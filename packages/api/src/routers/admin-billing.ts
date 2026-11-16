import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";

import {
  detailCredit,
  paymentAction,
  paymentEvent,
  paymentOrder,
  subscription,
  user,
  type PaymentAction,
} from "@vox-flow/db/schema";

import { resolveBillingPlans } from "../billing/plans";
import { activateOrderAtomic, sweepTransactions } from "../billing/reconcile";
import { adminProcedure, router } from "../index";

export const BILLING_SLA_MS = 24 * 60 * 60 * 1000;
export const BILLING_NEAR_SLA_MS = 18 * 60 * 60 * 1000;
const QUEUE_LIMIT = 50;
const SEARCH_ORDERS_LIMIT = 30;

export const adminBillingQueueInputSchema = z
  .object({
    filter: z.enum(["pending_review", "resolved", "all"]).default("pending_review"),
  })
  .optional();

export const searchOrdersInputSchema = z
  .object({
    query: z.string().optional(),
  })
  .optional();

export const activateBillingEventInputSchema = z.object({
  eventId: z.string().min(1),
  orderId: z.string().min(1).optional(),
  note: z.string().trim().min(1, "Ghi chú không được để trống"),
});

export const markRefundedBillingEventInputSchema = z.object({
  eventId: z.string().min(1),
  note: z.string().trim().min(1, "Ghi chú không được để trống"),
});

function resolveNow(nowFn?: () => Date): Date {
  const current = nowFn ? nowFn() : new Date();
  if (!(current instanceof Date) || !Number.isFinite(current.getTime())) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid clock value from Context.now",
    });
  }
  return current;
}

function escapeLikePattern(raw: string): string {
  return raw.replace(/[\\%_]/g, "\\$&");
}

function computeSlaState(params: {
  createdAt: Date;
  resolutionStatus: string;
  nowMs: number;
}) {
  const createdAtMs = params.createdAt.getTime();
  const slaDueAt = new Date(createdAtMs + BILLING_SLA_MS);
  const isPending = params.resolutionStatus === "pending_review";
  const ageMs = params.nowMs - createdAtMs;
  const isOverdue = isPending && ageMs >= BILLING_SLA_MS;
  const isNearOverdue = isPending && ageMs >= BILLING_NEAR_SLA_MS;
  return { slaDueAt, isNearOverdue, isOverdue };
}

export const adminBillingRouter = router({
  checkAdmin: adminProcedure.query(() => {
    return { isAdmin: true };
  }),

  queue: adminProcedure
    .input(adminBillingQueueInputSchema)
    .query(async ({ ctx, input }) => {
      const filter = input?.filter ?? "pending_review";
      const now = resolveNow(ctx.now);
      const nowMs = now.getTime();
      const plans = resolveBillingPlans(ctx.env);

      const baseNonOutbound = and(
        ne(paymentEvent.classification, "outbound"),
        ne(paymentEvent.resolutionStatus, "ignored"),
      );

      let whereClause = baseNonOutbound;
      if (filter === "pending_review") {
        whereClause = and(
          eq(paymentEvent.resolutionStatus, "pending_review"),
          ne(paymentEvent.classification, "outbound"),
        );
      } else if (filter === "resolved") {
        whereClause = and(
          inArray(paymentEvent.resolutionStatus, ["resolved", "activated", "refunded"]),
          ne(paymentEvent.classification, "outbound"),
        );
      }

      const orderDirection =
        filter === "pending_review"
          ? asc(paymentEvent.createdAt)
          : desc(paymentEvent.createdAt);

      const rows = await ctx.db
        .select({
          id: paymentEvent.id,
          sepayId: paymentEvent.sepayId,
          sepayUuid: paymentEvent.sepayUuid,
          transferType: paymentEvent.transferType,
          gateway: paymentEvent.gateway,
          accountNumber: paymentEvent.accountNumber,
          subAccount: paymentEvent.subAccount,
          transferAmount: paymentEvent.transferAmount,
          extractedCode: paymentEvent.extractedCode,
          referenceCode: paymentEvent.referenceCode,
          transactionDate: paymentEvent.transactionDate,
          orderId: paymentEvent.orderId,
          matchStatus: paymentEvent.matchStatus,
          classification: paymentEvent.classification,
          resolutionStatus: paymentEvent.resolutionStatus,
          source: paymentEvent.source,
          createdAt: paymentEvent.createdAt,
          orderRowId: paymentOrder.id,
          orderUserId: paymentOrder.userId,
          orderPlanId: paymentOrder.planId,
          orderAmountVnd: paymentOrder.amountVnd,
          orderTransferCode: paymentOrder.transferCode,
          orderStatus: paymentOrder.status,
          orderSepayId: paymentOrder.sepayId,
          orderExpiresAt: paymentOrder.expiresAt,
          orderPaidAt: paymentOrder.paidAt,
          orderCreatedAt: paymentOrder.createdAt,
          userEmail: user.email,
          userName: user.name,
        })
        .from(paymentEvent)
        .leftJoin(paymentOrder, eq(paymentEvent.orderId, paymentOrder.id))
        .leftJoin(user, eq(paymentOrder.userId, user.id))
        .where(whereClause)
        .orderBy(orderDirection)
        .limit(QUEUE_LIMIT);

      const eventIds = rows.map((r) => r.id);
      const actionsByEvent = new Map<string, PaymentAction[]>();
      if (eventIds.length > 0) {
        const actionRows = await ctx.db
          .select()
          .from(paymentAction)
          .where(inArray(paymentAction.eventId, eventIds))
          .orderBy(desc(paymentAction.createdAt));

        for (const action of actionRows) {
          const list = actionsByEvent.get(action.eventId) ?? [];
          list.push(action);
          actionsByEvent.set(action.eventId, list);
        }
      }

      const metricRows = await ctx.db
        .select({
          resolutionStatus: paymentEvent.resolutionStatus,
          createdAt: paymentEvent.createdAt,
        })
        .from(paymentEvent)
        .where(baseNonOutbound);

      let pendingCount = 0;
      let overdueCount = 0;
      let nearOverdueCount = 0;
      let resolvedCount = 0;

      for (const m of metricRows) {
        if (m.resolutionStatus === "pending_review") {
          pendingCount += 1;
          const sla = computeSlaState({
            createdAt: m.createdAt,
            resolutionStatus: m.resolutionStatus,
            nowMs,
          });
          if (sla.isOverdue) {
            overdueCount += 1;
          } else if (sla.isNearOverdue) {
            nearOverdueCount += 1;
          }
        } else if (
          m.resolutionStatus === "resolved" ||
          m.resolutionStatus === "activated" ||
          m.resolutionStatus === "refunded"
        ) {
          resolvedCount += 1;
        }
      }

      const items = rows.map((r) => {
        const sla = computeSlaState({
          createdAt: r.createdAt,
          resolutionStatus: r.resolutionStatus,
          nowMs,
        });

        const order =
          r.orderRowId && r.orderUserId && r.orderPlanId && r.orderAmountVnd != null &&
          r.orderTransferCode && r.orderStatus && r.orderExpiresAt && r.orderCreatedAt
            ? {
                id: r.orderRowId,
                userId: r.orderUserId,
                planId: r.orderPlanId,
                planName: plans[r.orderPlanId].name,
                amountVnd: r.orderAmountVnd,
                transferCode: r.orderTransferCode,
                status: r.orderStatus,
                sepayId: r.orderSepayId ?? null,
                expiresAt: r.orderExpiresAt,
                paidAt: r.orderPaidAt ?? null,
                createdAt: r.orderCreatedAt,
              }
            : null;

        return {
          id: r.id,
          sepayId: r.sepayId,
          sepayUuid: r.sepayUuid,
          transferType: r.transferType,
          gateway: r.gateway,
          accountNumber: r.accountNumber,
          subAccount: r.subAccount,
          transferAmount: r.transferAmount,
          extractedCode: r.extractedCode,
          referenceCode: r.referenceCode,
          transactionDate: r.transactionDate,
          orderId: r.orderId,
          matchStatus: r.matchStatus,
          classification: r.classification,
          resolutionStatus: r.resolutionStatus,
          source: r.source,
          createdAt: r.createdAt,
          userEmail: r.userEmail ?? null,
          userName: r.userName ?? null,
          order,
          actions: actionsByEvent.get(r.id) ?? [],
          slaDueAt: sla.slaDueAt,
          isNearOverdue: sla.isNearOverdue,
          isOverdue: sla.isOverdue,
        };
      });

      return {
        items,
        metrics: {
          pendingCount,
          overdueCount,
          nearOverdueCount,
          resolvedCount,
        },
      };
    }),

  searchOrders: adminProcedure
    .input(searchOrdersInputSchema)
    .query(async ({ ctx, input }) => {
      const plans = resolveBillingPlans(ctx.env);
      const trimmed = input?.query?.trim() ?? "";

      let whereClause;
      if (trimmed !== "") {
        const pattern = `%${escapeLikePattern(trimmed.toLowerCase())}%`;
        whereClause = or(
          sql`LOWER(${paymentOrder.transferCode}) LIKE ${pattern} ESCAPE '\\'`,
          sql`LOWER(COALESCE(${user.email}, '')) LIKE ${pattern} ESCAPE '\\'`,
        );
      }

      const rows = await ctx.db
        .select({
          id: paymentOrder.id,
          userId: paymentOrder.userId,
          planId: paymentOrder.planId,
          amountVnd: paymentOrder.amountVnd,
          transferCode: paymentOrder.transferCode,
          status: paymentOrder.status,
          expiresAt: paymentOrder.expiresAt,
          paidAt: paymentOrder.paidAt,
          createdAt: paymentOrder.createdAt,
          userEmail: user.email,
          userName: user.name,
        })
        .from(paymentOrder)
        .leftJoin(user, eq(paymentOrder.userId, user.id))
        .where(whereClause)
        .orderBy(desc(paymentOrder.createdAt))
        .limit(SEARCH_ORDERS_LIMIT);

      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        userEmail: row.userEmail ?? null,
        userName: row.userName ?? null,
        planId: row.planId,
        planName: plans[row.planId].name,
        amountVnd: row.amountVnd,
        transferCode: row.transferCode,
        status: row.status,
        expiresAt: row.expiresAt,
        paidAt: row.paidAt,
        createdAt: row.createdAt,
      }));
    }),

  activate: adminProcedure
    .input(activateBillingEventInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = resolveNow(ctx.now);

      const [event] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.id, input.eventId))
        .limit(1);

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy giao dịch cần xử lý",
        });
      }

      if (
        event.classification === "outbound" ||
        event.resolutionStatus === "ignored" ||
        event.resolutionStatus === "activated" ||
        event.resolutionStatus === "refunded"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Giao dịch này không thể kích hoạt thủ công",
        });
      }

      const targetOrderId = input.orderId ?? event.orderId;
      if (!targetOrderId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vui lòng chọn đơn hàng để kích hoạt",
        });
      }

      const [order] = await ctx.db
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, targetOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy đơn hàng",
        });
      }

      if (order.status === "paid") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "ORDER_ALREADY_PAID",
        });
      }

      if (order.status === "refunded") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Đơn hàng đã hoàn tiền, không thể kích hoạt",
        });
      }

      const activation = await activateOrderAtomic({
        db: ctx.db,
        order,
        sepayId: event.sepayId,
        env: ctx.env,
        now,
        allowExpired: true,
      });

      if (activation.alreadyPaid || !activation.activated) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "ORDER_ALREADY_PAID",
        });
      }

      const actionId = crypto.randomUUID();
      await ctx.db.batch([
        ctx.db
          .update(paymentEvent)
          .set({
            orderId: order.id,
            resolutionStatus: "activated",
          })
          .where(eq(paymentEvent.id, event.id)),
        ctx.db.insert(paymentAction).values({
          id: actionId,
          eventId: event.id,
          orderId: order.id,
          action: "activate",
          note: input.note,
          actorEmail: ctx.session.user.email,
          createdAt: now,
        }),
      ]);

      return {
        success: true,
        eventId: event.id,
        orderId: order.id,
        actionId,
      };
    }),

  markRefunded: adminProcedure
    .input(markRefundedBillingEventInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = resolveNow(ctx.now);
      const nowMs = now.getTime();
      const plans = resolveBillingPlans(ctx.env);

      const [event] = await ctx.db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.id, input.eventId))
        .limit(1);

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy giao dịch cần xử lý",
        });
      }

      if (
        event.classification === "outbound" ||
        event.resolutionStatus === "ignored" ||
        event.resolutionStatus === "refunded"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Giao dịch này không thể đánh dấu hoàn tiền",
        });
      }

      const batchStatements: BatchItem<"sqlite">[] = [];

      // Manual offline refund only (never triggers bank transfer).
      // Skip order/entitlement mutation for already_paid duplicate transfers
      // so the legitimate original paid order remains intact.
      if (event.orderId && event.classification !== "already_paid") {
        const [order] = await ctx.db
          .select()
          .from(paymentOrder)
          .where(eq(paymentOrder.id, event.orderId))
          .limit(1);

        if (order) {
          if (order.status === "paid") {
            const plan = plans[order.planId];
            if (order.planId === "pack") {
              batchStatements.push(
                ctx.db
                  .update(detailCredit)
                  .set({
                    remaining: sql`MAX(0, ${detailCredit.remaining} - ${plan.detailCredits})`,
                    updatedAt: now,
                  })
                  .where(eq(detailCredit.userId, order.userId)),
              );
            } else {
              batchStatements.push(
                ctx.db
                  .update(subscription)
                  .set({
                    pointsRemaining: sql`MAX(0, ${subscription.pointsRemaining} - ${plan.points})`,
                    expiresAt: sql`CASE WHEN MAX(0, ${subscription.pointsRemaining} - ${plan.points}) = 0 THEN ${nowMs} ELSE ${subscription.expiresAt} END`,
                    updatedAt: now,
                  })
                  .where(
                    and(
                      eq(subscription.userId, order.userId),
                      eq(subscription.lastOrderId, order.id),
                    ),
                  ),
              );
            }
          }

          if (order.status !== "refunded") {
            batchStatements.push(
              ctx.db
                .update(paymentOrder)
                .set({ status: "refunded" })
                .where(eq(paymentOrder.id, order.id)),
            );
          }
        }
      }

      const actionId = crypto.randomUUID();
      const eventUpdateStmt = ctx.db
        .update(paymentEvent)
        .set({ resolutionStatus: "refunded" })
        .where(eq(paymentEvent.id, event.id));
      const actionInsertStmt = ctx.db.insert(paymentAction).values({
        id: actionId,
        eventId: event.id,
        orderId: event.orderId ?? null,
        action: "mark_refunded",
        note: input.note,
        actorEmail: ctx.session.user.email,
        createdAt: now,
      });

      await ctx.db.batch([eventUpdateStmt, actionInsertStmt, ...batchStatements]);

      return {
        success: true,
        eventId: event.id,
        orderId: event.orderId ?? null,
        actionId,
      };
    }),

  triggerSweep: adminProcedure.mutation(async ({ ctx }) => {
    const now = resolveNow(ctx.now);
    return sweepTransactions({
      db: ctx.db,
      env: ctx.env,
      now,
    });
  }),
});
