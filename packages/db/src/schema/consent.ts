import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const consentEvent = sqliteTable(
  "consent_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["save", "calibration"] }).notNull(),
    granted: integer("granted", { mode: "boolean" }).notNull(),
    policyVersion: text("policy_version").notNull().default("v1"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("consent_event_userId_idx").on(table.userId),
    index("consent_event_userId_kind_idx").on(table.userId, table.kind),
  ],
);

export type ConsentEvent = typeof consentEvent.$inferSelect;
export type NewConsentEvent = typeof consentEvent.$inferInsert;
