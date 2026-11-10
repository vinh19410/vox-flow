import { getValidQuestionKeysForTopic, MAX_TOTAL_AUDIO_BYTES } from "./forecast-keys";

/** Hard cap for full-topic practice, safe above the largest seeded topic (17 questions). */
export const TOPIC_ANSWER_CAP = 18;
/** Single-question practice: the question itself plus at most its follow-up. */
export const SINGLE_QUESTION_CAP = 2;
/** Attempts without a topic (full mock): static exam, small by construction. */
export const TOPIC_LESS_CAP = 20;

export type AnswerLimitsTopic = { id: string; part: number; questions: string | unknown };
export type AnswerLimitsAnswer = { sizeBytes: number };
export type AnswerLimitViolation = "ANSWER_COUNT_EXCEEDED" | "TOTAL_AUDIO_LIMIT_EXCEEDED";

/**
 * Max answers allowed for this attempt. `topic === null` (row deleted or a
 * topic-less attempt) falls back to the static cap so a missing topic row can
 * never shrink the limit to 0 and brick the attempt.
 */
export function maxAnswersForAttempt(
  attempt: { questionKey: string | null },
  topic: AnswerLimitsTopic | null,
): number {
  if (attempt.questionKey) return SINGLE_QUESTION_CAP;
  if (!topic) return TOPIC_LESS_CAP;
  return Math.min(getValidQuestionKeysForTopic(topic, null).size, TOPIC_ANSWER_CAP);
}

/**
 * The authoritative count/bytes guard, shared by `attempt.submit` and the
 * scoring consumer. The consumer re-runs it so uploads that raced past
 * submit's answer snapshot are never transcribed or graded either.
 * Returns `null` when the recorded answers are within limits.
 */
export function findAnswerLimitViolation(
  attempt: { questionKey: string | null },
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
