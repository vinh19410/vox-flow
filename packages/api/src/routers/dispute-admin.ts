import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { attempt, attemptAnswer, scoreDispute, user } from "@vox-flow/db";
import { adminProcedure, router } from "../index";

export const resolveDisputeInputSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["resolved", "rejected"]),
  resolvedBand: z.enum(["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"]).optional(),
  previousBand: z.string().optional(),
  replyText: z.string().trim().min(1, "Nội dung trả lời không được để trống"),
});

export const getDisputeCaseInputSchema = z.object({
  id: z.string().min(1),
});

export const disputeQueueInputSchema = z
  .object({
    status: z.enum(["all", "open", "resolved"]).default("all"),
  })
  .optional();

export interface DisputeQueueItem {
  id: string;
  attemptId: string;
  userId: string;
  studentName?: string | null;
  studentEmail?: string | null;
  targetCriterion: string;
  expectedBand: string;
  reason?: string | null;
  shareConsent: boolean;
  status: "open" | "reviewing" | "resolved" | "rejected";
  dueAt: Date;
  warnedAt?: Date | null;
  resolvedAt?: Date | null;
  previousBand?: string | null;
  resolvedBand?: string | null;
  replyText?: string | null;
  createdAt: Date;
  isNearOverdue: boolean;
  isOverdue: boolean;
}

export interface DisputeCaseResponse {
  dispute: {
    id: string;
    attemptId: string;
    userId: string;
    studentName?: string | null;
    studentEmail?: string | null;
    targetCriterion: string;
    expectedBand: string;
    reason?: string | null;
    shareConsent: boolean;
    status: string;
    dueAt: Date;
    warnedAt?: Date | null;
    resolvedAt?: Date | null;
    previousBand?: string | null;
    resolvedBand?: string | null;
    replyText?: string | null;
    createdAt: Date;
  };
  attempt: {
    id: string;
    mode: string;
    status: string;
    startedAt: Date;
    submittedAt?: Date | null;
  } | null;
  answers: Array<{
    id: string;
    questionKey: string;
    questionText: string;
    partNumber: number;
    orderIndex: number;
    durationMs: number;
    mimeType: string;
    createdAt: Date;
    audioPlayable: boolean;
    audioUrl: string | null;
  }>;
}

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

export const disputeAdminRouter = router({
  checkAdmin: adminProcedure.query(() => {
    return { isAdmin: true };
  }),

  queue: adminProcedure
    .input(disputeQueueInputSchema)
    .query(async ({ ctx, input }) => {
      const filter = input?.status ?? "all";
      const now = resolveNow(ctx.now);

      let statusCondition;
      if (filter === "open") {
        statusCondition = inArray(scoreDispute.status, ["open", "reviewing"]);
      } else if (filter === "resolved") {
        statusCondition = inArray(scoreDispute.status, ["resolved", "rejected"]);
      }

      const rows = await ctx.db
        .select({
          id: scoreDispute.id,
          attemptId: scoreDispute.attemptId,
          userId: scoreDispute.userId,
          studentName: user.name,
          studentEmail: user.email,
          targetCriterion: scoreDispute.targetCriterion,
          expectedBand: scoreDispute.expectedBand,
          reason: scoreDispute.reason,
          shareConsent: scoreDispute.shareConsent,
          status: scoreDispute.status,
          dueAt: scoreDispute.dueAt,
          warnedAt: scoreDispute.warnedAt,
          resolvedAt: scoreDispute.resolvedAt,
          previousBand: scoreDispute.previousBand,
          resolvedBand: scoreDispute.resolvedBand,
          replyText: scoreDispute.replyText,
          createdAt: scoreDispute.createdAt,
        })
        .from(scoreDispute)
        .leftJoin(user, eq(scoreDispute.userId, user.id))
        .where(statusCondition)
        .orderBy(asc(scoreDispute.dueAt));

      return rows.map((r) => {
        const isResolved = Boolean(r.resolvedAt) || r.status === "resolved" || r.status === "rejected";
        const isNearOverdue =
          !isResolved &&
          (Boolean(r.warnedAt) || r.dueAt.getTime() - now.getTime() < 12 * 3600 * 1000);
        const isOverdue = !isResolved && r.dueAt.getTime() < now.getTime();

        return {
          ...r,
          shareConsent: Boolean(r.shareConsent),
          isNearOverdue,
          isOverdue,
        };
      });
    }),

  getCase: adminProcedure
    .input(getDisputeCaseInputSchema)
    .query(async ({ ctx, input }) => {
      const [disputeRecord] = await ctx.db
        .select({
          id: scoreDispute.id,
          attemptId: scoreDispute.attemptId,
          userId: scoreDispute.userId,
          studentName: user.name,
          studentEmail: user.email,
          targetCriterion: scoreDispute.targetCriterion,
          expectedBand: scoreDispute.expectedBand,
          reason: scoreDispute.reason,
          shareConsent: scoreDispute.shareConsent,
          status: scoreDispute.status,
          dueAt: scoreDispute.dueAt,
          warnedAt: scoreDispute.warnedAt,
          resolvedAt: scoreDispute.resolvedAt,
          previousBand: scoreDispute.previousBand,
          resolvedBand: scoreDispute.resolvedBand,
          replyText: scoreDispute.replyText,
          createdAt: scoreDispute.createdAt,
        })
        .from(scoreDispute)
        .leftJoin(user, eq(scoreDispute.userId, user.id))
        .where(eq(scoreDispute.id, input.id))
        .limit(1);

      if (!disputeRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy hồ sơ khiếu nại",
        });
      }

      const [attemptRecord] = await ctx.db
        .select({
          id: attempt.id,
          mode: attempt.mode,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
        })
        .from(attempt)
        .where(eq(attempt.id, disputeRecord.attemptId))
        .limit(1);

      const answers = await ctx.db
        .select({
          id: attemptAnswer.id,
          questionKey: attemptAnswer.questionKey,
          questionText: attemptAnswer.questionText,
          partNumber: attemptAnswer.partNumber,
          orderIndex: attemptAnswer.orderIndex,
          durationMs: attemptAnswer.durationMs,
          mimeType: attemptAnswer.mimeType,
          createdAt: attemptAnswer.createdAt,
        })
        .from(attemptAnswer)
        .where(eq(attemptAnswer.attemptId, disputeRecord.attemptId))
        .orderBy(asc(attemptAnswer.orderIndex));

      const hasAudioConsent = Boolean(disputeRecord.shareConsent);

      return {
        dispute: {
          ...disputeRecord,
          shareConsent: hasAudioConsent,
        },
        attempt: attemptRecord ?? null,
        answers: answers.map((ans) => ({
          ...ans,
          audioPlayable: hasAudioConsent,
          audioUrl: hasAudioConsent
            ? `/api/attempts/${disputeRecord.attemptId}/answers/${ans.id}/audio`
            : null,
        })),
      };
    }),

  resolve: adminProcedure
    .input(resolveDisputeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(scoreDispute)
        .where(eq(scoreDispute.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy hồ sơ khiếu nại",
        });
      }

      if (existing.status === "resolved" || existing.status === "rejected") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Báo lỗi này đã được xử lý trước đó",
        });
      }

      if (input.status === "resolved" && !input.resolvedBand) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vui lòng chọn band điểm cập nhật khi chấp nhận khiếu nại",
        });
      }

      const now = resolveNow(ctx.now);
      const updated = await ctx.db
        .update(scoreDispute)
        .set({
          status: input.status,
          resolvedBand: input.status === "resolved" ? input.resolvedBand : null,
          previousBand: input.previousBand ?? existing.previousBand ?? null,
          replyText: input.replyText,
          resolvedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(scoreDispute.id, input.id),
            inArray(scoreDispute.status, ["open", "reviewing"]),
          ),
        )
        .returning();

      if (updated.length === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Báo lỗi này đã được xử lý bởi người khác",
        });
      }

      return {
        success: true,
        dispute: updated[0]!,
      };
    }),

  metrics: adminProcedure.query(async ({ ctx }) => {
    const allDisputes = await ctx.db.select().from(scoreDispute);
    const now = resolveNow(ctx.now);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const totalCount = allDisputes.length;
    let openCount = 0;
    let resolvedCount = 0;
    let onTimeResolvedCount = 0;
    let weeklyCount = 0;
    let nearOverdueCount = 0;

    for (const d of allDisputes) {
      const isResolved = d.status === "resolved" || d.status === "rejected";
      if (isResolved) {
        resolvedCount++;
        const resolvedTime = d.resolvedAt ? d.resolvedAt.getTime() : 0;
        const dueTime = d.dueAt.getTime();
        if (resolvedTime <= dueTime) {
          onTimeResolvedCount++;
        }
      } else {
        openCount++;
        if (Boolean(d.warnedAt) || d.dueAt.getTime() - now.getTime() < 12 * 3600 * 1000) {
          nearOverdueCount++;
        }
      }

      if (d.createdAt.getTime() >= oneWeekAgo.getTime()) {
        weeklyCount++;
      }
    }

    const onTimeRate =
      resolvedCount > 0
        ? Math.round((onTimeResolvedCount / resolvedCount) * 1000) / 10
        : 100;

    return {
      totalCount,
      openCount,
      resolvedCount,
      onTimeRate,
      weeklyCount,
      nearOverdueCount,
    };
  }),
});
