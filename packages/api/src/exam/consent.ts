import { sql } from "drizzle-orm";
import type { Database } from "@vox-flow/db";

export type ExamConsentResult = {
  inHistory: boolean;
  calibrationGranted: boolean;
};

export async function requireExamConsent(
  db: Database,
  userId: string,
): Promise<ExamConsentResult> {
  try {
    const checkTable = await db.run(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='consent_event';`,
    );
    const hasTable = checkTable.results && checkTable.results.length > 0;

    if (hasTable) {
      const records = (await db.run(
        sql`SELECT kind, granted FROM consent_event WHERE user_id = ${userId} ORDER BY created_at DESC;`,
      )) as unknown as { results: Array<{ kind: string; granted: number | boolean }> };

      const rows = records.results ?? [];
      const saveConsent = rows.find((r) => r.kind === "save");
      const calibConsent = rows.find((r) => r.kind === "calibration");

      if (saveConsent) {
        return {
          inHistory: Boolean(saveConsent.granted),
          calibrationGranted: Boolean(calibConsent?.granted),
        };
      }
    }
  } catch {
    // If query fails, fall back to default pilot consent
  }

  return {
    inHistory: true,
    calibrationGranted: false,
  };
}
