import { TRPCError } from "@trpc/server";
import { and, countDistinct, desc, eq, inArray } from "drizzle-orm";
import { deduplicateAndDraftTopics } from "../forecast/dedupe";
import { z } from "zod";

import { forecastReport, forecastSource, forecastTopic } from "@vox-flow/db/schema";
import { adminProcedure, router } from "../index";

const urlSchema = z
  .string()
  .url()
  .refine((url) => /^https?:\/\//i.test(url), {
    message: "Only HTTP/HTTPS URLs are allowed",
  });

export const forecastAdminRouter = router({
  checkAdmin: adminProcedure.query(() => {
    return { isAdmin: true };
  }),

  listDrafts: adminProcedure
    .input(
      z
        .object({
          quarter: z.string().optional(),
          status: z.enum(["draft", "published", "archived"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input?.quarter) {
        conditions.push(eq(forecastTopic.quarter, input.quarter));
      }
      if (input?.status) {
        conditions.push(eq(forecastTopic.status, input.status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const topics = await ctx.db
        .select()
        .from(forecastTopic)
        .where(whereClause)
        .orderBy(desc(forecastTopic.createdAt));

      const topicIds = topics.map((t) => t.id);
      if (topicIds.length === 0) {
        return [];
      }

      const sources = await ctx.db
        .select()
        .from(forecastSource)
        .where(inArray(forecastSource.topicId, topicIds));

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
        const topicSources = sources.filter((s) => s.topicId === t.id);
        let parsedQuestions: string[] = [];
        try {
          parsedQuestions = JSON.parse(t.questions) as string[];
        } catch {
          parsedQuestions = [];
        }

        return {
          ...t,
          questions: parsedQuestions,
          sources: topicSources,
          realReportCount: countMap.get(t.id) ?? 0,
        };
      });
    }),

  createDraft: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        quarter: z.string().min(1, "Quarter is required"),
        part: z.number().int().min(1).max(3).default(1),
        questions: z.array(z.string()).default([]),
        sources: z
          .array(
            z
              .object({
                sourceType: z.enum(["manual", "student", "web"]),
                sourceUrl: urlSchema.optional(),
                rawContent: z.string().optional(),
              })
              .refine(
                (s) =>
                  s.sourceType !== "web" ||
                  (Boolean(s.sourceUrl) && (s.sourceUrl?.length ?? 0) > 0),
                {
                  message: "sourceUrl is required for web sources",
                },
              ),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newTopicId = crypto.randomUUID();
      const now = new Date();

      await ctx.db.insert(forecastTopic).values({
        id: newTopicId,
        title: input.title,
        quarter: input.quarter,
        part: input.part,
        questions: JSON.stringify(input.questions),
        status: "draft", // ALWAYS draft initially
        createdAt: now,
        updatedAt: now,
      });

      if (input.sources && input.sources.length > 0) {
        await ctx.db.insert(forecastSource).values(
          input.sources.map((s) => ({
            id: crypto.randomUUID(),
            topicId: newTopicId,
            sourceType: s.sourceType,
            sourceUrl: s.sourceUrl ?? null,
            rawContent: s.rawContent ?? null,
            createdAt: now,
          })),
        );
      }

      const created = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, newTopicId))
        .limit(1);
      const topic = created[0];
      if (!topic) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create forecast topic",
        });
      }
      return topic;
    }),

  updateDraft: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        quarter: z.string().optional(),
        part: z.number().int().min(1).max(3).optional(),
        questions: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Forecast topic not found",
        });
      }

      const updates: Partial<typeof forecastTopic.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (input.title !== undefined) updates.title = input.title;
      if (input.quarter !== undefined) updates.quarter = input.quarter;
      if (input.part !== undefined) updates.part = input.part;
      if (input.questions !== undefined) updates.questions = JSON.stringify(input.questions);

      await ctx.db.update(forecastTopic).set(updates).where(eq(forecastTopic.id, input.id));

      const updated = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, input.id))
        .limit(1);
      const topic = updated[0];
      if (!topic) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update forecast topic",
        });
      }
      return topic;
    }),

  publish: adminProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Forecast topic not found",
        });
      }

      const now = new Date();
      // Enforce reviewedBy is extracted from the authenticated admin session
      const reviewerId = ctx.session.user.id;

      await ctx.db
        .update(forecastTopic)
        .set({
          status: "published",
          reviewedBy: reviewerId,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(eq(forecastTopic.id, input.id));

      const updated = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, input.id))
        .limit(1);
      const topic = updated[0];
      if (!topic) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish forecast topic",
        });
      }
      return topic;
    }),

  archive: adminProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Forecast topic not found",
        });
      }

      await ctx.db
        .update(forecastTopic)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(forecastTopic.id, input.id));

      const updated = await ctx.db
        .select()
        .from(forecastTopic)
        .where(eq(forecastTopic.id, input.id))
        .limit(1);
      const topic = updated[0];
      if (!topic) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to archive forecast topic",
        });
      }
      return topic;
    }),

  ingestRawFeed: adminProcedure
    .input(
      z.object({
        items: z.array(
          z
            .object({
              sourceType: z.enum(["manual", "student", "web"]),
              sourceUrl: urlSchema.optional(),
              rawTitle: z.string().min(1),
              rawContent: z.string().optional(),
              questions: z.array(z.string()).default([]),
              quarter: z.string().min(1),
              part: z.number().int().min(1).max(3).default(1),
            })
            .refine(
              (s) =>
                s.sourceType !== "web" ||
                (Boolean(s.sourceUrl) && (s.sourceUrl?.length ?? 0) > 0),
              {
                message: "sourceUrl is required for web sources",
              },
            ),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const draftTopics = await deduplicateAndDraftTopics(input.items);
      const inserted = [];
      const now = new Date();

      for (const draft of draftTopics) {
        const topicId = crypto.randomUUID();
        await ctx.db.insert(forecastTopic).values({
          id: topicId,
          title: draft.title,
          quarter: draft.quarter,
          part: draft.part,
          questions: JSON.stringify(draft.questions),
          status: "draft",
          createdAt: now,
          updatedAt: now,
        });

        if (draft.sources.length > 0) {
          await ctx.db.insert(forecastSource).values(
            draft.sources.map((s) => ({
              id: crypto.randomUUID(),
              topicId,
              sourceType: s.sourceType,
              sourceUrl: s.sourceUrl ?? null,
              rawContent: s.rawContent ?? null,
              createdAt: now,
            })),
          );
        }

        inserted.push({
          id: topicId,
          title: draft.title,
          quarter: draft.quarter,
          part: draft.part,
          status: "draft",
        });
      }

      return {
        processed: input.items.length,
        createdDrafts: inserted.length,
        drafts: inserted,
      };
    }),
});
