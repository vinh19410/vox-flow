import { getValidQuestionKeysForTopic, MAX_TOTAL_AUDIO_BYTES } from "./forecast-keys";
import { getValidMockQuestionKeys } from "./mock-exam-bank";

/** Hard cap for full-topic practice, safe above the largest seeded topic (17 questions). */
export const TOPIC_ANSWER_CAP = 18;
/** Single-question practice: the question itself plus at most its follow-up. */
export const SINGLE_QUESTION_CAP = 2;
/**
 * Fallback for a forecast attempt whose `forecast_topic` row was deleted, so a
 * missing topic row can never shrink the limit to 0 and brick the attempt.
 * Topic-less (mock) attempts no longer use this: their cap is the mode's
 * key-set size, which also fails closed for unknown modes (cap 0).
 */
export const TOPIC_LESS_CAP = 20;

export type AnswerLimitsTopic = { id: string; part: number; questions: string | unknown };
/** The slice of the attempt row the count guard needs (`mode` only matters when `topicId` is null). */
export type AnswerLimitsAttempt = {
  mode?: string;
  topicId?: string | null;
  questionKey: string | null;
  retakeOfAttemptId?: string | null;
};
export type AnswerLimitsAnswer = { sizeBytes: number };
export type AnswerLimitViolation = "ANSWER_COUNT_EXCEEDED" | "TOTAL_AUDIO_LIMIT_EXCEEDED";

/**
 * Max answers allowed for this attempt. Single-question practice caps at 2. A
 * topic attempt caps at its topic's valid key count (deleted topic row falls
 * back to `TOPIC_LESS_CAP`). A topic-less (mock) attempt caps at its mode's
 * mock key-set size — 8/4/1/3 — with unknown modes capped at 0 (fail-closed).
 */
export function maxAnswersForAttempt(attempt: AnswerLimitsAttempt, topic: AnswerLimitsTopic | null): number {
  if (attempt.retakeOfAttemptId) return 1;
  if (attempt.questionKey) return SINGLE_QUESTION_CAP;
  if (attempt.topicId) {
    if (!topic) return TOPIC_LESS_CAP;
    return Math.min(getValidQuestionKeysForTopic(topic, null).size, TOPIC_ANSWER_CAP);
  }
  const validMock = attempt.mode ? getValidMockQuestionKeys(attempt.mode) : new Set<string>();
  return validMock.size;
}

/**
 * The authoritative count/bytes guard, shared by `attempt.submit` and the
 * scoring consumer. The consumer re-runs it so uploads that raced past
 * submit's answer snapshot are never transcribed or graded either.
 * Returns `null` when the recorded answers are within limits.
 */
export function findAnswerLimitViolation(
  attempt: AnswerLimitsAttempt,
  topic: AnswerLimitsTopic | null,
  answers: AnswerLimitsAnswer[],
): AnswerLimitViolation | null {
  if (answers.length > maxAnswersForAttempt(attempt, topic)) {
    return "ANSWER_COUNT_EXCEEDED";
  }
  const totalBytes = answers.reduce((sum, a) => sum + a.sizeBytes, 0);
  if (totalBytes > MAX_TOTAL_AUDIO_BYTES) {
    return "TOTAL_AUDIO_LIMIT_EXCEEDED";
  }
  return null;
}
