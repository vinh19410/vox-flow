import { describe, expect, it } from "vitest";

import {
  BILLING_PLANS,
  computeSubscriptionExpiry,
  endOfVietnamDayMs,
  extractTransferCode,
  formatTransferContent,
  generateVietQrUrl,
  resolveBillingPlans,
  validateExamDateForOrder,
} from "./plans";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("billing plans", () => {
  it("defines the 4 canonical plans with locked prices and default points P", () => {
    expect(BILLING_PLANS.pack).toMatchObject({
      id: "pack",
      priceVnd: 49_000,
      kind: "detail_pack",
      points: 0,
      durationDays: null,
      detailCredits: 3,
    });
    expect(BILLING_PLANS.week).toMatchObject({
      id: "week",
      priceVnd: 99_000,
      kind: "subscription",
      points: 48,
      durationDays: 7,
      detailCredits: 0,
    });
    expect(BILLING_PLANS.month).toMatchObject({
      id: "month",
      priceVnd: 249_000,
      kind: "subscription",
      points: 120,
      durationDays: 30,
      detailCredits: 0,
    });
    expect(BILLING_PLANS.exam).toMatchObject({
      id: "exam",
      priceVnd: 349_000,
      kind: "subscription",
      points: 180,
      durationDays: 60,
      detailCredits: 0,
    });
  });

  it("allows configuring points P for subscription plans via env without changing prices", () => {
    const plans = resolveBillingPlans({
      BILLING_POINTS_WEEK: "60",
      BILLING_POINTS_MONTH: "150",
      BILLING_POINTS_EXAM: "200",
    });

    expect(plans.week.points).toBe(60);
    expect(plans.month.points).toBe(150);
    expect(plans.exam.points).toBe(200);
    expect(plans.week.priceVnd).toBe(99_000);
    expect(plans.pack.points).toBe(0);
    expect(plans.pack.detailCredits).toBe(3);

    expect(() => resolveBillingPlans({ BILLING_POINTS_WEEK: "0" })).toThrow();
    expect(() => resolveBillingPlans({ BILLING_POINTS_MONTH: "abc" })).toThrow();
  });

  it("computes endOfVietnamDayMs accurately and rejects invalid calendar dates", () => {
    expect(endOfVietnamDayMs("2026-11-20")).toBe(Date.parse("2026-11-20T23:59:59.999+07:00"));
    expect(() => endOfVietnamDayMs("2026-02-30")).toThrow();
    expect(() => endOfVietnamDayMs("bad-date")).toThrow();
  });

  it("computes subscription expiry for week/month with tail stacking", () => {
    const nowMs = Date.parse("2026-11-16T10:00:00.000Z");
    expect(
      computeSubscriptionExpiry({ planId: "week", nowMs, currentExpiresAtMs: null, examDate: null }),
    ).toBe(nowMs + 7 * DAY_MS);

    const activeExpiry = nowMs + 10 * DAY_MS;
    expect(
      computeSubscriptionExpiry({
        planId: "week",
        nowMs,
        currentExpiresAtMs: activeExpiry,
        examDate: null,
      }),
    ).toBe(activeExpiry + 7 * DAY_MS);

    const expiredExpiry = nowMs - 2 * DAY_MS;
    expect(
      computeSubscriptionExpiry({
        planId: "month",
        nowMs,
        currentExpiresAtMs: expiredExpiry,
        examDate: null,
      }),
    ).toBe(nowMs + 30 * DAY_MS);
  });

  it("caps exam plan at examDate end-of-VN-day or 60 days, defaults null examDate to 60 days, and never shrinks active sub", () => {
    const nowMs = Date.parse("2026-11-16T10:00:00.000Z");

    // examDate within 60 days
    expect(
      computeSubscriptionExpiry({
        planId: "exam",
        nowMs,
        currentExpiresAtMs: null,
        examDate: "2026-12-01",
      }),
    ).toBe(Date.parse("2026-12-01T23:59:59.999+07:00"));

    // examDate beyond 60 days is capped at now + 60d
    expect(
      computeSubscriptionExpiry({
        planId: "exam",
        nowMs,
        currentExpiresAtMs: null,
        examDate: "2027-06-01",
      }),
    ).toBe(nowMs + 60 * DAY_MS);

    // null examDate defaults to 60 days
    expect(
      computeSubscriptionExpiry({
        planId: "exam",
        nowMs,
        currentExpiresAtMs: null,
        examDate: null,
      }),
    ).toBe(nowMs + 60 * DAY_MS);

    // stacking exam on top of longer active month plan never shrinks existing expiry
    const monthExpiry = nowMs + 25 * DAY_MS;
    expect(
      computeSubscriptionExpiry({
        planId: "exam",
        nowMs,
        currentExpiresAtMs: monthExpiry,
        examDate: "2026-11-26",
      }),
    ).toBe(monthExpiry);
  });

  it("validates examDate for orders using Vietnam timezone", () => {
    // 2026-11-16T18:00:00Z is 2026-11-17 01:00:00 in VN (+07:00)
    const vnMorningNov17 = Date.parse("2026-11-16T18:00:00.000Z");
    expect(validateExamDateForOrder("2026-11-16", vnMorningNov17)).toEqual({
      ok: false,
      reason: "EXAM_DATE_PASSED",
    });
    expect(validateExamDateForOrder("2026-11-17", vnMorningNov17)).toEqual({ ok: true });
    expect(validateExamDateForOrder(null, vnMorningNov17)).toEqual({ ok: true });
  });

  it("formats transfer content with SEVQR for VietinBank and extracts VF code from bank memos", () => {
    expect(formatTransferContent("VF1A2B3C4D5E", "VCB")).toBe("VF1A2B3C4D5E");
    expect(formatTransferContent("VF1A2B3C4D5E", "ICB")).toBe("SEVQR VF1A2B3C4D5E");
    expect(formatTransferContent("VF1A2B3C4D5E", "VietinBank")).toBe("SEVQR VF1A2B3C4D5E");

    expect(extractTransferCode("VF1A2B3C4D5E", "")).toBe("VF1A2B3C4D5E");
    expect(extractTransferCode(null, "MBVCB.123456.SEVQR vf1a2b3c4d5e.CT tu A")).toBe(
      "VF1A2B3C4D5E",
    );
    expect(extractTransferCode(null, "chuyen khoan khong ma")).toBeNull();
  });

  it("generates VietQR URL preferring subAccount when provided", () => {
    const standardUrl = generateVietQrUrl({
      account: "1017588888",
      bankCode: "VCB",
      amountVnd: 99000,
      transferContent: "VF1A2B3C4D5E",
    });
    expect(standardUrl).toBe(
      "https://vietqr.app/img?acc=1017588888&bank=VCB&amount=99000&des=VF1A2B3C4D5E&template=compact",
    );

    const vaUrl = generateVietQrUrl({
      account: "1017588888",
      subAccount: "96247VOXFLOW",
      bankCode: "BIDV",
      amountVnd: 349000,
      transferContent: "VF9988776655",
    });
    expect(vaUrl).toContain("acc=96247VOXFLOW");
  });
});
