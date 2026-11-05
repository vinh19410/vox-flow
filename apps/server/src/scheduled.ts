import { checkAndWarnOverdueDisputes } from "@vox-flow/api/disputes/overdue";
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
}
