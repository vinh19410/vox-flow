import { detailCredit, paymentEvent, paymentOrder, subscription, user } from "@vox-flow/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import {
  activateOrderAtomic,
  classify,
  formatUtcPlus7DateTime,
  ingestSepayTransaction,
  sweepTransactions,
  toMatchStatus,
  toResolutionStatus,
} from "./reconcile";
import { handleSepayWebhook } from "./sepay-webhook";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("payment reconciliation (WI-16)", () => {
  describe("classify()", () => {
    const t0 = new Date("2026-11-16T10:00:00.000Z");
    const validOrder = {
      status: "pending" as const,
      amountVnd: 99_000,
      expiresAt: new Date(t0.getTime() + 15 * 60 * 1000),
    };

    const baseInput = {
      transferType: "in" as const,
      accountNumber: "1017588888",
      subAccount: "",
      bankAccount: "1017588888",
      expectedSubAccount: "",
      extractedCode: "VFWEEK000001",
      order: validOrder,
      transferAmount: 99_000,
      nowMs: t0.getTime(),
    };

    it("returns matched when incoming transfer matches account, valid pending order, and exact amount", () => {
      expect(classify(baseInput)).toBe("matched");
      expect(toMatchStatus("matched")).toBe("matched");
      expect(toResolutionStatus("matched")).toBe("resolved");
    });

    it("returns underpaid when transferAmount is less than order.amountVnd", () => {
      const result = classify({ ...baseInput, transferAmount: 98_000 });
      expect(result).toBe("underpaid");
      expect(toMatchStatus(result)).toBe("amount_mismatch");
      expect(toResolutionStatus(result)).toBe("pending_review");
    });

    it("returns overpaid when transferAmount is greater than order.amountVnd", () => {
      const result = classify({ ...baseInput, transferAmount: 150_000 });
      expect(result).toBe("overpaid");
      expect(toMatchStatus(result)).toBe("amount_mismatch");
      expect(toResolutionStatus(result)).toBe("pending_review");
    });

    it("returns unknown_code when extractedCode is null or order is missing", () => {
      expect(classify({ ...baseInput, extractedCode: null })).toBe("unknown_code");
      expect(classify({ ...baseInput, order: null })).toBe("unknown_code");
      expect(toMatchStatus("unknown_code")).toBe("unknown_code");
      expect(toResolutionStatus("unknown_code")).toBe("pending_review");
    });

    it("returns expired_order when order.status is expired or nowMs > expiresAt", () => {
      expect(
        classify({
          ...baseInput,
          order: { ...validOrder, status: "expired" },
        }),
      ).toBe("expired_order");

      expect(
        classify({
          ...baseInput,
          nowMs: validOrder.expiresAt.getTime() + 1,
        }),
      ).toBe("expired_order");

      // Exact boundary nowMs === expiresAt is not expired yet
      expect(
        classify({
          ...baseInput,
          nowMs: validOrder.expiresAt.getTime(),
        }),
      ).toBe("matched");

      expect(toMatchStatus("expired_order")).toBe("order_not_pending");
      expect(toResolutionStatus("expired_order")).toBe("pending_review");
    });

    it("returns outbound first when transferType is out", () => {
      const result = classify({
        ...baseInput,
        transferType: "out",
        accountNumber: "999999",
        extractedCode: null,
        order: null,
      });
      expect(result).toBe("outbound");
      expect(toMatchStatus(result)).toBe("outbound");
      expect(toResolutionStatus(result)).toBe("ignored");
    });

    it("returns account_mismatch when bank account or expected subAccount differs", () => {
      expect(classify({ ...baseInput, accountNumber: "0000000000" })).toBe("account_mismatch");
      expect(
        classify({
          ...baseInput,
          expectedSubAccount: "VA12345",
          subAccount: "VA99999",
        }),
      ).toBe("account_mismatch");
      expect(
        classify({
          ...baseInput,
          expectedSubAccount: "VA12345",
          subAccount: " VA12345 ",
        }),
      ).toBe("matched");
      expect(toMatchStatus("account_mismatch")).toBe("account_mismatch");
      expect(toResolutionStatus("account_mismatch")).toBe("pending_review");
    });

    it("returns already_paid when order.status is paid", () => {
      const result = classify({
        ...baseInput,
        order: { ...validOrder, status: "paid" },
        nowMs: validOrder.expiresAt.getTime() + 60_000,
      });
      expect(result).toBe("already_paid");
      expect(toMatchStatus(result)).toBe("already_paid");
      expect(toResolutionStatus(result)).toBe("pending_review");
    });

    it("returns order_not_pending when order.status is refunded", () => {
      const result = classify({
        ...baseInput,
        order: { ...validOrder, status: "refunded" },
      });
      expect(result).toBe("order_not_pending");
      expect(toMatchStatus(result)).toBe("order_not_pending");
      expect(toResolutionStatus(result)).toBe("pending_review");
    });
  });

  describe("formatUtcPlus7DateTime()", () => {
    it("formats timestamps in UTC+7 regardless of host timezone", () => {
      const utcMs = Date.UTC(2026, 10, 16, 20, 5, 9); // 2026-11-16 20:05:09 UTC -> 2026-11-17 03:05:09 +07
      expect(formatUtcPlus7DateTime(utcMs)).toBe("2026-11-17 03:05:09");
    });
  });

  describe("activateOrderAtomic() & sweepTransactions() with Miniflare D1", () => {
    let ctx: TestDbContext;

    const user1 = {
      id: "usr_rec_1",
      name: "Reconcile Student 1",
      email: "rec1@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user2 = {
      id: "usr_rec_2",
      name: "Reconcile Student 2",
      email: "rec2@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const defaultEnv = {
      SEPAY_WEBHOOK_API_KEY: "test-secret-api-key-32-chars-min",
      SEPAY_API_TOKEN: "test-sepay-api-token-64-chars",
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

    it("activates pack and subscription orders atomically in D1 batch when sepayId is null", async () => {
      const t0 = new Date("2026-11-16T10:00:00.000Z");

      const packOrder = {
        id: "ord_atomic_pack_null",
        userId: user1.id,
        planId: "pack" as const,
        amountVnd: 49_000,
        transferCode: "VFATOMPACK01",
        examDateSnapshot: null,
        status: "pending" as const,
        sepayId: null,
        expiresAt: new Date(t0.getTime() + 900_000),
        paidAt: null,
        createdAt: t0,
      };
      await ctx.db.insert(paymentOrder).values(packOrder);

      const res1 = await activateOrderAtomic({
        db: ctx.db,
        order: packOrder,
        sepayId: null,
        env: defaultEnv,
        now: t0,
      });
      expect(res1).toEqual({ activated: true, alreadyPaid: false });

      const [credit1] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, user1.id));
      expect(credit1?.remaining).toBe(3);
      expect(credit1?.lastOrderId).toBe(packOrder.id);

      // Re-running with stale in-memory order object must NOT double-credit
      const resDup = await activateOrderAtomic({
        db: ctx.db,
        order: packOrder,
        sepayId: null,
        env: defaultEnv,
        now: new Date(t0.getTime() + 1000),
      });
      expect(resDup).toEqual({ activated: false, alreadyPaid: false });

      const [creditAfterDup] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, user1.id));
      expect(creditAfterDup?.remaining).toBe(3);

      // Expired order blocked unless allowExpired = true
      const expiredSubOrder = {
        id: "ord_atomic_sub_exp",
        userId: user1.id,
        planId: "week" as const,
        amountVnd: 99_000,
        transferCode: "VFATOMSUB001",
        examDateSnapshot: null,
        status: "expired" as const,
        sepayId: null,
        expiresAt: new Date(t0.getTime() - 60_000),
        paidAt: null,
        createdAt: new Date(t0.getTime() - 960_000),
      };
      await ctx.db.insert(paymentOrder).values(expiredSubOrder);

      const blocked = await activateOrderAtomic({
        db: ctx.db,
        order: expiredSubOrder,
        sepayId: null,
        env: defaultEnv,
        now: t0,
        allowExpired: false,
      });
      expect(blocked).toEqual({ activated: false, alreadyPaid: false });

      const allowed = await activateOrderAtomic({
        db: ctx.db,
        order: expiredSubOrder,
        sepayId: null,
        env: defaultEnv,
        now: t0,
        allowExpired: true,
      });
      expect(allowed).toEqual({ activated: true, alreadyPaid: false });

      const [sub] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, user1.id));
      expect(sub?.pointsRemaining).toBe(48);
      expect(sub?.expiresAt.getTime()).toBe(t0.getTime() + 7 * DAY_MS);
    });

    it("skips sweepTransactions cleanly when SEPAY_API_TOKEN or SEPAY_BANK_ACCOUNT is missing", async () => {
      const fetchMock = vi.fn<typeof fetch>();

      const noToken = await sweepTransactions({
        db: ctx.db,
        env: { ...defaultEnv, SEPAY_API_TOKEN: "" },
        fetchImpl: fetchMock,
      });
      expect(noToken).toEqual({
        fetched: 0,
        inserted: 0,
        skipped: 0,
        skippedReason: "missing_config",
      });

      const noBank = await sweepTransactions({
        db: ctx.db,
        env: { ...defaultEnv, SEPAY_BANK_ACCOUNT: "" },
        fetchImpl: fetchMock,
      });
      expect(noBank).toEqual({
        fetched: 0,
        inserted: 0,
        skipped: 0,
        skippedReason: "missing_config",
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("sweeps missed webhook transaction, activates order once, and dedups cross-channel in both orders", async () => {
      const t0 = new Date("2026-11-16T12:00:00.000Z");

      // Order A: missed by webhook, picked up by cron sweep (user2 pack +3 credits)
      await ctx.db.insert(paymentOrder).values({
        id: "ord_sweep_missed",
        userId: user2.id,
        planId: "pack",
        amountVnd: 49_000,
        transferCode: "VFSWEEP00001",
        status: "pending",
        expiresAt: new Date(t0.getTime() + 900_000),
        createdAt: t0,
      });

      // Order B: received by webhook first, then also seen in cron sweep (user2 month 120 pts)
      await ctx.db.insert(paymentOrder).values({
        id: "ord_wh_first",
        userId: user2.id,
        planId: "month",
        amountVnd: 249_000,
        transferCode: "VFDEDUPWH001",
        status: "pending",
        expiresAt: new Date(t0.getTime() + 900_000),
        createdAt: t0,
      });

      // Order C: picked up by cron sweep first, then delayed webhook arrives later (user2 week +48 pts)
      await ctx.db.insert(paymentOrder).values({
        id: "ord_sweep_first",
        userId: user2.id,
        planId: "week",
        amountVnd: 99_000,
        transferCode: "VFDEDUPSW001",
        status: "pending",
        expiresAt: new Date(t0.getTime() + 900_000),
        createdAt: t0,
      });

      // Order B arrives via webhook FIRST
      const whFirstRes = await handleSepayWebhook({
        request: new Request("https://api.vox.vinhtran.io.vn/webhooks/sepay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
          },
          body: JSON.stringify({
            id: 9101,
            gateway: "Vietcombank",
            transactionDate: "2026-11-16 19:00:00",
            accountNumber: "1017588888",
            subAccount: "",
            code: "VFDEDUPWH001",
            content: "VFDEDUPWH001",
            transferType: "in",
            transferAmount: 249_000,
            referenceCode: "FT9101",
          }),
        }),
        db: ctx.db,
        env: defaultEnv,
        now: () => t0,
      });
      expect(whFirstRes).toEqual({ status: 200, body: { success: true } });

      // Mock SePay API v2 returning 2 pages:
      // Page 1: Order A (missed by webhook) + Order B (already processed by webhook)
      // Page 2: Order C (missed by webhook, empty reference_number to also exercise fallback dedup!)
      const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
        const url = new URL(typeof input === "string" ? input : input.toString());
        expect(url.origin + url.pathname).toBe("https://userapi.sepay.vn/v2/transactions");
        expect(url.searchParams.get("transfer_type")).toBe("in");
        expect(url.searchParams.get("transaction_date_from")).toBe("2026-11-14 19:00:00");
        expect(url.searchParams.get("per_page")).toBe("100");
        expect((init?.headers as Record<string, string>)?.Authorization).toBe(
          `Bearer ${defaultEnv.SEPAY_API_TOKEN}`,
        );

        const page = url.searchParams.get("page");
        if (page === "1") {
          return new Response(
            JSON.stringify({
              status: "success",
              data: [
                {
                  id: "uuid-sweep-missed-1",
                  transaction_date: "2026-11-16 19:01:00",
                  account_number: "1017588888",
                  transfer_type: "in",
                  amount_in: 49_000,
                  amount_out: 0,
                  accumulated: 99_000_000,
                  transaction_content: "MBVCB VFSWEEP00001 chuyen khoan",
                  reference_number: "FT9100",
                  code: null,
                  bank_brand_name: "Vietcombank",
                },
                {
                  id: "uuid-wh-first-1",
                  transaction_date: "2026-11-16 19:00:00",
                  account_number: "1017588888",
                  transfer_type: "in",
                  amount_in: "249000.00",
                  amount_out: "0.00",
                  transaction_content: "VFDEDUPWH001",
                  reference_number: "FT9101",
                  code: "VFDEDUPWH001",
                  bank_brand_name: "Vietcombank",
                },
              ],
              meta: {
                pagination: {
                  total: 3,
                  per_page: 100,
                  current_page: 1,
                  last_page: 2,
                  has_more: true,
                },
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            status: "success",
            data: [
              {
                id: "uuid-sweep-first-1",
                transaction_date: "2026-11-16 19:02:00",
                account_number: "1017588888",
                transfer_type: "in",
                amount_in: 99_000,
                amount_out: 0,
                transaction_content: "VFDEDUPSW001",
                reference_number: null,
                code: "VFDEDUPSW001",
                bank_brand_name: "Vietcombank",
              },
            ],
            meta: {
              pagination: {
                total: 3,
                per_page: 100,
                current_page: 2,
                last_page: 2,
                has_more: false,
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });

      const sweepRes = await sweepTransactions({
        db: ctx.db,
        env: defaultEnv,
        fetchImpl: fetchMock,
        now: t0,
      });
      expect(sweepRes).toEqual({ fetched: 3, inserted: 2, skipped: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Order A was activated by sweep
      const [missedOrder] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, "ord_sweep_missed"));
      expect(missedOrder?.status).toBe("paid");
      expect(missedOrder?.sepayId).toBeNull();

      const [credit] = await ctx.db
        .select()
        .from(detailCredit)
        .where(eq(detailCredit.userId, user2.id));
      expect(credit?.remaining).toBe(3);

      // Order B event had sepayUuid backfilled onto existing webhook row
      const [whFirstEvent] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.sepayId, 9101));
      expect(whFirstEvent?.sepayUuid).toBe("uuid-wh-first-1");
      expect(whFirstEvent?.source).toBe("webhook");

      // Order C delayed webhook arrives AFTER cron sweep (empty referenceCode fallback dedup!)
      const whDelayedRes = await handleSepayWebhook({
        request: new Request("https://api.vox.vinhtran.io.vn/webhooks/sepay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Apikey ${defaultEnv.SEPAY_WEBHOOK_API_KEY}`,
          },
          body: JSON.stringify({
            id: 9102,
            gateway: "Vietcombank",
            transactionDate: "2026-11-16 19:02:00",
            accountNumber: "1017588888",
            subAccount: "",
            code: "VFDEDUPSW001",
            content: "VFDEDUPSW001",
            transferType: "in",
            transferAmount: 99_000,
            referenceCode: "",
          }),
        }),
        db: ctx.db,
        env: defaultEnv,
        now: () => t0,
      });
      expect(whDelayedRes).toEqual({ status: 200, body: { success: true } });

      // Order C event had sepayId backfilled onto existing cron_sweep row
      const [sweepFirstEvent] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.sepayUuid, "uuid-sweep-first-1"));
      expect(sweepFirstEvent?.sepayId).toBe(9102);
      expect(sweepFirstEvent?.source).toBe("cron_sweep");

      // Subscription points for user2 must equal exactly month (120) + week (48) = 168 (never double-activated!)
      const [sub] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, user2.id));
      expect(sub?.pointsRemaining).toBe(120 + 48);

      // Re-running sweep with same transactions skips all 3 via sepayUuid
      const secondSweep = await sweepTransactions({
        db: ctx.db,
        env: defaultEnv,
        fetchImpl: fetchMock,
        now: t0,
      });
      expect(secondSweep).toEqual({ fetched: 3, inserted: 0, skipped: 3 });

      const [subAfterSecondSweep] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, user2.id));
      expect(subAfterSecondSweep?.pointsRemaining).toBe(168);
    });

    it("throws explicit error when SePay API v2 returns non-2xx or invalid JSON shape", async () => {
      const failHttpFetch = vi.fn<typeof fetch>(async () => new Response("Unauthorized", { status: 401 }));
      await expect(
        sweepTransactions({
          db: ctx.db,
          env: defaultEnv,
          fetchImpl: failHttpFetch,
        }),
      ).rejects.toThrow("SePay API v2 returned HTTP 401");

      const badShapeFetch = vi.fn<typeof fetch>(
        async () =>
          new Response(JSON.stringify({ status: "error", message: "bad token" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      );
      await expect(
        sweepTransactions({
          db: ctx.db,
          env: defaultEnv,
          fetchImpl: badShapeFetch,
        }),
      ).rejects.toThrow("Invalid SePay API v2 payload");

      // Direct ingestSepayTransaction fails closed if SEPAY_BANK_ACCOUNT missing
      await expect(
        ingestSepayTransaction({
          db: ctx.db,
          env: { SEPAY_BANK_ACCOUNT: "" },
          now: new Date(),
          source: "cron_sweep",
          transferType: "in",
          gateway: "VCB",
          accountNumber: "1017588888",
          transferAmount: 49_000,
          extractedCode: "VFSWEEP00001",
          transactionDate: "2026-11-16 19:00:00",
        }),
      ).rejects.toThrow("Payment bank not configured");
    });
  });
});
