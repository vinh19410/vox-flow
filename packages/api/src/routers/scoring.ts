import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@vox-flow/db";
import { attempt, attemptAnswer, attemptScore } from "@vox-flow/db/schema";

import { protectedProcedure, router } from "../index";
import { enqueueScoring, SCORING_ENQUEUE_DELAY_SECONDS } from "../scoring/queue";
import {
  scoredCriterionSchema,
  type ScoreStatusResult,
  type ScoringResult,
} from "../scoring/types";

const attemptInput = z.object({ attemptId: z.string().min(1) });

const storedCriteriaSchema = z.array(scoredCriterionSchema);

/** Loads the attempt and enforces that the caller owns it. */
async function requireOwnedAttempt(db: Database, attemptId: string, userId: string) {
  const [row] = await db.select().from(attempt).where(eq(attempt.id, attemptId)).limit(1);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
  }
  if (row.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to access this attempt" });
  }
  return row;
}

async function loadScore(db: Database, attemptId: string) {
  const [row] = await db
    .select()
    .from(attemptScore)
    .where(eq(attemptScore.attemptId, attemptId))
    .limit(1);
  return row;
}

// Per-run data, ranges and errors are deliberately never returned to the learner.
export const scoringRouter = router({
  status: protectedProcedure
    .input(attemptInput)
    .query(async ({ ctx, input }): Promise<ScoreStatusResult> => {
      const owned = await requireOwnedAttempt(ctx.db, input.attemptId, ctx.session.user.id);
      const score = await loadScore(ctx.db, input.attemptId);
      return {
        attemptId: input.attemptId,
        status: score?.status ?? "not_scored",
        scorable: owned.topicId !== null,
      };
    }),

  retry: protectedProcedure
    .input(attemptInput)
    .mutation(async ({ ctx, input }): Promise<ScoreStatusResult> => {
      const owned = await requireOwnedAttempt(ctx.db, input.attemptId, ctx.session.user.id);
      const existing = await loadScore(ctx.db, input.attemptId);

      // Both branches are conditional writes, so concurrent retries enqueue once.
      let changed: Array<{ attemptId: string }>;
      if (!existing) {
        // Rescue path: a submitted forecast attempt whose score row was never
        // created (e.g. submit's enqueue step failed).
        if (owned.topicId === null || owned.status !== "submitted") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only a submitted forecast practice attempt can be scored",
          });
        }
        changed = await ctx.db
          .insert(attemptScore)
          .values({ attemptId: input.attemptId, userId: owned.userId, status: "queued" })
          .onConflictDoNothing()
          .returning({ attemptId: attemptScore.attemptId });
      } else {
        changed = await ctx.db
          .update(attemptScore)
          .set({ status: "queued", tries: 0, lastError: null, updatedAt: new Date() })
          .where(and(eq(attemptScore.attemptId, input.attemptId), eq(attemptScore.status, "failed")))
          .returning({ attemptId: attemptScore.attemptId });
      }

      if (changed.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only a failed or unscored attempt can be retried",
        });
      }

      await enqueueScoring(ctx.env?.SCORING_QUEUE, input.attemptId, {
        delaySeconds: SCORING_ENQUEUE_DELAY_SECONDS,
      });
      return { attemptId: input.attemptId, status: "queued", scorable: owned.topicId !== null };
    }),

  getResult: protectedProcedure
    .input(attemptInput)
    .query(async ({ ctx, input }): Promise<ScoringResult | null> => {
      const owned = await requireOwnedAttempt(ctx.db, input.attemptId, ctx.session.user.id);
      const score = await loadScore(ctx.db, input.attemptId);
      if (
        !score ||
        score.status !== "done" ||
        score.overall === null ||
        score.criteriaJson === null ||
        score.scoredAt === null
      ) {
        return null;
      }

      let storedCriteria: unknown;
      try {
        storedCriteria = JSON.parse(score.criteriaJson);
      } catch {
        storedCriteria = null;
      }
      const criteria = storedCriteriaSchema.safeParse(storedCriteria);
      if (!criteria.success) {
        console.error(`[scoring] Stored criteria for attempt ${input.attemptId} failed validation`);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Score data is unavailable" });
      }

      const answers = await ctx.db
        .select({
          questionKey: attemptAnswer.questionKey,
          questionText: attemptAnswer.questionText,
          partNumber: attemptAnswer.partNumber,
          durationMs: attemptAnswer.durationMs,
          transcript: attemptAnswer.transcript,
        })
        .from(attemptAnswer)
        .where(eq(attemptAnswer.attemptId, input.attemptId))
        .orderBy(asc(attemptAnswer.partNumber), asc(attemptAnswer.orderIndex));

      return {
        attemptId: input.attemptId,
        topicId: owned.topicId,
        overall: score.overall,
        oneLiner: score.oneLiner ?? "",
        criteria: criteria.data,
        answers: answers.map((a) => ({ ...a, transcript: a.transcript ?? "" })),
        scoredAt: score.scoredAt.getTime(),
      };
    }),
});
