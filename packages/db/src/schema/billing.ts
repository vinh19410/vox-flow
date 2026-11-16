import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { attempt } from "./attempt";
import { user } from "./auth";

export const paymentOrder = sqliteTable(
  "payment_order",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: text("plan_id", { enum: ["pack", "week", "month", "exam"] }).notNull(),
    amountVnd: integer("amount_vnd").notNull(),
    transferCode: text("transfer_code").notNull(),
    examDateSnapshot: text("exam_date_snapshot"),
    status: text("status", { enum: ["pending", "paid", "expired", "refunded"] })
      .default("pending")
      .notNull(),
    sepayId: integer("sepay_id"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("payment_order_transfer_code_unique").on(table.transferCode),
    index("payment_order_user_status_idx").on(table.userId, table.status),
  ],
);

export const subscription = sqliteTable("subscription", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  planId: text("plan_id", { enum: ["week", "month", "exam"] }).notNull(),
  pointsRemaining: integer("points_remaining").notNull(),
  planPointsTotal: integer("plan_points_total").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  lastReservationId: text("last_reservation_id"),
  lastRefundToken: text("last_refund_token"),
  lastOrderId: text("last_order_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const paymentEvent = sqliteTable(
  "payment_event",
  {
    id: text("id").primaryKey(),
    sepayId: integer("sepay_id").notNull(),
    transferType: text("transfer_type", { enum: ["in", "out"] }).notNull(),
    gateway: text("gateway").notNull(),
    accountNumber: text("account_number").notNull(),
    subAccount: text("sub_account").default("").notNull(),
    transferAmount: integer("transfer_amount").notNull(),
    extractedCode: text("extracted_code"),
    referenceCode: text("reference_code").default("").notNull(),
    transactionDate: text("transaction_date").notNull(),
    orderId: text("order_id").references(() => paymentOrder.id, { onDelete: "set null" }),
    matchStatus: text("match_status", {
      enum: [
        "matched",
        "outbound",
        "unknown_code",
        "amount_mismatch",
        "account_mismatch",
        "already_paid",
        "order_not_pending",
      ],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("payment_event_sepay_id_unique").on(table.sepayId),
    index("payment_event_order_id_idx").on(table.orderId),
    index("payment_event_match_status_idx").on(table.matchStatus),
  ],
);

export const detailCredit = sqliteTable("detail_credit", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  remaining: integer("remaining").default(0).notNull(),
  lastUnlockAttemptId: text("last_unlock_attempt_id"),
  lastOrderId: text("last_order_id"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const detailUnlock = sqliteTable(
  "detail_unlock",
  {
    id: text("id").primaryKey(),
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
    uniqueIndex("detail_unlock_user_attempt_unique").on(table.userId, table.attemptId),
    index("detail_unlock_attempt_id_idx").on(table.attemptId),
  ],
);

export type PaymentOrder = typeof paymentOrder.$inferSelect;
export type Subscription = typeof subscription.$inferSelect;
export type PaymentEvent = typeof paymentEvent.$inferSelect;
export type DetailCredit = typeof detailCredit.$inferSelect;
export type DetailUnlock = typeof detailUnlock.$inferSelect;
