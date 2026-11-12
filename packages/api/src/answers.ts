import { sql } from "drizzle-orm";

import { attemptAnswer } from "@vox-flow/db/schema";
import type { Database } from "@vox-flow/db";

type UpsertValues = typeof attemptAnswer.$inferInsert;

/**
 * Stores one answer recording, keeping whichever row has the higher generation.
 *
 * The conflict update only applies when the incoming generation is greater than or
 * equal to the stored one (`stored <= excluded.generation`), so two racing uploads
 * of the same question always converge on the newest recording no matter which DB
 * write lands last. `.returning()` returns the updated row, or an empty array when
 * a newer generation already won — callers must treat that as a stale upload.
 */
export async function upsertAnswerRecording(db: Database, values: UpsertValues) {
  return db
    .insert(attemptAnswer)
    .values(values)
    .onConflictDoUpdate({
      target: [attemptAnswer.attemptId, attemptAnswer.questionKey],
      set: {
        questionText: values.questionText,
        partNumber: values.partNumber,
        orderIndex: values.orderIndex,
        audioKey: values.audioKey,
        durationMs: values.durationMs,
        mimeType: values.mimeType,
        generation: values.generation,
        sizeBytes: values.sizeBytes,
        // Strictly newer recordings invalidate stale transcripts from older generations,
        // while equal-generation retries keep the existing transcript intact.
        transcript: sql`CASE WHEN ${attemptAnswer.generation} < excluded.generation THEN excluded.transcript ELSE ${attemptAnswer.transcript} END`,
      },
      setWhere: sql`${attemptAnswer.generation} <= excluded.generation`,
    })
    .returning();
}
