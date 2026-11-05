import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { attempt, attemptAnswer } from "@vox-flow/db";
import { protectedProcedure, router } from "../index";
import { requireExamConsent } from "../exam/consent";
import { generateFollowUp } from "../exam/follow-up";
import { buildAudioKey, normalizeMimeType, QUESTION_KEY_RE } from "../audio";
export const attemptRouter = router({
  start: protectedProcedure
    .input(
      z
        .object({
          mode: z.enum(["full", "part1", "part2", "part3"]).default("full"),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const mode = input?.mode ?? "full";

      // Launch gate check: LAUNCH_OPEN === 'true' or email in LAUNCH_ALLOWED_EMAILS
      const isLaunchOpen = ctx.env?.LAUNCH_OPEN === "true";
      const allowedEmails = (ctx.env?.LAUNCH_ALLOWED_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const userEmail = ctx.session.user.email?.toLowerCase();
      const isEmailAllowed = Boolean(userEmail && allowedEmails.includes(userEmail));

      if (!isLaunchOpen && !isEmailAllowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Mock exam is currently restricted to pilot candidates.",
        });
      }

      const consent = await requireExamConsent(ctx.db, ctx.session.user.id);
      const attemptId = crypto.randomUUID();
      const startedAt = new Date();

      await ctx.db.insert(attempt).values({
        id: attemptId,
        userId: ctx.session.user.id,
        mode,
        status: "in_progress",
        inHistory: consent.inHistory,
        calibrationGranted: consent.calibrationGranted,
        startedAt,
      });

      return {
        attemptId,
        mode,
        inHistory: consent.inHistory,
        calibrationGranted: consent.calibrationGranted,
        startedAt,
      };
    }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    const [active] = await ctx.db
      .select()
      .from(attempt)
      .where(
        and(
          eq(attempt.userId, ctx.session.user.id),
          eq(attempt.status, "in_progress"),
        ),
      )
      .orderBy(desc(attempt.startedAt))
      .limit(1);

    if (!active) {
      return null;
    }

    const answers = await ctx.db
      .select()
      .from(attemptAnswer)
      .where(eq(attemptAnswer.attemptId, active.id))
      .orderBy(asc(attemptAnswer.orderIndex));

    return {
      attempt: active,
      answers,
    };
  }),

  uploadAnswer: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        questionKey: z.string().regex(QUESTION_KEY_RE, "Invalid questionKey format"),
        questionText: z.string(),
        partNumber: z.number(),
        orderIndex: z.number(),
        durationMs: z.number(),
        mimeType: z
          .string()
          .refine((val) => normalizeMimeType(val) !== null, {
            message: "Invalid or unsupported audio mimeType",
          })
          .transform((val) => normalizeMimeType(val)!),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!currentAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found",
        });
      }

      if (currentAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to upload answers for this attempt",
        });
      }

      if (currentAttempt.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot upload answer to a finalized attempt",
        });
      }

      const answerId = crypto.randomUUID();
      const audioKey = buildAudioKey(
        ctx.session.user.id,
        input.attemptId,
        input.questionKey,
        input.mimeType,
      );

      await ctx.db
        .insert(attemptAnswer)
        .values({
          id: answerId,
          attemptId: input.attemptId,
          questionKey: input.questionKey,
          questionText: input.questionText,
          partNumber: input.partNumber,
          orderIndex: input.orderIndex,
          audioKey,
          durationMs: input.durationMs,
          mimeType: input.mimeType,
        })
        .onConflictDoUpdate({
          target: [attemptAnswer.attemptId, attemptAnswer.questionKey],
          set: {
            questionText: input.questionText,
            partNumber: input.partNumber,
            orderIndex: input.orderIndex,
            audioKey,
            durationMs: input.durationMs,
            mimeType: input.mimeType,
          },
        });

      return {
        success: true,
        answerId,
        attemptId: input.attemptId,
        questionKey: input.questionKey,
      };
    }),

  getFollowUp: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        questionKey: z.string(),
        part: z.number().default(1),
        candidateTranscript: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!currentAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found",
        });
      }

      if (currentAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this attempt",
        });
      }

      const result = await generateFollowUp({
        candidateTranscript: input.candidateTranscript,
        part: input.part,
        apiKey: ctx.env?.OPENAI_API_KEY ?? ctx.env?.ANTHROPIC_API_KEY,
      });

      return {
        followUpQuestion: {
          key: `${input.questionKey}-f`,
          part: input.part,
          text: result.questionText,
          trigger: result.triggerPhrase,
        },
      };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentAttempt] = await ctx.db
        .select()
        .from(attempt)
        .where(eq(attempt.id, input.attemptId))
        .limit(1);

      if (!currentAttempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found",
        });
      }

      if (currentAttempt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to submit this attempt",
        });
      }

      if (currentAttempt.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Attempt is already submitted or abandoned",
        });
      }

      const submittedAt = new Date();
      await ctx.db
        .update(attempt)
        .set({
          status: "submitted",
          submittedAt,
        })
        .where(eq(attempt.id, input.attemptId));

      return {
        success: true,
        attemptId: input.attemptId,
        status: "submitted",
        submittedAt,
      };
    }),
});
