import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";

import {
  attempt,
  attemptScore,
  detailCredit,
  detailUnlock,
  paymentOrder,
  subscription,
  userProfile,
} from "@vox-flow/db/schema";

import {
  formatTransferContent,
  generateVietQrUrl,
  ORDER_QR_TTL_MS,
  resolveBillingPlans,
  validateExamDateForOrder,
  type BillingPlanId,
} from "../billing/plans";
import type { ApiEnv } from "../context";
import { protectedProcedure, publicProcedure, router } from "../index";

const TRANSFER_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function generateTransferCode(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (const b of bytes) {
    suffix += TRANSFER_CODE_ALPHABET[b % TRANSFER_CODE_ALPHABET.length]!;
  }
  return `VF${suffix}`;
}

function isBillingAllowed(env: ApiEnv | undefined, email: string | null | undefined): boolean {
  if (env?.BILLING_ENABLED === "true") {
    return true;
  }
  const allowed = (env?.BILLING_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && allowed.includes(normalized));
}

function readBankConfig(env: ApiEnv | undefined) {
  const bankAccount = typeof env?.SEPAY_BANK_ACCOUNT === "string" ? env.SEPAY_BANK_ACCOUNT.trim() : "";
  const subAccount = typeof env?.SEPAY_SUB_ACCOUNT === "string" ? env.SEPAY_SUB_ACCOUNT.trim() : "";
  const bankCode = typeof env?.SEPAY_BANK_CODE === "string" ? env.SEPAY_BANK_CODE.trim() : "";
  return { bankAccount, subAccount, bankCode };
}

export const billingRouter = router({
  plans: publicProcedure.query(({ ctx }) => {
    const plans = resolveBillingPlans(ctx.env);
    return [plans.pack, plans.week, plans.exam, plans.month];
  }),

  status: protectedProcedure.query(async ({ ctx }) => {
    const now = (ctx.now ?? (() => new Date()))();
    const plans = resolveBillingPlans(ctx.env);

    const [sub] = await ctx.db
      .select()
      .from(subscription)
      .where(and(eq(subscription.userId, ctx.session.user.id), gt(subscription.expiresAt, now)))
      .limit(1);

    const [credit] = await ctx.db
      .select({ remaining: detailCredit.remaining })
      .from(detailCredit)
      .where(eq(detailCredit.userId, ctx.session.user.id))
      .limit(1);

    return {
      subscription: sub
        ? {
            planId: sub.planId,
            planName: plans[sub.planId].name,
            pointsRemaining: sub.pointsRemaining,
            planPointsTotal: sub.planPointsTotal,
            expiresAt: sub.expiresAt.getTime(),
          }
        : null,
      detailCredits: credit?.remaining ?? 0,
    };
  }),

  listOrders: protectedProcedure.query(async ({ ctx }) => {
    const plans = resolveBillingPlans(ctx.env);
    const rows = await ctx.db
      .select()
      .from(paymentOrder)
      .where(and(eq(paymentOrder.userId, ctx.session.user.id), eq(paymentOrder.status, "paid")))
      .orderBy(desc(paymentOrder.paidAt), desc(paymentOrder.createdAt))
      .limit(50);

    return rows.map((row) => ({
      id: row.id,
      planId: row.planId,
      planName: plans[row.planId].name,
      amountVnd: row.amountVnd,
      transferCode: row.transferCode,
      sepayId: row.sepayId,
      paidAt: row.paidAt ? row.paidAt.getTime() : null,
      createdAt: row.createdAt.getTime(),
    }));
  }),

  createOrder: protectedProcedure
    .input(z.object({ planId: z.enum(["pack", "week", "month", "exam"]) }))
    .mutation(async ({ ctx, input }) => {
      if (!isBillingAllowed(ctx.env, ctx.session.user.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BILLING_DISABLED",
        });
      }

      const { bankAccount, subAccount, bankCode } = readBankConfig(ctx.env);
      if (!bankAccount || !bankCode) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "SEPAY_BANK_CONFIG_MISSING",
        });
      }

      const now = (ctx.now ?? (() => new Date()))();
      const nowMs = now.getTime();
      const plans = resolveBillingPlans(ctx.env);
      const plan = plans[input.planId as BillingPlanId];

      let examDateSnapshot: string | null = null;
      if (plan.id === "exam") {
        const [profile] = await ctx.db
          .select({ examDate: userProfile.examDate })
          .from(userProfile)
          .where(eq(userProfile.userId, ctx.session.user.id))
          .limit(1);
        examDateSnapshot = profile?.examDate ?? null;
        const check = validateExamDateForOrder(examDateSnapshot, nowMs);
        if (!check.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: check.reason,
          });
        }
      }

      const existingPending = await ctx.db
        .select()
        .from(paymentOrder)
        .where(
          and(
            eq(paymentOrder.userId, ctx.session.user.id),
            eq(paymentOrder.planId, plan.id),
            eq(paymentOrder.amountVnd, plan.priceVnd),
            eq(paymentOrder.status, "pending"),
            gt(paymentOrder.expiresAt, now),
          ),
        )
        .orderBy(desc(paymentOrder.createdAt))
        .limit(1);

      const reusable = existingPending.find(
        (row) => (row.examDateSnapshot ?? null) === examDateSnapshot,
      );

      let order = reusable;
      if (!order) {
        const orderId = crypto.randomUUID();
        const transferCode = generateTransferCode();
        const expiresAt = new Date(nowMs + ORDER_QR_TTL_MS);

        const [inserted] = await ctx.db
          .insert(paymentOrder)
          .values({
            id: orderId,
            userId: ctx.session.user.id,
            planId: plan.id,
            amountVnd: plan.priceVnd,
            transferCode,
            examDateSnapshot,
            status: "pending",
            expiresAt,
            createdAt: now,
          })
          .returning();

        if (!inserted) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "ORDER_CREATE_FAILED",
          });
        }
        order = inserted;
      }

      const transferContent = formatTransferContent(order.transferCode, bankCode);
      const qrUrl = generateVietQrUrl({
        account: bankAccount,
        subAccount,
        bankCode,
        amountVnd: order.amountVnd,
        transferContent,
      });

      return {
        orderId: order.id,
        planId: order.planId,
        planName: plan.name,
        amountVnd: order.amountVnd,
        transferCode: order.transferCode,
        transferContent,
        bankCode,
        accountNumber: subAccount || bankAccount,
        qrUrl,
        expiresAt: order.expiresAt.getTime(),
        status: order.status,
      };
    }),

  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      if (order.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
      }

      const nowMs = (ctx.now ?? (() => new Date()))().getTime();
      const plans = resolveBillingPlans(ctx.env);
      const plan = plans[order.planId];
      const { bankAccount, subAccount, bankCode } = readBankConfig(ctx.env);
      const transferContent = bankCode
        ? formatTransferContent(order.transferCode, bankCode)
        : order.transferCode;
      const qrUrl =
        bankAccount && bankCode
          ? generateVietQrUrl({
              account: bankAccount,
              subAccount,
              bankCode,
              amountVnd: order.amountVnd,
              transferContent,
            })
          : "";

      const effectiveStatus =
        order.status === "pending" && order.expiresAt.getTime() <= nowMs
          ? ("expired" as const)
          : order.status;

      return {
        orderId: order.id,
        planId: order.planId,
        planName: plan.name,
        amountVnd: order.amountVnd,
        transferCode: order.transferCode,
        transferContent,
        bankCode,
        accountNumber: subAccount || bankAccount,
        qrUrl,
        status: effectiveStatus,
        sepayId: order.sepayId,
        expiresAt: order.expiresAt.getTime(),
        paidAt: order.paidAt ? order.paidAt.getTime() : null,
        createdAt: order.createdAt.getTime(),
      };
    }),

  unlockDetail: protectedProcedure
    .input(z.object({ attemptId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [owned] = await ctx.db
        .select({ id: attempt.id, userId: attempt.userId })
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!owned) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
      }
      if (owned.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
      }

      const [score] = await ctx.db
        .select({ status: attemptScore.status })
        .from(attemptScore)
        .where(eq(attemptScore.attemptId, input.attemptId))
        .limit(1);

      if (!score || score.status !== "done") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ATTEMPT_NOT_SCORED",
        });
      }

      const [existingUnlock] = await ctx.db
        .select({ id: detailUnlock.id })
        .from(detailUnlock)
        .where(and(eq(detailUnlock.userId, userId), eq(detailUnlock.attemptId, input.attemptId)))
        .limit(1);

      if (existingUnlock) {
        const [credit] = await ctx.db
          .select({ remaining: detailCredit.remaining })
          .from(detailCredit)
          .where(eq(detailCredit.userId, userId))
          .limit(1);
        return {
          unlocked: true,
          alreadyUnlocked: true,
          remaining: credit?.remaining ?? 0,
        };
      }

      const now = (ctx.now ?? (() => new Date()))();
      const nowMs = now.getTime();
      const unlockToken = crypto.randomUUID();
      const unlockId = crypto.randomUUID();

      const [debited, inserted] = await ctx.db.batch([
        ctx.db
          .update(detailCredit)
          .set({
            remaining: sql`${detailCredit.remaining} - 1`,
            lastUnlockAttemptId: unlockToken,
            updatedAt: now,
          })
          .where(
            and(
              eq(detailCredit.userId, userId),
              gt(detailCredit.remaining, 0),
              sql`NOT EXISTS (
                SELECT 1 FROM detail_unlock du
                WHERE du.user_id = ${userId} AND du.attempt_id = ${input.attemptId}
              )`,
            ),
          )
          .returning({ remaining: detailCredit.remaining }),
        ctx.db
          .insert(detailUnlock)
          .select((qb) =>
            qb
              .select({
                id: sql<string>`${unlockId}`.as("id"),
                userId: sql<string>`${userId}`.as("user_id"),
                attemptId: sql<string>`${input.attemptId}`.as("attempt_id"),
                createdAt: sql<Date>`${nowMs}`.as("created_at"),
              })
              .from(detailCredit)
              .where(
                and(
                  eq(detailCredit.userId, userId),
                  eq(detailCredit.lastUnlockAttemptId, unlockToken),
                ),
              ),
          )
          .onConflictDoNothing()
          .returning({ id: detailUnlock.id }),
      ]);

      if ((debited?.length ?? 0) > 0 && (inserted?.length ?? 0) > 0) {
        return {
          unlocked: true,
          alreadyUnlocked: false,
          remaining: debited[0]!.remaining,
        };
      }

      const [racedUnlock] = await ctx.db
        .select({ id: detailUnlock.id })
        .from(detailUnlock)
        .where(and(eq(detailUnlock.userId, userId), eq(detailUnlock.attemptId, input.attemptId)))
        .limit(1);

      const [credit] = await ctx.db
        .select({ remaining: detailCredit.remaining })
        .from(detailCredit)
        .where(eq(detailCredit.userId, userId))
        .limit(1);

      if (racedUnlock) {
        return {
          unlocked: true,
          alreadyUnlocked: true,
          remaining: credit?.remaining ?? 0,
        };
      }

      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "NO_DETAIL_CREDITS",
      });
    }),
});
