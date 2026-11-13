import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { attempt, attemptAnswer, attemptScore, forecastTopic } from "@vox-flow/db";
import { protectedProcedure, router } from "../index";
import { requireExamConsent } from "../exam/consent";
import { generateFollowUp, generateLinkedQuestion } from "../exam/follow-up";
import {
  deleteLinkedPrompt,
  isLinkedPromptInvalidated,
  loadLinkedPrompt,
  markLinkedPromptInvalidated,
  PREP_TOKEN_RE,
  saveLinkedPrompt,
} from "../exam/linked-prompt-store";
import { transcribeAudioStrict } from "../exam/transcribe";
import { isValidAudioKey, QUESTION_KEY_RE } from "../audio";
import { weakestQuestionKey } from "../scoring/aggregate";
import {
  cueCardKey,
  getValidQuestionKeysForTopic,
  parseTopicQuestions,
  part1QuestionKey,
  part3QuestionKey,
} from "../scoring/forecast-keys";
import { findAnswerLimitViolation } from "../scoring/answer-limits";
import { getMockPromptDetail, getValidMockQuestionKeys } from "../scoring/mock-exam-bank";
import { sanitizeDelimited } from "../scoring/prompt";
import { enqueueScoring, SCORING_ENQUEUE_DELAY_SECONDS } from "../scoring/queue";
import { scoredCriterionSchema } from "../scoring/types";
import { resolveForecastQuestionDetail } from "../tts/resolver";

const storedCriteriaSchema = z.array(scoredCriterionSchema);

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
          mode: z.enum(["full", "part1", "part2", "part3"]).optional(),
          topicId: z.string().regex(QUESTION_KEY_RE, "Invalid topicId format").optional(),
          questionKey: z.string().regex(QUESTION_KEY_RE, "Invalid questionKey format").optional(),
          retakeOf: z.string().min(1).max(128).optional(),
        })
        .refine(
          (data) => {
            return !data.questionKey || Boolean(data.topicId);
          },
          {
            message: "questionKey requires topicId",
          },
        )
        .refine(
          (data) => {
            return !data.retakeOf || (!data.topicId && !data.questionKey && !data.mode);
          },
          {
            message: "retakeOf cannot be combined with mode, topicId, or questionKey",
          },
        )
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
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

      if (input?.retakeOf) {
        const [sourceAttempt] = await ctx.db
          .select()
          .from(attempt)
          .where(eq(attempt.id, input.retakeOf))
          .limit(1);
        if (!sourceAttempt) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Source attempt not found" });
        }
        if (sourceAttempt.userId !== ctx.session.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this attempt" });
        }

        const [sourceScore] = await ctx.db
          .select()
          .from(attemptScore)
          .where(eq(attemptScore.attemptId, sourceAttempt.id))
          .limit(1);
        if (!sourceScore || sourceScore.status !== "done" || !sourceScore.criteriaJson) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Source attempt has not finished scoring",
          });
        }

        let parsedCriteriaRaw: unknown;
        try {
          parsedCriteriaRaw = JSON.parse(sourceScore.criteriaJson);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Source attempt score payload is invalid",
          });
        }
        const parsedCriteria = storedCriteriaSchema.safeParse(parsedCriteriaRaw);
        if (!parsedCriteria.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Source attempt score payload is invalid",
          });
        }

        const sourceAnswers = await ctx.db
          .select({
            questionKey: attemptAnswer.questionKey,
            partNumber: attemptAnswer.partNumber,
            orderIndex: attemptAnswer.orderIndex,
          })
          .from(attemptAnswer)
          .where(eq(attemptAnswer.attemptId, sourceAttempt.id))
          .orderBy(asc(attemptAnswer.partNumber), asc(attemptAnswer.orderIndex));

        const rawWeakestKey = weakestQuestionKey(parsedCriteria.data, sourceAnswers);
        if (!rawWeakestKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No answer found in source attempt to retake",
          });
        }

        const consent = await requireExamConsent(ctx.db, ctx.session.user.id);
        const attemptId = crypto.randomUUID();
        const startedAt = new Date();

        if (sourceAttempt.topicId) {
          const [topic] = await ctx.db
            .select({
              id: forecastTopic.id,
              title: forecastTopic.title,
              part: forecastTopic.part,
              questions: forecastTopic.questions,
              status: forecastTopic.status,
            })
            .from(forecastTopic)
            .where(
              and(
                eq(forecastTopic.id, sourceAttempt.topicId),
                inArray(forecastTopic.status, ["published", "archived"]),
              ),
            )
            .limit(1);
          if (!topic) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Forecast topic unavailable for retake",
            });
          }

          const isFollowUp = rawWeakestKey.endsWith("-f");
          const resolvedKey = isFollowUp ? rawWeakestKey.slice(0, -2) : rawWeakestKey;
          if (!getValidQuestionKeysForTopic(topic, null).has(resolvedKey)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Weakest question is no longer valid for this topic",
            });
          }

          const parsedQuestions = parseTopicQuestions(topic.questions);
          let part: 1 | 2 | 3 = 1;
          let questionText = "";
          let cue: { title: string; points: string[]; ending: string } | undefined;

          if (topic.part === 1) {
            const p1 = parsedQuestions.part1Questions ?? [];
            const idx = p1.findIndex((_, i) => resolvedKey === part1QuestionKey(topic.id, i));
            if (idx >= 0) {
              part = 1;
              questionText = (p1[idx] ?? "").trim();
            }
          } else if (resolvedKey === cueCardKey(topic.id)) {
            part = 2;
            const title = topic.title.trim();
            questionText = title;
            const points =
              parsedQuestions.cueCards.length > 1
                ? parsedQuestions.cueCards.slice(0, -1)
                : parsedQuestions.cueCards;
            const ending =
              parsedQuestions.cueCards.length > 1
                ? (parsedQuestions.cueCards[parsedQuestions.cueCards.length - 1] ?? "")
                : "";
            cue = { title, points, ending };
          } else {
            const idx = parsedQuestions.part3Questions.findIndex(
              (_, i) => resolvedKey === part3QuestionKey(topic.id, i),
            );
            if (idx >= 0) {
              part = 3;
              questionText = (parsedQuestions.part3Questions[idx] ?? "").trim();
            }
          }

          if (!questionText) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Canonical question text unavailable for retake",
            });
          }

          const baseQuestionText = questionText;
          let hasLinkedPrompt = false;
          if (!isFollowUp && ctx.env?.AUDIO_BUCKET) {
            const linked = await loadLinkedPrompt(ctx.env.AUDIO_BUCKET, {
              userId: ctx.session.user.id,
              attemptId: sourceAttempt.id,
              questionKey: resolvedKey,
            }).catch(() => null);
            if (linked?.questionText) {
              await saveLinkedPrompt(ctx.env.AUDIO_BUCKET, {
                userId: ctx.session.user.id,
                attemptId,
                questionKey: resolvedKey,
                prompt: {
                  questionText: linked.questionText,
                  triggerPhrase: linked.triggerPhrase,
                  baseQuestionText,
                  updatedAt: Date.now(),
                },
              });
              questionText = linked.questionText;
              hasLinkedPrompt = true;
            }
          }

          const retakeMode = part === 1 ? "part1" : part === 2 ? "part2" : "part3";
          const retakeKind = topic.part === 1 ? ("p1" as const) : ("p23" as const);

          await ctx.db.insert(attempt).values({
            id: attemptId,
            userId: ctx.session.user.id,
            mode: retakeMode,
            status: "in_progress",
            inHistory: consent.inHistory,
            calibrationGranted: consent.calibrationGranted,
            startedAt,
            topicId: topic.id,
            questionKey: resolvedKey,
            retakeOfAttemptId: sourceAttempt.id,
          });

          return {
            attemptId,
            mode: retakeMode,
            inHistory: consent.inHistory,
            calibrationGranted: consent.calibrationGranted,
            startedAt,
            topicId: topic.id,
            topicTitle: topic.title,
            kind: retakeKind,
            questionKey: resolvedKey,
            part,
            questionText,
            ...(cue ? { cue } : {}),
            hasLinkedPrompt,
            retakeOfAttemptId: sourceAttempt.id,
          };
        }

        const detail = getMockPromptDetail(rawWeakestKey, sourceAttempt.mode);
        if (!detail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Canonical mock question unavailable for retake",
          });
        }
        const retakeMode = detail.part === 1 ? "part1" : detail.part === 2 ? "part2" : "part3";
        if (!getValidMockQuestionKeys(retakeMode, rawWeakestKey).has(rawWeakestKey)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Mock retake question key invalid for mode",
          });
        }
        const retakeKind = detail.part === 1 ? ("p1" as const) : ("p23" as const);

        await ctx.db.insert(attempt).values({
          id: attemptId,
          userId: ctx.session.user.id,
          mode: retakeMode,
          status: "in_progress",
          inHistory: consent.inHistory,
          calibrationGranted: consent.calibrationGranted,
          startedAt,
          topicId: null,
          questionKey: rawWeakestKey,
          retakeOfAttemptId: sourceAttempt.id,
        });

        return {
          attemptId,
          mode: retakeMode,
          inHistory: consent.inHistory,
          calibrationGranted: consent.calibrationGranted,
          startedAt,
          topicId: null,
          topicTitle: "Thi thử IELTS",
          kind: retakeKind,
          questionKey: rawWeakestKey,
          part: detail.part,
          questionText: detail.text,
          ...(detail.cue ? { cue: detail.cue } : {}),
          hasLinkedPrompt: false,
          retakeOfAttemptId: sourceAttempt.id,
        };
      }

      const mode = input?.mode ?? "full";
      const topicId = input?.topicId;
      const questionKey = input?.questionKey;

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
        previousGeneration: z.number().int().nonnegative().optional(),
        prepToken: z.string().regex(PREP_TOKEN_RE, "Invalid prepToken format").optional(),
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

      const unlinkedFallback = () => ({
        questionKey: input.nextQuestionKey,
        questionText: nextDetail.text,
        triggerPhrase: null as string | null,
        linked: false,
      });

      const bucket = ctx.env?.AUDIO_BUCKET;
      const isPrepInvalidated = async (): Promise<boolean> => {
        if (!bucket || !input.prepToken) return false;
        return isLinkedPromptInvalidated(bucket, {
          userId: ctx.session.user.id,
          attemptId: input.attemptId,
          questionKey: input.nextQuestionKey,
          prepToken: input.prepToken,
        }).catch(() => false);
      };

      if (await isPrepInvalidated()) {
        return unlinkedFallback();
      }

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

      if (
        input.previousGeneration !== undefined &&
        answerRow &&
        answerRow.generation > input.previousGeneration
      ) {
        // Stale prepare call superseded by a newer recording; leave R2 untouched.
        return unlinkedFallback();
      }

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
                timeoutMs: 6000,
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
        timeoutMs: 3500,
      });

      if (input.previousGeneration !== undefined) {
        const [latestRow] = await ctx.db
          .select({ generation: attemptAnswer.generation })
          .from(attemptAnswer)
          .where(
            and(
              eq(attemptAnswer.attemptId, input.attemptId),
              eq(attemptAnswer.questionKey, input.previousQuestionKey),
            ),
          )
          .limit(1);
        if (latestRow && latestRow.generation > input.previousGeneration) {
          return unlinkedFallback();
        }
      }

      if (await isPrepInvalidated()) {
        return unlinkedFallback();
      }

      const sanitizedQuestion = sanitizeDelimited(result.questionText).slice(0, 300).trim();
      const rawTrigger =
        result.linked && result.triggerPhrase
          ? sanitizeDelimited(result.triggerPhrase).slice(0, 160).trim()
          : "";
      const effectiveLinked = result.linked && sanitizedQuestion.length >= 5;

      if (bucket) {
        if (effectiveLinked) {
          try {
            await saveLinkedPrompt(bucket, {
              userId: ctx.session.user.id,
              attemptId: input.attemptId,
              questionKey: input.nextQuestionKey,
              prompt: {
                questionText: sanitizedQuestion,
                triggerPhrase: rawTrigger || undefined,
                baseQuestionText: nextDetail.text,
                ...(input.prepToken ? { prepToken: input.prepToken } : {}),
                updatedAt: Date.now(),
              },
            });
            if (await isPrepInvalidated()) {
              const currentStored = await loadLinkedPrompt(bucket, {
                userId: ctx.session.user.id,
                attemptId: input.attemptId,
                questionKey: input.nextQuestionKey,
              }).catch(() => null);
              if (!currentStored || !currentStored.prepToken || currentStored.prepToken === input.prepToken) {
                await deleteLinkedPrompt(bucket, {
                  userId: ctx.session.user.id,
                  attemptId: input.attemptId,
                  questionKey: input.nextQuestionKey,
                }).catch(() => {});
              }
              return unlinkedFallback();
            }
          } catch {
            return unlinkedFallback();
          }
        } else {
          const existing = input.prepToken
            ? await loadLinkedPrompt(bucket, {
                userId: ctx.session.user.id,
                attemptId: input.attemptId,
                questionKey: input.nextQuestionKey,
              }).catch(() => null)
            : null;
          if (!input.prepToken || !existing?.prepToken || existing.prepToken === input.prepToken) {
            await deleteLinkedPrompt(bucket, {
              userId: ctx.session.user.id,
              attemptId: input.attemptId,
              questionKey: input.nextQuestionKey,
            }).catch(() => {});
          }
        }
      }

      if (!effectiveLinked) {
        return unlinkedFallback();
      }

      return {
        questionKey: input.nextQuestionKey,
        questionText: sanitizedQuestion,
        triggerPhrase: rawTrigger || null,
        linked: true,
      };
    }),

  invalidateLinkedPrompt: protectedProcedure
    .input(
      z.object({
        attemptId: z.string().min(1),
        questionKey: z.string().max(128).regex(QUESTION_KEY_RE, "Invalid questionKey format"),
        prepToken: z.string().regex(PREP_TOKEN_RE, "Invalid prepToken format").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentAttempt] = await ctx.db
        .select({
          id: attempt.id,
          userId: attempt.userId,
          status: attempt.status,
        })
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!currentAttempt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
      }
      if (currentAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this attempt",
        });
      }
      if (currentAttempt.status !== "in_progress") {
        return { cleared: false };
      }

      if (ctx.env?.AUDIO_BUCKET) {
        await markLinkedPromptInvalidated(ctx.env.AUDIO_BUCKET, {
          userId: ctx.session.user.id,
          attemptId: input.attemptId,
          questionKey: input.questionKey,
          ...(input.prepToken ? { prepToken: input.prepToken } : {}),
        }).catch(() => {});
      }

      return { cleared: true };
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
