import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@vox-flow/db";
import { attempt, attemptAnswer, attemptScore, scoringRetryLog } from "@vox-flow/db/schema";

import { protectedProcedure, router } from "../index";
import { startOfVietnamDayMs } from "../scoring/retry-limits";
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

/** Manual retries the user has already spent today (Vietnam day). */
async function countDailyRetries(db: Database, userId: string, nowMs: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(scoringRetryLog)
    .where(
      and(
        eq(scoringRetryLog.userId, userId),
        gte(scoringRetryLog.createdAt, new Date(startOfVietnamDayMs(nowMs))),
      ),
    );
  return row?.count ?? 0;
}

// Per-run data, ranges and errors are deliberately never returned to the learner.
export const scoringRouter = router({
  status: protectedProcedure
    .input(attemptInput)
    .query(async ({ ctx, input }): Promise<ScoreStatusResult> => {
      const nowMs = (ctx.now?.() ?? new Date()).getTime();
      const owned = await requireOwnedAttempt(ctx.db, input.attemptId, ctx.session.user.id);
      const score = await loadScore(ctx.db, input.attemptId);
      const manualRetries = score?.manualRetries ?? 0;
      return {
        attemptId: input.attemptId,
        status: score?.status ?? "not_scored",
        scorable: true,
        attemptStatus: owned.status,
        manualRetries,
        // No score row: retry goes through the quota-exempt rescue path.
        canRetry: score
          ? manualRetries < 1 && (await countDailyRetries(ctx.db, ctx.session.user.id, nowMs)) < 3
          : true,
      };
    }),

  retry: protectedProcedure
    .input(attemptInput)
    .mutation(async ({ ctx, input }): Promise<ScoreStatusResult> => {
      const now = ctx.now?.() ?? new Date();
      const owned = await requireOwnedAttempt(ctx.db, input.attemptId, ctx.session.user.id);
      const existing = await loadScore(ctx.db, input.attemptId);

      // Both branches are conditional writes, so concurrent retries enqueue once.
      let changed: Array<{ attemptId: string; manualRetries?: number }>;
      if (!existing) {
        // Rescue path: a submitted attempt (mock or forecast) whose score row
        // was never created (e.g. submit's enqueue step failed, or the attempt
        // predates the all-modes cutover). Deliberately exempt from the
        // manual-retry and daily quotas: this restores lost server state, it
        // does not give the learner another grading run.
        if (owned.status !== "submitted") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only a submitted attempt can be scored",
          });
        }
        changed = await ctx.db
          .insert(attemptScore)
          .values({ attemptId: input.attemptId, userId: owned.userId, status: "queued" })
          .onConflictDoNothing()
          .returning({ attemptId: attemptScore.attemptId });
      } else {
        // Manual retry: reserve-first in one D1 batch (a single transaction).
        // The log row is only inserted when both the per-attempt budget
        // (manualRetries < 1) and the daily quota (< 3) still hold, and the
        // score update only lands when that reservation exists — so two racing
        // retries can never both go through.
        const nowMs = now.getTime();
        const startOfDayUtc = startOfVietnamDayMs(nowMs);
        const retryLogId = crypto.randomUUID();

        const batchResult = await ctx.db.batch([
          ctx.db.insert(scoringRetryLog).select(sql`
            SELECT ${retryLogId}, ${ctx.session.user.id}, ${input.attemptId}, ${nowMs}
            WHERE (SELECT COUNT(*) FROM scoring_retry_log
                   WHERE user_id = ${ctx.session.user.id}
                     AND created_at >= ${startOfDayUtc}) < 3
              AND EXISTS (SELECT 1 FROM attempt_score
                          WHERE attempt_id = ${input.attemptId}
                            AND status = 'failed'
                            AND manual_retries < 1)
          `),
          ctx.db
            .update(attemptScore)
            .set({
              manualRetries: sql`${attemptScore.manualRetries} + 1`,
              status: "queued",
              tries: 0,
              lastError: null,
              updatedAt: new Date(nowMs),
            })
            .where(
              and(
                eq(attemptScore.attemptId, input.attemptId),
                eq(attemptScore.status, "failed"),
                lt(attemptScore.manualRetries, 1),
                sql`EXISTS (SELECT 1 FROM scoring_retry_log WHERE id = ${retryLogId})`,
              ),
            )
            .returning({ attemptId: attemptScore.attemptId, manualRetries: attemptScore.manualRetries }),
        ]);
        changed = batchResult[1] ?? [];
      }

      if (changed.length === 0) {
        // Re-read only to pick the right message: the batch above already made
        // the decision atomically, so this cannot reopen a race.
        const score = await loadScore(ctx.db, input.attemptId);
        if (score && score.manualRetries >= 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "RETRY_LIMIT_EXCEEDED" });
        }
        const dailyCount = await countDailyRetries(ctx.db, ctx.session.user.id, now.getTime());
        if (score?.status === "failed" && dailyCount >= 3) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "DAILY_RETRY_LIMIT_EXCEEDED",
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only a failed or unscored attempt can be retried",
        });
      }

      await enqueueScoring(ctx.env?.SCORING_QUEUE, input.attemptId, {
        delaySeconds: SCORING_ENQUEUE_DELAY_SECONDS,
      });
      return {
        attemptId: input.attemptId,
        status: "queued",
        scorable: true,
        attemptStatus: owned.status,
        manualRetries: changed[0]?.manualRetries ?? 0,
      };
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
        mode: owned.mode,
        overall: score.overall,
        oneLiner: score.oneLiner ?? "",
        criteria: criteria.data,
        answers: answers.map((a) => ({ ...a, transcript: a.transcript ?? "" })),
        scoredAt: score.scoredAt.getTime(),
      };
    }),
});
