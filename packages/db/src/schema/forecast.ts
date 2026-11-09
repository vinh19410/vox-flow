import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const forecastTopic = sqliteTable(
  "forecast_topic",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    quarter: text("quarter").notNull(),
    part: integer("part").notNull().default(1),
    questions: text("questions").notNull().default("[]"),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("forecast_topic_quarter_idx").on(table.quarter),
    index("forecast_topic_status_idx").on(table.status),
    index("forecast_topic_reviewed_by_idx").on(table.reviewedBy),
  ],
);

export const forecastSource = sqliteTable(
  "forecast_source",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    topicId: text("topic_id")
      .notNull()
      .references(() => forecastTopic.id, { onDelete: "cascade" }),
    sourceType: text("source_type", { enum: ["manual", "student", "web"] }).notNull(),
    sourceUrl: text("source_url"),
    rawContent: text("raw_content"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("forecast_source_topic_id_idx").on(table.topicId),
    index("forecast_source_type_idx").on(table.sourceType),
  ],
);

export const forecastReport = sqliteTable(
  "forecast_report",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    topicId: text("topic_id")
      .notNull()
      .references(() => forecastTopic.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("forecast_report_user_topic_idx").on(table.userId, table.topicId),
    index("forecast_report_topic_id_idx").on(table.topicId),
    index("forecast_report_user_id_idx").on(table.userId),
  ],
);

export type ForecastTopic = typeof forecastTopic.$inferSelect;
export type NewForecastTopic = typeof forecastTopic.$inferInsert;
export type ForecastSource = typeof forecastSource.$inferSelect;
export type NewForecastSource = typeof forecastSource.$inferInsert;
export type ForecastReport = typeof forecastReport.$inferSelect;
export type NewForecastReport = typeof forecastReport.$inferInsert;
