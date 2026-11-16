import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  attempt,
  detailCredit,
  detailUnlock,
  paymentAction,
  paymentEvent,
  paymentOrder,
  subscription,
  user,
} from "@vox-flow/db/schema";

import { createTestDb, type TestDbContext } from "../test/db";
import { BILLING_NEAR_SLA_MS, BILLING_SLA_MS } from "./admin-billing";
import { appRouter } from "./index";

const baseTimestamp = new Date("2026-11-16T12:00:00.000Z");

const adminUser = {
  id: "usr_bill_admin",
  name: "Billing Admin",
  email: "owner@voxflow.ai",
  emailVerified: true,
  image: null,
  createdAt: baseTimestamp,
  updatedAt: baseTimestamp,
};

const studentUser1 = {
  id: "usr_bill_student1",
  name: "Nguyen An",
  email: "an.student@example.com",
  emailVerified: true,
  image: null,
  createdAt: baseTimestamp,
  updatedAt: baseTimestamp,
};

const studentUser2 = {
  id: "usr_bill_student2",
  name: "Tran Binh",
  email: "binh.student@example.com",
  emailVerified: true,
  image: null,
  createdAt: baseTimestamp,
  updatedAt: baseTimestamp,
};

const defaultEnv = {
  ADMIN_EMAILS: "Owner@voxflow.ai, backup-admin@voxflow.ai",
  SEPAY_BANK_ACCOUNT: "1017588888",
  SEPAY_BANK_CODE: "VCB",
};

function makeCaller(
  db: TestDbContext["db"],
  u: typeof adminUser | null,
  env: Record<string, unknown> | undefined = defaultEnv,
  now?: () => Date,
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

describe("admin-billing router", () => {
  describe("authentication and admin authorization", () => {
    let ctx: TestDbContext;

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([adminUser, studentUser1]);
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("allows admin user on checkAdmin", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      await expect(caller.adminBilling.checkAdmin()).resolves.toEqual({ isAdmin: true });
    });

    it("rejects unauthenticated caller with UNAUTHORIZED across procedures", async () => {
      const caller = makeCaller(ctx.db, null);
      await expect(caller.adminBilling.checkAdmin()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      await expect(caller.adminBilling.queue()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      await expect(caller.adminBilling.searchOrders()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      await expect(
        caller.adminBilling.activate({ eventId: "ev_x", note: "test" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(
        caller.adminBilling.markRefunded({ eventId: "ev_x", note: "test" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(caller.adminBilling.triggerSweep()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("rejects non-admin user with FORBIDDEN across procedures", async () => {
      const caller = makeCaller(ctx.db, studentUser1);
      await expect(caller.adminBilling.checkAdmin()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.adminBilling.queue()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.adminBilling.searchOrders()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        caller.adminBilling.activate({ eventId: "ev_x", note: "test" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        caller.adminBilling.markRefunded({ eventId: "ev_x", note: "test" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.adminBilling.triggerSweep()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("denies all users including former admin when ADMIN_EMAILS is empty or absent", async () => {
      const emptyEnvCaller = makeCaller(ctx.db, adminUser, { ADMIN_EMAILS: "   " });
      await expect(emptyEnvCaller.adminBilling.checkAdmin()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      const missingEnvCaller = appRouter.createCaller({
        db: ctx.db,
        env: undefined,
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
      await expect(missingEnvCaller.adminBilling.checkAdmin()).rejects.toThrowError(TRPCError);
      await expect(missingEnvCaller.adminBilling.checkAdmin()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("rejects empty or whitespace-only note on activate and markRefunded", async () => {
      const caller = makeCaller(ctx.db, adminUser);
      await expect(
        caller.adminBilling.activate({ eventId: "ev_x", note: "   " }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        caller.adminBilling.markRefunded({ eventId: "ev_x", note: "" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("queue, SLA 24h flags, metrics, and searchOrders", () => {
    let ctx: TestDbContext;
    const now = new Date("2026-11-16T12:00:00.000Z");

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([adminUser, studentUser1, studentUser2]);

      await ctx.db.insert(paymentOrder).values([
        {
          id: "ord_q_1",
          userId: studentUser1.id,
          planId: "week",
          amountVnd: 99_000,
          transferCode: "VF0001ALPHA",
          status: "pending",
          expiresAt: new Date(now.getTime() + 15 * 60_000),
          createdAt: new Date(now.getTime() - 2 * 3600_000),
        },
        {
          id: "ord_q_2",
          userId: studentUser2.id,
          planId: "month",
          amountVnd: 249_000,
          transferCode: "VF0002BETA",
          status: "paid",
          paidAt: new Date(now.getTime() - 1 * 3600_000),
          expiresAt: new Date(now.getTime() + 15 * 60_000),
          createdAt: new Date(now.getTime() - 3 * 3600_000),
        },
      ]);

      await ctx.db.insert(paymentEvent).values([
        {
          id: "ev_fresh",
          sepayId: 1001,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 50_000,
          extractedCode: "VF0001ALPHA",
          referenceCode: "REF1001",
          transactionDate: "2026-11-16 01:00:00",
          orderId: "ord_q_1",
          matchStatus: "amount_mismatch",
          classification: "underpaid",
          resolutionStatus: "pending_review",
          source: "webhook",
          createdAt: new Date(now.getTime() - (BILLING_NEAR_SLA_MS - 1)),
        },
        {
          id: "ev_near_exact",
          sepayId: 1002,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 120_000,
          extractedCode: "VF0001ALPHA",
          referenceCode: "REF1002",
          transactionDate: "2026-11-15 18:00:00",
          orderId: "ord_q_1",
          matchStatus: "amount_mismatch",
          classification: "overpaid",
          resolutionStatus: "pending_review",
          source: "webhook",
          createdAt: new Date(now.getTime() - BILLING_NEAR_SLA_MS),
        },
        {
          id: "ev_overdue_exact",
          sepayId: 1003,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 99_000,
          extractedCode: null,
          referenceCode: "REF1003",
          transactionDate: "2026-11-15 12:00:00",
          orderId: null,
          matchStatus: "unknown_code",
          classification: "unknown_code",
          resolutionStatus: "pending_review",
          source: "cron_sweep",
          createdAt: new Date(now.getTime() - BILLING_SLA_MS),
        },
        {
          id: "ev_resolved_old",
          sepayId: 1004,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 249_000,
          extractedCode: "VF0002BETA",
          referenceCode: "REF1004",
          transactionDate: "2026-11-14 10:00:00",
          orderId: "ord_q_2",
          matchStatus: "matched",
          classification: "matched",
          resolutionStatus: "resolved",
          source: "webhook",
          createdAt: new Date(now.getTime() - 48 * 3600_000),
        },
        {
          id: "ev_outbound_ignored",
          sepayId: 1005,
          transferType: "out",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 500_000,
          extractedCode: null,
          referenceCode: "REF1005",
          transactionDate: "2026-11-15 09:00:00",
          orderId: null,
          matchStatus: "outbound",
          classification: "outbound",
          resolutionStatus: "ignored",
          source: "webhook",
          createdAt: new Date(now.getTime() - 30 * 3600_000),
        },
      ]);

      await ctx.db.insert(paymentAction).values([
        {
          id: "act_older",
          eventId: "ev_near_exact",
          orderId: "ord_q_1",
          action: "activate",
          note: "First note",
          actorEmail: adminUser.email,
          createdAt: new Date(now.getTime() - 2000),
        },
        {
          id: "act_newer",
          eventId: "ev_near_exact",
          orderId: "ord_q_1",
          action: "mark_refunded",
          note: "Second note",
          actorEmail: adminUser.email,
          createdAt: new Date(now.getTime() - 1000),
        },
      ]);
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("returns pending_review items by default, excludes outbound, joins order/user, loads actions newest first, and computes SLA flags + metrics", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      const res = await caller.adminBilling.queue();

      expect(res.metrics).toEqual({
        pendingCount: 3,
        overdueCount: 1,
        nearOverdueCount: 1,
        resolvedCount: 1,
      });

      const ids = res.items.map((i) => i.id);
      expect(ids).toContain("ev_fresh");
      expect(ids).toContain("ev_near_exact");
      expect(ids).toContain("ev_overdue_exact");
      expect(ids).not.toContain("ev_resolved_old");
      expect(ids).not.toContain("ev_outbound_ignored");

      const byId = new Map(res.items.map((i) => [i.id, i]));

      const fresh = byId.get("ev_fresh")!;
      expect(fresh.isNearOverdue).toBe(false);
      expect(fresh.isOverdue).toBe(false);
      expect(fresh.slaDueAt).toEqual(new Date(fresh.createdAt.getTime() + BILLING_SLA_MS));
      expect(fresh.userEmail).toBe(studentUser1.email);
      expect(fresh.userName).toBe(studentUser1.name);
      expect(fresh.order?.planName).toBe("7 ngày");
      expect(fresh.order?.transferCode).toBe("VF0001ALPHA");

      const near = byId.get("ev_near_exact")!;
      expect(near.isNearOverdue).toBe(true);
      expect(near.isOverdue).toBe(false);
      expect(near.actions.map((a) => a.id)).toEqual(["act_newer", "act_older"]);

      const overdue = byId.get("ev_overdue_exact")!;
      expect(overdue.isNearOverdue).toBe(true);
      expect(overdue.isOverdue).toBe(true);
      expect(overdue.order).toBeNull();
      expect(overdue.userEmail).toBeNull();
    });

    it("supports resolved and all filters while keeping outbound excluded and resolved SLA flags false", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);

      const resolvedRes = await caller.adminBilling.queue({ filter: "resolved" });
      expect(resolvedRes.items.map((i) => i.id)).toEqual(["ev_resolved_old"]);
      expect(resolvedRes.items[0]!.isNearOverdue).toBe(false);
      expect(resolvedRes.items[0]!.isOverdue).toBe(false);
      expect(resolvedRes.metrics.pendingCount).toBe(3);

      const allRes = await caller.adminBilling.queue({ filter: "all" });
      expect(allRes.items.map((i) => i.id)).not.toContain("ev_outbound_ignored");
      expect(allRes.items).toHaveLength(4);
    });

    it("rejects invalid Context.now fail-closed with INTERNAL_SERVER_ERROR", async () => {
      const invalidCaller = makeCaller(
        ctx.db,
        adminUser,
        defaultEnv,
        () => new Date(Number.NaN),
      );
      await expect(invalidCaller.adminBilling.queue()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });

    it("searchOrders filters case-insensitively by transferCode or userEmail and caps at 30", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);

      const allRecent = await caller.adminBilling.searchOrders();
      expect(allRecent).toHaveLength(2);

      const byCode = await caller.adminBilling.searchOrders({ query: "vf0001alpha" });
      expect(byCode).toHaveLength(1);
      expect(byCode[0]).toMatchObject({
        id: "ord_q_1",
        userEmail: studentUser1.email,
        userName: studentUser1.name,
        planName: "7 ngày",
        amountVnd: 99_000,
        transferCode: "VF0001ALPHA",
        status: "pending",
      });

      const byEmail = await caller.adminBilling.searchOrders({ query: "BINH.STUDENT@" });
      expect(byEmail).toHaveLength(1);
      expect(byEmail[0]?.id).toBe("ord_q_2");
    });

    it("caps queue results at 50 rows so D1 inArray bind limit is respected", async () => {
      let isolated: TestDbContext | undefined;
      try {
        isolated = await createTestDb();
        await isolated.db.insert(user).values([adminUser, studentUser1]);

        const events = Array.from({ length: 55 }, (_, idx) => ({
          id: `ev_bulk_${idx}`,
          sepayId: 5000 + idx,
          transferType: "in" as const,
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 99_000,
          extractedCode: null,
          referenceCode: `REFBULK${idx}`,
          transactionDate: "2026-11-16 10:00:00",
          orderId: null,
          matchStatus: "unknown_code" as const,
          classification: "unknown_code" as const,
          resolutionStatus: "pending_review" as const,
          source: "webhook" as const,
          createdAt: new Date(now.getTime() - idx * 60_000),
        }));
        for (let i = 0; i < events.length; i += 5) {
          await isolated.db.insert(paymentEvent).values(events.slice(i, i + 5));
        }

        const caller = makeCaller(isolated.db, adminUser, defaultEnv, () => now);
        const res = await caller.adminBilling.queue();
        expect(res.items).toHaveLength(50);
        expect(res.metrics.pendingCount).toBe(55);
      } finally {
        await isolated?.dispose();
      }
    }, 15_000);
  });

  describe("activate procedure", () => {
    let ctx: TestDbContext;
    const now = new Date("2026-11-16T14:00:00.000Z");

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([adminUser, studentUser1, studentUser2]);
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("activates overpaid pending order, grants entitlement once, and logs paymentAction", async () => {
      const orderId = "ord_overpaid_1";
      const eventId = "ev_overpaid_1";
      await ctx.db.insert(paymentOrder).values({
        id: orderId,
        userId: studentUser1.id,
        planId: "week",
        amountVnd: 99_000,
        transferCode: "VFOVERPAID01",
        status: "pending",
        expiresAt: new Date(now.getTime() + 15 * 60_000),
        createdAt: new Date(now.getTime() - 5 * 60_000),
      });
      await ctx.db.insert(paymentEvent).values({
        id: eventId,
        sepayId: 2001,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 150_000,
        extractedCode: "VFOVERPAID01",
        referenceCode: "REF2001",
        transactionDate: "2026-11-16 13:58:00",
        orderId,
        matchStatus: "amount_mismatch",
        classification: "overpaid",
        resolutionStatus: "pending_review",
        source: "webhook",
        createdAt: now,
      });

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      const res = await caller.adminBilling.activate({
        eventId,
        note: "Khách chuyển dư, giữ nguyên gói 7 ngày theo yêu cầu.",
      });
      expect(res).toMatchObject({ success: true, eventId, orderId });

      const [ord] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, orderId))
        .limit(1);
      expect(ord?.status).toBe("paid");
      expect(ord?.sepayId).toBe(2001);
      expect(ord?.paidAt).toEqual(now);

      const [sub] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, studentUser1.id))
        .limit(1);
      expect(sub?.planId).toBe("week");
      expect(sub?.pointsRemaining).toBe(48);
      expect(sub?.lastOrderId).toBe(orderId);

      const [ev] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.id, eventId))
        .limit(1);
      expect(ev?.resolutionStatus).toBe("activated");

      const actions = await ctx.db
        .select()
        .from(paymentAction)
        .where(eq(paymentAction.eventId, eventId));
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        action: "activate",
        actorEmail: adminUser.email,
        orderId,
        note: "Khách chuyển dư, giữ nguyên gói 7 ngày theo yêu cầu.",
      });

      // Second activation on already-activated event fails with BAD_REQUEST
      await expect(
        caller.adminBilling.activate({ eventId, note: "Retry" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("activates expired_order and unknown_code with supplied orderId", async () => {
      const expiredOrderId = "ord_expired_1";
      const expiredEventId = "ev_expired_1";
      const unknownOrderId = "ord_unknown_target";
      const unknownEventId = "ev_unknown_1";

      await ctx.db.insert(paymentOrder).values([
        {
          id: expiredOrderId,
          userId: studentUser2.id,
          planId: "pack",
          amountVnd: 49_000,
          transferCode: "VFEXPIRED001",
          status: "expired",
          expiresAt: new Date(now.getTime() - 3600_000),
          createdAt: new Date(now.getTime() - 4000_000),
        },
        {
          id: unknownOrderId,
          userId: studentUser2.id,
          planId: "pack",
          amountVnd: 49_000,
          transferCode: "VFUNKNOWN001",
          status: "pending",
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: new Date(now.getTime() - 100_000),
        },
      ]);

      await ctx.db.insert(paymentEvent).values([
        {
          id: expiredEventId,
          sepayId: 2002,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 49_000,
          extractedCode: "VFEXPIRED001",
          referenceCode: "REF2002",
          transactionDate: "2026-11-16 13:50:00",
          orderId: expiredOrderId,
          matchStatus: "order_not_pending",
          classification: "expired_order",
          resolutionStatus: "pending_review",
          source: "webhook",
          createdAt: now,
        },
        {
          id: unknownEventId,
          sepayId: 2003,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 49_000,
          extractedCode: null,
          referenceCode: "REF2003",
          transactionDate: "2026-11-16 13:55:00",
          orderId: null,
          matchStatus: "unknown_code",
          classification: "unknown_code",
          resolutionStatus: "pending_review",
          source: "webhook",
          createdAt: now,
        },
      ]);

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);

      // Missing orderId on unknown_code throws BAD_REQUEST
      await expect(
        caller.adminBilling.activate({ eventId: unknownEventId, note: "No order yet" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await caller.adminBilling.activate({
        eventId: expiredEventId,
        note: "Kích hoạt đơn hết hạn",
      });

      await caller.adminBilling.activate({
        eventId: unknownEventId,
        orderId: unknownOrderId,
        note: "Đối soát tay từ sao kê",
      });

      const [credit] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, studentUser2.id))
        .limit(1);
      expect(credit?.remaining).toBe(6);

      const [unknownEv] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.id, unknownEventId))
        .limit(1);
      expect(unknownEv?.orderId).toBe(unknownOrderId);
      expect(unknownEv?.resolutionStatus).toBe("activated");
    });

    it("rejects CONFLICT when target order is already paid, and NOT_FOUND/BAD_REQUEST for invalid states", async () => {
      const paidOrderId = "ord_already_paid_target";
      const dupEventId = "ev_dup_target";
      const outboundEventId = "ev_outbound_act";

      await ctx.db.insert(paymentOrder).values({
        id: paidOrderId,
        userId: studentUser1.id,
        planId: "month",
        amountVnd: 249_000,
        transferCode: "VFPAIDTARGET",
        status: "paid",
        paidAt: now,
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      await ctx.db.insert(paymentEvent).values([
        {
          id: dupEventId,
          sepayId: 2004,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 249_000,
          extractedCode: "VFPAIDTARGET",
          referenceCode: "REF2004",
          transactionDate: "2026-11-16 14:00:00",
          orderId: paidOrderId,
          matchStatus: "already_paid",
          classification: "already_paid",
          resolutionStatus: "pending_review",
          source: "webhook",
          createdAt: now,
        },
        {
          id: outboundEventId,
          sepayId: 2005,
          transferType: "out",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 100_000,
          extractedCode: null,
          referenceCode: "REF2005",
          transactionDate: "2026-11-16 14:00:00",
          orderId: null,
          matchStatus: "outbound",
          classification: "outbound",
          resolutionStatus: "ignored",
          source: "webhook",
          createdAt: now,
        },
      ]);

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);

      await expect(
        caller.adminBilling.activate({ eventId: dupEventId, note: "Thử kích hoạt lại" }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "ORDER_ALREADY_PAID",
      });

      await expect(
        caller.adminBilling.activate({ eventId: "missing_ev", note: "test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(
        caller.adminBilling.activate({
          eventId: outboundEventId,
          orderId: paidOrderId,
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      // Non-existent orderId on pending event throws NOT_FOUND
      await ctx.db.insert(paymentEvent).values({
        id: "ev_missing_ord_target",
        sepayId: 2006,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 99_000,
        extractedCode: null,
        referenceCode: "REF2006",
        transactionDate: "2026-11-16 14:00:00",
        orderId: null,
        matchStatus: "unknown_code",
        classification: "unknown_code",
        resolutionStatus: "pending_review",
        source: "webhook",
        createdAt: now,
      });

      await expect(
        caller.adminBilling.activate({
          eventId: "ev_missing_ord_target",
          orderId: "nonexistent_order",
          note: "test",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects underpaid, already-resolved, and mismatched orderId on activate, and handles concurrent activate atomically", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);

      await ctx.db.insert(paymentOrder).values([
        {
          id: "ord_underpaid_block",
          userId: studentUser1.id,
          planId: "week",
          amountVnd: 99_000,
          transferCode: "VFUNDERACT1",
          status: "pending",
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: now,
        },
        {
          id: "ord_race_a",
          userId: studentUser2.id,
          planId: "pack",
          amountVnd: 49_000,
          transferCode: "VFRACEA0001",
          status: "pending",
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: now,
        },
        {
          id: "ord_race_b",
          userId: studentUser2.id,
          planId: "pack",
          amountVnd: 49_000,
          transferCode: "VFRACEB0001",
          status: "pending",
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: now,
        },
      ]);

      await ctx.db.insert(paymentEvent).values([
        {
          id: "ev_underpaid_block",
          sepayId: 2010,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 50_000,
          extractedCode: "VFUNDERACT1",
          referenceCode: "REF2010",
          transactionDate: "2026-11-16 14:10:00",
          orderId: "ord_underpaid_block",
          matchStatus: "amount_mismatch",
          classification: "underpaid",
          resolutionStatus: "pending_review",
          source: "webhook",
          createdAt: now,
        },
        {
          id: "ev_resolved_block",
          sepayId: 2011,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 99_000,
          extractedCode: "VFUNDERACT1",
          referenceCode: "REF2011",
          transactionDate: "2026-11-16 14:11:00",
          orderId: null,
          matchStatus: "matched",
          classification: "matched",
          resolutionStatus: "resolved",
          source: "webhook",
          createdAt: now,
        },
        {
          id: "ev_race_unknown",
          sepayId: 2012,
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 49_000,
          extractedCode: null,
          referenceCode: "REF2012",
          transactionDate: "2026-11-16 14:12:00",
          orderId: null,
          matchStatus: "unknown_code",
          classification: "unknown_code",
          resolutionStatus: "pending_review",
          source: "webhook",
          createdAt: now,
        },
      ]);

      await expect(
        caller.adminBilling.activate({
          eventId: "ev_underpaid_block",
          note: "Attempt activate underpaid",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        caller.adminBilling.activate({
          eventId: "ev_resolved_block",
          orderId: "ord_race_a",
          note: "Attempt activate resolved event",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        caller.adminBilling.activate({
          eventId: "ev_overpaid_1",
          orderId: "ord_race_a",
          note: "Attempt mismatch orderId",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const raceResults = await Promise.allSettled([
        caller.adminBilling.activate({
          eventId: "ev_race_unknown",
          orderId: "ord_race_a",
          note: "Race attempt A",
        }),
        caller.adminBilling.activate({
          eventId: "ev_race_unknown",
          orderId: "ord_race_b",
          note: "Race attempt B",
        }),
      ]);

      const fulfilled = raceResults.filter((r) => r.status === "fulfilled");
      const rejected = raceResults.filter((r) => r.status === "rejected");
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const raceActions = await ctx.db
        .select()
        .from(paymentAction)
        .where(eq(paymentAction.eventId, "ev_race_unknown"));
      expect(raceActions).toHaveLength(1);

      const [ordA] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, "ord_race_a"))
        .limit(1);
      const [ordB] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, "ord_race_b"))
        .limit(1);
      const paidCount = [ordA?.status, ordB?.status].filter((s) => s === "paid").length;
      expect(paidCount).toBe(1);
    });
  });

  describe("markRefunded procedure", () => {
    let ctx: TestDbContext;
    const now = new Date("2026-11-16T16:00:00.000Z");

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([adminUser, studentUser1, studentUser2]);
    });

    afterAll(async () => {
      await ctx.dispose();
    });

    it("marks underpaid event refunded, updates order status to refunded, and records paymentAction", async () => {
      const orderId = "ord_underpaid_1";
      const eventId = "ev_underpaid_1";

      await ctx.db.insert(paymentOrder).values({
        id: orderId,
        userId: studentUser1.id,
        planId: "week",
        amountVnd: 99_000,
        transferCode: "VFUNDERPAID1",
        status: "pending",
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      await ctx.db.insert(paymentEvent).values({
        id: eventId,
        sepayId: 3001,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 50_000,
        extractedCode: "VFUNDERPAID1",
        referenceCode: "REF3001",
        transactionDate: "2026-11-16 15:55:00",
        orderId,
        matchStatus: "amount_mismatch",
        classification: "underpaid",
        resolutionStatus: "pending_review",
        source: "webhook",
        createdAt: now,
      });

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      const res = await caller.adminBilling.markRefunded({
        eventId,
        note: "Đã chuyển khoản hoàn 50.000đ qua VCB",
      });
      expect(res).toMatchObject({ success: true, eventId, orderId });

      const [ev] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.id, eventId))
        .limit(1);
      expect(ev?.resolutionStatus).toBe("refunded");

      const [ord] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, orderId))
        .limit(1);
      expect(ord?.status).toBe("refunded");

      const actions = await ctx.db
        .select()
        .from(paymentAction)
        .where(eq(paymentAction.eventId, eventId));
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        action: "mark_refunded",
        actorEmail: adminUser.email,
        orderId,
        note: "Đã chuyển khoản hoàn 50.000đ qua VCB",
      });

      // Repeating markRefunded on already refunded event throws BAD_REQUEST
      await expect(
        caller.adminBilling.markRefunded({ eventId, note: "Duplicate refund" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("revokes unused detailCredit.remaining on paid pack order while preserving detail_unlock rows", async () => {
      const orderId = "ord_pack_paid_refund";
      const eventId = "ev_pack_paid_refund";

      await ctx.db.insert(attempt).values({
        id: "att_unlocked_1",
        userId: studentUser1.id,
        mode: "full",
        status: "submitted",
        submittedAt: now,
      });

      await ctx.db.insert(paymentOrder).values({
        id: orderId,
        userId: studentUser1.id,
        planId: "pack",
        amountVnd: 49_000,
        transferCode: "VFPACKREFUND",
        status: "paid",
        sepayId: 3002,
        paidAt: now,
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      // 3 credits granted, 1 unlocked -> 2 remaining
      await ctx.db.insert(detailCredit).values({
        userId: studentUser1.id,
        remaining: 2,
        lastUnlockAttemptId: "att_unlocked_1",
        lastOrderId: orderId,
        updatedAt: now,
      });
      await ctx.db.insert(detailUnlock).values({
        id: "unlock_keep_1",
        userId: studentUser1.id,
        attemptId: "att_unlocked_1",
        createdAt: now,
      });

      await ctx.db.insert(paymentEvent).values({
        id: eventId,
        sepayId: 3002,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 55_000,
        extractedCode: "VFPACKREFUND",
        referenceCode: "REF3002",
        transactionDate: "2026-11-16 15:58:00",
        orderId,
        matchStatus: "amount_mismatch",
        classification: "overpaid",
        resolutionStatus: "activated",
        source: "webhook",
        createdAt: now,
      });

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      await caller.adminBilling.markRefunded({
        eventId,
        note: "Hoàn tiền gói theo lượt, giữ bài đã mở",
      });

      const [credit] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, studentUser1.id))
        .limit(1);
      expect(credit?.remaining).toBe(0);

      const unlocks = await ctx.db
        .select()
        .from(detailUnlock)
        .where(eq(detailUnlock.userId, studentUser1.id));
      expect(unlocks).toHaveLength(1);
      expect(unlocks[0]?.id).toBe("unlock_keep_1");

      const [ord] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, orderId))
        .limit(1);
      expect(ord?.status).toBe("refunded");
    });

    it("revokes subscription pointsRemaining and sets expiresAt=now when remaining reaches 0", async () => {
      const orderId = "ord_sub_paid_refund";
      const eventId = "ev_sub_paid_refund";
      const futureExpiry = new Date(now.getTime() + 7 * 24 * 3600_000);

      await ctx.db.insert(paymentOrder).values({
        id: orderId,
        userId: studentUser2.id,
        planId: "week",
        amountVnd: 99_000,
        transferCode: "VFSUBREFUND1",
        status: "paid",
        sepayId: 3003,
        paidAt: now,
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      await ctx.db.insert(subscription).values({
        userId: studentUser2.id,
        planId: "week",
        pointsRemaining: 38, // 48 - 10 used
        planPointsTotal: 48,
        expiresAt: futureExpiry,
        lastOrderId: orderId,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert(paymentEvent).values({
        id: eventId,
        sepayId: 3003,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 99_000,
        extractedCode: "VFSUBREFUND1",
        referenceCode: "REF3003",
        transactionDate: "2026-11-16 15:59:00",
        orderId,
        matchStatus: "matched",
        classification: "matched",
        resolutionStatus: "resolved",
        source: "webhook",
        createdAt: now,
      });

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      await caller.adminBilling.markRefunded({
        eventId,
        note: "Hoàn tiền gói tuần",
      });

      const [sub] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, studentUser2.id))
        .limit(1);
      expect(sub?.pointsRemaining).toBe(0);
      expect(sub?.expiresAt).toEqual(now);

      const [ord] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, orderId))
        .limit(1);
      expect(ord?.status).toBe("refunded");
    });

    it("does NOT revoke legitimate original paid order when marking already_paid duplicate refunded", async () => {
      const legitOrderId = "ord_legit_keep";
      const dupEventId = "ev_dup_refund";
      const legitExpiry = new Date(now.getTime() + 30 * 24 * 3600_000);

      await ctx.db.insert(paymentOrder).values({
        id: legitOrderId,
        userId: studentUser1.id,
        planId: "month",
        amountVnd: 249_000,
        transferCode: "VFLEGITMONTH",
        status: "paid",
        sepayId: 3004,
        paidAt: now,
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      await ctx.db
        .insert(subscription)
        .values({
          userId: studentUser1.id,
          planId: "month",
          pointsRemaining: 120,
          planPointsTotal: 120,
          expiresAt: legitExpiry,
          lastOrderId: legitOrderId,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscription.userId,
          set: {
            planId: "month",
            pointsRemaining: 120,
            planPointsTotal: 120,
            expiresAt: legitExpiry,
            lastOrderId: legitOrderId,
          },
        });

      await ctx.db.insert(paymentEvent).values({
        id: dupEventId,
        sepayId: 3005,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 249_000,
        extractedCode: "VFLEGITMONTH",
        referenceCode: "REF3005",
        transactionDate: "2026-11-16 16:00:00",
        orderId: legitOrderId,
        matchStatus: "already_paid",
        classification: "already_paid",
        resolutionStatus: "pending_review",
        source: "webhook",
        createdAt: now,
      });

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      await caller.adminBilling.markRefunded({
        eventId: dupEventId,
        note: "Hoàn tiền giao dịch chuyển trùng lần 2",
      });

      const [legitOrd] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, legitOrderId))
        .limit(1);
      expect(legitOrd?.status).toBe("paid");

      const [sub] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, studentUser1.id))
        .limit(1);
      expect(sub?.pointsRemaining).toBe(120);
      expect(sub?.expiresAt).toEqual(legitExpiry);

      const [dupEv] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.id, dupEventId))
        .limit(1);
      expect(dupEv?.resolutionStatus).toBe("refunded");
    });

    it("rejects NOT_FOUND and outbound events on markRefunded", async () => {
      await ctx.db.insert(paymentEvent).values({
        id: "ev_outbound_refund",
        sepayId: 3006,
        transferType: "out",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 100_000,
        extractedCode: null,
        referenceCode: "REF3006",
        transactionDate: "2026-11-16 16:00:00",
        orderId: null,
        matchStatus: "outbound",
        classification: "outbound",
        resolutionStatus: "ignored",
        source: "webhook",
        createdAt: now,
      });

      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      await expect(
        caller.adminBilling.markRefunded({ eventId: "missing_ev", note: "test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(
        caller.adminBilling.markRefunded({ eventId: "ev_outbound_refund", note: "test" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("marks unknown_code (null orderId) refunded and prevents double-deduction on concurrent markRefunded", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);

      await ctx.db.insert(paymentEvent).values({
        id: "ev_unknown_refund",
        sepayId: 3007,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 77_000,
        extractedCode: null,
        referenceCode: "REF3007",
        transactionDate: "2026-11-16 16:05:00",
        orderId: null,
        matchStatus: "unknown_code",
        classification: "unknown_code",
        resolutionStatus: "pending_review",
        source: "webhook",
        createdAt: now,
      });

      const unknownRes = await caller.adminBilling.markRefunded({
        eventId: "ev_unknown_refund",
        note: "Hoàn tiền giao dịch không mã",
      });
      expect(unknownRes).toMatchObject({
        success: true,
        eventId: "ev_unknown_refund",
        orderId: null,
      });

      // Concurrent markRefunded on paid pack order deducts credits once (not twice)
      await ctx.db
        .insert(detailCredit)
        .values({ userId: studentUser2.id, remaining: 6, lastOrderId: "ord_race_pack" })
        .onConflictDoUpdate({
          target: detailCredit.userId,
          set: { remaining: 6, lastOrderId: "ord_race_pack" },
        });

      await ctx.db.insert(paymentOrder).values({
        id: "ord_race_pack",
        userId: studentUser2.id,
        planId: "pack",
        amountVnd: 49_000,
        transferCode: "VFPACKRACE1",
        status: "paid",
        paidAt: now,
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      await ctx.db.insert(paymentEvent).values({
        id: "ev_race_pack_refund",
        sepayId: 3008,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 55_000,
        extractedCode: "VFPACKRACE1",
        referenceCode: "REF3008",
        transactionDate: "2026-11-16 16:10:00",
        orderId: "ord_race_pack",
        matchStatus: "amount_mismatch",
        classification: "overpaid",
        resolutionStatus: "activated",
        source: "webhook",
        createdAt: now,
      });

      const results = await Promise.allSettled([
        caller.adminBilling.markRefunded({
          eventId: "ev_race_pack_refund",
          note: "Hoàn lần 1",
        }),
        caller.adminBilling.markRefunded({
          eventId: "ev_race_pack_refund",
          note: "Hoàn lần 2",
        }),
      ]);

      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);

      const [credit] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, studentUser2.id))
        .limit(1);
      // 6 - 3 (only once!) = 3
      expect(credit?.remaining).toBe(3);

      const actions = await ctx.db
        .select()
        .from(paymentAction)
        .where(eq(paymentAction.eventId, "ev_race_pack_refund"));
      expect(actions).toHaveLength(1);
    });

    it("does NOT revoke legitimate paid order when refunding an underpaid pending_review event on the same order", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      const orderId = "ord_underpaid_then_paid";
      const futureExpiry = new Date(now.getTime() + 7 * 24 * 3600_000);

      await ctx.db.insert(paymentOrder).values({
        id: orderId,
        userId: studentUser2.id,
        planId: "week",
        amountVnd: 99_000,
        transferCode: "VFRETRY99K",
        status: "paid",
        sepayId: 3009,
        paidAt: now,
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      await ctx.db
        .insert(subscription)
        .values({
          userId: studentUser2.id,
          planId: "week",
          pointsRemaining: 48,
          planPointsTotal: 48,
          expiresAt: futureExpiry,
          lastOrderId: orderId,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscription.userId,
          set: {
            planId: "week",
            pointsRemaining: 48,
            planPointsTotal: 48,
            expiresAt: futureExpiry,
            lastOrderId: orderId,
            updatedAt: now,
          },
        });

      await ctx.db.insert(paymentEvent).values({
        id: "ev_underpaid_same_ord",
        sepayId: 3010,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 50_000,
        extractedCode: "VFRETRY99K",
        referenceCode: "REF3010",
        transactionDate: "2026-11-16 16:12:00",
        orderId,
        matchStatus: "amount_mismatch",
        classification: "underpaid",
        resolutionStatus: "pending_review",
        source: "webhook",
        createdAt: now,
      });

      await caller.adminBilling.markRefunded({
        eventId: "ev_underpaid_same_ord",
        note: "Hoàn tiền 50.000đ chuyển thiếu (đơn đã thanh toán đủ bằng giao dịch khác)",
      });

      const [ord] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, orderId))
        .limit(1);
      expect(ord?.status).toBe("paid");

      const [sub] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, studentUser2.id))
        .limit(1);
      expect(sub?.pointsRemaining).toBe(48);
    });

    it("handles concurrent activate and markRefunded atomically without unrevoked entitlement", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      const orderId = "ord_race_act_ref";
      const eventId = "ev_race_act_ref";

      await ctx.db
        .insert(detailCredit)
        .values({ userId: studentUser2.id, remaining: 0, lastOrderId: null })
        .onConflictDoUpdate({
          target: detailCredit.userId,
          set: { remaining: 0, lastOrderId: null },
        });

      await ctx.db.insert(paymentOrder).values({
        id: orderId,
        userId: studentUser2.id,
        planId: "pack",
        amountVnd: 49_000,
        transferCode: "VFRACEAR1",
        status: "pending",
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      await ctx.db.insert(paymentEvent).values({
        id: eventId,
        sepayId: 3011,
        transferType: "in",
        gateway: "VCB",
        accountNumber: "1017588888",
        transferAmount: 55_000,
        extractedCode: "VFRACEAR1",
        referenceCode: "REF3011",
        transactionDate: "2026-11-16 16:15:00",
        orderId,
        matchStatus: "amount_mismatch",
        classification: "overpaid",
        resolutionStatus: "pending_review",
        source: "webhook",
        createdAt: now,
      });

      const results = await Promise.allSettled([
        caller.adminBilling.activate({ eventId, note: "Kích hoạt race" }),
        caller.adminBilling.markRefunded({ eventId, note: "Hoàn tiền race" }),
      ]);

      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);

      const [ev] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.id, eventId))
        .limit(1);
      const [ord] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, orderId))
        .limit(1);
      const [credit] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, studentUser2.id))
        .limit(1);

      if (ev?.resolutionStatus === "activated") {
        expect(ord?.status).toBe("paid");
        expect(credit?.remaining).toBe(3);
      } else {
        expect(ev?.resolutionStatus).toBe("refunded");
        expect(ord?.status).toBe("refunded");
        expect(credit?.remaining).toBe(0);
      }
    });
  });

  describe("triggerSweep procedure", () => {
    let ctx: TestDbContext;
    const now = new Date("2026-11-16T18:00:00.000Z");

    beforeAll(async () => {
      ctx = await createTestDb();
      await ctx.db.insert(user).values([adminUser, studentUser1]);
    });

    afterAll(async () => {
      vi.unstubAllGlobals();
      await ctx.dispose();
    });

    it("returns missing_config when SePay config is incomplete", async () => {
      const caller = makeCaller(ctx.db, adminUser, defaultEnv, () => now);
      const res = await caller.adminBilling.triggerSweep();
      expect(res).toEqual({
        fetched: 0,
        inserted: 0,
        skipped: 0,
        skippedReason: "missing_config",
      });
    });

    it("runs sweepTransactions with ctx.env and ctx.now when configured", async () => {
      await ctx.db.insert(paymentOrder).values({
        id: "ord_sweep_1",
        userId: studentUser1.id,
        planId: "pack",
        amountVnd: 49_000,
        transferCode: "VFSWEEP00001",
        status: "pending",
        expiresAt: new Date(now.getTime() + 600_000),
        createdAt: now,
      });

      const fetchSpy = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 200,
            data: [
              {
                id: "sepay-uuid-9001",
                transaction_date: "2026-11-16 17:55:00",
                account_number: "1017588888",
                sub_account: "",
                transfer_type: "in",
                amount_in: 49_000,
                amount_out: 0,
                transaction_content: "Thanh toan VFSWEEP00001",
                reference_number: "REFSWEEP9001",
                bank_brand_name: "VCB",
              },
            ],
            pagination: { last_page: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      vi.stubGlobal("fetch", fetchSpy);

      const caller = makeCaller(
        ctx.db,
        adminUser,
        {
          ...defaultEnv,
          SEPAY_API_TOKEN: "test-api-token",
        },
        () => now,
      );

      const res = await caller.adminBilling.triggerSweep();
      expect(res).toEqual({ fetched: 1, inserted: 1, skipped: 0 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [ord] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, "ord_sweep_1"))
        .limit(1);
      expect(ord?.status).toBe("paid");
    });
  });
});
