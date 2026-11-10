import { checkAndWarnOverdueDisputes } from "@vox-flow/api/disputes/overdue";
import { requeueStaleScores } from "@vox-flow/api/scoring/requeue";

import { ENV } from "./env.server";
import { getDb } from "./services";

export async function handleScheduled(
  _event: { scheduledTime: number; cron: string },
  _env: unknown,
  _ctx: { waitUntil: (promise: Promise<unknown>) => void },
): Promise<void> {
  try {
    const db = getDb();
    const result = await checkAndWarnOverdueDisputes(db);
    console.log(`[scheduled] Checked overdue disputes: warned ${result.warnedCount} disputes`);
  } catch (error) {
    console.error("[scheduled] Error processing scheduled event:", error);
  }

  // Independent of the dispute check so one failing never skips the other.
  try {
    const result = await requeueStaleScores(getDb(), ENV.SCORING_QUEUE);
    console.log(
      `[scheduled] Stale scores: re-enqueued ${result.requeued}, marked failed ${result.failed}`,
    );
  } catch (error) {
    console.error("[scheduled] Error re-enqueueing stale scores:", error);
  }
}
