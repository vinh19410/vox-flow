import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index, unique } from "drizzle-orm/sqlite-core";

import { attempt } from "./attempt";
import { user } from "./auth";

/**
 * One aggregated score per attempt. The row is created when a scorable attempt
 * is submitted; its primary key on attemptId keeps re-submission idempotent.
 */
export const attemptScore = sqliteTable(
  "attempt_score",
  {
    attemptId: text("attempt_id")
      .primaryKey()
      .references(() => attempt.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["queued", "processing", "done", "failed"] })
      .default("queued")
      .notNull(),
    /** Median overall band, rounded to the nearest 0.5. */
    overall: real("overall"),
    /** JSON: ScoredCriterion[] (median band per criterion plus evidence). */
    criteriaJson: text("criteria_json"),
    oneLiner: text("one_liner"),
    model: text("model"),
    /** Number of processing attempts made by the queue consumer. */
    tries: integer("tries").default(0).notNull(),
    /** Manual retry count driven by scoring.retry; capped at 1 per attempt. */
    manualRetries: integer("manual_retries").default(0).notNull(),
    lastError: text("last_error"),
    costUsd: real("cost_usd"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
    scoredAt: integer("scored_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("attempt_score_userId_idx").on(table.userId),
    index("attempt_score_status_idx").on(table.status),
  ],
);

/** One independent grading run. Never shown to the learner directly. */
export const scoreRun = sqliteTable(
  "score_run",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => attempt.id, { onDelete: "cascade" }),
    runIndex: integer("run_index").notNull(),
    fc: real("fc").notNull(),
    lr: real("lr").notNull(),
    gra: real("gra").notNull(),
    p: real("p").notNull(),
    overall: real("overall").notNull(),
    /** JSON: the validated model output for this run. */
    payloadJson: text("payload_json").notNull(),
    model: text("model").notNull(),
    audioUsed: integer("audio_used", { mode: "boolean" }).default(false).notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: real("cost_usd"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("score_run_attemptId_idx").on(table.attemptId),
    unique("score_run_attempt_run_unique").on(table.attemptId, table.runIndex),
  ],
);

export type AttemptScore = typeof attemptScore.$inferSelect;
export type ScoreRun = typeof scoreRun.$inferSelect;

/**
 * One manual scoring retry. Powers the 3-retries-per-user-per-day cap
 * (Asia/Ho_Chi_Minh day). Rescue-path re-enqueues never write here.
 */
export const scoringRetryLog = sqliteTable(
  "scoring_retry_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => attempt.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("scoring_retry_log_userId_createdAt_idx").on(table.userId, table.createdAt),
    index("scoring_retry_log_attemptId_idx").on(table.attemptId),
  ],
);

export type ScoringRetryLog = typeof scoringRetryLog.$inferSelect;
