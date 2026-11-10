import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import type { ScoreStatusResult, ScoringResult } from "../scoring/types";

const attemptInput = z.object({ attemptId: z.string().min(1) });

// Contract stub: the backend implementation replaces these bodies without
// changing names, inputs or return types.
export const scoringRouter = router({
  status: protectedProcedure.input(attemptInput).query(async (): Promise<ScoreStatusResult> => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED" });
  }),
  retry: protectedProcedure.input(attemptInput).mutation(async (): Promise<ScoreStatusResult> => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED" });
  }),
  getResult: protectedProcedure.input(attemptInput).query(async (): Promise<ScoringResult | null> => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED" });
  }),
});
