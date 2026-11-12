import { TRPCError } from "@trpc/server";
import { and, countDistinct, desc, eq } from "drizzle-orm";
import { deduplicateAndDraftTopics } from "../forecast/dedupe";
import { z } from "zod";

import { forecastReport, forecastSource, forecastTopic } from "@vox-flow/db/schema";
import type { Context } from "../context";
import { adminProcedure, router } from "../index";
import { prewarmTopicAudio } from "../tts";

function scheduleTopicAudioPrewarm(
  ctx: Context,
  topic: { title: string; part: number; questions: string | unknown },
) {
  const bucket = ctx.env?.AUDIO_BUCKET;
  if (!bucket) {
    return;
  }
  const promise = prewarmTopicAudio({
    topic,
    bucket,
    env: ctx.env,
  }).catch(() => {});
  if (ctx.waitUntil) {
    ctx.waitUntil(promise);
  } else {
    void promise;
  }
}

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
        .select({
          id: forecastSource.id,
          topicId: forecastSource.topicId,
          sourceType: forecastSource.sourceType,
          sourceUrl: forecastSource.sourceUrl,
          rawContent: forecastSource.rawContent,
          createdAt: forecastSource.createdAt,
        })
        .from(forecastSource)
        .innerJoin(forecastTopic, eq(forecastSource.topicId, forecastTopic.id))
        .where(whereClause);

      const reportCounts = await ctx.db
        .select({
          topicId: forecastReport.topicId,
          count: countDistinct(forecastReport.userId),
        })
        .from(forecastReport)
        .innerJoin(forecastTopic, eq(forecastReport.topicId, forecastTopic.id))
        .where(whereClause)
        .groupBy(forecastReport.topicId);

      const countMap = new Map<string, number>();
      for (const r of reportCounts) {
        countMap.set(r.topicId, Number(r.count));
      }

      return topics.map((t) => {
        const topicSources = sources.filter((s) => s.topicId === t.id);
        let parsedQuestions: string[] = [];
        try {
          const raw = JSON.parse(t.questions);
          if (raw && typeof raw === "object" && !Array.isArray(raw) && "cueCards" in raw && "part3" in raw) {
            const cue = Array.isArray(raw.cueCards) ? raw.cueCards.map((c: unknown) => `[Cue] ${c}`) : [];
            const p3 = Array.isArray(raw.part3) ? raw.part3.map((q: unknown) => `[Part 3] ${q}`) : [];
            parsedQuestions = [...cue, ...p3];
          } else if (Array.isArray(raw)) {
            parsedQuestions = raw.map(String);
          } else {
            parsedQuestions = [];
          }
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

      let serializedQuestions = JSON.stringify(input.questions);
      if (input.part === 2) {
        const cueCards: string[] = [];
        const part3: string[] = [];
        for (const q of input.questions) {
          if (q.startsWith("[Cue] ")) {
            cueCards.push(q.slice(6));
          } else if (q.startsWith("[Part 3] ")) {
            part3.push(q.slice(9));
          } else {
            cueCards.push(q);
          }
        }
        if (cueCards.length > 0 || part3.length > 0) {
          serializedQuestions = JSON.stringify({ cueCards, part3 });
        }
      }

      await ctx.db.insert(forecastTopic).values({
        id: newTopicId,
        title: input.title,
        quarter: input.quarter,
        part: input.part,
        questions: serializedQuestions,
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
      if (input.questions !== undefined) {
        const targetPart = input.part ?? existing[0]?.part ?? 1;
        if (targetPart === 2) {
          let isNew = false;
          try {
            const parsedExisting = JSON.parse(existing[0]?.questions ?? "{}");
            if (parsedExisting && typeof parsedExisting === "object" && "isNew" in parsedExisting) {
              isNew = Boolean(parsedExisting.isNew);
            }
          } catch {
            isNew = false;
          }

          const cueCards: string[] = [];
          const part3: string[] = [];
          for (const q of input.questions) {
            if (q.startsWith("[Cue] ")) {
              cueCards.push(q.slice(6));
            } else if (q.startsWith("[Part 3] ")) {
              part3.push(q.slice(9));
            } else {
              cueCards.push(q);
            }
          }
          if (cueCards.length > 0 || part3.length > 0) {
            updates.questions = JSON.stringify({ cueCards, part3, isNew });
          } else {
            updates.questions = JSON.stringify(input.questions);
          }
        } else {
          updates.questions = JSON.stringify(input.questions);
        }
      }

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
      if (
        topic.status === "published" &&
        (input.questions !== undefined || input.title !== undefined)
      ) {
        scheduleTopicAudioPrewarm(ctx, topic);
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
      scheduleTopicAudioPrewarm(ctx, topic);
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
