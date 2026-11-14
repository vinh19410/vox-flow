import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

/**
 * Single-table atomic ledger for free-tier daily point quota and global
 * estimated budget cap (`FREE_DAILY_BUDGET_VND`).
 *
 * No foreign key to `attempt.id` by design:
 * 1) `reserve` runs before inserting `attempt` in a single `db.batch` under
 *    `PRAGMA foreign_keys = ON`.
 * 2) Daily budget accounting survives `eraseUserData` when `user_id` is set to
 *    `NULL` for today's rows.
 */
export const quotaReservation = sqliteTable(
  "quota_reservation",
  {
    attemptId: text("attempt_id").primaryKey(),
    reservationId: text("reservation_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    vnDay: text("vn_day").notNull(),
    points: integer("points").notNull(),
    costVnd: integer("cost_vnd").notNull(),
    sunkCostVnd: integer("sunk_cost_vnd").default(0).notNull(),
    refundCount: integer("refund_count").default(0).notNull(),
    retakeOfAttemptId: text("retake_of_attempt_id"),
    status: text("status", { enum: ["active", "released"] }).default("active").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("quota_reservation_vn_day_status_idx").on(table.vnDay, table.status),
    index("quota_reservation_user_vn_day_status_idx").on(table.userId, table.vnDay, table.status),
    index("quota_reservation_retake_of_idx").on(table.retakeOfAttemptId),
  ],
);

export type QuotaReservation = typeof quotaReservation.$inferSelect;
