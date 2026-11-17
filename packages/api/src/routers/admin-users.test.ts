import { desc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminUserAction,
  attempt,
  detailCredit,
  paymentEvent,
  paymentOrder,
  subscription,
  user,
  userProfile,
} from "@vox-flow/db/schema";

import { endOfVietnamDayMs } from "../billing/plans";
import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";

const DAY_MS = 24 * 60 * 60 * 1000;
const baseTimestamp = new Date("2026-11-16T12:00:00.000Z");

const adminUser = {
  id: "usr_admin",
  name: "Super Admin",
  email: "owner@voxflow.ai",
  emailVerified: true,
  image: null,
  createdAt: new Date(baseTimestamp.getTime() - 10 * DAY_MS),
  updatedAt: new Date(baseTimestamp.getTime() - 10 * DAY_MS),
};

const studentActive = {
  id: "usr_active_1",
  name: "Nguyen Van An",
  email: "an.nguyen@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date(baseTimestamp.getTime() - 1 * DAY_MS),
  updatedAt: new Date(baseTimestamp.getTime() - 1 * DAY_MS),
};

const studentExpired = {
  id: "usr_expired_2",
  name: "Tran Thi Binh",
  email: "binh_tran@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date(baseTimestamp.getTime() - 2 * DAY_MS),
  updatedAt: new Date(baseTimestamp.getTime() - 2 * DAY_MS),
};

const studentFree = {
  id: "usr_free_3",
  name: "Le Hoang Cuong 100%",
  email: "cuong.le@example.com",
  emailVerified: false,
  image: null,
  createdAt: new Date(baseTimestamp.getTime() - 3 * DAY_MS),
  updatedAt: new Date(baseTimestamp.getTime() - 3 * DAY_MS),
};

const defaultEnv = {
  ADMIN_EMAILS: "Owner@voxflow.ai, second-admin@voxflow.ai",
};

function makeCaller(
  db: TestDbContext["db"],
  u: typeof adminUser | null,
  env: Record<string, unknown> | undefined = defaultEnv,
  now: () => Date = () => baseTimestamp,
) {
  return appRouter.createCaller({
    db,
    env,
    now,
    session: u
      ? {
          session: {
            id: `sess_${u.id}`,
            userId: u.id,
            expiresAt: new Date(baseTimestamp.getTime() + 3600 * 1000),
            createdAt: baseTimestamp,
            updatedAt: baseTimestamp,
            token: `tok_${u.id}`,
          },
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            emailVerified: u.emailVerified,
            image: u.image,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          },
        }
      : null,
  });
}

describe("admin-users router", () => {
  describe("authentication and admin authorization", () => {
    let ctx: TestDbContext;

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([adminUser, studentActive]);
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("allows admin user on checkAdmin", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      await expect(caller.adminUsers.checkAdmin()).resolves.toEqual({ isAdmin: true });
    });

    it("rejects unauthenticated caller with UNAUTHORIZED across all procedures", async () => {
      const caller = makeCaller(ctx.db, null);

      await expect(caller.adminUsers.checkAdmin()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      await expect(caller.adminUsers.list()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      await expect(
        caller.adminUsers.detail({ userId: studentActive.id }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(
        caller.adminUsers.grantPlan({
          userId: studentActive.id,
          planId: "week",
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentActive.id,
          target: "detail_credit",
          detailCredits: 1,
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("rejects non-admin user with FORBIDDEN across all procedures", async () => {
      const caller = makeCaller(ctx.db, studentActive);

      await expect(caller.adminUsers.checkAdmin()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.adminUsers.list()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        caller.adminUsers.detail({ userId: studentActive.id }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        caller.adminUsers.grantPlan({
          userId: studentActive.id,
          planId: "week",
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentActive.id,
          target: "detail_credit",
          detailCredits: 1,
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("denies admin access when ADMIN_EMAILS is empty or absent", async () => {
      const emptyEnvCaller = makeCaller(ctx.db, adminUser, { ADMIN_EMAILS: "  " });
      await expect(emptyEnvCaller.adminUsers.checkAdmin()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      const missingEnvCaller = appRouter.createCaller({
        db: ctx.db,
        env: undefined,
        now: () => baseTimestamp,
        session: {
          session: {
            id: `sess_${adminUser.id}`,
            userId: adminUser.id,
            expiresAt: new Date(baseTimestamp.getTime() + 3600 * 1000),
            createdAt: baseTimestamp,
            updatedAt: baseTimestamp,
            token: `tok_${adminUser.id}`,
          },
          user: { ...adminUser },
        },
      });
      await expect(missingEnvCaller.adminUsers.list()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("list and detail", () => {
    let ctx: TestDbContext;

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db
        .insert(user)
        .values([adminUser, studentActive, studentExpired, studentFree]);

      await ctx.db.insert(userProfile).values([
        {
          userId: studentActive.id,
          targetBand: 7.5,
          examDate: "2026-12-20",
          onboardedAt: new Date(baseTimestamp.getTime() - DAY_MS),
        },
        {
          userId: studentExpired.id,
          targetBand: 6.5,
          examDate: null,
          onboardedAt: null,
        },
      ]);

      await ctx.db.insert(subscription).values([
        {
          userId: studentActive.id,
          planId: "week",
          pointsRemaining: 30,
          planPointsTotal: 48,
          expiresAt: new Date(baseTimestamp.getTime() + 5 * DAY_MS),
          lastOrderId: "ord_act_2",
        },
        {
          userId: studentExpired.id,
          planId: "month",
          pointsRemaining: 12,
          planPointsTotal: 120,
          // Exactly at nowMs -> treated as expired (expiresAt <= now)
          expiresAt: baseTimestamp,
          lastOrderId: "ord_exp_1",
        },
      ]);

      await ctx.db.insert(detailCredit).values([
        { userId: studentActive.id, remaining: 5 },
        { userId: studentFree.id, remaining: 2 },
      ]);

      const order1PaidAt = new Date(baseTimestamp.getTime() - 4 * DAY_MS);
      const order2PaidAt = new Date(baseTimestamp.getTime() - 1 * DAY_MS);

      await ctx.db.insert(paymentOrder).values([
        {
          id: "ord_act_1",
          userId: studentActive.id,
          planId: "pack",
          amountVnd: 49_000,
          transferCode: "VFACT000001",
          status: "paid",
          paidAt: order1PaidAt,
          expiresAt: new Date(baseTimestamp.getTime() - 4 * DAY_MS + 15 * 60_000),
          createdAt: new Date(baseTimestamp.getTime() - 4 * DAY_MS - 60_000),
        },
        {
          id: "ord_act_2",
          userId: studentActive.id,
          planId: "week",
          amountVnd: 99_000,
          transferCode: "VFACT000002",
          status: "paid",
          paidAt: order2PaidAt,
          expiresAt: new Date(baseTimestamp.getTime() - 1 * DAY_MS + 15 * 60_000),
          createdAt: new Date(baseTimestamp.getTime() - 1 * DAY_MS - 60_000),
        },
        {
          id: "ord_act_pending",
          userId: studentActive.id,
          planId: "month",
          amountVnd: 249_000,
          transferCode: "VFACT000003",
          status: "pending",
          paidAt: null,
          expiresAt: new Date(baseTimestamp.getTime() + 15 * 60_000),
          createdAt: baseTimestamp,
        },
        {
          id: "ord_exp_1",
          userId: studentExpired.id,
          planId: "month",
          amountVnd: 249_000,
          transferCode: "VFEXP000001",
          status: "paid",
          paidAt: new Date(baseTimestamp.getTime() - 30 * DAY_MS),
          expiresAt: new Date(baseTimestamp.getTime() - 30 * DAY_MS + 15 * 60_000),
          createdAt: new Date(baseTimestamp.getTime() - 30 * DAY_MS - 60_000),
        },
      ]);

      await ctx.db.insert(paymentEvent).values([
        {
          id: "ev_act_2",
          sepayId: 5001,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 99_000,
          extractedCode: "VFACT000002",
          referenceCode: "REF5001",
          transactionDate: "2026-11-15 12:00:00",
          orderId: "ord_act_2",
          matchStatus: "matched",
          classification: "matched",
          resolutionStatus: "resolved",
          source: "webhook",
          createdAt: order2PaidAt,
        },
        {
          id: "ev_exp_1",
          sepayId: 5002,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 249_000,
          extractedCode: "VFEXP000001",
          referenceCode: "REF5002",
          transactionDate: "2026-10-17 12:00:00",
          orderId: "ord_exp_1",
          matchStatus: "matched",
          classification: "matched",
          resolutionStatus: "resolved",
          source: "webhook",
          createdAt: new Date(baseTimestamp.getTime() - 30 * DAY_MS),
        },
      ]);

      await ctx.db.insert(adminUserAction).values([
        {
          id: "act_old",
          userId: studentActive.id,
          action: "adjust_detail_credit",
          detailCreditsDelta: 2,
          note: "Khách cũ hỗ trợ",
          actorEmail: adminUser.email,
          createdAt: new Date(baseTimestamp.getTime() - 2 * DAY_MS),
        },
        {
          id: "act_new",
          userId: studentActive.id,
          action: "adjust_points",
          pointsDelta: 5,
          note: "Bù điểm lỗi mạng",
          actorEmail: adminUser.email,
          createdAt: new Date(baseTimestamp.getTime() - 1 * 3600_000),
        },
      ]);

      await ctx.db.insert(attempt).values([
        {
          id: "att_1",
          userId: studentActive.id,
          mode: "full",
          status: "submitted",
        },
        {
          id: "att_2",
          userId: studentActive.id,
          mode: "part1",
          status: "in_progress",
        },
      ]);
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("lists all users ordered by createdAt DESC with joined profile, subscription, credits, and paid order stats", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      const res = await caller.adminUsers.list();

      expect(res.total).toBe(4);
      expect(res.items.map((i) => i.id)).toEqual([
        studentActive.id,
        studentExpired.id,
        studentFree.id,
        adminUser.id,
      ]);

      const activeItem = res.items[0]!;
      expect(activeItem.planStatus).toBe("active_paid");
      expect(activeItem.profile).toMatchObject({
        targetBand: 7.5,
        examDate: "2026-12-20",
      });
      expect(activeItem.subscription).toMatchObject({
        planId: "week",
        planName: "7 ngày",
        pointsRemaining: 30,
        planPointsTotal: 48,
        isActive: true,
      });
      expect(activeItem.detailCredits).toBe(5);
      // Pending order excluded from paidOrderCount and totalPaidVnd
      expect(activeItem.paidOrderCount).toBe(2);
      expect(activeItem.totalPaidVnd).toBe(148_000);
      expect(activeItem.lastOrderAt?.getTime()).toBe(baseTimestamp.getTime() - 1 * DAY_MS);

      const expiredItem = res.items[1]!;
      expect(expiredItem.planStatus).toBe("expired");
      expect(expiredItem.subscription?.isActive).toBe(false);

      const freeItem = res.items[2]!;
      expect(freeItem.planStatus).toBe("free");
      expect(freeItem.subscription).toBeNull();
      expect(freeItem.detailCredits).toBe(2);
      expect(freeItem.paidOrderCount).toBe(0);
      expect(freeItem.totalPaidVnd).toBe(0);
      expect(freeItem.lastOrderAt).toBeNull();
    });

    it("filters by planFilter (active_paid, expired, free)", async () => {
      const caller = makeCaller(ctx.db, adminUser);

      const activeOnly = await caller.adminUsers.list({ planFilter: "active_paid" });
      expect(activeOnly.total).toBe(1);
      expect(activeOnly.items.map((i) => i.id)).toEqual([studentActive.id]);

      const expiredOnly = await caller.adminUsers.list({ planFilter: "expired" });
      expect(expiredOnly.total).toBe(1);
      expect(expiredOnly.items.map((i) => i.id)).toEqual([studentExpired.id]);

      const freeOnly = await caller.adminUsers.list({ planFilter: "free" });
      expect(freeOnly.total).toBe(2);
      expect(freeOnly.items.map((i) => i.id)).toEqual([studentFree.id, adminUser.id]);
    });

    it("searches by email, name, or id and escapes LIKE wildcards", async () => {
      const caller = makeCaller(ctx.db, adminUser);

      const byEmail = await caller.adminUsers.list({ query: "AN.NGUYEN" });
      expect(byEmail.items.map((i) => i.id)).toEqual([studentActive.id]);

      const byName = await caller.adminUsers.list({ query: "Hoang Cuong" });
      expect(byName.items.map((i) => i.id)).toEqual([studentFree.id]);

      const byId = await caller.adminUsers.list({ query: "usr_expired_2" });
      expect(byId.items.map((i) => i.id)).toEqual([studentExpired.id]);

      // Wildcard '%' in query should match literal '%' in studentFree.name, not everyone
      const literalPercent = await caller.adminUsers.list({ query: "100%" });
      expect(literalPercent.total).toBe(1);
      expect(literalPercent.items.map((i) => i.id)).toEqual([studentFree.id]);

      // Wildcard '_' in query should match literal '_', not single-char wildcard
      const literalUnderscore = await caller.adminUsers.list({ query: "binh_tran" });
      expect(literalUnderscore.total).toBe(1);
      expect(literalUnderscore.items.map((i) => i.id)).toEqual([studentExpired.id]);
    });

    it("supports limit and offset pagination", async () => {
      const caller = makeCaller(ctx.db, adminUser);

      const page1 = await caller.adminUsers.list({ limit: 2, offset: 0 });
      expect(page1.total).toBe(4);
      expect(page1.items.map((i) => i.id)).toEqual([studentActive.id, studentExpired.id]);

      const page2 = await caller.adminUsers.list({ limit: 2, offset: 2 });
      expect(page2.total).toBe(4);
      expect(page2.items.map((i) => i.id)).toEqual([studentFree.id, adminUser.id]);

      const beyond = await caller.adminUsers.list({ limit: 2, offset: 10 });
      expect(beyond.total).toBe(4);
      expect(beyond.items).toEqual([]);
    });

    it("returns NOT_FOUND on detail for missing user", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      await expect(
        caller.adminUsers.detail({ userId: "usr_does_not_exist" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("returns full detail including profile, subscription, detailCredits, orders, events, actions, and attemptsCount", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      const detail = await caller.adminUsers.detail({ userId: studentActive.id });

      expect(detail.user.id).toBe(studentActive.id);
      expect(detail.profile?.targetBand).toBe(7.5);
      expect(detail.subscription).toMatchObject({
        planId: "week",
        planName: "7 ngày",
        pointsRemaining: 30,
        planPointsTotal: 48,
        isActive: true,
      });
      expect(detail.detailCredits).toBe(5);
      expect(detail.orders.map((o) => o.id)).toEqual(["ord_act_pending", "ord_act_2", "ord_act_1"]);
      expect(detail.orders[1]?.planName).toBe("7 ngày");
      expect(detail.orders[2]?.planName).toBe("Theo lượt");
      expect(detail.events.map((e) => e.id)).toEqual(["ev_act_2"]);
      expect(detail.actions.map((a) => a.id)).toEqual(["act_new", "act_old"]);
      expect(detail.attemptsCount).toBe(2);
    });
  });

  describe("grantPlan", () => {
    let ctx: TestDbContext;

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([
        adminUser,
        studentActive,
        studentExpired,
        studentFree,
      ]);
      await ctx.db.insert(userProfile).values([
        {
          userId: studentFree.id,
          targetBand: 7.0,
          examDate: "2026-12-01",
        },
        {
          userId: studentExpired.id,
          targetBand: 6.5,
          examDate: "2026-11-01", // already in the past relative to baseTimestamp (2026-11-16)
        },
      ]);
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("rejects missing user and blank note", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      await expect(
        caller.adminUsers.grantPlan({
          userId: "usr_missing",
          planId: "week",
          note: "valid note",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(
        caller.adminUsers.grantPlan({
          userId: studentActive.id,
          planId: "week",
          note: "   ",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("grants pack plan atomically and accumulates detail_credit with audit log", async () => {
      let currentNow = baseTimestamp;
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => currentNow);

      const first = await caller.adminUsers.grantPlan({
        userId: studentFree.id,
        planId: "pack",
        note: "Tặng gói lẻ hỗ trợ học viên",
      });
      expect(first.detailCredits).toBe(3);

      currentNow = new Date(baseTimestamp.getTime() + 1000);
      const second = await caller.adminUsers.grantPlan({
        userId: studentFree.id,
        planId: "pack",
        note: "Tặng thêm gói lẻ lần 2",
      });
      expect(second.detailCredits).toBe(6);

      const [creditRow] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, studentFree.id));
      expect(creditRow?.remaining).toBe(6);

      const actions = await ctx.db
        .select()
        .from(adminUserAction)
        .where(eq(adminUserAction.userId, studentFree.id))
        .orderBy(desc(adminUserAction.createdAt));

      expect(actions).toHaveLength(2);
      expect(actions[0]).toMatchObject({
        action: "grant_plan",
        planId: "pack",
        detailCreditsDelta: 3,
        pointsDelta: null,
        note: "Tặng thêm gói lẻ lần 2",
        actorEmail: adminUser.email,
      });
    });

    it("grants week plan and stacks month onto active week per D-13", async () => {
      const caller = makeCaller(ctx.db, adminUser);

      const weekGrant = await caller.adminUsers.grantPlan({
        userId: studentActive.id,
        planId: "week",
        note: "Cấp gói 7 ngày",
      });

      const expectedWeekExpiry = baseTimestamp.getTime() + 7 * DAY_MS;
      expect(weekGrant.subscription).toMatchObject({
        planId: "week",
        pointsRemaining: 48,
        planPointsTotal: 48,
      });
      expect(weekGrant.subscription?.expiresAt.getTime()).toBe(expectedWeekExpiry);

      // Stack month 1 day later while week is still active
      const dayLater = new Date(baseTimestamp.getTime() + 1 * DAY_MS);
      const laterCaller = makeCaller(ctx.db, adminUser, defaultEnv, () => dayLater);

      const monthGrant = await laterCaller.adminUsers.grantPlan({
        userId: studentActive.id,
        planId: "month",
        note: "Cộng dồn gói 30 ngày",
      });

      const expectedStackedExpiry = expectedWeekExpiry + 30 * DAY_MS;
      expect(monthGrant.subscription).toMatchObject({
        planId: "month",
        pointsRemaining: 48 + 120,
        planPointsTotal: 48 + 120,
      });
      expect(monthGrant.subscription?.expiresAt.getTime()).toBe(expectedStackedExpiry);

      const actions = await ctx.db
        .select()
        .from(adminUserAction)
        .where(eq(adminUserAction.userId, studentActive.id))
        .orderBy(desc(adminUserAction.createdAt));

      expect(actions).toHaveLength(2);
      expect(actions[0]).toMatchObject({
        action: "grant_plan",
        planId: "month",
        pointsDelta: 120,
        note: "Cộng dồn gói 30 ngày",
        actorEmail: adminUser.email,
      });
      expect(actions[0]?.previousExpiresAt?.getTime()).toBe(expectedWeekExpiry);
      expect(actions[0]?.newExpiresAt?.getTime()).toBe(expectedStackedExpiry);

      expect(actions[1]?.previousExpiresAt).toBeNull();
      expect(actions[1]?.newExpiresAt?.getTime()).toBe(expectedWeekExpiry);
    });

    it("resets points and expiry when granting onto an expired subscription", async () => {
      await ctx.db.insert(subscription).values({
        userId: studentExpired.id,
        planId: "month",
        pointsRemaining: 15,
        planPointsTotal: 120,
        expiresAt: new Date(baseTimestamp.getTime() - 2 * DAY_MS),
      });

      const caller = makeCaller(ctx.db, adminUser);
      const granted = await caller.adminUsers.grantPlan({
        userId: studentExpired.id,
        planId: "week",
        note: "Gia hạn lại sau khi hết hạn",
      });

      expect(granted.subscription).toMatchObject({
        planId: "week",
        pointsRemaining: 48,
        planPointsTotal: 48,
      });
      expect(granted.subscription?.expiresAt.getTime()).toBe(
        baseTimestamp.getTime() + 7 * DAY_MS,
      );
    });

    it("validates exam date for exam plan (invalid, passed, profile fallback, explicit override)", async () => {
      const caller = makeCaller(ctx.db, adminUser);

      // Invalid date string
      await expect(
        caller.adminUsers.grantPlan({
          userId: studentFree.id,
          planId: "exam",
          examDate: "2026-02-30",
          note: "Test invalid exam date",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "EXAM_DATE_INVALID" });

      // Passed date from profile when examDate omitted
      await expect(
        caller.adminUsers.grantPlan({
          userId: studentExpired.id,
          planId: "exam",
          note: "Test passed profile exam date",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "EXAM_DATE_PASSED" });

      // Explicit valid examDate on studentFree (180 points, expires end of Vietnam day)
      const examGrant = await caller.adminUsers.grantPlan({
        userId: studentFree.id,
        planId: "exam",
        examDate: "2026-12-10",
        note: "Cấp gói đến ngày thi",
      });

      expect(examGrant.subscription).toMatchObject({
        planId: "exam",
        pointsRemaining: 180,
        planPointsTotal: 180,
      });
      expect(examGrant.subscription?.expiresAt.getTime()).toBe(
        endOfVietnamDayMs("2026-12-10"),
      );

      // Explicit null overrides passed profile.examDate and stacks onto studentExpired's active week (48 + 180)
      const overrideGrant = await caller.adminUsers.grantPlan({
        userId: studentExpired.id,
        planId: "exam",
        examDate: null,
        note: "Bỏ qua ngày thi cũ đã qua",
      });
      expect(overrideGrant.subscription).toMatchObject({
        planId: "exam",
        pointsRemaining: 48 + 180,
        planPointsTotal: 48 + 180,
      });
      expect(overrideGrant.subscription?.expiresAt.getTime()).toBeGreaterThan(
        baseTimestamp.getTime() + 50 * DAY_MS,
      );
    });
  });

  describe("adjustQuota", () => {
    let ctx: TestDbContext;

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([adminUser, studentActive, studentFree]);
      await ctx.db.insert(subscription).values({
        userId: studentActive.id,
        planId: "week",
        pointsRemaining: 20,
        planPointsTotal: 48,
        expiresAt: new Date(baseTimestamp.getTime() + 5 * DAY_MS),
      });
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("rejects missing user, negative numbers, non-positive expiry, blank note, and missing subscription", async () => {
      const caller = makeCaller(ctx.db, adminUser);

      await expect(
        caller.adminUsers.adjustQuota({
          userId: "usr_missing",
          target: "detail_credit",
          detailCredits: 5,
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentActive.id,
          target: "points",
          pointsRemaining: -1,
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentFree.id,
          target: "detail_credit",
          detailCredits: -5,
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentActive.id,
          target: "expiry",
          expiresAtMs: 0,
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentActive.id,
          target: "points",
          pointsRemaining: 10,
          note: "   ",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      // studentFree has no subscription
      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentFree.id,
          target: "points",
          pointsRemaining: 10,
          note: "Should fail without subscription",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        caller.adminUsers.adjustQuota({
          userId: studentFree.id,
          target: "expiry",
          expiresAtMs: baseTimestamp.getTime() + DAY_MS,
          note: "Should fail without subscription",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("adjusts points, raises planPointsTotal if needed, and logs audit delta", async () => {
      let currentNow = baseTimestamp;
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => currentNow);

      // Increase beyond planPointsTotal (20 -> 60; total 48 -> 60)
      const up = await caller.adminUsers.adjustQuota({
        userId: studentActive.id,
        target: "points",
        pointsRemaining: 60,
        note: "Tăng điểm bù sự cố",
      });
      expect(up.subscription).toMatchObject({
        pointsRemaining: 60,
        planPointsTotal: 60,
      });

      // Decrease (60 -> 15; total stays 60)
      currentNow = new Date(baseTimestamp.getTime() + 1000);
      const down = await caller.adminUsers.adjustQuota({
        userId: studentActive.id,
        target: "points",
        pointsRemaining: 15,
        note: "Điều chỉnh giảm điểm",
      });
      expect(down.subscription).toMatchObject({
        pointsRemaining: 15,
        planPointsTotal: 60,
      });

      const actions = await ctx.db
        .select()
        .from(adminUserAction)
        .where(eq(adminUserAction.userId, studentActive.id))
        .orderBy(desc(adminUserAction.createdAt));

      expect(actions.map((a) => ({ action: a.action, pointsDelta: a.pointsDelta, note: a.note }))).toEqual([
        { action: "adjust_points", pointsDelta: -45, note: "Điều chỉnh giảm điểm" },
        { action: "adjust_points", pointsDelta: 40, note: "Tăng điểm bù sự cố" },
      ]);
      expect(actions[0]?.actorEmail).toBe(adminUser.email);
    });

    it("upserts detail_credit and logs audit delta", async () => {
      let currentNow = new Date(baseTimestamp.getTime() + 2000);
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => currentNow);

      // No existing detail_credit row -> 0 -> 4 (delta +4)
      const created = await caller.adminUsers.adjustQuota({
        userId: studentFree.id,
        target: "detail_credit",
        detailCredits: 4,
        note: "Cấp lượt chấm chi tiết",
      });
      expect(created.detailCredits).toBe(4);

      // Existing 4 -> 1 (delta -3)
      currentNow = new Date(baseTimestamp.getTime() + 3000);
      const updated = await caller.adminUsers.adjustQuota({
        userId: studentFree.id,
        target: "detail_credit",
        detailCredits: 1,
        note: "Thu hồi bớt lượt",
      });
      expect(updated.detailCredits).toBe(1);

      const actions = await ctx.db
        .select()
        .from(adminUserAction)
        .where(eq(adminUserAction.userId, studentFree.id))
        .orderBy(desc(adminUserAction.createdAt));

      expect(actions).toHaveLength(2);
      expect(actions[0]).toMatchObject({
        action: "adjust_detail_credit",
        detailCreditsDelta: -3,
        note: "Thu hồi bớt lượt",
        actorEmail: adminUser.email,
      });
      expect(actions[1]).toMatchObject({
        action: "adjust_detail_credit",
        detailCreditsDelta: 4,
        note: "Cấp lượt chấm chi tiết",
        actorEmail: adminUser.email,
      });
    });

    it("adjusts subscription expiry and logs previous/new expiresAt", async () => {
      const caller = makeCaller(
        ctx.db,
        adminUser,
        defaultEnv,
        () => new Date(baseTimestamp.getTime() + 4000),
      );
      const previousExpiryMs = baseTimestamp.getTime() + 5 * DAY_MS;
      const newExpiryMs = baseTimestamp.getTime() + 14 * DAY_MS;

      const res = await caller.adminUsers.adjustQuota({
        userId: studentActive.id,
        target: "expiry",
        expiresAtMs: newExpiryMs,
        note: "Gia hạn thêm 9 ngày",
      });

      expect(res.subscription?.expiresAt.getTime()).toBe(newExpiryMs);

      const [latestAction] = await ctx.db
        .select()
        .from(adminUserAction)
        .where(eq(adminUserAction.userId, studentActive.id))
        .orderBy(desc(adminUserAction.createdAt))
        .limit(1);

      expect(latestAction).toMatchObject({
        action: "adjust_expiry",
        note: "Gia hạn thêm 9 ngày",
        actorEmail: adminUser.email,
      });
      expect(latestAction?.previousExpiresAt?.getTime()).toBe(previousExpiryMs);
      expect(latestAction?.newExpiresAt?.getTime()).toBe(newExpiryMs);
    });
  });

  describe("list with limit=100 under D1 bind limit", () => {
    let ctx: TestDbContext;

    beforeAll(async () => {
      ctx = await createTestDb();
      const bulkUsers = Array.from({ length: 100 }, (_, idx) => ({
        id: `usr_bulk_${String(idx).padStart(3, "0")}`,
        name: `Bulk Student ${idx}`,
        email: `bulk${idx}@example.com`,
        emailVerified: true,
        image: null,
        createdAt: new Date(baseTimestamp.getTime() + idx * 1000),
        updatedAt: baseTimestamp,
      }));
      // Insert in chunks of 10 to stay within D1's 100 bind-param cap per statement
      for (let i = 0; i < bulkUsers.length; i += 10) {
        await ctx.db.insert(user).values(bulkUsers.slice(i, i + 10));
      }
      await ctx.db.insert(paymentOrder).values({
        id: "ord_bulk_last",
        userId: "usr_bulk_099",
        planId: "week",
        amountVnd: 99_000,
        transferCode: "VFBULK099",
        status: "paid",
        expiresAt: new Date(baseTimestamp.getTime() + 900_000),
        paidAt: baseTimestamp,
        createdAt: baseTimestamp,
      });
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("returns 100 users and aggregates paid orders without exceeding D1 bind limit", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      const res = await caller.adminUsers.list({ limit: 100, offset: 0 });
      expect(res.total).toBe(100);
      expect(res.items).toHaveLength(100);
      const paidUser = res.items.find((item) => item.id === "usr_bulk_099");
      expect(paidUser?.paidOrderCount).toBe(1);
      expect(paidUser?.totalPaidVnd).toBe(99_000);
    });
  });
});
