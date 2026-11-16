const DAY_MS = 24 * 60 * 60 * 1000;

export const MAX_EXAM_PLAN_DAYS = 60;
export const ORDER_QR_TTL_MS = 15 * 60 * 1000;

export type BillingPlanId = "pack" | "week" | "month" | "exam";
export type SubscriptionPlanId = "week" | "month" | "exam";

export interface BillingPlanDefinition {
  id: BillingPlanId;
  name: string;
  priceVnd: number;
  kind: "detail_pack" | "subscription";
  points: number;
  durationDays: number | null;
  detailCredits: number;
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlanDefinition> = {
  pack: {
    id: "pack",
    name: "Theo lượt",
    priceVnd: 49_000,
    kind: "detail_pack",
    points: 0,
    durationDays: null,
    detailCredits: 3,
  },
  week: {
    id: "week",
    name: "7 ngày",
    priceVnd: 99_000,
    kind: "subscription",
    points: 48,
    durationDays: 7,
    detailCredits: 0,
  },
  month: {
    id: "month",
    name: "30 ngày",
    priceVnd: 249_000,
    kind: "subscription",
    points: 120,
    durationDays: 30,
    detailCredits: 0,
  },
  exam: {
    id: "exam",
    name: "Đến ngày thi",
    priceVnd: 349_000,
    kind: "subscription",
    points: 180,
    durationDays: MAX_EXAM_PLAN_DAYS,
    detailCredits: 0,
  },
};

function readPositivePointsOverride(
  env: Record<string, unknown> | undefined,
  key: string,
  fallback: number,
): number {
  const raw = env?.[key];
  if (raw === undefined || raw === null) return fallback;
  const trimmed = String(raw).trim();
  if (trimmed === "") return fallback;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${key} must be a positive integer`);
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return parsed;
}

export function resolveBillingPlans(
  env?: Record<string, unknown>,
): Record<BillingPlanId, BillingPlanDefinition> {
  return {
    pack: BILLING_PLANS.pack,
    week: {
      ...BILLING_PLANS.week,
      points: readPositivePointsOverride(env, "BILLING_POINTS_WEEK", BILLING_PLANS.week.points),
    },
    month: {
      ...BILLING_PLANS.month,
      points: readPositivePointsOverride(env, "BILLING_POINTS_MONTH", BILLING_PLANS.month.points),
    },
    exam: {
      ...BILLING_PLANS.exam,
      points: readPositivePointsOverride(env, "BILLING_POINTS_EXAM", BILLING_PLANS.exam.points),
    },
  };
}

export function endOfVietnamDayMs(dateStr: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  const parsedUtcMidnight = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsedUtcMidnight)) {
    throw new Error(`Invalid calendar date: ${dateStr}`);
  }
  const iso = new Date(parsedUtcMidnight).toISOString().slice(0, 10);
  if (iso !== dateStr) {
    throw new Error(`Invalid calendar date: ${dateStr}`);
  }
  return Date.parse(`${dateStr}T23:59:59.999+07:00`);
}

export function validateExamDateForOrder(
  examDate: string | null | undefined,
  nowMs: number,
): { ok: true } | { ok: false; reason: "EXAM_DATE_INVALID" | "EXAM_DATE_PASSED" } {
  if (!examDate) {
    return { ok: true };
  }
  let endMs: number;
  try {
    endMs = endOfVietnamDayMs(examDate);
  } catch {
    return { ok: false, reason: "EXAM_DATE_INVALID" };
  }
  if (endMs <= nowMs) {
    return { ok: false, reason: "EXAM_DATE_PASSED" };
  }
  return { ok: true };
}

export function computeSubscriptionExpiry(params: {
  planId: SubscriptionPlanId;
  nowMs: number;
  currentExpiresAtMs: number | null;
  examDate: string | null;
}): number {
  const { planId, nowMs, currentExpiresAtMs, examDate } = params;
  const activeCurrentMs =
    currentExpiresAtMs !== null && currentExpiresAtMs > nowMs ? currentExpiresAtMs : null;

  if (planId === "week") {
    return (activeCurrentMs ?? nowMs) + 7 * DAY_MS;
  }
  if (planId === "month") {
    return (activeCurrentMs ?? nowMs) + 30 * DAY_MS;
  }

  const maxCapMs = nowMs + MAX_EXAM_PLAN_DAYS * DAY_MS;
  let targetEndMs = maxCapMs;
  if (examDate) {
    try {
      targetEndMs = Math.min(endOfVietnamDayMs(examDate), maxCapMs);
    } catch {
      targetEndMs = maxCapMs;
    }
  }

  return Math.max(activeCurrentMs ?? nowMs, targetEndMs);
}

const VIETINBANK_CODES = new Set(["ICB", "VIETINBANK", "CTG"]);

export function formatTransferContent(transferCode: string, bankCode: string): string {
  const normalizedBank = bankCode.trim().toUpperCase();
  if (VIETINBANK_CODES.has(normalizedBank)) {
    return `SEVQR ${transferCode}`;
  }
  return transferCode;
}

const TRANSFER_CODE_RE = /\b(VF[A-Z0-9]{10,12})\b/i;

export function extractTransferCode(code: string | null | undefined, content: string): string | null {
  if (code) {
    const codeMatch = TRANSFER_CODE_RE.exec(code.trim());
    if (codeMatch?.[1]) {
      return codeMatch[1].toUpperCase();
    }
  }
  const contentMatch = TRANSFER_CODE_RE.exec(content);
  return contentMatch?.[1] ? contentMatch[1].toUpperCase() : null;
}

export function generateVietQrUrl(params: {
  account: string;
  subAccount?: string;
  bankCode: string;
  amountVnd: number;
  transferContent: string;
}): string {
  const acc = params.subAccount?.trim() || params.account.trim();
  const search = new URLSearchParams({
    acc,
    bank: params.bankCode.trim(),
    amount: String(Math.floor(params.amountVnd)),
    des: params.transferContent,
    template: "compact",
  });
  return `https://vietqr.app/img?${search.toString()}`;
}
