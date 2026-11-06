import { TRPCError } from "@trpc/server";
import { and, countDistinct, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { forecastReport, forecastTopic } from "@vox-flow/db/schema";
import { protectedProcedure, publicProcedure, router } from "../index";

export type Part23Questions = {
  cueCards: string[];
  part3: string[];
  isNew?: boolean;
};

export type ForecastTopicQuestions = string[] | Part23Questions;

export type PublishedForecastTopic = {
  id: string;
  title: string;
  quarter: string;
  part: number;
  questions: ForecastTopicQuestions;
  isNew: boolean;
  status: string;
  realReportCount: number;
};
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

      const reportCounts = await ctx.db
        .select({
          topicId: forecastReport.topicId,
          count: countDistinct(forecastReport.userId),
        })
        .from(forecastReport)
        .innerJoin(forecastTopic, eq(forecastReport.topicId, forecastTopic.id))
        .where(and(...conditions))
        .groupBy(forecastReport.topicId);

      const countMap = new Map<string, number>();
      for (const r of reportCounts) {
        countMap.set(r.topicId, Number(r.count));
      }

      return topics.map((t) => {
        let parsedQuestions: ForecastTopicQuestions = [];
        let isNew = false;
        try {
          const raw = JSON.parse(t.questions);
          if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            if ("isNew" in raw) {
              isNew = Boolean(raw.isNew);
            }
            if ("cueCards" in raw && "part3" in raw) {
              parsedQuestions = {
                cueCards: Array.isArray(raw.cueCards) ? raw.cueCards.map(String) : [],
                part3: Array.isArray(raw.part3) ? raw.part3.map(String) : [],
                isNew,
              };
            }
          } else if (Array.isArray(raw)) {
            parsedQuestions = raw.map(String);
          } else {
            parsedQuestions = [];
          }
        } catch {
          parsedQuestions = [];
        }

        return {
          id: t.id,
          title: t.title,
          quarter: t.quarter,
          part: t.part,
          questions: parsedQuestions,
          isNew,
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
