import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const adminUserAction = sqliteTable(
  "admin_user_action",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action", {
      enum: ["grant_plan", "adjust_points", "adjust_detail_credit", "adjust_expiry"],
    }).notNull(),
    planId: text("plan_id", { enum: ["pack", "week", "month", "exam"] }),
    pointsDelta: integer("points_delta"),
    detailCreditsDelta: integer("detail_credits_delta"),
    previousExpiresAt: integer("previous_expires_at", { mode: "timestamp_ms" }),
    newExpiresAt: integer("new_expires_at", { mode: "timestamp_ms" }),
    note: text("note").notNull(),
    actorEmail: text("actor_email").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("admin_user_action_user_id_idx").on(table.userId),
    index("admin_user_action_created_at_idx").on(table.createdAt),
  ],
);

export type AdminUserAction = typeof adminUserAction.$inferSelect;
export type NewAdminUserAction = typeof adminUserAction.$inferInsert;
