import { checkAndWarnOverdueDisputes } from "@vox-flow/api/disputes/overdue";
import { requeueStaleScores } from "@vox-flow/api/scoring/requeue";

import { ENV } from "./env.server";
import { getDb } from "./services";

/** Hourly jobs. Must match an entry of `crons` in packages/infra/alchemy.run.ts. */
export const HOURLY_CRON = "0 * * * *";
/**
 * Frequent sweep that re-sends scores whose queue message was lost, so a
 * learner waits minutes rather than an hour. Must match an entry of `crons`
 * in packages/infra/alchemy.run.ts.
 */
export const SCORING_SWEEP_CRON = "*/5 * * * *";

async function runOverdueDisputeCheck(): Promise<void> {
  try {
    const result = await checkAndWarnOverdueDisputes(getDb());
    console.log(`[scheduled] Checked overdue disputes: warned ${result.warnedCount} disputes`);
  } catch (error) {
    console.error("[scheduled] Error processing scheduled event:", error);
  }
}

async function runScoringSweep(): Promise<void> {
  try {
    const result = await requeueStaleScores(getDb(), ENV.SCORING_QUEUE);
    console.log(
      `[scheduled] Stale scores: re-enqueued ${result.requeued}, marked failed ${result.failed}`,
    );
  } catch (error) {
    console.error("[scheduled] Error re-enqueueing stale scores:", error);
  }
}

/**
 * Both schedules fire at minute 0 as separate events, so each event runs only
 * its own jobs: the hourly event keeps the dispute check hourly and the
 * 5-minute event runs the scoring sweep. An unknown cron (e.g. a manual
 * trigger) runs everything.
 */
export async function handleScheduled(
  event: { scheduledTime: number; cron: string },
  _env: unknown,
  _ctx: { waitUntil: (promise: Promise<unknown>) => void },
): Promise<void> {
  if (event.cron === SCORING_SWEEP_CRON) {
    await runScoringSweep();
    return;
  }
  await runOverdueDisputeCheck();
  if (event.cron !== HOURLY_CRON) {
    await runScoringSweep();
  }
}
