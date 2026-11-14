import { and, eq, inArray, lt, sql } from "drizzle-orm";

import type { Database } from "@vox-flow/db";
import { attemptScore } from "@vox-flow/db/schema";

import { release } from "../quota/quota";
import { enqueueScoring, type ScoringQueue } from "./queue";
import { MAX_SCORING_TRIES, SCORING_LEASE_MS } from "./score-attempt";

/**
 * A queued/processing score untouched for this long is assumed to have lost
 * its message (or its worker). Equal to the claim lease, so a processing row is
 * only re-sent once a new delivery is allowed to claim it.
 */
export const STALE_SCORE_AFTER_MS = SCORING_LEASE_MS;

export type RequeueResult = { requeued: number; failed: number };

/**
 * Safety net for lost queue messages: re-enqueues `queued`/`processing` scores
 * that have not been updated within the lease and still have tries left
 * (releasing an expired processing claim back to `queued`), and
 * fails the ones that already used every try (e.g. the worker died mid-run on
 * the last attempt), so no submission is stuck forever.
 */
export async function requeueStaleScores(
  db: Database,
  queue: ScoringQueue | undefined,
  now: Date = new Date(),
): Promise<RequeueResult> {
  const cutoff = new Date(now.getTime() - STALE_SCORE_AFTER_MS);
  const lastTouched = sql`coalesce(${attemptScore.updatedAt}, ${attemptScore.createdAt})`;
  const isStale = and(
    inArray(attemptScore.status, ["queued", "processing"]),
    lt(lastTouched, cutoff.getTime()),
  );

  const stale = await db
    .select({ attemptId: attemptScore.attemptId, tries: attemptScore.tries })
    .from(attemptScore)
    .where(isStale);

  const result: RequeueResult = { requeued: 0, failed: 0 };
  for (const row of stale) {
    const thisRow = and(eq(attemptScore.attemptId, row.attemptId), isStale);
    if (row.tries >= MAX_SCORING_TRIES) {
      const markedFailed = await db
        .update(attemptScore)
        .set({ status: "failed", lastError: "Scoring timed out", updatedAt: now })
        .where(thisRow)
        .returning({ attemptId: attemptScore.attemptId });
      if (markedFailed.length > 0) {
        await release(db, row.attemptId, { retainBudget: row.tries > 0, now });
      }
      result.failed += 1;
      continue;
    }
    if (await enqueueScoring(queue, row.attemptId)) {
      // Release an expired claim and touch the row so the next sweep waits
      // another full window before re-sending.
      await db.update(attemptScore).set({ status: "queued", updatedAt: now }).where(thisRow);
      result.requeued += 1;
    }
  }
  return result;
}
