import { attempt, attemptScore, detailCredit, detailUnlock, paymentOrder, subscription, user, userProfile } from "@vox-flow/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";

describe("Billing router (WI-15)", () => {
  let ctx: TestDbContext;

  const alice = {
    id: "usr_alice_bill",
    name: "Alice Billing",
    email: "alice.billing@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const bob = {
    id: "usr_bob_bill",
    name: "Bob Billing",
    email: "bob.billing@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    ctx = await createTestDb();
    await ctx.db.insert(user).values([alice, bob]);
  });

  afterAll(async () => {
    await ctx.dispose();
  });

  function makeCaller(u: typeof alice, env: Record<string, unknown> = {}, now?: Date) {
    return appRouter.createCaller({
      db: ctx.db,
      session: {
        session: {
          id: `sess_${u.id}`,
          userId: u.id,
          expiresAt: new Date(Date.now() + 86_400_000),
          token: `tok_${u.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
        user: u,
      },
      env: {
        SEPAY_BANK_ACCOUNT: "1017588888",
        SEPAY_BANK_CODE: "VCB",
        ...env,
      },
      ...(now ? { now: () => now } : {}),
    });
  }

  it("enforces BILLING_ENABLED and BILLING_ALLOWED_EMAILS gate on createOrder", async () => {
    const blocked = makeCaller(alice, { BILLING_ENABLED: "false", BILLING_ALLOWED_EMAILS: "" });
    await expect(blocked.billing.createOrder({ planId: "week" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const allowlisted = makeCaller(alice, {
      BILLING_ENABLED: "false",
      BILLING_ALLOWED_EMAILS: "other@example.com, Alice.Billing@example.com ",
    });
    const order1 = await allowlisted.billing.createOrder({ planId: "week" });
    expect(order1.amountVnd).toBe(99_000);
    expect(order1.transferCode).toMatch(/^VF[0-9A-Z]{10}$/);
    expect(order1.qrUrl).toContain("https://vietqr.app/img?");
    expect(order1.qrUrl).toContain("amount=99000");

    // Reuses the same unexpired pending order for identical plan
    const order1Again = await allowlisted.billing.createOrder({ planId: "week" });
    expect(order1Again.orderId).toBe(order1.orderId);

    const openBilling = makeCaller(bob, { BILLING_ENABLED: "true" });
    const orderBob = await openBilling.billing.createOrder({ planId: "month" });
    expect(orderBob.amountVnd).toBe(249_000);
    expect(orderBob.transferCode).not.toBe(order1.transferCode);
  });

  it("applies SEVQR prefix for VietinBank and rejects past examDate for exam plan", async () => {
    const now = new Date("2026-11-16T10:00:00.000Z");
    await ctx.db.insert(userProfile).values({
      userId: alice.id,
      targetBand: 7.0,
      examDate: "2026-11-15",
    });

    const caller = makeCaller(
      alice,
      { BILLING_ENABLED: "true", SEPAY_BANK_CODE: "ICB", SEPAY_SUB_ACCOUNT: "VA999" },
      now,
    );
    await expect(caller.billing.createOrder({ planId: "exam" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    await ctx.db
      .update(userProfile)
      .set({ examDate: "2026-12-10" })
      .where(eq(userProfile.userId, alice.id));

    const examOrder = await caller.billing.createOrder({ planId: "exam" });
    expect(examOrder.amountVnd).toBe(349_000);
    expect(examOrder.transferContent).toBe(`SEVQR ${examOrder.transferCode}`);
    expect(examOrder.accountNumber).toBe("VA999");
    expect(examOrder.qrUrl).toContain("acc=VA999");
    expect(examOrder.qrUrl).toContain(`des=SEVQR+${examOrder.transferCode}`);
  });

  it("enforces order ownership on getOrder and marks expired pending orders", async () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    const aliceCaller = makeCaller(alice, { BILLING_ENABLED: "true" }, t0);
    const created = await aliceCaller.billing.createOrder({ planId: "pack" });

    const bobCaller = makeCaller(bob, { BILLING_ENABLED: "true" }, t0);
    await expect(bobCaller.billing.getOrder({ orderId: created.orderId })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const afterExpiry = new Date(t0.getTime() + 16 * 60 * 1000);
    const aliceLater = makeCaller(alice, { BILLING_ENABLED: "true" }, afterExpiry);
    const fetched = await aliceLater.billing.getOrder({ orderId: created.orderId });
    expect(fetched.status).toBe("expired");
  });

  it("lists paid orders as receipts and reports subscription/credit status", async () => {
    const now = new Date("2026-11-16T12:00:00.000Z");
    await ctx.db.insert(paymentOrder).values({
      id: "ord_paid_alice",
      userId: alice.id,
      planId: "month",
      amountVnd: 249_000,
      transferCode: "VFPAIDALICE1",
      status: "paid",
      sepayId: 777001,
      expiresAt: new Date(now.getTime() + 60_000),
      paidAt: now,
      createdAt: now,
    });
    await ctx.db.insert(subscription).values({
      userId: alice.id,
      planId: "month",
      pointsRemaining: 117,
      planPointsTotal: 120,
      expiresAt: new Date(now.getTime() + 30 * 86_400_000),
      lastOrderId: "ord_paid_alice",
    });
    await ctx.db.insert(detailCredit).values({ userId: alice.id, remaining: 2 });

    const caller = makeCaller(alice, { BILLING_ENABLED: "true" }, now);
    const status = await caller.billing.status();
    expect(status.subscription).toMatchObject({
      planId: "month",
      planName: "30 ngày",
      pointsRemaining: 117,
      planPointsTotal: 120,
    });
    expect(status.detailCredits).toBe(2);

    const receipts = await caller.billing.listOrders();
    expect(receipts.some((r) => r.id === "ord_paid_alice" && r.sepayId === 777001)).toBe(true);
  });

  it("unlocks attempt details atomically with idempotency and rejects insufficient credits, unscored, or foreign attempts", async () => {
    await ctx.db.insert(attempt).values([
      { id: "att_bill_done_1", userId: bob.id, mode: "full", status: "submitted" },
      { id: "att_bill_done_2", userId: bob.id, mode: "part1", status: "submitted" },
      { id: "att_bill_queued", userId: bob.id, mode: "part1", status: "submitted" },
      { id: "att_bill_alice", userId: alice.id, mode: "part1", status: "submitted" },
    ]);
    await ctx.db.insert(attemptScore).values([
      { attemptId: "att_bill_done_1", userId: bob.id, status: "done", overall: 6.5 },
      { attemptId: "att_bill_done_2", userId: bob.id, status: "done", overall: 7.0 },
      { attemptId: "att_bill_queued", userId: bob.id, status: "queued" },
      { attemptId: "att_bill_alice", userId: alice.id, status: "done", overall: 6.0 },
    ]);

    const bobCaller = makeCaller(bob);

    // No credits yet
    await expect(
      bobCaller.billing.unlockDetail({ attemptId: "att_bill_done_1" }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: "NO_DETAIL_CREDITS" });

    // Seed 1 credit
    await ctx.db.insert(detailCredit).values({ userId: bob.id, remaining: 1 });

    // Unscored attempt rejected without consuming credit
    await expect(
      bobCaller.billing.unlockDetail({ attemptId: "att_bill_queued" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "ATTEMPT_NOT_SCORED" });

    // Foreign attempt rejected without consuming credit
    await expect(
      bobCaller.billing.unlockDetail({ attemptId: "att_bill_alice" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Concurrent calls on the same attempt only consume 1 credit
    const [res1, res2] = await Promise.all([
      bobCaller.billing.unlockDetail({ attemptId: "att_bill_done_1" }),
      bobCaller.billing.unlockDetail({ attemptId: "att_bill_done_1" }),
    ]);
    expect(res1.unlocked).toBe(true);
    expect(res2.unlocked).toBe(true);

    const [creditRow] = await ctx.db
      .select()
      .from(detailCredit)
      .where(eq(detailCredit.userId, bob.id));
    expect(creditRow?.remaining).toBe(0);

    const unlockRows = await ctx.db
      .select()
      .from(detailUnlock)
      .where(eq(detailUnlock.userId, bob.id));
    expect(unlockRows).toHaveLength(1);

    // Second attempt rejected because remaining === 0
    await expect(
      bobCaller.billing.unlockDetail({ attemptId: "att_bill_done_2" }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: "NO_DETAIL_CREDITS" });

    // Re-calling already unlocked attempt still succeeds idempotently at 0 remaining
    const resAgain = await bobCaller.billing.unlockDetail({ attemptId: "att_bill_done_1" });
    expect(resAgain).toEqual({ unlocked: true, alreadyUnlocked: true, remaining: 0 });
  });
});
