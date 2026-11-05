import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { attempt, scoreDispute } from "@vox-flow/db";
import { protectedProcedure, router } from "../index";

export const submitDisputeInputSchema = z.object({
  attemptId: z.string().min(1),
  targetCriterion: z
    .enum(["ALL", "FC", "LR", "GRA", "PRON"])
    .or(z.literal("P").transform(() => "PRON" as const)),
  expectedBand: z.enum(["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"]),
  previousBand: z.string().optional(),
  reason: z.string().trim().max(1000).optional(),
  shareConsent: z.boolean().default(false),
});

export const getDisputeInputSchema = z.object({
  attemptId: z.string().min(1),
});

export const disputeRouter = router({
  submit: protectedProcedure
    .input(submitDisputeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const isEnabled = ctx.env?.SCORE_DISPUTE_ENABLED === "true";
      if (!isEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt",
        });
      }

      const [targetAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!targetAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy bài thi",
        });
      }

      if (targetAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bạn không có quyền báo lỗi cho bài thi này",
        });
      }

      if (targetAttempt.status !== "submitted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chỉ bài thi đã nộp mới có thể gửi báo lỗi",
        });
      }

      const [activeDispute] = await ctx.db
        .select()
        .from(scoreDispute)
        .where(
          and(
            eq(scoreDispute.attemptId, input.attemptId),
            inArray(scoreDispute.status, ["open", "reviewing"]),
          ),
        )
        .limit(1);

      if (activeDispute) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bài thi này đã có báo lỗi đang được xử lý",
        });
      }

      const disputeId = crypto.randomUUID();
      const now = new Date();
      const dueAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

      try {
        const [inserted] = await ctx.db
          .insert(scoreDispute)
          .values({
            id: disputeId,
            attemptId: input.attemptId,
            userId: ctx.session.user.id,
            targetCriterion: input.targetCriterion,
            expectedBand: input.expectedBand,
            reason: input.reason && input.reason.length > 0 ? input.reason : null,
            shareConsent: input.shareConsent,
            previousBand: input.previousBand ?? null,
            status: "open",
            dueAt,
            createdAt: now,
          })
          .returning();
        if (!inserted) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Không thể lưu báo lỗi",
          });
        }


        return {
          id: inserted.id,
          attemptId: inserted.attemptId,
          targetCriterion: inserted.targetCriterion,
          expectedBand: inserted.expectedBand,
          reason: inserted.reason,
          shareConsent: inserted.shareConsent,
          status: inserted.status,
          dueAt: inserted.dueAt,
          createdAt: inserted.createdAt,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        const msg = String(err);
        if (msg.includes("UNIQUE constraint failed") || msg.includes("score_dispute_active_attempt_unique")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Bài thi này đã có báo lỗi đang được xử lý",
          });
        }
        throw err;
      }
    }),

  get: protectedProcedure
    .input(getDisputeInputSchema)
    .query(async ({ ctx, input }) => {
      const isEnabled = ctx.env?.SCORE_DISPUTE_ENABLED === "true";

      const [targetAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!targetAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy bài thi",
        });
      }

      if (targetAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bạn không có quyền xem thông tin bài thi này",
        });
      }

      const [disputeRecord] = await ctx.db
        .select()
        .from(scoreDispute)
        .where(eq(scoreDispute.attemptId, input.attemptId))
        .orderBy(desc(scoreDispute.createdAt))
        .limit(1);

      return {
        enabled: isEnabled,
        dispute: disputeRecord ?? null,
      };
    }),
});
