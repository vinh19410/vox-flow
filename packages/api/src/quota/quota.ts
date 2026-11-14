import { and, eq, ne, sql, type SQL } from "drizzle-orm";

import type { Database } from "@vox-flow/db";
import { quotaReservation, user } from "@vox-flow/db/schema";

import { getEntitlement, type Entitlement } from "../entitlements";
import { nextVietnamMidnightMs, UNSUBMITTED_HOLD_TTL_MS, vnDay } from "./vn-time";

export { nextVietnamMidnightMs, UNSUBMITTED_HOLD_TTL_MS, vnDay };

export const DAILY_FREE_POINTS = 3;
export const MAX_DAILY_REFUNDS = 3;
export const DEFAULT_FREE_DAILY_BUDGET_VND = 33_000;

export const QUOTA_EXCEEDED = "QUOTA_EXCEEDED";
export const GLOBAL_CAP_REACHED = "GLOBAL_CAP_REACHED";

const PRICE_COSTS = {
  full: { points: 3, costVnd: 2500 },
  part: { points: 1, costVnd: 1000 },
  forecastP1: { points: 1, costVnd: 3000 },
  forecastP23: { points: 2, costVnd: 4500 },
  singleQuestion: { points: 1, costVnd: 1000 },
  firstRetake: { points: 0, costVnd: 1000 },
  extraRetake: { points: 1, costVnd: 1000 },
} as const;

export type MockQuotaMode = "full" | "part1" | "part2" | "part3";

export type QuotaChargeTarget =
  | { kind: "mock"; mode: MockQuotaMode }
  | { kind: "forecast_topic"; topicPart: number }
  | { kind: "forecast_question" }
  | { kind: "retake"; isFirstRootRetake: boolean };

function priceFor(target: QuotaChargeTarget): { points: number; costVnd: number } {
  switch (target.kind) {
    case "mock":
      return target.mode === "full" ? PRICE_COSTS.full : PRICE_COSTS.part;
    case "forecast_topic":
      return target.topicPart === 1 ? PRICE_COSTS.forecastP1 : PRICE_COSTS.forecastP23;
    case "forecast_question":
      return PRICE_COSTS.singleQuestion;
    case "retake":
      return target.isFirstRootRetake ? PRICE_COSTS.firstRetake : PRICE_COSTS.extraRetake;
  }
}

export function pointsFor(target: QuotaChargeTarget): number {
  return priceFor(target).points;
}

export function costVndFor(target: QuotaChargeTarget): number {
  return priceFor(target).costVnd;
}

/**
 * Parses `FREE_DAILY_BUDGET_VND` strictly: empty/undefined falls back to
 * `33000`, `"0"` is respected to lock the global cap, and malformed values
 * fail closed to `0`.
 */
export function parseFreeDailyBudgetVnd(raw: unknown): number {
  if (raw === undefined || raw === null) {
    return DEFAULT_FREE_DAILY_BUDGET_VND;
  }
  const str = String(raw).trim();
  if (str === "") {
    return DEFAULT_FREE_DAILY_BUDGET_VND;
  }
  if (!/^\d+$/.test(str)) {
    return 0;
  }
  const parsed = Number.parseInt(str, 10);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

export function usedPointsSubquery(userId: string, day: string): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(points), 0)
    FROM quota_reservation
    WHERE user_id = ${userId} AND vn_day = ${day} AND status = 'active'
  )`;
}

function usedPointsExcludingSubquery(
  userId: string,
  day: string,
  excludeAttemptId: string,
): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(points), 0)
    FROM quota_reservation
    WHERE user_id = ${userId}
      AND vn_day = ${day}
      AND status = 'active'
      AND attempt_id <> ${excludeAttemptId}
  )`;
}

/**
 * Total daily global spend in VND (sunk AI costs + active un-expired holds).
 * Abandoned or stale (>30m) `in_progress` attempts release their global hold.
 */
export function spentVndSubquery(day: string, staleCutoffMs: number): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(
      sunk_cost_vnd + CASE
        WHEN status = 'active' AND NOT EXISTS (
          SELECT 1 FROM attempt a
          WHERE a.id = quota_reservation.attempt_id
            AND (
              a.status = 'abandoned'
              OR (a.status = 'in_progress' AND quota_reservation.created_at <= ${staleCutoffMs})
            )
        ) THEN cost_vnd
        ELSE 0
      END
    ), 0)
    FROM quota_reservation
    WHERE vn_day = ${day}
  )`;
}

function spentVndExcludingActiveHoldSubquery(
  day: string,
  staleCutoffMs: number,
  excludeAttemptId: string,
): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(
      sunk_cost_vnd + CASE
        WHEN attempt_id <> ${excludeAttemptId}
          AND status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM attempt a
            WHERE a.id = quota_reservation.attempt_id
              AND (
                a.status = 'abandoned'
                OR (a.status = 'in_progress' AND quota_reservation.created_at <= ${staleCutoffMs})
              )
          ) THEN cost_vnd
        ELSE 0
      END
    ), 0)
    FROM quota_reservation
    WHERE vn_day = ${day}
  )`;
}

export type ReserveParams = {
  userId: string;
  attemptId: string;
  reservationId?: string;
  target: QuotaChargeTarget;
  budgetCapVnd: number;
  now?: Date;
  retakeOfAttemptId?: string | null;
  resolveEntitlement?: (db: Database, userId: string) => Promise<Entitlement>;
};

export type ReserveResult =
  | { ok: true; bypassed: boolean; points: number; costVnd: number; reservationId: string }
  | { ok: false; reason: typeof QUOTA_EXCEEDED | typeof GLOBAL_CAP_REACHED | "FIRST_RETAKE_TAKEN" };

/**
 * Builds the atomic conditional INSERT statement for `quota_reservation`.
 * Callers running `db.batch` can compose this with `attempt` insert in one
 * D1 transaction so failed quotas never leave orphaned `in_progress` rows.
 */
export function buildReserveStatement(
  db: Database,
  params: {
    userId: string;
    attemptId: string;
    reservationId: string;
    target: QuotaChargeTarget;
    budgetCapVnd: number;
    nowMs: number;
    retakeOfAttemptId?: string | null;
  },
) {
  const { points, costVnd } = priceFor(params.target);
  const day = vnDay(params.nowMs);
  const staleCutoffMs = params.nowMs - UNSUBMITTED_HOLD_TTL_MS;
  const retakeId = params.retakeOfAttemptId ?? null;

  const isUniqueFirstRetake =
    params.target.kind === "retake" && params.target.isFirstRootRetake && Boolean(retakeId);

  const conditions: SQL[] = [
    eq(user.id, params.userId),
    sql`(${usedPointsSubquery(params.userId, day)} + ${points}) <= ${DAILY_FREE_POINTS}`,
    sql`(${spentVndSubquery(day, staleCutoffMs)} + ${costVnd}) <= ${params.budgetCapVnd}`,
  ];

  if (isUniqueFirstRetake && retakeId) {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM quota_reservation qr
        WHERE qr.retake_of_attempt_id = ${retakeId} AND qr.status = 'active'
      )`,
    );
  }

  return db
    .insert(quotaReservation)
    .select((qb) =>
      qb
        .select({
          attemptId: sql<string>`${params.attemptId}`.as("attempt_id"),
          reservationId: sql<string>`${params.reservationId}`.as("reservation_id"),
          userId: sql<string>`${params.userId}`.as("user_id"),
          vnDay: sql<string>`${day}`.as("vn_day"),
          points: sql<number>`${points}`.as("points"),
          costVnd: sql<number>`${costVnd}`.as("cost_vnd"),
          sunkCostVnd: sql<number>`0`.as("sunk_cost_vnd"),
          refundCount: sql<number>`0`.as("refund_count"),
          retakeOfAttemptId: sql<string | null>`${retakeId}`.as("retake_of_attempt_id"),
          status: sql<"active">`'active'`.as("status"),
          createdAt: sql<Date>`${params.nowMs}`.as("created_at"),
          updatedAt: sql<Date>`${params.nowMs}`.as("updated_at"),
        })
        .from(user)
        .where(and(...conditions)),
    )
    .returning({ attemptId: quotaReservation.attemptId });
}

export async function diagnoseReserveFailure(
  db: Database,
  params: {
    userId: string;
    target: QuotaChargeTarget;
    budgetCapVnd: number;
    nowMs: number;
    retakeOfAttemptId?: string | null;
  },
): Promise<typeof QUOTA_EXCEEDED | typeof GLOBAL_CAP_REACHED | "FIRST_RETAKE_TAKEN"> {
  const { points, costVnd } = priceFor(params.target);
  const day = vnDay(params.nowMs);
  const staleCutoffMs = params.nowMs - UNSUBMITTED_HOLD_TTL_MS;

  const [usage] = await db
    .select({
      usedPoints: usedPointsSubquery(params.userId, day),
      spentVnd: spentVndSubquery(day, staleCutoffMs),
      firstRetakeTaken: params.retakeOfAttemptId
        ? sql<number>`EXISTS (
            SELECT 1 FROM quota_reservation qr
            WHERE qr.retake_of_attempt_id = ${params.retakeOfAttemptId}
              AND qr.status = 'active'
          )`
        : sql<number>`0`,
    })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);

  if (!usage || usage.usedPoints + points > DAILY_FREE_POINTS) {
    return QUOTA_EXCEEDED;
  }
  if (usage.spentVnd + costVnd > params.budgetCapVnd) {
    return GLOBAL_CAP_REACHED;
  }
  if (
    params.target.kind === "retake" &&
    params.target.isFirstRootRetake &&
    params.retakeOfAttemptId &&
    Number(usage.firstRetakeTaken) > 0
  ) {
    return "FIRST_RETAKE_TAKEN";
  }
  return GLOBAL_CAP_REACHED;
}

export function buildReserveOnRetryStatement(
  db: Database,
  params: {
    userId: string;
    attemptId: string;
    reservationId: string;
    points: number;
    costVnd: number;
    budgetCapVnd: number;
    nowMs: number;
    retryStartOfDayMs: number;
    retakeOfAttemptId?: string | null;
  },
) {
  const day = vnDay(params.nowMs);
  const staleCutoffMs = params.nowMs - UNSUBMITTED_HOLD_TTL_MS;
  const retakeId = params.retakeOfAttemptId ?? null;

  return db
    .insert(quotaReservation)
    .select((qb) =>
      qb
        .select({
          attemptId: sql<string>`${params.attemptId}`.as("attempt_id"),
          reservationId: sql<string>`${params.reservationId}`.as("reservation_id"),
          userId: sql<string>`${params.userId}`.as("user_id"),
          vnDay: sql<string>`${day}`.as("vn_day"),
          points: sql<number>`${params.points}`.as("points"),
          costVnd: sql<number>`${params.costVnd}`.as("cost_vnd"),
          sunkCostVnd: sql<number>`0`.as("sunk_cost_vnd"),
          refundCount: sql<number>`0`.as("refund_count"),
          retakeOfAttemptId: sql<string | null>`${retakeId}`.as("retake_of_attempt_id"),
          status: sql<"active">`'active'`.as("status"),
          createdAt: sql<Date>`${params.nowMs}`.as("created_at"),
          updatedAt: sql<Date>`${params.nowMs}`.as("updated_at"),
        })
        .from(user)
        .where(
          and(
            eq(user.id, params.userId),
            sql`(SELECT COUNT(*) FROM scoring_retry_log WHERE user_id = ${params.userId} AND created_at >= ${params.retryStartOfDayMs}) < 3`,
            sql`EXISTS (SELECT 1 FROM attempt_score WHERE attempt_id = ${params.attemptId} AND status = 'failed' AND manual_retries < 1)`,
            sql`(${usedPointsExcludingSubquery(params.userId, day, params.attemptId)} + ${params.points}) <= ${DAILY_FREE_POINTS}`,
            sql`(${spentVndExcludingActiveHoldSubquery(day, staleCutoffMs, params.attemptId)} + ${params.costVnd}) <= ${params.budgetCapVnd}`,
          ),
        ),
    )
    .onConflictDoUpdate({
      target: quotaReservation.attemptId,
      set: {
        reservationId: params.reservationId,
        vnDay: day,
        points: params.points,
        costVnd: params.costVnd,
        sunkCostVnd: sql`CASE WHEN ${quotaReservation.vnDay} = ${day} THEN ${quotaReservation.sunkCostVnd} ELSE 0 END`,
        refundCount: sql`CASE WHEN ${quotaReservation.vnDay} = ${day} THEN ${quotaReservation.refundCount} ELSE 0 END`,
        status: "active",
        createdAt: new Date(params.nowMs),
        updatedAt: new Date(params.nowMs),
      },
    });
}

export async function diagnoseRetryQuotaFailure(
  db: Database,
  params: {
    userId: string;
    attemptId: string;
    points: number;
    nowMs: number;
  },
): Promise<typeof QUOTA_EXCEEDED | typeof GLOBAL_CAP_REACHED> {
  const day = vnDay(params.nowMs);
  const [usage] = await db
    .select({
      usedPoints: usedPointsExcludingSubquery(params.userId, day, params.attemptId),
    })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);

  if (!usage || usage.usedPoints + params.points > DAILY_FREE_POINTS) {
    return QUOTA_EXCEEDED;
  }
  return GLOBAL_CAP_REACHED;
}

export async function reserve(db: Database, params: ReserveParams): Promise<ReserveResult> {
  const resolver = params.resolveEntitlement ?? getEntitlement;
  if ((await resolver(db, params.userId)) === "paid") {
    return { ok: true, bypassed: true, points: 0, costVnd: 0, reservationId: "" };
  }

  const nowMs = (params.now ?? new Date()).getTime();
  const reservationId = params.reservationId ?? crypto.randomUUID();
  const { points, costVnd } = priceFor(params.target);

  const inserted = await buildReserveStatement(db, {
    userId: params.userId,
    attemptId: params.attemptId,
    reservationId,
    target: params.target,
    budgetCapVnd: params.budgetCapVnd,
    nowMs,
    retakeOfAttemptId: params.retakeOfAttemptId,
  });

  if (inserted.length > 0) {
    return { ok: true, bypassed: false, points, costVnd, reservationId };
  }

  const reason = await diagnoseReserveFailure(db, {
    userId: params.userId,
    target: params.target,
    budgetCapVnd: params.budgetCapVnd,
    nowMs,
    retakeOfAttemptId: params.retakeOfAttemptId,
  });
  return { ok: false, reason };
}

/**
 * Re-verifies global budget (and today's points if the attempt crossed midnight
 * while unsubmitted) when submitting an `in_progress` attempt whose global hold
 * has expired (>30m) or belongs to a previous VN day.
 */
export async function refreshHoldOnSubmit(
  db: Database,
  attemptId: string,
  budgetCapVnd: number,
  now: Date = new Date(),
): Promise<{ ok: true } | { ok: false; reason: typeof QUOTA_EXCEEDED | typeof GLOBAL_CAP_REACHED }> {
  const [row] = await db
    .select()
    .from(quotaReservation)
    .where(and(eq(quotaReservation.attemptId, attemptId), eq(quotaReservation.status, "active")))
    .limit(1);

  if (!row) {
    return { ok: true };
  }

  const nowMs = now.getTime();
  const today = vnDay(nowMs);
  const staleCutoffMs = nowMs - UNSUBMITTED_HOLD_TTL_MS;
  const isFresh = row.vnDay === today && row.createdAt.getTime() > staleCutoffMs;
  if (isFresh) {
    return { ok: true };
  }

  const sameDay = row.vnDay === today;
  const spent = spentVndExcludingActiveHoldSubquery(today, staleCutoffMs, attemptId);
  const pointsGuard =
    !sameDay && row.userId
      ? sql`AND (${usedPointsExcludingSubquery(row.userId, today, attemptId)} + ${quotaReservation.points}) <= ${DAILY_FREE_POINTS}`
      : sql``;

  const updated = await db
    .update(quotaReservation)
    .set({
      vnDay: today,
      createdAt: new Date(nowMs),
      updatedAt: new Date(nowMs),
    })
    .where(
      and(
        eq(quotaReservation.attemptId, attemptId),
        eq(quotaReservation.status, "active"),
        sql`(${spent} + ${quotaReservation.costVnd}) <= ${budgetCapVnd} ${pointsGuard}`,
      ),
    )
    .returning({ attemptId: quotaReservation.attemptId });

  if (updated.length > 0) {
    return { ok: true };
  }

  if (!sameDay && row.userId) {
    const [usage] = await db
      .select({ usedPoints: usedPointsExcludingSubquery(row.userId, today, attemptId) })
      .from(user)
      .where(eq(user.id, row.userId))
      .limit(1);
    if ((usage?.usedPoints ?? 0) + row.points > DAILY_FREE_POINTS) {
      return { ok: false, reason: QUOTA_EXCEEDED };
    }
  }
  return { ok: false, reason: GLOBAL_CAP_REACHED };
}

/**
 * Idempotently releases an active reservation when scoring fails.
 * - Refunds personal points (> 0) up to `MAX_DAILY_REFUNDS` per `(userId, vnDay)`.
 * - Keeps 0-point retake reservations `'active'` without consuming a refund slot.
 * - Guards against releasing an attempt whose `attempt_score` already reached `'done'`.
 * - Retains `costVnd` inside `sunkCostVnd` whenever `retainBudget` is true
 *   (external AI calls already ran).
 */
export async function release(
  db: Database,
  attemptId: string,
  opts: { retainBudget?: boolean; now?: Date } = {},
): Promise<void> {
  const retain = opts.retainBudget ? 1 : 0;
  const nowMs = (opts.now ?? new Date()).getTime();
  const canRefundExpr = sql`(
    quota_reservation.points > 0
    AND quota_reservation.user_id IS NOT NULL
    AND (
      SELECT COALESCE(SUM(q2.refund_count), 0)
      FROM quota_reservation q2
      WHERE q2.user_id = quota_reservation.user_id
        AND q2.vn_day = quota_reservation.vn_day
    ) < ${MAX_DAILY_REFUNDS}
  )`;

  await db
    .update(quotaReservation)
    .set({
      status: sql`CASE WHEN ${canRefundExpr} THEN 'released' ELSE 'active' END`,
      refundCount: sql`CASE WHEN ${canRefundExpr} THEN refund_count + 1 ELSE refund_count END`,
      sunkCostVnd: sql`sunk_cost_vnd + CASE WHEN ${retain} = 1 THEN cost_vnd ELSE 0 END`,
      // If user hit refund cap or reservation is 0 points, zero out active cost_vnd
      // after moving spent AI cost into sunk_cost_vnd so release stays idempotent.
      costVnd: sql`CASE WHEN ${canRefundExpr} THEN cost_vnd ELSE 0 END`,
      updatedAt: new Date(nowMs),
    })
    .where(
      and(
        eq(quotaReservation.attemptId, attemptId),
        eq(quotaReservation.status, "active"),
        sql`NOT EXISTS (
          SELECT 1 FROM attempt_score s
          WHERE s.attempt_id = quota_reservation.attempt_id AND s.status = 'done'
        )`,
      ),
    );
}

/**
 * Reclaims a previously `released` reservation when a late scoring worker
 * finishes `done` after a timeout/failure sweep already refunded points.
 */
export async function reclaimOnLateDone(
  db: Database,
  attemptId: string,
  now: Date = new Date(),
): Promise<void> {
  await db
    .update(quotaReservation)
    .set({
      status: "active",
      sunkCostVnd: sql`MAX(0, sunk_cost_vnd - cost_vnd)`,
      refundCount: sql`MAX(0, refund_count - 1)`,
      updatedAt: now,
    })
    .where(and(eq(quotaReservation.attemptId, attemptId), ne(quotaReservation.status, "active")));
}

export type QuotaStatus = {
  entitlement: Entitlement;
  dailyLimit: number;
  usedPoints: number;
  remainingPoints: number;
  globalCapReached: boolean;
  globalRemainingCanAfford: {
    full: boolean;
    part: boolean;
    forecastP1: boolean;
    forecastP23: boolean;
    singleQuestion: boolean;
    retake: boolean;
  };
  resetAtMs: number;
  costs: {
    full: 3;
    part: 1;
    forecastP1: 1;
    forecastP23: 2;
    singleQuestion: 1;
    firstRetake: 0;
    extraRetake: 1;
  };
};

const COSTS_RESPONSE = {
  full: 3,
  part: 1,
  forecastP1: 1,
  forecastP23: 2,
  singleQuestion: 1,
  firstRetake: 0,
  extraRetake: 1,
} as const;

export async function getQuotaStatus(
  db: Database,
  userId: string,
  env: { FREE_DAILY_BUDGET_VND?: unknown } | undefined,
  opts: {
    now?: Date;
    resolveEntitlement?: (db: Database, userId: string) => Promise<Entitlement>;
  } = {},
): Promise<QuotaStatus> {
  const nowMs = (opts.now ?? new Date()).getTime();
  const resetAtMs = nextVietnamMidnightMs(nowMs);
  const resolver = opts.resolveEntitlement ?? getEntitlement;
  const entitlement = await resolver(db, userId);

  if (entitlement === "paid") {
    return {
      entitlement,
      dailyLimit: DAILY_FREE_POINTS,
      usedPoints: 0,
      remainingPoints: DAILY_FREE_POINTS,
      globalCapReached: false,
      globalRemainingCanAfford: {
        full: true,
        part: true,
        forecastP1: true,
        forecastP23: true,
        singleQuestion: true,
        retake: true,
      },
      resetAtMs,
      costs: { ...COSTS_RESPONSE },
    };
  }

  const day = vnDay(nowMs);
  const staleCutoffMs = nowMs - UNSUBMITTED_HOLD_TTL_MS;
  const budgetCapVnd = parseFreeDailyBudgetVnd(env?.FREE_DAILY_BUDGET_VND);

  const [row] = await db
    .select({
      usedPoints: usedPointsSubquery(userId, day),
      spentVnd: spentVndSubquery(day, staleCutoffMs),
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const usedPoints = Math.max(0, row?.usedPoints ?? 0);
  const remainingPoints = Math.max(0, DAILY_FREE_POINTS - usedPoints);
  const remainingBudgetVnd = budgetCapVnd - (row?.spentVnd ?? 0);
  const canAfford = (costVnd: number) => remainingBudgetVnd >= costVnd;

  return {
    entitlement,
    dailyLimit: DAILY_FREE_POINTS,
    usedPoints,
    remainingPoints,
    globalCapReached: !canAfford(PRICE_COSTS.part.costVnd),
    globalRemainingCanAfford: {
      full: canAfford(PRICE_COSTS.full.costVnd),
      part: canAfford(PRICE_COSTS.part.costVnd),
      forecastP1: canAfford(PRICE_COSTS.forecastP1.costVnd),
      forecastP23: canAfford(PRICE_COSTS.forecastP23.costVnd),
      singleQuestion: canAfford(PRICE_COSTS.singleQuestion.costVnd),
      retake: canAfford(PRICE_COSTS.firstRetake.costVnd),
    },
    resetAtMs,
    costs: { ...COSTS_RESPONSE },
  };
}
