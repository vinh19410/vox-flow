import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@vox-flow/db";
import { consentEvent } from "@vox-flow/db/schema";
import { exportUserData } from "../data-registry";
import { protectedProcedure, router } from "../index";
export async function requireConsent(db: Database, userId: string) {
  const saveEvents = await db
    .select()
    .from(consentEvent)
    .where(and(eq(consentEvent.userId, userId), eq(consentEvent.kind, "save")))
    .orderBy(desc(consentEvent.createdAt))
    .limit(1);

  if (saveEvents.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Consent required: user has not completed consent step",
    });
  }

  const calibrationEvents = await db
    .select()
    .from(consentEvent)
    .where(and(eq(consentEvent.userId, userId), eq(consentEvent.kind, "calibration")))
    .orderBy(desc(consentEvent.createdAt))
    .limit(1);

  return {
    save: Boolean(saveEvents[0]?.granted),
    calibration: Boolean(calibrationEvents[0]?.granted),
  };
}

export const setConsentInputSchema = z.union([
  z.object({
    kind: z.enum(["save", "calibration"]),
    granted: z.boolean(),
    policyVersion: z.string().optional(),
  }),
  z
    .object({
      save: z.boolean().optional(),
      calibration: z.boolean().optional(),
      train: z.boolean().optional(),
      policyVersion: z.string().optional(),
    })
    .refine(
      (data) =>
        typeof data.save === "boolean" ||
        typeof data.calibration === "boolean" ||
        typeof data.train === "boolean",
      { message: "At least one consent setting (save, calibration, or train) must be provided" },
    ),
]);

export const privacyRouter = router({
  getConsent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const saveEvents = await ctx.db
      .select()
      .from(consentEvent)
      .where(and(eq(consentEvent.userId, userId), eq(consentEvent.kind, "save")))
      .orderBy(desc(consentEvent.createdAt))
      .limit(1);

    const calibrationEvents = await ctx.db
      .select()
      .from(consentEvent)
      .where(and(eq(consentEvent.userId, userId), eq(consentEvent.kind, "calibration")))
      .orderBy(desc(consentEvent.createdAt))
      .limit(1);

    const saveGranted = Boolean(saveEvents[0]?.granted);
    const calibrationGranted = Boolean(calibrationEvents[0]?.granted);

    return {
      save: saveGranted,
      calibration: calibrationGranted,
      train: calibrationGranted,
      hasAnswered: saveEvents.length > 0,
    };
  }),

  setConsent: protectedProcedure
    .input(setConsentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const policyVersion = input.policyVersion ?? "v1";

      if ("kind" in input) {
        await ctx.db.insert(consentEvent).values({
          userId,
          kind: input.kind,
          granted: input.granted,
          policyVersion,
        });
      } else {
        if (typeof input.save === "boolean") {
          await ctx.db.insert(consentEvent).values({
            userId,
            kind: "save",
            granted: input.save,
            policyVersion,
          });
        }
        const calib = input.calibration ?? input.train;
        if (typeof calib === "boolean") {
          await ctx.db.insert(consentEvent).values({
            userId,
            kind: "calibration",
            granted: calib,
            policyVersion,
          });
        }
      }

      return { success: true };
    }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return exportUserData(ctx.db, userId);
  }),
});
