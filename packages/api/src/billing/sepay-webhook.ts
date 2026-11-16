import { timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@vox-flow/db";
import { detailCredit, paymentEvent, paymentOrder, subscription } from "@vox-flow/db/schema";

import type { ApiEnv } from "../context";
import {
  computeSubscriptionExpiry,
  extractTransferCode,
  resolveBillingPlans,
  type SubscriptionPlanId,
} from "./plans";

const DAY_MS = 24 * 60 * 60 * 1000;

const sepayPayloadSchema = z.object({
  id: z.number().int(),
  gateway: z.string().default(""),
  transactionDate: z.string().default(""),
  accountNumber: z.string().default(""),
  subAccount: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  code: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  content: z.string().default(""),
  transferType: z.enum(["in", "out"]),
  transferAmount: z.number().int().nonnegative(),
  referenceCode: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
});

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function verifySepayApiKey(authHeader: string | null, expectedApiKey: string | undefined): boolean {
  const key = typeof expectedApiKey === "string" ? expectedApiKey.trim() : "";
  if (!key || !authHeader) {
    return false;
  }
  const match = /^Apikey\s+(.+)$/i.exec(authHeader.trim());
  if (!match?.[1]) {
    return false;
  }
  return safeEqualStrings(match[1].trim(), key);
}

export type SepayWebhookResult =
  | { status: 200; body: { success: true } }
  | { status: 400 | 401 | 500; body: { success: false; error: string } };

export async function handleSepayWebhook(params: {
  request: Request;
  db: Database;
  env?: ApiEnv;
  now?: () => Date;
}): Promise<SepayWebhookResult> {
  const { request, db, env } = params;
  const now = (params.now ?? (() => new Date()))();
  const nowMs = now.getTime();

  const apiKey = typeof env?.SEPAY_WEBHOOK_API_KEY === "string" ? env.SEPAY_WEBHOOK_API_KEY : undefined;
  if (!verifySepayApiKey(request.headers.get("authorization"), apiKey)) {
    return { status: 401, body: { success: false, error: "Unauthorized" } };
  }

  const bankAccount = typeof env?.SEPAY_BANK_ACCOUNT === "string" ? env.SEPAY_BANK_ACCOUNT.trim() : "";
  const subAccount = typeof env?.SEPAY_SUB_ACCOUNT === "string" ? env.SEPAY_SUB_ACCOUNT.trim() : "";
  if (!bankAccount) {
    return { status: 500, body: { success: false, error: "Payment bank not configured" } };
  }

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return { status: 400, body: { success: false, error: "Invalid JSON payload" } };
  }

  const parsed = sepayPayloadSchema.safeParse(rawJson);
  if (!parsed.success) {
    return { status: 400, body: { success: false, error: "Invalid payload" } };
  }
  const payload = parsed.data;

  // Fast-path dedup check (still enforced atomically via ON CONFLICT in db.batch below)
  const [existingEvent] = await db
    .select({ id: paymentEvent.id })
    .from(paymentEvent)
    .where(eq(paymentEvent.sepayId, payload.id))
    .limit(1);
  if (existingEvent) {
    return { status: 200, body: { success: true } };
  }

  const extractedCode = extractTransferCode(payload.code, payload.content);

  type MatchStatus =
    | "matched"
    | "outbound"
    | "unknown_code"
    | "amount_mismatch"
    | "account_mismatch"
    | "already_paid"
    | "order_not_pending";

  let matchStatus: MatchStatus;
  let matchedOrder: typeof paymentOrder.$inferSelect | null = null;

  if (payload.transferType === "out") {
    matchStatus = "outbound";
  } else if (
    payload.accountNumber.trim() !== bankAccount ||
    (subAccount && payload.subAccount.trim() !== subAccount)
  ) {
    matchStatus = "account_mismatch";
  } else if (!extractedCode) {
    matchStatus = "unknown_code";
  } else {
    const [order] = await db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.transferCode, extractedCode))
      .limit(1);

    if (!order) {
      matchStatus = "unknown_code";
    } else if (order.status === "paid") {
      matchedOrder = order;
      matchStatus = "already_paid";
    } else if (order.status !== "pending") {
      matchedOrder = order;
      matchStatus = "order_not_pending";
    } else if (payload.transferAmount < order.amountVnd) {
      matchedOrder = order;
      matchStatus = "amount_mismatch";
    } else {
      matchedOrder = order;
      matchStatus = "matched";
    }
  }

  const eventInsertStmt = db
    .insert(paymentEvent)
    .values({
      id: crypto.randomUUID(),
      sepayId: payload.id,
      transferType: payload.transferType,
      gateway: payload.gateway,
      accountNumber: payload.accountNumber,
      subAccount: payload.subAccount,
      transferAmount: payload.transferAmount,
      extractedCode,
      referenceCode: payload.referenceCode,
      transactionDate: payload.transactionDate,
      orderId: matchedOrder?.id ?? null,
      matchStatus,
      createdAt: now,
    })
    .onConflictDoNothing({ target: paymentEvent.sepayId });

  if (matchStatus !== "matched" || !matchedOrder) {
    await db.batch([eventInsertStmt]);
    return { status: 200, body: { success: true } };
  }

  const plans = resolveBillingPlans(env);
  const plan = plans[matchedOrder.planId];

  const orderUpdateStmt = db
    .update(paymentOrder)
    .set({
      status: "paid",
      sepayId: payload.id,
      paidAt: now,
    })
    .where(and(eq(paymentOrder.id, matchedOrder.id), eq(paymentOrder.status, "pending")));

  if (plan.kind === "detail_pack") {
    const creditUpsertStmt = db
      .insert(detailCredit)
      .select((qb) =>
        qb
          .select({
            userId: sql<string>`${matchedOrder.userId}`.as("user_id"),
            remaining: sql<number>`${plan.detailCredits}`.as("remaining"),
            lastUnlockAttemptId: sql<string | null>`NULL`.as("last_unlock_attempt_id"),
            lastOrderId: sql<string | null>`${matchedOrder.id}`.as("last_order_id"),
            updatedAt: sql<Date>`${nowMs}`.as("updated_at"),
          })
          .from(paymentOrder)
          .where(and(eq(paymentOrder.id, matchedOrder.id), eq(paymentOrder.sepayId, payload.id))),
      )
      .onConflictDoUpdate({
        target: detailCredit.userId,
        set: {
          remaining: sql`${detailCredit.remaining} + ${plan.detailCredits}`,
          lastOrderId: matchedOrder.id,
          updatedAt: now,
        },
        setWhere: sql`COALESCE(${detailCredit.lastOrderId}, '') <> ${matchedOrder.id}`,
      });

    await db.batch([eventInsertStmt, orderUpdateStmt, creditUpsertStmt]);
    return { status: 200, body: { success: true } };
  }

  const subPlanId = matchedOrder.planId as SubscriptionPlanId;
  const freshExpiresAtMs = computeSubscriptionExpiry({
    planId: subPlanId,
    nowMs,
    currentExpiresAtMs: null,
    examDate: matchedOrder.examDateSnapshot ?? null,
  });

  const stackedExpirySql =
    subPlanId === "week"
      ? sql`${subscription.expiresAt} + ${7 * DAY_MS}`
      : subPlanId === "month"
        ? sql`${subscription.expiresAt} + ${30 * DAY_MS}`
        : sql`MAX(${subscription.expiresAt}, ${freshExpiresAtMs})`;

  const subUpsertStmt = db
    .insert(subscription)
    .select((qb) =>
      qb
        .select({
          userId: sql<string>`${matchedOrder.userId}`.as("user_id"),
          planId: sql<SubscriptionPlanId>`${subPlanId}`.as("plan_id"),
          pointsRemaining: sql<number>`${plan.points}`.as("points_remaining"),
          planPointsTotal: sql<number>`${plan.points}`.as("plan_points_total"),
          expiresAt: sql<Date>`${freshExpiresAtMs}`.as("expires_at"),
          lastReservationId: sql<string | null>`NULL`.as("last_reservation_id"),
          lastRefundToken: sql<string | null>`NULL`.as("last_refund_token"),
          lastOrderId: sql<string | null>`${matchedOrder.id}`.as("last_order_id"),
          createdAt: sql<Date>`${nowMs}`.as("created_at"),
          updatedAt: sql<Date>`${nowMs}`.as("updated_at"),
        })
        .from(paymentOrder)
        .where(and(eq(paymentOrder.id, matchedOrder.id), eq(paymentOrder.sepayId, payload.id))),
    )
    .onConflictDoUpdate({
      target: subscription.userId,
      set: {
        pointsRemaining: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${subscription.pointsRemaining} + ${plan.points} ELSE ${plan.points} END`,
        planPointsTotal: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${subscription.planPointsTotal} + ${plan.points} ELSE ${plan.points} END`,
        expiresAt: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${stackedExpirySql} ELSE ${freshExpiresAtMs} END`,
        planId: subPlanId,
        lastOrderId: matchedOrder.id,
        updatedAt: now,
      },
      setWhere: sql`COALESCE(${subscription.lastOrderId}, '') <> ${matchedOrder.id}`,
    });

  await db.batch([eventInsertStmt, orderUpdateStmt, subUpsertStmt]);
  return { status: 200, body: { success: true } };
}
