import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { attempt, attemptScore, quotaReservation, user } from "@vox-flow/db/schema";

import { createTestDb, type TestDbContext } from "../test/db";
import {
  costVndFor,
  DAILY_FREE_POINTS,
  DEFAULT_FREE_DAILY_BUDGET_VND,
  getQuotaStatus,
  GLOBAL_CAP_REACHED,
  MAX_DAILY_REFUNDS,
  nextVietnamMidnightMs,
  parseFreeDailyBudgetVnd,
  pointsFor,
  QUOTA_EXCEEDED,
  reclaimOnLateDone,
  refreshHoldOnSubmit,
  release,
  reserve,
  UNSUBMITTED_HOLD_TTL_MS,
  vnDay,
} from "./quota";

describe("quota domain logic", () => {
  let ctx: TestDbContext;

  beforeEach(async () => {
    ctx = await createTestDb();
    await ctx.db.insert(user).values([
      { id: "u1", name: "User 1", email: "u1@voxflow.vn" },
      { id: "u2", name: "User 2", email: "u2@voxflow.vn" },
      { id: "u3", name: "User 3", email: "u3@voxflow.vn" },
      { id: "u4", name: "User 4", email: "u4@voxflow.vn" },
    ]);
  });

  afterEach(async () => {
    await ctx.dispose();
  });

  describe("Vietnam calendar day & budget parsing", () => {
    it("switches vnDay and nextVietnamMidnightMs at exact 00:00 Asia/Ho_Chi_Minh (17:00 UTC)", () => {
      const beforeMidnightUtc = Date.UTC(2026, 10, 14, 16, 59, 59, 999); // 2026-11-14 23:59:59.999 +07
      const atMidnightUtc = Date.UTC(2026, 10, 14, 17, 0, 0, 0); // 2026-11-15 00:00:00.000 +07

      expect(vnDay(beforeMidnightUtc)).toBe("2026-11-14");
      expect(nextVietnamMidnightMs(beforeMidnightUtc)).toBe(atMidnightUtc);

      expect(vnDay(atMidnightUtc)).toBe("2026-11-15");
      expect(nextVietnamMidnightMs(atMidnightUtc)).toBe(Date.UTC(2026, 10, 15, 17, 0, 0, 0));
    });

    it("parses FREE_DAILY_BUDGET_VND strictly with safe defaults and fail-closed invalid values", () => {
      expect(parseFreeDailyBudgetVnd(undefined)).toBe(DEFAULT_FREE_DAILY_BUDGET_VND);
      expect(parseFreeDailyBudgetVnd("")).toBe(33_000);
      expect(parseFreeDailyBudgetVnd("   ")).toBe(33_000);
      expect(parseFreeDailyBudgetVnd("0")).toBe(0);
      expect(parseFreeDailyBudgetVnd("50000")).toBe(50_000);
      expect(parseFreeDailyBudgetVnd("-100")).toBe(0);
      expect(parseFreeDailyBudgetVnd("abc")).toBe(0);
      expect(parseFreeDailyBudgetVnd("12.5")).toBe(0);
      expect(parseFreeDailyBudgetVnd("Infinity")).toBe(0);
    });

    it("maps points and estimated VND costs for all exam & practice targets", () => {
      expect(pointsFor({ kind: "mock", mode: "full" })).toBe(3);
      expect(costVndFor({ kind: "mock", mode: "full" })).toBe(2500);

      for (const mode of ["part1", "part2", "part3"] as const) {
        expect(pointsFor({ kind: "mock", mode })).toBe(1);
        expect(costVndFor({ kind: "mock", mode })).toBe(1000);
      }

      expect(pointsFor({ kind: "forecast_topic", topicPart: 1 })).toBe(1);
      expect(costVndFor({ kind: "forecast_topic", topicPart: 1 })).toBe(3000);

      expect(pointsFor({ kind: "forecast_topic", topicPart: 2 })).toBe(2);
      expect(costVndFor({ kind: "forecast_topic", topicPart: 2 })).toBe(4500);
      expect(pointsFor({ kind: "forecast_topic", topicPart: 3 })).toBe(2);
      expect(costVndFor({ kind: "forecast_topic", topicPart: 3 })).toBe(4500);

      expect(pointsFor({ kind: "forecast_question" })).toBe(1);
      expect(costVndFor({ kind: "forecast_question" })).toBe(1000);

      expect(pointsFor({ kind: "retake", isFirstRootRetake: true })).toBe(0);
      expect(costVndFor({ kind: "retake", isFirstRootRetake: true })).toBe(1000);

      expect(pointsFor({ kind: "retake", isFirstRootRetake: false })).toBe(1);
      expect(costVndFor({ kind: "retake", isFirstRootRetake: false })).toBe(1000);
    });
  });

  describe("reserve, concurrency & entitlement", () => {
    it("enforces 3-point daily limit with no rollover across Vietnam days", async () => {
      const tDay1 = new Date(Date.UTC(2026, 10, 14, 16, 59, 0)); // 23:59 VN Nov 14
      const r1 = await reserve(ctx.db, {
        userId: "u1",
        attemptId: "att-day1-p1",
        target: { kind: "mock", mode: "part1" },
        budgetCapVnd: 33_000,
        now: tDay1,
      });
      expect(r1).toMatchObject({ ok: true, bypassed: false, points: 1 });

      const statusDay1 = await getQuotaStatus(ctx.db, "u1", {}, { now: tDay1 });
      expect(statusDay1.remainingPoints).toBe(2);

      // Crossing midnight UTC+7 resets to 3 (unused 2 points do NOT carry over to 5).
      const tDay2 = new Date(Date.UTC(2026, 10, 14, 17, 0, 5)); // 00:00:05 VN Nov 15
      const statusDay2 = await getQuotaStatus(ctx.db, "u1", {}, { now: tDay2 });
      expect(statusDay2.remainingPoints).toBe(DAILY_FREE_POINTS);
      expect(statusDay2.usedPoints).toBe(0);

      const rFullDay2 = await reserve(ctx.db, {
        userId: "u1",
        attemptId: "att-day2-full",
        target: { kind: "mock", mode: "full" },
        budgetCapVnd: 33_000,
        now: tDay2,
      });
      expect(rFullDay2).toMatchObject({ ok: true, points: 3 });

      const rBlockedDay2 = await reserve(ctx.db, {
        userId: "u1",
        attemptId: "att-day2-extra",
        target: { kind: "mock", mode: "part1" },
        budgetCapVnd: 33_000,
        now: tDay2,
      });
      expect(rBlockedDay2).toEqual({ ok: false, reason: QUOTA_EXCEEDED });
    });

    it("prevents concurrent Promise.all requests for one free user from exceeding 3 points", async () => {
      const now = new Date(Date.UTC(2026, 10, 14, 5, 0, 0));
      const results = await Promise.all(
        [0, 1, 2, 3, 4].map((i) =>
          reserve(ctx.db, {
            userId: "u1",
            attemptId: `conc-u1-${i}`,
            target: { kind: "mock", mode: "part1" },
            budgetCapVnd: 33_000,
            now,
          }),
        ),
      );

      const okCount = results.filter((r) => r.ok).length;
      const exceededCount = results.filter((r) => !r.ok && r.reason === QUOTA_EXCEEDED).length;
      expect(okCount).toBe(3);
      expect(exceededCount).toBe(2);

      const status = await getQuotaStatus(ctx.db, "u1", {}, { now });
      expect(status.usedPoints).toBe(3);
      expect(status.remainingPoints).toBe(0);
    });

    it("prevents concurrent Promise.all requests across distinct users from exceeding FREE_DAILY_BUDGET_VND", async () => {
      const now = new Date(Date.UTC(2026, 10, 14, 6, 0, 0));
      const results = await Promise.all(
        ["u1", "u2", "u3", "u4"].map((uid, idx) =>
          reserve(ctx.db, {
            userId: uid,
            attemptId: `conc-global-${idx}`,
            target: { kind: "mock", mode: "full" }, // 2500 VND each
            budgetCapVnd: 5000, // allows max 2 full attempts
            now,
          }),
        ),
      );

      const okCount = results.filter((r) => r.ok).length;
      const capCount = results.filter((r) => !r.ok && r.reason === GLOBAL_CAP_REACHED).length;
      expect(okCount).toBe(2);
      expect(capCount).toBe(2);

      const u3Status = await getQuotaStatus(
        ctx.db,
        "u3",
        { FREE_DAILY_BUDGET_VND: "5000" },
        { now },
      );
      expect(u3Status.globalCapReached).toBe(true);
    });

    it("bypasses both personal and global limits for paid users, while keeping per-attempt pack buyers on free limits", async () => {
      const now = new Date(Date.UTC(2026, 10, 14, 6, 0, 0));
      const paidEntitlement = async () => "paid" as const;
      const perAttemptBuyerEntitlement = async () => "free" as const;

      for (let i = 0; i < 4; i += 1) {
        const res = await reserve(ctx.db, {
          userId: "u1",
          attemptId: `paid-att-${i}`,
          target: { kind: "mock", mode: "full" },
          budgetCapVnd: 0,
          now,
          resolveEntitlement: paidEntitlement,
        });
        expect(res).toMatchObject({ ok: true, bypassed: true, points: 0, costVnd: 0 });
      }

      const paidStatus = await getQuotaStatus(
        ctx.db,
        "u1",
        { FREE_DAILY_BUDGET_VND: "0" },
        { now, resolveEntitlement: paidEntitlement },
      );
      expect(paidStatus.entitlement).toBe("paid");
      expect(paidStatus.globalCapReached).toBe(false);
      expect(paidStatus.remainingPoints).toBe(3);

      const freeRes = await reserve(ctx.db, {
        userId: "u2",
        attemptId: "pack-buyer-att",
        target: { kind: "mock", mode: "part1" },
        budgetCapVnd: 0,
        now,
        resolveEntitlement: perAttemptBuyerEntitlement,
      });
      expect(freeRes).toEqual({ ok: false, reason: GLOBAL_CAP_REACHED });
    });

    it("supports 0-point first root retake even at 0 personal points, while enforcing budget & rejecting duplicate 0-pt retakes", async () => {
      const now = new Date(Date.UTC(2026, 10, 14, 7, 0, 0));
      // Spend all 3 points first.
      await reserve(ctx.db, {
        userId: "u1",
        attemptId: "root-full",
        target: { kind: "mock", mode: "full" },
        budgetCapVnd: 33_000,
        now,
      });

      const firstRetake = await reserve(ctx.db, {
        userId: "u1",
        attemptId: "retake-1",
        target: { kind: "retake", isFirstRootRetake: true },
        retakeOfAttemptId: "root-full",
        budgetCapVnd: 33_000,
        now,
      });
      expect(firstRetake).toMatchObject({ ok: true, points: 0, costVnd: 1000 });

      // Concurrent/second attempt claiming 0-point retake on the same root attempt fails cleanly.
      const dupFreeRetake = await reserve(ctx.db, {
        userId: "u1",
        attemptId: "retake-2",
        target: { kind: "retake", isFirstRootRetake: true },
        retakeOfAttemptId: "root-full",
        budgetCapVnd: 33_000,
        now,
      });
      expect(dupFreeRetake).toEqual({ ok: false, reason: "FIRST_RETAKE_TAKEN" });

      // Paid 1-point retake also rejected when u1 has 0 points left.
      const paidSecondRetake = await reserve(ctx.db, {
        userId: "u1",
        attemptId: "retake-2-paid",
        target: { kind: "retake", isFirstRootRetake: false },
        retakeOfAttemptId: "root-full",
        budgetCapVnd: 33_000,
        now,
      });
      expect(paidSecondRetake).toEqual({ ok: false, reason: QUOTA_EXCEEDED });
    });
  });

  describe("30-minute in_progress hold TTL, release & late-done reclaim", () => {
    it("releases unsubmitted in_progress global budget hold after 30 minutes and re-verifies on submit", async () => {
      const t0 = new Date(Date.UTC(2026, 10, 14, 8, 0, 0));
      await reserve(ctx.db, {
        userId: "u1",
        attemptId: "stale-att",
        target: { kind: "mock", mode: "full" }, // 2500 VND
        budgetCapVnd: 3000,
        now: t0,
      });
      await ctx.db.insert(attempt).values({
        id: "stale-att",
        userId: "u1",
        mode: "full",
        status: "in_progress",
        startedAt: t0,
      });

      // Within 30m: u2 is blocked because stale-att holds 2500 of 3000 VND.
      const t10 = new Date(t0.getTime() + 10 * 60 * 1000);
      const blocked = await reserve(ctx.db, {
        userId: "u2",
        attemptId: "u2-part",
        target: { kind: "mock", mode: "part1" },
        budgetCapVnd: 3000,
        now: t10,
      });
      expect(blocked).toEqual({ ok: false, reason: GLOBAL_CAP_REACHED });

      // Past 30m: u1's unsubmitted global hold expired, so u2 can take 1000 VND.
      const t31 = new Date(t0.getTime() + UNSUBMITTED_HOLD_TTL_MS + 60_000);
      const allowed = await reserve(ctx.db, {
        userId: "u2",
        attemptId: "u2-part",
        target: { kind: "mock", mode: "part1" }, // 1000 VND
        budgetCapVnd: 3000,
        now: t31,
      });
      expect(allowed).toMatchObject({ ok: true });

      // Personal points for u1 remain consumed (prevents fake-tab farming).
      const u1Status = await getQuotaStatus(ctx.db, "u1", { FREE_DAILY_BUDGET_VND: "3000" }, { now: t31 });
      expect(u1Status.remainingPoints).toBe(0);

      // u2 ALSO consumes 2000 more (total active 2500 + 1000 > 3000), wait: u2 had 1000, let's reserve 1000 for u3 -> spent 2000/3000
      await reserve(ctx.db, {
        userId: "u3",
        attemptId: "u3-part",
        target: { kind: "mock", mode: "part1" },
        budgetCapVnd: 3000,
        now: t31,
      });

      // Now stale-att (2500 VND) tries to submit at t31: remaining budget is only 1000 VND -> rejected!
      const refresh = await refreshHoldOnSubmit(ctx.db, "stale-att", 3000, t31);
      expect(refresh).toEqual({ ok: false, reason: GLOBAL_CAP_REACHED });
    });

    it("releases failed attempt points idempotently, retains sunkCostVnd when AI ran, caps refunds at 3/day, and handles cross-midnight", async () => {
      const tDay1 = new Date(Date.UTC(2026, 10, 14, 10, 0, 0));
      for (let i = 1; i <= 4; i += 1) {
        await reserve(ctx.db, {
          userId: "u1",
          attemptId: `fail-${i}`,
          target: { kind: "mock", mode: "part1" }, // 1 pt / 1000 VND
          budgetCapVnd: 5000,
          now: tDay1,
        });
        await release(ctx.db, `fail-${i}`, { retainBudget: i === 1, now: tDay1 });
      }

      // Calling release twice on fail-1 is idempotent.
      await release(ctx.db, "fail-1", { retainBudget: true, now: tDay1 });

      const status = await getQuotaStatus(
        ctx.db,
        "u1",
        { FREE_DAILY_BUDGET_VND: "5000" },
        { now: tDay1 },
      );
      // fail-1..3 refunded (MAX_DAILY_REFUNDS=3), fail-4 stayed active consuming 1 point.
      expect(status.usedPoints).toBe(1);
      expect(status.remainingPoints).toBe(2);
      expect(MAX_DAILY_REFUNDS).toBe(3);

      // fail-1 retained sunkCostVnd = 1000 while fail-2/3 did not retain budget (tries=0) -> spent = 1000 + fail-4(1000) = 2000.
      const [row1] = await ctx.db
        .select()
        .from(quotaReservation)
        .where(eq(quotaReservation.attemptId, "fail-1"));
      expect(row1?.status).toBe("released");
      expect(row1?.sunkCostVnd).toBe(1000);
      expect(row1?.refundCount).toBe(1);

      const [row4] = await ctx.db
        .select()
        .from(quotaReservation)
        .where(eq(quotaReservation.attemptId, "fail-4"));
      expect(row4?.status).toBe("active");
      expect(row4?.refundCount).toBe(0);

      // Reclaiming fail-1 when late worker succeeds avoids double-counting sunkCostVnd + costVnd.
      await reclaimOnLateDone(ctx.db, "fail-1", tDay1);
      const [reclaimed] = await ctx.db
        .select()
        .from(quotaReservation)
        .where(eq(quotaReservation.attemptId, "fail-1"));
      expect(reclaimed?.status).toBe("active");
      expect(reclaimed?.sunkCostVnd).toBe(0);
      expect(reclaimed?.refundCount).toBe(0);

      // Cross-midnight release updates yesterday's row without inflating today's points above 3.
      const tDay2 = new Date(Date.UTC(2026, 10, 14, 17, 15, 0));
      await release(ctx.db, "fail-4", { retainBudget: true, now: tDay2 });
      const statusDay2 = await getQuotaStatus(ctx.db, "u1", {}, { now: tDay2 });
      expect(statusDay2.remainingPoints).toBe(3);
    });

    it("does not release an active reservation when attempt_score is already done (requeue/late-worker race)", async () => {
      const now = new Date(Date.UTC(2026, 10, 14, 9, 0, 0));
      await reserve(ctx.db, {
        userId: "u1",
        attemptId: "done-race-att",
        target: { kind: "mock", mode: "full" },
        budgetCapVnd: 33_000,
        now,
      });
      await ctx.db.insert(attempt).values({
        id: "done-race-att",
        userId: "u1",
        mode: "full",
        status: "submitted",
        startedAt: now,
      });
      await ctx.db.insert(attemptScore).values({
        attemptId: "done-race-att",
        userId: "u1",
        status: "done",
        overall: 6.5,
      });

      await release(ctx.db, "done-race-att", { retainBudget: true, now });

      const [row] = await ctx.db
        .select()
        .from(quotaReservation)
        .where(eq(quotaReservation.attemptId, "done-race-att"));
      expect(row?.status).toBe("active");
      expect(row?.refundCount).toBe(0);
      expect(row?.sunkCostVnd).toBe(0);
    });

    it("does not burn MAX_DAILY_REFUNDS or unlock duplicate 0-point retake when a 0-point retake fails", async () => {
      const now = new Date(Date.UTC(2026, 10, 14, 9, 30, 0));
      await reserve(ctx.db, {
        userId: "u1",
        attemptId: "root-for-zero-retake",
        target: { kind: "mock", mode: "full" },
        budgetCapVnd: 33_000,
        now,
      });
      await reserve(ctx.db, {
        userId: "u1",
        attemptId: "zero-retake-1",
        target: { kind: "retake", isFirstRootRetake: true },
        retakeOfAttemptId: "root-for-zero-retake",
        budgetCapVnd: 33_000,
        now,
      });

      await release(ctx.db, "zero-retake-1", { retainBudget: true, now });

      const [row] = await ctx.db
        .select()
        .from(quotaReservation)
        .where(eq(quotaReservation.attemptId, "zero-retake-1"));
      expect(row?.status).toBe("active");
      expect(row?.refundCount).toBe(0);
      expect(row?.sunkCostVnd).toBe(1000);
      expect(row?.costVnd).toBe(0);

      // Opening a second 0-point retake on the same root attempt remains blocked.
      const dupFreeRetake = await reserve(ctx.db, {
        userId: "u1",
        attemptId: "zero-retake-2",
        target: { kind: "retake", isFirstRootRetake: true },
        retakeOfAttemptId: "root-for-zero-retake",
        budgetCapVnd: 33_000,
        now,
      });
      expect(dupFreeRetake).toEqual({ ok: false, reason: "FIRST_RETAKE_TAKEN" });
    });

    it("excludes the attempt's own hold when concurrent refreshHoldOnSubmit calls run", async () => {
      const t0 = new Date(Date.UTC(2026, 10, 14, 8, 0, 0));
      await reserve(ctx.db, {
        userId: "u1",
        attemptId: "concurrent-refresh-att",
        target: { kind: "mock", mode: "full" }, // 2500 VND, 3 points
        budgetCapVnd: 3000,
        now: t0,
      });
      await ctx.db.insert(attempt).values({
        id: "concurrent-refresh-att",
        userId: "u1",
        mode: "full",
        status: "in_progress",
        startedAt: t0,
      });

      const t31SameDay = new Date(t0.getTime() + UNSUBMITTED_HOLD_TTL_MS + 60_000);
      const [r1, r2] = await Promise.all([
        refreshHoldOnSubmit(ctx.db, "concurrent-refresh-att", 3000, t31SameDay),
        refreshHoldOnSubmit(ctx.db, "concurrent-refresh-att", 3000, t31SameDay),
      ]);
      expect(r1).toEqual({ ok: true });
      expect(r2).toEqual({ ok: true });

      // Cross-midnight concurrent refresh also avoids double-counting the attempt's own points.
      const tNextDay = new Date(Date.UTC(2026, 10, 14, 17, 5, 0));
      const [c1, c2] = await Promise.all([
        refreshHoldOnSubmit(ctx.db, "concurrent-refresh-att", 3000, tNextDay),
        refreshHoldOnSubmit(ctx.db, "concurrent-refresh-att", 3000, tNextDay),
      ]);
      expect(c1).toEqual({ ok: true });
      expect(c2).toEqual({ ok: true });
    });

    it("never exposes VND amounts in getQuotaStatus", async () => {
      const now = new Date(Date.UTC(2026, 10, 14, 10, 0, 0));
      const status = await getQuotaStatus(
        ctx.db,
        "u1",
        { FREE_DAILY_BUDGET_VND: "33000" },
        { now },
      );
      const serialized = JSON.stringify(status).toLowerCase();
      expect(serialized).not.toContain("vnd");
      expect(serialized).not.toContain("33000");
      expect(serialized).not.toContain("budget");
      expect(serialized).not.toContain("sunk");
      expect(status.globalRemainingCanAfford).toEqual({
        full: true,
        part: true,
        forecastP1: true,
        forecastP23: true,
        singleQuestion: true,
        retake: true,
      });
    });
  });
});
