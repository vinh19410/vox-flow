import { z } from "zod";

/** Shared contract between the scoring pipeline, the `scoring` router and the web app. */

export const CRITERION_KEYS = ["FC", "LR", "GRA", "P"] as const;
export type CriterionKey = (typeof CRITERION_KEYS)[number];

export const scoreStatusSchema = z.enum(["not_scored", "queued", "processing", "done", "failed"]);
export type ScoreStatus = z.infer<typeof scoreStatusSchema>;

export const scoredEvidenceSchema = z.object({
  /** Verbatim substring of the answer transcript identified by questionKey. */
  quote: z.string(),
  questionKey: z.string(),
  /** Human label of where the quote comes from, e.g. "Part 1 · Câu 2". */
  where: z.string(),
  kind: z.enum(["plus", "minus"]),
  note: z.string(),
});
export type ScoredEvidence = z.infer<typeof scoredEvidenceSchema>;

export const scoredCriterionSchema = z.object({
  key: z.enum(CRITERION_KEYS),
  band: z.number(),
  summary: z.string(),
  evidence: z.array(scoredEvidenceSchema),
  improve: z.array(z.object({ from: z.string(), to: z.string(), why: z.string() })),
});
export type ScoredCriterion = z.infer<typeof scoredCriterionSchema>;

export type ScoreStatusResult = {
  attemptId: string;
  status: ScoreStatus;
  /** False when the attempt's mode is not scored (e.g. full mock exam in this beta). */
  scorable: boolean;
};

export type ScoringResult = {
  attemptId: string;
  topicId: string | null;
  overall: number;
  oneLiner: string;
  criteria: ScoredCriterion[];
  answers: Array<{
    questionKey: string;
    questionText: string;
    partNumber: number;
    durationMs: number;
    transcript: string;
  }>;
  scoredAt: number;
};

/** Message body sent to the scoring queue. */
export type ScoringQueueMessage = { attemptId: string };
