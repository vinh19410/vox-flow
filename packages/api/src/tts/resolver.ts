import type { Database } from "@vox-flow/db";
import { forecastTopic } from "@vox-flow/db/schema";
import { eq } from "drizzle-orm";

import {
  cueCardKey,
  parseTopicQuestions,
  part1QuestionKey,
  part3QuestionKey,
} from "../scoring/forecast-keys";
import { MOCK_EXAM_PROMPTS } from "../scoring/mock-exam-bank";
import { type ExaminerVoiceId, PREVIEW_TEXTS } from "./voices";

export function normalizeTtsText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function resolvePreviewTtsText(voice: ExaminerVoiceId): string {
  return PREVIEW_TEXTS[voice];
}

/**
 * Resolves canonical spoken text for a mock exam prompt key.
 * - Main key (`p1-1`, `p2-1`, `p3-1`, ...): `item.text` (for Part 2, only the
 *   opening prompt `item.text` is spoken by the examiner, never bullet points).
 * - Static follow-up key (`${id}-f`): `item.followUp?.text ?? null`.
 * - Unknown key: `null`.
 */
export function resolveMockTtsText(questionKey: string): string | null {
  if (!questionKey) {
    return null;
  }
  if (questionKey.endsWith("-f")) {
    const baseId = questionKey.slice(0, -2);
    const item = MOCK_EXAM_PROMPTS.find((candidate) => candidate.id === baseId);
    const followUp = item?.followUp?.text?.trim();
    return followUp && followUp.length > 0 ? followUp : null;
  }
  const item = MOCK_EXAM_PROMPTS.find((candidate) => candidate.id === questionKey);
  if (!item) {
    return null;
  }
  const trimmed = item.text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type ForecastQuestionDetail = {
  text: string;
  part: 1 | 2 | 3;
};

/**
 * Resolves canonical spoken text and speaking part for a published forecast
 * topic question key. Rejects missing, `draft`, or `archived` topics with `null`.
 */
export async function resolveForecastQuestionDetail(
  db: Database,
  topicId: string,
  questionKey: string,
  options?: { allowArchived?: boolean },
): Promise<ForecastQuestionDetail | null> {
  if (!topicId || !questionKey) {
    return null;
  }

  const rows = await db
    .select({
      id: forecastTopic.id,
      title: forecastTopic.title,
      part: forecastTopic.part,
      questions: forecastTopic.questions,
      status: forecastTopic.status,
    })
    .from(forecastTopic)
    .where(eq(forecastTopic.id, topicId))
    .limit(1);

  const topic = rows[0];
  const allowedStatus =
    topic?.status === "published" || (Boolean(options?.allowArchived) && topic?.status === "archived");
  if (!topic || !allowedStatus) {
    return null;
  }

  const parsed = parseTopicQuestions(topic.questions);

  if (topic.part === 1) {
    const part1Questions = parsed.part1Questions ?? [];
    for (let i = 0; i < part1Questions.length; i++) {
      if (questionKey === part1QuestionKey(topic.id, i)) {
        const text = part1Questions[i]?.trim();
        return text && text.length > 0 ? { text, part: 1 } : null;
      }
    }
    return null;
  }

  if (questionKey === cueCardKey(topic.id)) {
    const title = typeof topic.title === "string" ? topic.title.trim() : "";
    return title.length > 0 ? { text: title, part: 2 } : null;
  }

  for (let i = 0; i < parsed.part3Questions.length; i++) {
    if (questionKey === part3QuestionKey(topic.id, i)) {
      const text = parsed.part3Questions[i]?.trim();
      return text && text.length > 0 ? { text, part: 3 } : null;
    }
  }

  return null;
}

/**
 * Resolves canonical spoken text for a published forecast topic question key.
 * Rejects missing, `draft`, or `archived` topics with `null`.
 */
export async function resolveForecastTtsText(
  db: Database,
  topicId: string,
  questionKey: string,
  options?: { allowArchived?: boolean },
): Promise<string | null> {
  const detail = await resolveForecastQuestionDetail(db, topicId, questionKey, options);
  return detail?.text ?? null;
}

export type TtsCanonicalTarget =
  | { kind: "preview"; voice: ExaminerVoiceId }
  | { kind: "mock"; questionKey: string }
  | { kind: "forecast"; db: Database; topicId: string; questionKey: string };

export async function resolveCanonicalTtsText(target: TtsCanonicalTarget): Promise<string | null> {
  switch (target.kind) {
    case "preview":
      return resolvePreviewTtsText(target.voice);
    case "mock":
      return resolveMockTtsText(target.questionKey);
    case "forecast":
      return resolveForecastTtsText(target.db, target.topicId, target.questionKey);
  }
}

/**
 * Extracts deduplicated non-empty canonical spoken prompts for a forecast topic
 * (used when pre-warming R2 audio across all examiner voices).
 */
export function extractTopicSpokenTexts(topic: {
  title: string;
  part: number;
  questions: string | unknown;
}): string[] {
  const parsed = parseTopicQuestions(topic.questions);
  const rawTexts =
    topic.part === 1
      ? (parsed.part1Questions ?? [])
      : [topic.title, ...parsed.part3Questions];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of rawTexts) {
    if (typeof item !== "string") continue;
    const normalized = normalizeTtsText(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}
