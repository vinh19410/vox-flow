import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
  adminUserAction,
  attempt,
  detailCredit,
  paymentEvent,
  paymentOrder,
  subscription,
  user,
  userProfile,
  type PaymentEvent,
} from "@vox-flow/db/schema";

import {
  computeSubscriptionExpiry,
  resolveBillingPlans,
  validateExamDateForOrder,
  type SubscriptionPlanId,
} from "../billing/plans";
import { adminProcedure, router } from "../index";

const DAY_MS = 24 * 60 * 60 * 1000;
const DETAIL_LIST_LIMIT = 50;

export const adminUsersListInputSchema = z
  .object({
    query: z.string().optional(),
    planFilter: z.enum(["all", "active_paid", "expired", "free"]).default("all"),
    limit: z.number().int().min(1).max(100).default(30),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

export const adminUsersDetailInputSchema = z.object({
  userId: z.string().min(1),
});

export const adminUsersGrantPlanInputSchema = z.object({
  userId: z.string().min(1),
  planId: z.enum(["pack", "week", "month", "exam"]),
  examDate: z.string().nullable().optional(),
  note: z.string().trim().min(1, "Ghi chú không được để trống"),
});

export const adminUsersAdjustQuotaInputSchema = z.discriminatedUnion("target", [
  z.object({
    userId: z.string().min(1),
    target: z.literal("points"),
    pointsRemaining: z.number().finite().int().min(0),
    note: z.string().trim().min(1, "Ghi chú không được để trống"),
  }),
  z.object({
    userId: z.string().min(1),
    target: z.literal("detail_credit"),
    detailCredits: z.number().finite().int().min(0),
    note: z.string().trim().min(1, "Ghi chú không được để trống"),
  }),
  z.object({
    userId: z.string().min(1),
    target: z.literal("expiry"),
    expiresAtMs: z.number().finite().int().positive(),
    note: z.string().trim().min(1, "Ghi chú không được để trống"),
  }),
]);

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

export const adminUsersRouter = router({
  checkAdmin: adminProcedure.query(() => {
    return { isAdmin: true };
  }),

  list: adminProcedure
    .input(adminUsersListInputSchema)
    .query(async ({ ctx, input }) => {
      const now = resolveNow(ctx.now);
      const nowMs = now.getTime();
      const plans = resolveBillingPlans(ctx.env);

      const planFilter = input?.planFilter ?? "all";
      const limit = input?.limit ?? 30;
      const offset = input?.offset ?? 0;
      const trimmedQuery = input?.query?.trim() ?? "";

      const conditions = [];
      if (trimmedQuery !== "") {
        const pattern = `%${escapeLikePattern(trimmedQuery.toLowerCase())}%`;
        conditions.push(
          or(
            sql`LOWER(${user.email}) LIKE ${pattern} ESCAPE '\\'`,
            sql`LOWER(${user.name}) LIKE ${pattern} ESCAPE '\\'`,
            sql`LOWER(${user.id}) LIKE ${pattern} ESCAPE '\\'`,
          )!,
        );
      }

      if (planFilter === "active_paid") {
        conditions.push(and(isNotNull(subscription.userId), gt(subscription.expiresAt, now))!);
      } else if (planFilter === "expired") {
        conditions.push(and(isNotNull(subscription.userId), lte(subscription.expiresAt, now))!);
      } else if (planFilter === "free") {
        conditions.push(isNull(subscription.userId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countRow] = await ctx.db
        .select({ total: sql<number>`COUNT(*)` })
        .from(user)
        .leftJoin(subscription, eq(subscription.userId, user.id))
        .where(whereClause);

      const total = Number(countRow?.total ?? 0);
      if (total === 0) {
        return { items: [], total: 0 };
      }

      const rows = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
          targetBand: userProfile.targetBand,
          examDate: userProfile.examDate,
          onboardedAt: userProfile.onboardedAt,
          subUserId: subscription.userId,
          subPlanId: subscription.planId,
          subPointsRemaining: subscription.pointsRemaining,
          subPlanPointsTotal: subscription.planPointsTotal,
          subExpiresAt: subscription.expiresAt,
          detailCredits: detailCredit.remaining,
        })
        .from(user)
        .leftJoin(userProfile, eq(userProfile.userId, user.id))
        .leftJoin(subscription, eq(subscription.userId, user.id))
        .leftJoin(detailCredit, eq(detailCredit.userId, user.id))
        .where(whereClause)
        .orderBy(desc(user.createdAt), desc(user.id))
        .limit(limit)
        .offset(offset);

      const userIds = rows.map((row) => row.id);
      const statsByUser = new Map<
        string,
        { paidOrderCount: number; totalPaidVnd: number; lastOrderAt: Date | null }
      >();

      if (userIds.length > 0) {
        // Cloudflare D1 limits each SQL statement to 100 bind parameters; chunk `userIds` <= 50.
        const ORDER_STATS_CHUNK_SIZE = 50;
        for (let i = 0; i < userIds.length; i += ORDER_STATS_CHUNK_SIZE) {
          const chunk = userIds.slice(i, i + ORDER_STATS_CHUNK_SIZE);
          const orderStatsRows = await ctx.db
            .select({
              userId: paymentOrder.userId,
              paidOrderCount: sql<number>`COUNT(*)`,
              totalPaidVnd: sql<number>`COALESCE(SUM(${paymentOrder.amountVnd}), 0)`,
              lastOrderAtMs: sql<number | null>`MAX(COALESCE(${paymentOrder.paidAt}, ${paymentOrder.createdAt}))`,
            })
            .from(paymentOrder)
            .where(and(inArray(paymentOrder.userId, chunk), eq(paymentOrder.status, "paid")))
            .groupBy(paymentOrder.userId);

          for (const stat of orderStatsRows) {
            statsByUser.set(stat.userId, {
              paidOrderCount: Number(stat.paidOrderCount ?? 0),
              totalPaidVnd: Number(stat.totalPaidVnd ?? 0),
              lastOrderAt: stat.lastOrderAtMs != null ? new Date(Number(stat.lastOrderAtMs)) : null,
            });
          }
        }
      }

      const items = rows.map((row) => {
        const hasSubscription =
          row.subUserId !== null && row.subPlanId !== null && row.subExpiresAt !== null;
        const isActiveSub = hasSubscription && row.subExpiresAt!.getTime() > nowMs;
        const planStatus: "active_paid" | "expired" | "free" = hasSubscription
          ? isActiveSub
            ? "active_paid"
            : "expired"
          : "free";
        const stats = statsByUser.get(row.id);

        return {
          id: row.id,
          name: row.name,
          email: row.email,
          emailVerified: row.emailVerified,
          image: row.image,
          createdAt: row.createdAt,
          planStatus,
          profile:
            row.targetBand !== null
              ? {
                  targetBand: row.targetBand,
                  examDate: row.examDate ?? null,
                  onboardedAt: row.onboardedAt ?? null,
                }
              : null,
          subscription: hasSubscription
            ? {
                planId: row.subPlanId!,
                planName: plans[row.subPlanId!].name,
                pointsRemaining: row.subPointsRemaining ?? 0,
                planPointsTotal: row.subPlanPointsTotal ?? 0,
                expiresAt: row.subExpiresAt!,
                isActive: isActiveSub,
              }
            : null,
          detailCredits: row.detailCredits ?? 0,
          paidOrderCount: stats?.paidOrderCount ?? 0,
          totalPaidVnd: stats?.totalPaidVnd ?? 0,
          lastOrderAt: stats?.lastOrderAt ?? null,
        };
      });

      return { items, total };
    }),

  detail: adminProcedure
    .input(adminUsersDetailInputSchema)
    .query(async ({ ctx, input }) => {
      const now = resolveNow(ctx.now);
      const nowMs = now.getTime();
      const plans = resolveBillingPlans(ctx.env);

      const [foundUser] = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!foundUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy người dùng",
        });
      }

      const [profileRows, subRows, creditRows, orderRows, actionRows, attemptCountRows] =
        await Promise.all([
          ctx.db
            .select()
            .from(userProfile)
            .where(eq(userProfile.userId, foundUser.id))
            .limit(1),
          ctx.db
            .select()
            .from(subscription)
            .where(eq(subscription.userId, foundUser.id))
            .limit(1),
          ctx.db
            .select({ remaining: detailCredit.remaining })
            .from(detailCredit)
            .where(eq(detailCredit.userId, foundUser.id))
            .limit(1),
          ctx.db
            .select()
            .from(paymentOrder)
            .where(eq(paymentOrder.userId, foundUser.id))
            .orderBy(desc(paymentOrder.createdAt))
            .limit(DETAIL_LIST_LIMIT),
          ctx.db
            .select()
            .from(adminUserAction)
            .where(eq(adminUserAction.userId, foundUser.id))
            .orderBy(desc(adminUserAction.createdAt))
            .limit(DETAIL_LIST_LIMIT),
          ctx.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(attempt)
            .where(eq(attempt.userId, foundUser.id)),
        ]);

      const orderIds = orderRows.map((o) => o.id);
      let events: PaymentEvent[] = [];
      if (orderIds.length > 0) {
        events = await ctx.db
          .select()
          .from(paymentEvent)
          .where(inArray(paymentEvent.orderId, orderIds))
          .orderBy(desc(paymentEvent.createdAt));
      }

      const subRow = subRows[0] ?? null;

      return {
        user: foundUser,
        profile: profileRows[0] ?? null,
        subscription: subRow
          ? {
              userId: subRow.userId,
              planId: subRow.planId,
              planName: plans[subRow.planId].name,
              pointsRemaining: subRow.pointsRemaining,
              planPointsTotal: subRow.planPointsTotal,
              expiresAt: subRow.expiresAt,
              isActive: subRow.expiresAt.getTime() > nowMs,
              lastOrderId: subRow.lastOrderId,
              createdAt: subRow.createdAt,
              updatedAt: subRow.updatedAt,
            }
          : null,
        detailCredits: creditRows[0]?.remaining ?? 0,
        orders: orderRows.map((o) => ({
          id: o.id,
          userId: o.userId,
          planId: o.planId,
          planName: plans[o.planId].name,
          amountVnd: o.amountVnd,
          transferCode: o.transferCode,
          examDateSnapshot: o.examDateSnapshot,
          status: o.status,
          sepayId: o.sepayId,
          expiresAt: o.expiresAt,
          paidAt: o.paidAt,
          createdAt: o.createdAt,
        })),
        events,
        actions: actionRows,
        attemptsCount: Number(attemptCountRows[0]?.count ?? 0),
      };
    }),

  grantPlan: adminProcedure
    .input(adminUsersGrantPlanInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = resolveNow(ctx.now);
      const nowMs = now.getTime();
      const plans = resolveBillingPlans(ctx.env);

      const [foundUser] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!foundUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy người dùng",
        });
      }

      const plan = plans[input.planId];
      const actionId = crypto.randomUUID();

      if (plan.kind === "detail_pack") {
        const creditUpsertStmt = ctx.db
          .insert(detailCredit)
          .values({
            userId: foundUser.id,
            remaining: plan.detailCredits,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: detailCredit.userId,
            set: {
              remaining: sql`${detailCredit.remaining} + ${plan.detailCredits}`,
              updatedAt: now,
            },
          })
          .returning({ remaining: detailCredit.remaining });

        const actionInsertStmt = ctx.db.insert(adminUserAction).values({
          id: actionId,
          userId: foundUser.id,
          action: "grant_plan",
          planId: "pack",
          detailCreditsDelta: plan.detailCredits,
          note: input.note,
          actorEmail: ctx.session.user.email,
          createdAt: now,
        });

        const [updatedCredits] = await ctx.db.batch([creditUpsertStmt, actionInsertStmt]);

        return {
          success: true,
          userId: foundUser.id,
          planId: input.planId,
          actionId,
          subscription: null,
          detailCredits: updatedCredits?.[0]?.remaining ?? plan.detailCredits,
        };
      }

      const subPlanId = input.planId as SubscriptionPlanId;
      let effectiveExamDate: string | null = null;
      if (subPlanId === "exam") {
        if (input.examDate === undefined) {
          const [profile] = await ctx.db
            .select({ examDate: userProfile.examDate })
            .from(userProfile)
            .where(eq(userProfile.userId, foundUser.id))
            .limit(1);
          effectiveExamDate = profile?.examDate ?? null;
        } else if (input.examDate === null || input.examDate.trim() === "") {
          effectiveExamDate = null;
        } else {
          effectiveExamDate = input.examDate.trim();
        }
        const check = validateExamDateForOrder(effectiveExamDate, nowMs);
        if (!check.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: check.reason,
          });
        }
      }

      const [existingSub] = await ctx.db
        .select({ expiresAt: subscription.expiresAt })
        .from(subscription)
        .where(eq(subscription.userId, foundUser.id))
        .limit(1);

      const previousExpiresAtMs = existingSub ? existingSub.expiresAt.getTime() : null;

      const freshExpiresAtMs = computeSubscriptionExpiry({
        planId: subPlanId,
        nowMs,
        currentExpiresAtMs: null,
        examDate: effectiveExamDate,
      });

      const stackedExpirySql =
        subPlanId === "week"
          ? sql`${subscription.expiresAt} + ${7 * DAY_MS}`
          : subPlanId === "month"
            ? sql`${subscription.expiresAt} + ${30 * DAY_MS}`
            : sql`MAX(${subscription.expiresAt}, ${freshExpiresAtMs})`;

      const subUpsertStmt = ctx.db
        .insert(subscription)
        .values({
          userId: foundUser.id,
          planId: subPlanId,
          pointsRemaining: plan.points,
          planPointsTotal: plan.points,
          expiresAt: new Date(freshExpiresAtMs),
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscription.userId,
          set: {
            pointsRemaining: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${subscription.pointsRemaining} + ${plan.points} ELSE ${plan.points} END`,
            planPointsTotal: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${subscription.planPointsTotal} + ${plan.points} ELSE ${plan.points} END`,
            expiresAt: sql`CASE WHEN ${subscription.expiresAt} > ${nowMs} THEN ${stackedExpirySql} ELSE ${freshExpiresAtMs} END`,
            planId: subPlanId,
            updatedAt: now,
          },
        })
        .returning();

      const actionInsertStmt = ctx.db
        .insert(adminUserAction)
        .select((qb) =>
          qb
            .select({
              id: sql<string>`${actionId}`.as("id"),
              userId: subscription.userId,
              action: sql<"grant_plan">`${"grant_plan"}`.as("action"),
              planId: sql<"pack" | "week" | "month" | "exam" | null>`${subPlanId}`.as("plan_id"),
              pointsDelta: sql<number | null>`${plan.points}`.as("points_delta"),
              detailCreditsDelta: sql<number | null>`NULL`.as("detail_credits_delta"),
              previousExpiresAt:
                previousExpiresAtMs !== null
                  ? sql<Date | null>`${previousExpiresAtMs}`.as("previous_expires_at")
                  : sql<Date | null>`NULL`.as("previous_expires_at"),
              newExpiresAt: subscription.expiresAt,
              note: sql<string>`${input.note}`.as("note"),
              actorEmail: sql<string>`${ctx.session.user.email}`.as("actor_email"),
              createdAt: sql<Date>`${nowMs}`.as("created_at"),
            })
            .from(subscription)
            .where(eq(subscription.userId, foundUser.id)),
        )
        .returning();

      const [updatedSubs] = await ctx.db.batch([subUpsertStmt, actionInsertStmt]);
      const updatedSub = updatedSubs?.[0] ?? null;

      return {
        success: true,
        userId: foundUser.id,
        planId: input.planId,
        actionId,
        subscription: updatedSub
          ? {
              userId: updatedSub.userId,
              planId: updatedSub.planId,
              planName: plans[updatedSub.planId].name,
              pointsRemaining: updatedSub.pointsRemaining,
              planPointsTotal: updatedSub.planPointsTotal,
              expiresAt: updatedSub.expiresAt,
              isActive: updatedSub.expiresAt.getTime() > nowMs,
            }
          : null,
        detailCredits: null,
      };
    }),

  adjustQuota: adminProcedure
    .input(adminUsersAdjustQuotaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = resolveNow(ctx.now);
      const nowMs = now.getTime();
      const plans = resolveBillingPlans(ctx.env);

      const [foundUser] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!foundUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy người dùng",
        });
      }

      const actionId = crypto.randomUUID();

      if (input.target === "detail_credit") {
        const actionInsertStmt = ctx.db
          .insert(adminUserAction)
          .select((qb) =>
            qb
              .select({
                id: sql<string>`${actionId}`.as("id"),
                userId: user.id,
                action: sql<"adjust_detail_credit">`${"adjust_detail_credit"}`.as("action"),
                planId: sql<"pack" | "week" | "month" | "exam" | null>`NULL`.as("plan_id"),
                pointsDelta: sql<number | null>`NULL`.as("points_delta"),
                detailCreditsDelta: sql<number | null>`${input.detailCredits} - COALESCE((SELECT ${detailCredit.remaining} FROM ${detailCredit} WHERE ${detailCredit.userId} = ${foundUser.id}), 0)`.as(
                  "detail_credits_delta",
                ),
                previousExpiresAt: sql<Date | null>`NULL`.as("previous_expires_at"),
                newExpiresAt: sql<Date | null>`NULL`.as("new_expires_at"),
                note: sql<string>`${input.note}`.as("note"),
                actorEmail: sql<string>`${ctx.session.user.email}`.as("actor_email"),
                createdAt: sql<Date>`${nowMs}`.as("created_at"),
              })
              .from(user)
              .where(eq(user.id, foundUser.id)),
          )
          .returning({ id: adminUserAction.id });

        const creditUpsertStmt = ctx.db
          .insert(detailCredit)
          .values({
            userId: foundUser.id,
            remaining: input.detailCredits,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: detailCredit.userId,
            set: {
              remaining: input.detailCredits,
              updatedAt: now,
            },
          })
          .returning({ remaining: detailCredit.remaining });

        const [, updatedCredits] = await ctx.db.batch([actionInsertStmt, creditUpsertStmt]);

        return {
          success: true,
          userId: foundUser.id,
          target: input.target,
          actionId,
          subscription: null,
          detailCredits: updatedCredits?.[0]?.remaining ?? input.detailCredits,
        };
      }

      const [existingSub] = await ctx.db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, foundUser.id))
        .limit(1);

      if (!existingSub) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Người dùng chưa có gói đăng ký để điều chỉnh",
        });
      }

      if (input.target === "points") {
        const actionInsertStmt = ctx.db
          .insert(adminUserAction)
          .select((qb) =>
            qb
              .select({
                id: sql<string>`${actionId}`.as("id"),
                userId: subscription.userId,
                action: sql<"adjust_points">`${"adjust_points"}`.as("action"),
                planId: sql<"pack" | "week" | "month" | "exam" | null>`NULL`.as("plan_id"),
                pointsDelta: sql<number | null>`${input.pointsRemaining} - ${subscription.pointsRemaining}`.as(
                  "points_delta",
                ),
                detailCreditsDelta: sql<number | null>`NULL`.as("detail_credits_delta"),
                previousExpiresAt: sql<Date | null>`NULL`.as("previous_expires_at"),
                newExpiresAt: sql<Date | null>`NULL`.as("new_expires_at"),
                note: sql<string>`${input.note}`.as("note"),
                actorEmail: sql<string>`${ctx.session.user.email}`.as("actor_email"),
                createdAt: sql<Date>`${nowMs}`.as("created_at"),
              })
              .from(subscription)
              .where(eq(subscription.userId, foundUser.id)),
          )
          .returning({ id: adminUserAction.id });

        const subUpdateStmt = ctx.db
          .update(subscription)
          .set({
            pointsRemaining: input.pointsRemaining,
            planPointsTotal: sql`MAX(${subscription.planPointsTotal}, ${input.pointsRemaining})`,
            updatedAt: now,
          })
          .where(eq(subscription.userId, foundUser.id))
          .returning();

        const [insertedActions, updatedSubs] = await ctx.db.batch([
          actionInsertStmt,
          subUpdateStmt,
        ]);

        if (!insertedActions || insertedActions.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Người dùng chưa có gói đăng ký để điều chỉnh",
          });
        }

        const updatedSub = updatedSubs?.[0];

        return {
          success: true,
          userId: foundUser.id,
          target: input.target,
          actionId,
          subscription: updatedSub
            ? {
                userId: updatedSub.userId,
                planId: updatedSub.planId,
                planName: plans[updatedSub.planId].name,
                pointsRemaining: updatedSub.pointsRemaining,
                planPointsTotal: updatedSub.planPointsTotal,
                expiresAt: updatedSub.expiresAt,
                isActive: updatedSub.expiresAt.getTime() > nowMs,
              }
            : null,
          detailCredits: null,
        };
      }

      const newExpiresAt = new Date(input.expiresAtMs);
      const actionInsertStmt = ctx.db
        .insert(adminUserAction)
        .select((qb) =>
          qb
            .select({
              id: sql<string>`${actionId}`.as("id"),
              userId: subscription.userId,
              action: sql<"adjust_expiry">`${"adjust_expiry"}`.as("action"),
              planId: sql<"pack" | "week" | "month" | "exam" | null>`NULL`.as("plan_id"),
              pointsDelta: sql<number | null>`NULL`.as("points_delta"),
              detailCreditsDelta: sql<number | null>`NULL`.as("detail_credits_delta"),
              previousExpiresAt: subscription.expiresAt,
              newExpiresAt: sql<Date | null>`${input.expiresAtMs}`.as("new_expires_at"),
              note: sql<string>`${input.note}`.as("note"),
              actorEmail: sql<string>`${ctx.session.user.email}`.as("actor_email"),
              createdAt: sql<Date>`${nowMs}`.as("created_at"),
            })
            .from(subscription)
            .where(eq(subscription.userId, foundUser.id)),
        )
        .returning({ id: adminUserAction.id });

      const subUpdateStmt = ctx.db
        .update(subscription)
        .set({
          expiresAt: newExpiresAt,
          updatedAt: now,
        })
        .where(eq(subscription.userId, foundUser.id))
        .returning();

      const [insertedActions, updatedSubs] = await ctx.db.batch([
        actionInsertStmt,
        subUpdateStmt,
      ]);

      if (!insertedActions || insertedActions.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Người dùng chưa có gói đăng ký để điều chỉnh",
        });
      }

      const updatedSub = updatedSubs?.[0];

      return {
        success: true,
        userId: foundUser.id,
        target: input.target,
        actionId,
        subscription: updatedSub
          ? {
              userId: updatedSub.userId,
              planId: updatedSub.planId,
              planName: plans[updatedSub.planId].name,
              pointsRemaining: updatedSub.pointsRemaining,
              planPointsTotal: updatedSub.planPointsTotal,
              expiresAt: updatedSub.expiresAt,
              isActive: updatedSub.expiresAt.getTime() > nowMs,
            }
          : null,
        detailCredits: null,
      };
    }),
});
