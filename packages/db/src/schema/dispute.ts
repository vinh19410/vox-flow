import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

import { attempt } from "./attempt";
import { user } from "./auth";

export const scoreDispute = sqliteTable(
  "score_dispute",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => attempt.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetCriterion: text("target_criterion", {
      enum: ["ALL", "FC", "LR", "GRA", "PRON"],
    }).notNull(),
    expectedBand: text("expected_band").notNull(),
    reason: text("reason"),
    shareConsent: integer("share_consent", { mode: "boolean" }).default(false).notNull(),
    status: text("status", { enum: ["open", "reviewing", "resolved", "rejected"] })
      .default("open")
      .notNull(),
    dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
    previousBand: text("previous_band"),
    resolvedBand: text("resolved_band"),
    replyText: text("reply_text"),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
    warnedAt: integer("warned_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("score_dispute_userId_idx").on(table.userId),
    index("score_dispute_attemptId_idx").on(table.attemptId),
    index("score_dispute_status_idx").on(table.status),
    index("score_dispute_dueAt_idx").on(table.dueAt),
    uniqueIndex("score_dispute_active_attempt_unique")
      .on(table.attemptId)
      .where(sql`status IN ('open', 'reviewing')`),
  ],
);

export type ScoreDispute = typeof scoreDispute.$inferSelect;
export type NewScoreDispute = typeof scoreDispute.$inferInsert;
