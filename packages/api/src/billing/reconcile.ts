import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@vox-flow/db";
import {
  detailCredit,
  paymentEvent,
  paymentOrder,
  subscription,
  type PaymentOrder,
} from "@vox-flow/db/schema";

import type { ApiEnv } from "../context";
import {
  computeSubscriptionExpiry,
  extractTransferCode,
  resolveBillingPlans,
  type SubscriptionPlanId,
} from "./plans";

const DAY_MS = 24 * 60 * 60 * 1000;
const SEPAY_API_V2_TRANSACTIONS_URL = "https://userapi.sepay.vn/v2/transactions";
const SWEEP_LOOKBACK_MS = 48 * 60 * 60 * 1000;
const SWEEP_TIMEOUT_MS = 10_000;
const SWEEP_PER_PAGE = 100;
const SWEEP_MAX_PAGES = 5;

export type PaymentClassification =
  | "matched"
  | "underpaid"
  | "overpaid"
  | "unknown_code"
  | "expired_order"
  | "outbound"
  | "account_mismatch"
  | "already_paid"
  | "order_not_pending";

export type PaymentMatchStatus =
  | "matched"
  | "outbound"
  | "unknown_code"
  | "amount_mismatch"
  | "account_mismatch"
  | "already_paid"
  | "order_not_pending";

export type PaymentResolutionStatus =
  | "resolved"
  | "pending_review"
  | "activated"
  | "refunded"
  | "ignored";

export type PaymentSource = "webhook" | "cron_sweep";

export interface ClassifyInput {
  transferType: "in" | "out";
  accountNumber: string;
  subAccount?: string | null;
  bankAccount: string;
  expectedSubAccount?: string | null;
  extractedCode: string | null;
  order: Pick<PaymentOrder, "status" | "amountVnd" | "expiresAt"> | null | undefined;
  transferAmount: number;
  nowMs: number;
}

export function classify(input: ClassifyInput): PaymentClassification {
  if (input.transferType === "out") {
    return "outbound";
  }

  const expectedSub = input.expectedSubAccount?.trim() ?? "";
  const actualSub = input.subAccount?.trim() ?? "";
  if (
    input.accountNumber.trim() !== input.bankAccount.trim() ||
    (expectedSub !== "" && actualSub !== expectedSub)
  ) {
    return "account_mismatch";
  }

  if (!input.extractedCode || !input.order) {
    return "unknown_code";
  }

  if (input.order.status === "paid") {
    return "already_paid";
  }

  if (input.order.status === "expired") {
    return "expired_order";
  }

  if (input.order.status !== "pending") {
    return "order_not_pending";
  }

  if (input.nowMs > input.order.expiresAt.getTime()) {
    return "expired_order";
  }

  if (input.transferAmount < input.order.amountVnd) {
    return "underpaid";
  }

  if (input.transferAmount > input.order.amountVnd) {
    return "overpaid";
  }

  return "matched";
}

export function toMatchStatus(classification: PaymentClassification): PaymentMatchStatus {
  switch (classification) {
    case "underpaid":
    case "overpaid":
      return "amount_mismatch";
    case "expired_order":
      return "order_not_pending";
    case "matched":
    case "outbound":
    case "unknown_code":
    case "account_mismatch":
    case "already_paid":
    case "order_not_pending":
      return classification;
  }
}

export function toResolutionStatus(classification: PaymentClassification): PaymentResolutionStatus {
  if (classification === "matched") {
    return "resolved";
  }
  if (classification === "outbound") {
    return "ignored";
  }
  return "pending_review";
}

export interface ActivateOrderParams {
  db: Database;
  order: PaymentOrder;
  sepayId?: number | null;
  env?: ApiEnv;
  now: Date;
  allowExpired?: boolean;
}

export interface ActivateOrderResult {
  activated: boolean;
  alreadyPaid: boolean;
}

function buildActivationStatements(params: ActivateOrderParams) {
  const { db, order, sepayId = null, env, now, allowExpired = false } = params;
  const nowMs = now.getTime();
  const plans = resolveBillingPlans(env);
  const plan = plans[order.planId];

  const statusCondition = allowExpired
    ? inArray(paymentOrder.status, ["pending", "expired"])
    : eq(paymentOrder.status, "pending");

  const orderUpdateStmt = db
    .update(paymentOrder)
    .set({
      status: "paid",
      ...(sepayId != null ? { sepayId } : {}),
      paidAt: now,
    })
    .where(and(eq(paymentOrder.id, order.id), statusCondition))
    .returning({ id: paymentOrder.id });

  const orderActivatedWhere =
    sepayId != null
      ? and(
          eq(paymentOrder.id, order.id),
          eq(paymentOrder.status, "paid"),
          eq(paymentOrder.paidAt, now),
          eq(paymentOrder.sepayId, sepayId),
        )
      : and(
          eq(paymentOrder.id, order.id),
          eq(paymentOrder.status, "paid"),
          eq(paymentOrder.paidAt, now),
        );

  if (plan.kind === "detail_pack") {
    const creditUpsertStmt = db
      .insert(detailCredit)
      .select((qb) =>
        qb
          .select({
            userId: sql<string>`${order.userId}`.as("user_id"),
            remaining: sql<number>`${plan.detailCredits}`.as("remaining"),
            lastUnlockAttemptId: sql<string | null>`NULL`.as("last_unlock_attempt_id"),
            lastOrderId: sql<string | null>`${order.id}`.as("last_order_id"),
            updatedAt: sql<Date>`${nowMs}`.as("updated_at"),
          })
          .from(paymentOrder)
          .where(orderActivatedWhere),
      )
      .onConflictDoUpdate({
        target: detailCredit.userId,
        set: {
          remaining: sql`${detailCredit.remaining} + ${plan.detailCredits}`,
          lastOrderId: order.id,
          updatedAt: now,
        },
        setWhere: sql`COALESCE(${detailCredit.lastOrderId}, '') <> ${order.id}`,
      });

    return { orderUpdateStmt, entitlementUpsertStmt: creditUpsertStmt };
  }

  const subPlanId = order.planId as SubscriptionPlanId;
  const freshExpiresAtMs = computeSubscriptionExpiry({
    planId: subPlanId,
    nowMs,
    currentExpiresAtMs: null,
    examDate: order.examDateSnapshot ?? null,
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
          userId: sql<string>`${order.userId}`.as("user_id"),
          planId: sql<SubscriptionPlanId>`${subPlanId}`.as("plan_id"),
          pointsRemaining: sql<number>`${plan.points}`.as("points_remaining"),
          planPointsTotal: sql<number>`${plan.points}`.as("plan_points_total"),
          expiresAt: sql<Date>`${freshExpiresAtMs}`.as("expires_at"),
          lastReservationId: sql<string | null>`NULL`.as("last_reservation_id"),
          lastRefundToken: sql<string | null>`NULL`.as("last_refund_token"),
          lastOrderId: sql<string | null>`${order.id}`.as("last_order_id"),
          createdAt: sql<Date>`${nowMs}`.as("created_at"),
          updatedAt: sql<Date>`${nowMs}`.as("updated_at"),
        })
        .from(paymentOrder)
        .where(orderActivatedWhere),
    )
    .onConflictDoUpdate({
      target: subscription.userId,
      set: {
        pointsRemaining: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${subscription.pointsRemaining} + ${plan.points} ELSE ${plan.points} END`,
        planPointsTotal: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${subscription.planPointsTotal} + ${plan.points} ELSE ${plan.points} END`,
        expiresAt: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${stackedExpirySql} ELSE ${freshExpiresAtMs} END`,
        planId: subPlanId,
        lastOrderId: order.id,
        updatedAt: now,
      },
      setWhere: sql`COALESCE(${subscription.lastOrderId}, '') <> ${order.id}`,
    });

  return { orderUpdateStmt, entitlementUpsertStmt: subUpsertStmt };
}

export async function activateOrderAtomic(
  params: ActivateOrderParams,
): Promise<ActivateOrderResult> {
  const { order, allowExpired = false } = params;
  if (order.status === "paid") {
    return { activated: false, alreadyPaid: true };
  }
  const canActivate =
    order.status === "pending" || (allowExpired && order.status === "expired");
  if (!canActivate) {
    return { activated: false, alreadyPaid: false };
  }

  const { orderUpdateStmt, entitlementUpsertStmt } = buildActivationStatements(params);
  const [updatedRows] = await params.db.batch([orderUpdateStmt, entitlementUpsertStmt]);
  const activated = (updatedRows?.length ?? 0) > 0;
  return {
    activated,
    alreadyPaid: false,
  };
}

export interface IngestSepayTransactionParams {
  db: Database;
  env?: ApiEnv;
  now: Date;
  source: PaymentSource;
  sepayId?: number | null;
  sepayUuid?: string | null;
  transferType: "in" | "out";
  gateway: string;
  accountNumber: string;
  subAccount?: string | null;
  transferAmount: number;
  extractedCode: string | null;
  referenceCode?: string | null;
  transactionDate: string;
}

export interface IngestSepayTransactionResult {
  skipped: boolean;
  eventId: string;
  classification: PaymentClassification;
  matchStatus: PaymentMatchStatus;
  resolutionStatus: PaymentResolutionStatus;
  orderId: string | null;
}

async function findExistingEventForDedup(params: {
  db: Database;
  sepayId: number | null;
  sepayUuid: string | null;
  referenceCode: string;
  transferAmount: number;
  accountNumber: string;
  transferType: "in" | "out";
  transactionDate: string;
  extractedCode: string | null;
}) {
  const {
    db,
    sepayId,
    sepayUuid,
    referenceCode,
    transferAmount,
    accountNumber,
    transferType,
    transactionDate,
    extractedCode,
  } = params;

  if (sepayId != null) {
    const [byId] = await db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.sepayId, sepayId))
      .limit(1);
    if (byId) return byId;
  }

  if (sepayUuid) {
    const [byUuid] = await db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.sepayUuid, sepayUuid))
      .limit(1);
    if (byUuid) return byUuid;
  }

  if (referenceCode !== "") {
    const [byRef] = await db
      .select()
      .from(paymentEvent)
      .where(
        and(
          eq(paymentEvent.referenceCode, referenceCode),
          eq(paymentEvent.transferAmount, transferAmount),
          eq(paymentEvent.accountNumber, accountNumber),
          eq(paymentEvent.transferType, transferType),
        ),
      )
      .limit(1);
    if (byRef) return byRef;
  } else {
    const [byFallback] = await db
      .select()
      .from(paymentEvent)
      .where(
        and(
          eq(paymentEvent.referenceCode, ""),
          eq(paymentEvent.accountNumber, accountNumber),
          eq(paymentEvent.transferType, transferType),
          eq(paymentEvent.transferAmount, transferAmount),
          eq(paymentEvent.transactionDate, transactionDate),
          extractedCode === null
            ? isNull(paymentEvent.extractedCode)
            : eq(paymentEvent.extractedCode, extractedCode),
        ),
      )
      .limit(1);
    if (byFallback) return byFallback;
  }

  return null;
}

export async function ingestSepayTransaction(
  params: IngestSepayTransactionParams,
): Promise<IngestSepayTransactionResult> {
  const { db, env, now, source } = params;
  const bankAccount =
    typeof env?.SEPAY_BANK_ACCOUNT === "string" ? env.SEPAY_BANK_ACCOUNT.trim() : "";
  const expectedSubAccount =
    typeof env?.SEPAY_SUB_ACCOUNT === "string" ? env.SEPAY_SUB_ACCOUNT.trim() : "";

  if (!bankAccount) {
    throw new Error("Payment bank not configured");
  }

  const sepayId = params.sepayId ?? null;
  const sepayUuid = params.sepayUuid?.trim() ? params.sepayUuid.trim() : null;
  const accountNumber = params.accountNumber.trim();
  const subAccount = (params.subAccount ?? "").trim();
  const referenceCode = (params.referenceCode ?? "").trim();
  const transactionDate = params.transactionDate.trim();
  const gateway = params.gateway.trim();
  const extractedCode = params.extractedCode;

  const existing = await findExistingEventForDedup({
    db,
    sepayId,
    sepayUuid,
    referenceCode,
    transferAmount: params.transferAmount,
    accountNumber,
    transferType: params.transferType,
    transactionDate,
    extractedCode,
  });

  if (existing) {
    if (sepayId != null && existing.sepayId == null) {
      await db
        .update(paymentEvent)
        .set({ sepayId })
        .where(and(eq(paymentEvent.id, existing.id), isNull(paymentEvent.sepayId)));
    }
    if (sepayUuid !== null && existing.sepayUuid == null) {
      await db
        .update(paymentEvent)
        .set({ sepayUuid })
        .where(and(eq(paymentEvent.id, existing.id), isNull(paymentEvent.sepayUuid)));
    }

    return {
      skipped: true,
      eventId: existing.id,
      classification: existing.classification,
      matchStatus: existing.matchStatus,
      resolutionStatus: existing.resolutionStatus,
      orderId: existing.orderId ?? null,
    };
  }

  let matchedOrder: PaymentOrder | null = null;
  if (extractedCode) {
    const [order] = await db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.transferCode, extractedCode))
      .limit(1);
    matchedOrder = order ?? null;
  }

  const classification = classify({
    transferType: params.transferType,
    accountNumber,
    subAccount,
    bankAccount,
    expectedSubAccount,
    extractedCode,
    order: matchedOrder,
    transferAmount: params.transferAmount,
    nowMs: now.getTime(),
  });
  const matchStatus = toMatchStatus(classification);
  const resolutionStatus = toResolutionStatus(classification);
  const eventId = crypto.randomUUID();

  // Never store content, description, or accumulated in payment_event.
  const eventInsertStmt = db
    .insert(paymentEvent)
    .values({
      id: eventId,
      sepayId,
      sepayUuid,
      transferType: params.transferType,
      gateway,
      accountNumber,
      subAccount,
      transferAmount: params.transferAmount,
      extractedCode,
      referenceCode,
      transactionDate,
      orderId: matchedOrder?.id ?? null,
      matchStatus,
      classification,
      resolutionStatus,
      source,
      createdAt: now,
    })
    .onConflictDoNothing();

  if (classification !== "matched" || !matchedOrder) {
    await db.batch([eventInsertStmt]);
    return {
      skipped: false,
      eventId,
      classification,
      matchStatus,
      resolutionStatus,
      orderId: matchedOrder?.id ?? null,
    };
  }

  const { orderUpdateStmt, entitlementUpsertStmt } = buildActivationStatements({
    db,
    order: matchedOrder,
    sepayId,
    env,
    now,
    allowExpired: false,
  });

  await db.batch([eventInsertStmt, orderUpdateStmt, entitlementUpsertStmt]);

  return {
    skipped: false,
    eventId,
    classification,
    matchStatus,
    resolutionStatus,
    orderId: matchedOrder.id,
  };
}

export function formatUtcPlus7DateTime(dateMs: number): string {
  const vnMs = dateMs + 7 * 60 * 60 * 1000;
  const d = new Date(vnMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

const sepayApiNumberSchema = z.union([
  z.number().finite().nonnegative(),
  z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d+)?$/)
    .transform((s) => Number(s)),
]);

const sepayApiTransactionSchema = z.object({
  id: z.union([z.string().min(1), z.number().int().transform(String)]),
  transaction_date: z.string().default(""),
  account_number: z.string().default(""),
  sub_account: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  transfer_type: z.enum(["in", "out"]).default("in"),
  amount_in: sepayApiNumberSchema.nullish().transform((v) => Math.round(v ?? 0)),
  amount_out: sepayApiNumberSchema.nullish().transform((v) => Math.round(v ?? 0)),
  transaction_content: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  reference_number: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  reference_code: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  code: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  bank_brand_name: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  gateway: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
});

const sepayPaginationSchema = z.object({
  total: z.number().int().nonnegative().optional(),
  per_page: z.number().int().positive().optional(),
  current_page: z.number().int().positive().optional(),
  last_page: z.number().int().nonnegative().optional(),
  has_more: z.boolean().optional(),
});

const sepayApiResponseSchema = z.object({
  status: z.union([z.literal("success"), z.literal(200), z.literal(true)]).optional(),
  data: z.array(sepayApiTransactionSchema),
  pagination: sepayPaginationSchema.optional(),
  meta: z
    .object({
      pagination: sepayPaginationSchema.optional(),
    })
    .optional(),
});

export interface SweepTransactionsParams {
  db: Database;
  env?: ApiEnv;
  fetchImpl?: typeof fetch;
  now?: Date | (() => Date);
}

export interface SweepTransactionsResult {
  fetched: number;
  inserted: number;
  skipped: number;
  skippedReason?: "missing_config";
}

export async function sweepTransactions(
  params: SweepTransactionsParams,
): Promise<SweepTransactionsResult> {
  const { db, env } = params;
  const apiToken = typeof env?.SEPAY_API_TOKEN === "string" ? env.SEPAY_API_TOKEN.trim() : "";
  const bankAccount =
    typeof env?.SEPAY_BANK_ACCOUNT === "string" ? env.SEPAY_BANK_ACCOUNT.trim() : "";

  if (!apiToken || !bankAccount) {
    return { fetched: 0, inserted: 0, skipped: 0, skippedReason: "missing_config" };
  }

  const fetchFn = params.fetchImpl ?? globalThis.fetch;
  const nowDate =
    typeof params.now === "function" ? params.now() : (params.now ?? new Date());
  const transactionDateFrom = formatUtcPlus7DateTime(nowDate.getTime() - SWEEP_LOOKBACK_MS);

  let fetched = 0;
  let inserted = 0;
  let skipped = 0;

  for (let page = 1; page <= SWEEP_MAX_PAGES; page += 1) {
    const url = new URL(SEPAY_API_V2_TRANSACTIONS_URL);
    url.searchParams.set("transfer_type", "in");
    url.searchParams.set("transaction_date_from", transactionDateFrom);
    url.searchParams.set("per_page", String(SWEEP_PER_PAGE));
    url.searchParams.set("page", String(page));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SWEEP_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetchFn(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`SePay API v2 returned HTTP ${response.status}`);
    }

    const rawJson: unknown = await response.json();
    const parsed = sepayApiResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      throw new Error(`Invalid SePay API v2 payload: ${parsed.error.message}`);
    }

    const transactions = parsed.data.data;
    fetched += transactions.length;

    for (const tx of transactions) {
      const transferAmount = tx.transfer_type === "out" ? tx.amount_out : tx.amount_in;
      const extractedCode = extractTransferCode(tx.code, tx.transaction_content);
      const referenceCode = tx.reference_number || tx.reference_code;
      const gateway = tx.bank_brand_name || tx.gateway;

      const result = await ingestSepayTransaction({
        db,
        env,
        now: nowDate,
        source: "cron_sweep",
        sepayUuid: tx.id,
        sepayId: null,
        transferType: tx.transfer_type,
        gateway,
        accountNumber: tx.account_number,
        subAccount: tx.sub_account,
        transferAmount,
        extractedCode,
        referenceCode,
        transactionDate: tx.transaction_date,
      });

      if (result.skipped) {
        skipped += 1;
      } else {
        inserted += 1;
      }
    }

    const pagination = parsed.data.meta?.pagination ?? parsed.data.pagination;
    const lastPage = pagination?.last_page ?? 1;
    if (page >= lastPage || transactions.length === 0) {
      break;
    }
  }

  return { fetched, inserted, skipped };
}
