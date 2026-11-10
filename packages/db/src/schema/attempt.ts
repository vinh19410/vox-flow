import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const attempt = sqliteTable(
  "attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mode: text("mode").notNull(),
    status: text("status", { enum: ["in_progress", "submitted", "abandoned"] })
      .default("in_progress")
      .notNull(),
    inHistory: integer("in_history", { mode: "boolean" }).default(true).notNull(),
    calibrationGranted: integer("calibration_granted", { mode: "boolean" }).default(false).notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
    topicId: text("topic_id"),
    questionKey: text("question_key"),
  },
  (table) => [
    index("attempt_userId_idx").on(table.userId),
    index("attempt_status_idx").on(table.status),
    index("attempt_topicId_idx").on(table.topicId),
  ],
);

export const attemptAnswer = sqliteTable(
  "attempt_answer",
  {
    id: text("id").primaryKey(),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => attempt.id, { onDelete: "cascade" }),
    questionKey: text("question_key").notNull(),
    questionText: text("question_text").notNull(),
    partNumber: integer("part_number").notNull(),
    orderIndex: integer("order_index").notNull(),
    audioKey: text("audio_key").notNull(),
    durationMs: integer("duration_ms").notNull(),
    mimeType: text("mime_type").notNull(),
    /** Actual byte size reported by R2 after the upload; drives the 35MB per-attempt budget. */
    sizeBytes: integer("size_bytes").default(0).notNull(),
    /** Speech-to-text of this answer, filled by the scoring pipeline. */
    transcript: text("transcript"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("attempt_answer_attemptId_idx").on(table.attemptId),
    unique("attempt_answer_attempt_question_unique").on(table.attemptId, table.questionKey),
  ],
);
