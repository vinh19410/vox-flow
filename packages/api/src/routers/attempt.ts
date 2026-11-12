import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { attempt, attemptAnswer, attemptScore, forecastTopic } from "@vox-flow/db";
import { protectedProcedure, router } from "../index";
import { requireExamConsent } from "../exam/consent";
import { generateFollowUp, generateLinkedQuestion } from "../exam/follow-up";
import { deleteLinkedPrompt, loadLinkedPrompt, saveLinkedPrompt } from "../exam/linked-prompt-store";
import { transcribeAudioStrict } from "../exam/transcribe";
import { isValidAudioKey, QUESTION_KEY_RE } from "../audio";
import { getValidQuestionKeysForTopic } from "../scoring/forecast-keys";
import { findAnswerLimitViolation } from "../scoring/answer-limits";
import { sanitizeDelimited } from "../scoring/prompt";
import { enqueueScoring, SCORING_ENQUEUE_DELAY_SECONDS } from "../scoring/queue";
import { resolveForecastQuestionDetail } from "../tts/resolver";

/**
 * Returned (as BAD_REQUEST) when submit is called twice. The web client matches
 * this exact text to recover by re-enqueueing scoring, so keep them in sync.
 */
export const ATTEMPT_ALREADY_SUBMITTED_MESSAGE = "Attempt is already submitted";

export const attemptRouter = router({
  start: protectedProcedure
    .input(
      z
        .object({
          mode: z.enum(["full", "part1", "part2", "part3"]).default("full"),
          topicId: z.string().regex(QUESTION_KEY_RE, "Invalid topicId format").optional(),
          questionKey: z.string().regex(QUESTION_KEY_RE, "Invalid questionKey format").optional(),
        })
        .refine(
          (data) => {
            return !data.questionKey || Boolean(data.topicId);
          },
          {
            message: "questionKey requires topicId",
          },
        )
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const mode = input?.mode ?? "full";
      const topicId = input?.topicId;
      const questionKey = input?.questionKey;
      // Launch gate check: LAUNCH_OPEN === 'true' or email in LAUNCH_ALLOWED_EMAILS
      const isLaunchOpen = ctx.env?.LAUNCH_OPEN === "true";
      const allowedEmails = (ctx.env?.LAUNCH_ALLOWED_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const userEmail = ctx.session.user.email?.toLowerCase();
      const isEmailAllowed = Boolean(userEmail && allowedEmails.includes(userEmail));

      if (!isLaunchOpen && !isEmailAllowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Mock exam is currently restricted to pilot candidates.",
        });
      }

      // Attempts with a topicId are scored, so the topic must be a real published
      // forecast topic rather than any string the client chooses.
      if (topicId) {
        const [topic] = await ctx.db
          .select({
            id: forecastTopic.id,
            part: forecastTopic.part,
            questions: forecastTopic.questions,
          })
          .from(forecastTopic)
          .where(and(eq(forecastTopic.id, topicId), eq(forecastTopic.status, "published")))
          .limit(1);
        if (!topic) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unknown or unpublished forecast topic",
          });
        }
        if (questionKey) {
          const validKeys = getValidQuestionKeysForTopic(topic, null);
          if (!validKeys.has(questionKey)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid questionKey for topic",
            });
          }
        }
      }

      const consent = await requireExamConsent(ctx.db, ctx.session.user.id);
      const attemptId = crypto.randomUUID();
      const startedAt = new Date();

      await ctx.db.insert(attempt).values({
        id: attemptId,
        userId: ctx.session.user.id,
        mode,
        status: "in_progress",
        inHistory: consent.inHistory,
        calibrationGranted: consent.calibrationGranted,
        startedAt,
        topicId,
        questionKey,
      });

      return {
        attemptId,
        mode,
        inHistory: consent.inHistory,
        calibrationGranted: consent.calibrationGranted,
        startedAt,
        topicId,
        questionKey,
      };
    }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    const [active] = await ctx.db
      .select()
      .from(attempt)
      .where(
        and(
          eq(attempt.userId, ctx.session.user.id),
          eq(attempt.status, "in_progress"),
        ),
      )
      .orderBy(desc(attempt.startedAt))
      .limit(1);

    if (!active) {
      return null;
    }

    const answers = await ctx.db
      .select()
      .from(attemptAnswer)
      .where(eq(attemptAnswer.attemptId, active.id))
      .orderBy(asc(attemptAnswer.orderIndex));

    return {
      attempt: active,
      answers,
    };
  }),

  getFollowUp: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        questionKey: z.string().max(128).regex(QUESTION_KEY_RE, "Invalid questionKey format"),
        part: z.number().int().min(1).max(3).default(1),
        candidateTranscript: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!currentAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found",
        });
      }

      if (currentAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this attempt",
        });
      }

      // Guard before the LLM call: no generation cost after submit, and no
      // follow-up text minted for an attempt that is already being scored.
      if (currentAttempt.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot generate a follow-up for a finalized attempt",
        });
      }

      const result = await generateFollowUp({
        candidateTranscript: input.candidateTranscript,
        part: input.part,
        apiKey: ctx.env?.OPENAI_API_KEY ?? ctx.env?.ANTHROPIC_API_KEY,
      });

      return {
        followUpQuestion: {
          key: `${input.questionKey}-f`,
          part: input.part,
          // Generated text is seeded by the client-controlled transcript, so
          // strip delimiter tags and bound its length before it reaches the
          // client. Not persisted: scoring never trusts it (see
          // score-attempt.ts — non-bank keys grade with a placeholder).
          text: sanitizeDelimited(result.questionText).slice(0, 300),
          trigger: sanitizeDelimited(result.triggerPhrase),
        },
      };
    }),

  prepareNextQuestion: protectedProcedure
    .input(
      z.object({
        attemptId: z.string().min(1),
        previousQuestionKey: z.string().max(128).regex(QUESTION_KEY_RE, "Invalid questionKey format"),
        nextQuestionKey: z.string().max(128).regex(QUESTION_KEY_RE, "Invalid questionKey format"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!currentAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found",
        });
      }

      if (currentAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this attempt",
        });
      }

      if (currentAttempt.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot prepare next question for a finalized attempt",
        });
      }

      if (!currentAttempt.topicId || currentAttempt.questionKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Linked practice preparation is only supported for whole-topic forecast attempts",
        });
      }

      const [prevDetail, nextDetail] = await Promise.all([
        resolveForecastQuestionDetail(ctx.db, currentAttempt.topicId, input.previousQuestionKey),
        resolveForecastQuestionDetail(ctx.db, currentAttempt.topicId, input.nextQuestionKey),
      ]);

      if (!prevDetail || !nextDetail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid questionKey for topic",
        });
      }

      const bucket = ctx.env?.AUDIO_BUCKET;
      const prevLinked = bucket
        ? await loadLinkedPrompt(bucket, {
            userId: ctx.session.user.id,
            attemptId: input.attemptId,
            questionKey: input.previousQuestionKey,
          }).catch(() => null)
        : null;
      const previousQuestionText = prevLinked?.questionText ?? prevDetail.text;

      const [answerRow] = await ctx.db
        .select()
        .from(attemptAnswer)
        .where(
          and(
            eq(attemptAnswer.attemptId, input.attemptId),
            eq(attemptAnswer.questionKey, input.previousQuestionKey),
          ),
        )
        .limit(1);

      let candidateTranscript = answerRow?.transcript?.trim() ?? "";
      const openAiKey = ctx.env?.OPENAI_API_KEY;
      if (!candidateTranscript && answerRow && bucket && openAiKey) {
        try {
          if (isValidAudioKey(answerRow.audioKey, ctx.session.user.id, input.attemptId)) {
            const obj = await bucket.get(answerRow.audioKey);
            if (obj) {
              const transcribed = await transcribeAudioStrict({
                audioBuffer: await obj.arrayBuffer(),
                mimeType: answerRow.mimeType,
                apiKey: openAiKey,
                timeoutMs: 8000,
              });
              if (transcribed) {
                candidateTranscript = transcribed;
                await ctx.db
                  .update(attemptAnswer)
                  .set({ transcript: transcribed })
                  .where(
                    and(
                      eq(attemptAnswer.id, answerRow.id),
                      eq(attemptAnswer.generation, answerRow.generation),
                    ),
                  );
              }
            }
          }
        } catch {
          // Best-effort STT; fall back to unlinked canonical question on error
        }
      }

      const result = await generateLinkedQuestion({
        previousQuestionText,
        candidateTranscript,
        nextQuestionText: nextDetail.text,
        previousPart: prevDetail.part,
        part: nextDetail.part,
        apiKey: openAiKey,
      });

      if (bucket) {
        if (result.linked) {
          await saveLinkedPrompt(bucket, {
            userId: ctx.session.user.id,
            attemptId: input.attemptId,
            questionKey: input.nextQuestionKey,
            prompt: {
              questionText: result.questionText,
              triggerPhrase: result.triggerPhrase || undefined,
              baseQuestionText: nextDetail.text,
              updatedAt: Date.now(),
            },
          });
        } else {
          await deleteLinkedPrompt(bucket, {
            userId: ctx.session.user.id,
            attemptId: input.attemptId,
            questionKey: input.nextQuestionKey,
          }).catch(() => {});
        }
      }

      return {
        questionKey: input.nextQuestionKey,
        questionText: sanitizeDelimited(result.questionText).slice(0, 300),
        triggerPhrase:
          result.linked && result.triggerPhrase
            ? sanitizeDelimited(result.triggerPhrase).slice(0, 160)
            : null,
        linked: result.linked,
      };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!currentAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found",
        });
      }

      if (currentAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to submit this attempt",
        });
      }

      if (currentAttempt.status === "submitted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: ATTEMPT_ALREADY_SUBMITTED_MESSAGE });
      }
      if (currentAttempt.status !== "in_progress") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Attempt is abandoned" });
      }

      // Authoritative barrier: re-check answer count and total audio size so no
      // concurrency abuse or forged client state can slip past the upload route.
      // The scoring consumer re-runs the same guard (answer-limits.ts), so an
      // upload that lands after this snapshot is never transcribed either.
      const answers = await ctx.db
        .select()
        .from(attemptAnswer)
        .where(eq(attemptAnswer.attemptId, input.attemptId));

      let topic: { id: string; part: number; questions: string | unknown } | null = null;
      if (currentAttempt.topicId) {
        const [row] = await ctx.db
          .select({
            id: forecastTopic.id,
            part: forecastTopic.part,
            questions: forecastTopic.questions,
          })
          .from(forecastTopic)
          .where(eq(forecastTopic.id, currentAttempt.topicId))
          .limit(1);
        topic = row ?? null;
      }
      const violation = findAnswerLimitViolation(currentAttempt, topic, answers);
      if (violation) {
        throw new TRPCError({ code: "BAD_REQUEST", message: violation });
      }
      // A submit with no recorded answers (e.g. the submitAnyway path when no
      // upload ever succeeded) would create a dead score row that could never
      // be graded — reject it before any state is written.
      if (answers.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Attempt has no recorded answers" });
      }

      const submittedAt = new Date();
      const markSubmitted = ctx.db
        .update(attempt)
        .set({
          status: "submitted",
          submittedAt,
        })
        .where(eq(attempt.id, input.attemptId));

      // Every attempt with recorded answers is scored asynchronously, mock and
      // forecast alike. The status change and the score row are written in one
      // D1 batch (a single transaction), so a submitted attempt never lacks its
      // score row. The primary key on attempt_score makes this idempotent: only
      // the call that creates the row enqueues.
      const [, inserted] = await ctx.db.batch([
        markSubmitted,
        ctx.db
          .insert(attemptScore)
          .values({ attemptId: input.attemptId, userId: currentAttempt.userId, status: "queued" })
          .onConflictDoNothing()
          .returning({ attemptId: attemptScore.attemptId }),
      ]);
      if (inserted.length > 0) {
        await enqueueScoring(ctx.env?.SCORING_QUEUE, input.attemptId, {
          delaySeconds: SCORING_ENQUEUE_DELAY_SECONDS,
        });
      }

      return {
        success: true,
        attemptId: input.attemptId,
        status: "submitted",
        submittedAt,
      };
    }),
});
