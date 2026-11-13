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

/** Client-facing criterion shape returned by `scoring.getResult` (omits `band`/`summary` when locked per D-04). */
export type PublicScoredCriterion = {
  key: CriterionKey;
  band?: number;
  summary?: string;
  evidence: ScoredEvidence[];
  improve: Array<{ from: string; to: string; why: string }>;
};

export type ScoreStatusResult = {
  attemptId: string;
  status: ScoreStatus;
  /** Kept for web backward compatibility: every attempt mode is scored now; `attemptStatus` gates resumability. */
  scorable: boolean;
  /** Lifecycle of the underlying attempt ("Bài thi chưa được chấm điểm" applies only to `submitted`). */
  attemptStatus: "in_progress" | "submitted" | "abandoned";
  /** Manual retries already spent on this attempt (0 without a score row). */
  manualRetries?: number;
  /** False when the learner has exhausted the per-attempt manual retry or daily quota. */
  canRetry?: boolean;
};

export type ScoringResult = {
  attemptId: string;
  topicId: string | null;
  /** Server-side exam mode (`full` / `part1` / `part2` / `part3`); present on every current attempt row. */
  mode?: string;
  overall: number;
  /** Confidence interval `[min, max]` snapped to 0.5 bands from independent grading runs. */
  range: [number, number];
  oneLiner: string;
  /** True when the caller lacks detail entitlement (D-04 server paywall). */
  locked: boolean;
  /** Weakest question identified by `weakestQuestionKey`, or `null` if no answers. */
  weakestQuestionKey: string | null;
  retakeOfAttemptId?: string | null;
  previousOverall?: number | null;
  criteria: PublicScoredCriterion[];
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
