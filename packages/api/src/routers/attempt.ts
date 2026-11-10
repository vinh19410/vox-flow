import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { attempt, attemptAnswer, attemptScore, forecastTopic } from "@vox-flow/db";
import { protectedProcedure, router } from "../index";
import { requireExamConsent } from "../exam/consent";
import { generateFollowUp } from "../exam/follow-up";
import { QUESTION_KEY_RE } from "../audio";
import {
  getValidQuestionKeysForTopic,
} from "../scoring/forecast-keys";
import { findAnswerLimitViolation } from "../scoring/answer-limits";
import { enqueueScoring, SCORING_ENQUEUE_DELAY_SECONDS } from "../scoring/queue";

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
        questionKey: z.string(),
        part: z.number().default(1),
        candidateTranscript: z.string().optional(),
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

      const result = await generateFollowUp({
        candidateTranscript: input.candidateTranscript,
        part: input.part,
        apiKey: ctx.env?.OPENAI_API_KEY ?? ctx.env?.ANTHROPIC_API_KEY,
      });

      return {
        followUpQuestion: {
          key: `${input.questionKey}-f`,
          part: input.part,
          text: result.questionText,
          trigger: result.triggerPhrase,
        },
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

      const submittedAt = new Date();
      const markSubmitted = ctx.db
        .update(attempt)
        .set({
          status: "submitted",
          submittedAt,
        })
        .where(eq(attempt.id, input.attemptId));

      // Forecast practice attempts are scored asynchronously. The status change
      // and the score row are written in one D1 batch (a single transaction), so
      // a submitted forecast attempt never lacks its score row. The primary key
      // on attempt_score makes this idempotent: only the call that creates the
      // row enqueues.
      if (currentAttempt.topicId) {
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
      } else {
        await markSubmitted;
      }

      return {
        success: true,
        attemptId: input.attemptId,
        status: "submitted",
        submittedAt,
      };
    }),
});
