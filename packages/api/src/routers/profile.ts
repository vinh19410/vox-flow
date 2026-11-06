import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { userProfile } from "@vox-flow/db/schema";
import { protectedProcedure, router } from "../index";

export const VALID_BANDS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0] as const;

export const upsertProfileSchema = z.object({
  targetBand: z
    .number()
    .refine((b) => VALID_BANDS.includes(b as (typeof VALID_BANDS)[number]), {
      message: "Target band must be between 5.0 and 9.0 in 0.5 increments",
    }),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .nullable()
    .optional()
    .refine(
      (d) => {
        if (!d) return true;
        const parsed = Date.parse(`${d}T00:00:00Z`);
        if (Number.isNaN(parsed)) return false;
        const dateObj = new Date(parsed);
        const isoDate = dateObj.toISOString().slice(0, 10);
        if (isoDate !== d) return false;

        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, "0");
        const day = String(now.getUTCDate()).padStart(2, "0");
        const todayUtc = `${y}-${m}-${day}`;
        return d >= todayUtc;
      },
      { message: "Exam date must be a valid calendar date and cannot be in the past" },
    ),
});

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const rows = await ctx.db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    return rows[0] ?? null;
  }),

  upsert: protectedProcedure
    .input(upsertProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { targetBand, examDate } = input;

      await ctx.db
        .insert(userProfile)
        .values({
          userId,
          targetBand,
          examDate: examDate ?? null,
        })
        .onConflictDoUpdate({
          target: userProfile.userId,
          set: {
            targetBand,
            examDate: examDate ?? null,
            updatedAt: new Date(),
          },
        });

      const updated = await ctx.db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId))
        .limit(1);

      if (!updated[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to persist profile",
        });
      }

      return updated[0];
    }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const existing = await ctx.db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    const userRow = existing[0];
    if (!userRow || userRow.targetBand == null) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Target band must be set before completing onboarding",
      });
    }

    if (userRow.onboardedAt) {
      return userRow;
    }
    const now = new Date();
    await ctx.db
      .update(userProfile)
      .set({
        onboardedAt: now,
        updatedAt: now,
      })
      .where(eq(userProfile.userId, userId));

    const updated = await ctx.db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    if (!updated[0]) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete onboarding",
      });
    }

    return updated[0];
  }),
});
