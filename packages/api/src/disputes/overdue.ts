import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";
import type { Database } from "@vox-flow/db";
import { scoreDispute } from "@vox-flow/db/schema";

export const OVERDUE_WARNING_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface OverdueCheckResult {
  warnedCount: number;
  warnedIds: string[];
}

/**
 * Hourly cron job function that checks active disputes approaching the 72h deadline (within 12 hours).
 * It conditionally updates `warnedAt` only if `warnedAt` is currently NULL, preventing double-warnings.
 */
export async function checkAndWarnOverdueDisputes(
  db: Database,
  now: Date = new Date(),
): Promise<OverdueCheckResult> {
  const warningCutoff = new Date(now.getTime() + OVERDUE_WARNING_THRESHOLD_MS);

  // Find disputes that are active (open/reviewing), not resolved, not yet warned, and due within 12h
  const candidates = await db
    .select({
      id: scoreDispute.id,
    })
    .from(scoreDispute)
    .where(
      and(
        or(eq(scoreDispute.status, "open"), eq(scoreDispute.status, "reviewing")),
        isNull(scoreDispute.warnedAt),
        isNull(scoreDispute.resolvedAt),
        lte(scoreDispute.dueAt, warningCutoff),
      ),
    );

  if (candidates.length === 0) {
    return {
      warnedCount: 0,
      warnedIds: [],
    };
  }

  const ids = candidates.map((c) => c.id);

  // Conditional atomic update: only update if warnedAt is still NULL
  const updatedRows = await db
    .update(scoreDispute)
    .set({
      warnedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        inArray(scoreDispute.id, ids),
        isNull(scoreDispute.warnedAt),
      ),
    )
    .returning({ id: scoreDispute.id });

  return {
    warnedCount: updatedRows.length,
    warnedIds: updatedRows.map((r) => r.id),
  };
}
