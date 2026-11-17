import { detailCredit, paymentEvent, paymentOrder, subscription, user } from "@vox-flow/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { handleSepayWebhook } from "./sepay-webhook";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("SePay webhook handler (WI-15)", () => {
  let ctx: TestDbContext;

  const user1 = {
    id: "usr_webhook_1",
    name: "Webhook Student 1",
    email: "wh1@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const user2 = {
    id: "usr_webhook_2",
    name: "Webhook Student 2",
    email: "wh2@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultEnv = {
    SEPAY_WEBHOOK_API_KEY: "test-secret-api-key-32-chars-min",
    SEPAY_BANK_ACCOUNT: "1017588888",
    SEPAY_BANK_CODE: "VCB",
  };

  beforeAll(async () => {
    ctx = await createTestDb();
    await ctx.db.insert(user).values([user1, user2]);
  });

  afterAll(async () => {
    await ctx.dispose();
  });

  function makeWebhookRequest(body: unknown, authHeader?: string) {
    return new Request("https://api.vox.vinhtran.io.vn/webhooks/sepay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader !== undefined ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  it("rejects missing/wrong API key or unconfigured SEPAY_WEBHOOK_API_KEY with 401, and fails closed when SEPAY_BANK_ACCOUNT is missing", async () => {
    const payload = {
      id: 1001,
      gateway: "Vietcombank",
      transactionDate: "2026-11-16 14:00:00",
      accountNumber: "1017588888",
      subAccount: "",
      code: null,
      content: "VF0000000001",
      transferType: "in",
      transferAmount: 99_000,
      referenceCode: "FT1001",
    };

    const resNoEnvKey = await handleSepayWebhook({
      request: makeWebhookRequest(payload, `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`),
      db: ctx.db,
      env: { ...defaultEnv, SEPAY_WEBHOOK_API_KEY: "" },
    });
    expect(resNoEnvKey.status).toBe(401);

    const resWrongKey = await handleSepayWebhook({
      request: makeWebhookRequest(payload, "Apikey wrong-key"),
      db: ctx.db,
      env: defaultEnv,
    });
    expect(resWrongKey.status).toBe(401);

    const resMissingBank = await handleSepayWebhook({
      request: makeWebhookRequest(payload, `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`),
      db: ctx.db,
      env: { ...defaultEnv, SEPAY_BANK_ACCOUNT: "" },
    });
    expect(resMissingBank.status).toBe(500);
  });

  it("activates subscription once on valid payment within expiry, ignores duplicate sepayId and second transaction", async () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_week_1",
      userId: user1.id,
      planId: "week",
      amountVnd: 99_000,
      transferCode: "VFWEEK000001",
      status: "pending",
      expiresAt: new Date(t0.getTime() + 15 * 60 * 1000),
      createdAt: new Date(t0.getTime() - 5 * 60 * 1000),
    });

    const basePayload = {
      id: 2001,
      gateway: "Vietcombank",
      transactionDate: "2026-11-16 17:00:00",
      accountNumber: "1017588888",
      subAccount: "",
      code: null,
      content: "MBVCB.999.VFWEEK000001.chuyen tien",
      transferType: "in" as const,
      transferAmount: 99_000,
      accumulated: 55_000_000,
      description: "NGUYEN VAN A chuyen khoan",
      referenceCode: "FT2001",
    };

    // Outbound event with same code & amount must NOT activate, and duplicate outbound is idempotent
    const outRes1 = await handleSepayWebhook({
      request: makeWebhookRequest(
        { ...basePayload, id: 2000, transferType: "out" },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(outRes1).toEqual({ status: 200, body: { success: true } });

    const outResDup = await handleSepayWebhook({
      request: makeWebhookRequest(
        { ...basePayload, id: 2000, transferType: "out" },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(outResDup).toEqual({ status: 200, body: { success: true } });

    // Underpayment must NOT activate
    const underRes = await handleSepayWebhook({
      request: makeWebhookRequest(
        { ...basePayload, id: 20001, transferAmount: 98_000 },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(underRes).toEqual({ status: 200, body: { success: true } });
    const [stillPending] = await ctx.db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, "ord_wh_week_1"));
    expect(stillPending?.status).toBe("pending");

    // Valid payment activates week subscription (48 points, 7 days)
    const okRes = await handleSepayWebhook({
      request: makeWebhookRequest(basePayload, `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(okRes).toEqual({ status: 200, body: { success: true } });

    const [paidOrder] = await ctx.db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, "ord_wh_week_1"));
    expect(paidOrder?.status).toBe("paid");
    expect(paidOrder?.sepayId).toBe(2001);

    const [sub] = await ctx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user1.id));
    expect(sub?.planId).toBe("week");
    expect(sub?.pointsRemaining).toBe(48);
    expect(sub?.planPointsTotal).toBe(48);
    expect(sub?.expiresAt.getTime()).toBe(t0.getTime() + 7 * DAY_MS);

    // Duplicate webhook with same sepayId does not double-credit
    const dupRes = await handleSepayWebhook({
      request: makeWebhookRequest(basePayload, `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(dupRes).toEqual({ status: 200, body: { success: true } });

    // Second transaction with different sepayId for same already-paid order does not double-credit
    const secondTxRes = await handleSepayWebhook({
      request: makeWebhookRequest(
        { ...basePayload, id: 2002 },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(secondTxRes).toEqual({ status: 200, body: { success: true } });

    const [subAfter] = await ctx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user1.id));
    expect(subAfter?.pointsRemaining).toBe(48);

    const [eventRow] = await ctx.db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.sepayId, 2001));
    expect(eventRow?.matchStatus).toBe("matched");
    expect(eventRow?.extractedCode).toBe("VFWEEK000001");
  });

  it("stacks points and expiry on subsequent subscription purchases and caps exam by examDateSnapshot / 60 days", async () => {
    const t1 = new Date("2026-11-17T10:00:00.000Z");
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_month_stack",
      userId: user1.id,
      planId: "month",
      amountVnd: 249_000,
      transferCode: "VFMON0000002",
      status: "pending",
      expiresAt: new Date(t1.getTime() + 900_000),
      createdAt: t1,
    });

    await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 3001,
          gateway: "Vietcombank",
          transactionDate: "2026-11-17 17:00:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: "VFMON0000002",
          content: "VFMON0000002",
          transferType: "in",
          transferAmount: 249_000,
          referenceCode: "FT3001",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t1,
    });

    const [sub] = await ctx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user1.id));
    expect(sub?.planId).toBe("month");
    expect(sub?.pointsRemaining).toBe(48 + 120);
    expect(sub?.planPointsTotal).toBe(48 + 120);
    // Original t0 + 7d + 30d
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    expect(sub?.expiresAt.getTime()).toBe(t0.getTime() + 37 * DAY_MS);
  });

  it("credits detail_credit (+3) without creating a subscription for pack orders", async () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_pack_1",
      userId: user2.id,
      planId: "pack",
      amountVnd: 49_000,
      transferCode: "VFPACK000001",
      status: "pending",
      expiresAt: new Date(t0.getTime() + 900_000),
      createdAt: t0,
    });

    const res = await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 4001,
          gateway: "VietinBank",
          transactionDate: "2026-11-16 17:00:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: null,
          content: "SEVQR VFPACK000001",
          transferType: "in",
          transferAmount: 49_000,
          referenceCode: "FT4001",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(res).toEqual({ status: 200, body: { success: true } });

    const [credit] = await ctx.db
      .select()
      .from(detailCredit)
      .where(eq(detailCredit.userId, user2.id));
    expect(credit?.remaining).toBe(3);

    const [sub] = await ctx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user2.id));
    expect(sub).toBeUndefined();
  });

  it("rejects account mismatch without activating order", async () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_mismatch",
      userId: user2.id,
      planId: "week",
      amountVnd: 99_000,
      transferCode: "VFMIS0000001",
      status: "pending",
      expiresAt: new Date(t0.getTime() + 900_000),
      createdAt: t0,
    });

    const res = await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 5001,
          gateway: "Vietcombank",
          transactionDate: "2026-11-16 17:00:00",
          accountNumber: "9999999999",
          subAccount: "",
          code: "VFMIS0000001",
          content: "VFMIS0000001",
          transferType: "in",
          transferAmount: 99_000,
          referenceCode: "FT5001",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(res).toEqual({ status: 200, body: { success: true } });

    const [orderRow] = await ctx.db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, "ord_wh_mismatch"));
    expect(orderRow?.status).toBe("pending");

    const [ev] = await ctx.db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.sepayId, 5001));
    expect(ev?.matchStatus).toBe("account_mismatch");
  });

  it("uses examDateSnapshot for exam orders, never shrinks longer active subscriptions, and resets expired subscriptions", async () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    const tPlus35Days = new Date(t0.getTime() + 35 * DAY_MS);

    // 1) User2 starts with an expired subscription with 99 leftover points
    await ctx.db.insert(subscription).values({
      userId: user2.id,
      planId: "week",
      pointsRemaining: 99,
      planPointsTotal: 48,
      expiresAt: new Date(t0.getTime() - 1000),
    });

    // Paying for month (120 pts) resets expired leftover 99 -> 120 (does NOT add 99 + 120)
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_reset_exp",
      userId: user2.id,
      planId: "month",
      amountVnd: 249_000,
      transferCode: "VFRESET00001",
      status: "pending",
      expiresAt: new Date(t0.getTime() + 900_000),
      createdAt: t0,
    });
    await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 6001,
          gateway: "Vietcombank",
          transactionDate: "2026-11-16 17:00:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: "VFRESET00001",
          content: "VFRESET00001",
          transferType: "in",
          transferAmount: 249_000,
          referenceCode: "FT6001",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    const [afterReset] = await ctx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user2.id));
    expect(afterReset?.pointsRemaining).toBe(120);
    expect(afterReset?.planPointsTotal).toBe(120);
    expect(afterReset?.expiresAt.getTime()).toBe(t0.getTime() + 30 * DAY_MS);

    // 2) Stacking exam with examDateSnapshot within 10 days does NOT shrink existing 30-day month expiry
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_exam_stack",
      userId: user2.id,
      planId: "exam",
      amountVnd: 349_000,
      transferCode: "VFEXAM000001",
      examDateSnapshot: "2026-11-26",
      status: "pending",
      expiresAt: new Date(t0.getTime() + 900_000),
      createdAt: t0,
    });
    await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 6002,
          gateway: "Vietcombank",
          transactionDate: "2026-11-16 17:05:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: "VFEXAM000001",
          content: "VFEXAM000001",
          transferType: "in",
          transferAmount: 349_000,
          referenceCode: "FT6002",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    const [afterExamStack] = await ctx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user2.id));
    expect(afterExamStack?.pointsRemaining).toBe(120 + 180);
    expect(afterExamStack?.planPointsTotal).toBe(120 + 180);
    expect(afterExamStack?.expiresAt.getTime()).toBe(t0.getTime() + 30 * DAY_MS);

    // 3) Fresh exam order after expiry uses examDateSnapshot capped at 60d
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_exam_fresh",
      userId: user2.id,
      planId: "exam",
      amountVnd: 349_000,
      transferCode: "VFEXAM000002",
      examDateSnapshot: "2027-05-01",
      status: "pending",
      expiresAt: new Date(tPlus35Days.getTime() + 900_000),
      createdAt: tPlus35Days,
    });
    await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 6003,
          gateway: "Vietcombank",
          transactionDate: "2026-12-21 17:00:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: "VFEXAM000002",
          content: "VFEXAM000002",
          transferType: "in",
          transferAmount: 349_000,
          referenceCode: "FT6003",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => tPlus35Days,
    });
    const [afterFreshExam] = await ctx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user2.id));
    expect(afterFreshExam?.pointsRemaining).toBe(180);
    expect(afterFreshExam?.expiresAt.getTime()).toBe(tPlus35Days.getTime() + 60 * DAY_MS);
  });

  it("queues overpaid webhook transactions into pending_review without auto-activating", async () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    await ctx.db.insert(paymentOrder).values({
      id: "ord_wh_overpaid",
      userId: user2.id,
      planId: "pack",
      amountVnd: 49_000,
      transferCode: "VFOVER000001",
      status: "pending",
      expiresAt: new Date(t0.getTime() + 900_000),
      createdAt: t0,
    });

    const [creditBefore] = await ctx.db
      .select()
      .from(detailCredit)
      .where(eq(detailCredit.userId, user2.id));

    const res = await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 7001,
          gateway: "Vietcombank",
          transactionDate: "2026-11-16 17:00:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: "VFOVER000001",
          content: "VFOVER000001",
          transferType: "in",
          transferAmount: 99_000,
          referenceCode: "FT7001",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(res).toEqual({ status: 200, body: { success: true } });

    const [orderRow] = await ctx.db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, "ord_wh_overpaid"));
    expect(orderRow?.status).toBe("pending");

    const [creditAfter] = await ctx.db
      .select()
      .from(detailCredit)
      .where(eq(detailCredit.userId, user2.id));
    expect(creditAfter?.remaining).toBe(creditBefore?.remaining ?? 0);

    const [ev] = await ctx.db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.sepayId, 7001));
    expect(ev?.classification).toBe("overpaid");
    expect(ev?.matchStatus).toBe("amount_mismatch");
    expect(ev?.resolutionStatus).toBe("pending_review");
    expect(ev?.source).toBe("webhook");
  });

  it("queues expired_order webhook transactions (by expiresAt or status) into pending_review without auto-activating", async () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    await ctx.db.insert(paymentOrder).values([
      {
        id: "ord_wh_exp_time",
        userId: user2.id,
        planId: "pack",
        amountVnd: 49_000,
        transferCode: "VFEXP0000001",
        status: "pending",
        expiresAt: new Date(t0.getTime() - 60_000),
        createdAt: new Date(t0.getTime() - 960_000),
      },
      {
        id: "ord_wh_exp_status",
        userId: user2.id,
        planId: "pack",
        amountVnd: 49_000,
        transferCode: "VFEXP0000002",
        status: "expired",
        expiresAt: new Date(t0.getTime() + 900_000),
        createdAt: t0,
      },
    ]);

    const [creditBefore] = await ctx.db
      .select()
      .from(detailCredit)
      .where(eq(detailCredit.userId, user2.id));

    const res1 = await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 7002,
          gateway: "Vietcombank",
          transactionDate: "2026-11-16 17:00:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: "VFEXP0000001",
          content: "VFEXP0000001",
          transferType: "in",
          transferAmount: 49_000,
          referenceCode: "FT7002",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(res1).toEqual({ status: 200, body: { success: true } });

    const res2 = await handleSepayWebhook({
      request: makeWebhookRequest(
        {
          id: 7003,
          gateway: "Vietcombank",
          transactionDate: "2026-11-16 17:01:00",
          accountNumber: "1017588888",
          subAccount: "",
          code: "VFEXP0000002",
          content: "VFEXP0000002",
          transferType: "in",
          transferAmount: 49_000,
          referenceCode: "FT7003",
        },
        `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
      ),
      db: ctx.db,
      env: defaultEnv,
      now: () => t0,
    });
    expect(res2).toEqual({ status: 200, body: { success: true } });

    const [creditAfter] = await ctx.db
      .select()
      .from(detailCredit)
      .where(eq(detailCredit.userId, user2.id));
    expect(creditAfter?.remaining).toBe(creditBefore?.remaining ?? 0);

    const [order1] = await ctx.db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, "ord_wh_exp_time"));
    expect(order1?.status).toBe("pending");

    const [ev1] = await ctx.db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.sepayId, 7002));
    expect(ev1?.classification).toBe("expired_order");
    expect(ev1?.matchStatus).toBe("order_not_pending");
    expect(ev1?.resolutionStatus).toBe("pending_review");

    const [ev2] = await ctx.db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.sepayId, 7003));
    expect(ev2?.classification).toBe("expired_order");
    expect(ev2?.matchStatus).toBe("order_not_pending");
    expect(ev2?.resolutionStatus).toBe("pending_review");
  });
});
