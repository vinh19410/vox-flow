import { TRPCError } from "@trpc/server";
import { and, countDistinct, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { forecastReport, forecastTopic } from "@vox-flow/db/schema";
import { protectedProcedure, publicProcedure, router } from "../index";

export const forecastRouter = router({
  listPublished: publicProcedure
    .input(
      z
        .object({
          quarter: z.string().optional(),
          part: z.number().int().min(1).max(3).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(forecastTopic.status, "published")];
      if (input?.quarter) {
        conditions.push(eq(forecastTopic.quarter, input.quarter));
      }
      if (input?.part) {
        conditions.push(eq(forecastTopic.part, input.part));
      }

      const topics = await ctx.db
        .select()
        .from(forecastTopic)
        .where(and(...conditions))
        .orderBy(desc(forecastTopic.createdAt));

      if (topics.length === 0) {
        return [];
      }

      const topicIds = topics.map((t) => t.id);
      const reportCounts = await ctx.db
        .select({
          topicId: forecastReport.topicId,
          count: countDistinct(forecastReport.userId),
        })
        .from(forecastReport)
        .where(inArray(forecastReport.topicId, topicIds))
        .groupBy(forecastReport.topicId);

      const countMap = new Map<string, number>();
      for (const r of reportCounts) {
        countMap.set(r.topicId, Number(r.count));
      }

      return topics.map((t) => {
        let parsedQuestions: string[] = [];
        try {
          parsedQuestions = JSON.parse(t.questions) as string[];
        } catch {
          parsedQuestions = [];
        }

        return {
          id: t.id,
          title: t.title,
          quarter: t.quarter,
          part: t.part,
          questions: parsedQuestions,
          status: t.status,
          realReportCount: countMap.get(t.id) ?? 0,
        };
      });
    }),

  reportTopic: protectedProcedure
    .input(
      z.object({
        topicId: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, input.topicId))
        .limit(1);

      if (topic.length === 0 || topic[0]?.status !== "published") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Published forecast topic not found",
        });
      }

      const existingReport = await ctx.db
        .select()
        .from(forecastReport)
        .where(
          and(
            eq(forecastReport.userId, ctx.session.user.id),
            eq(forecastReport.topicId, input.topicId),
          ),
        )
        .limit(1);

      if (existingReport.length > 0) {
        // Idempotent: user already reported this topic
        return { success: true, alreadyReported: true };
      }

      await ctx.db
        .insert(forecastReport)
        .values({
          id: crypto.randomUUID(),
          topicId: input.topicId,
          userId: ctx.session.user.id,
          notes: input.notes ?? null,
        })
        .onConflictDoNothing();

      return { success: true, alreadyReported: false };
    }),
});
