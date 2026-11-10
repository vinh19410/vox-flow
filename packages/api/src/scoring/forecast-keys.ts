/**
 * Shared, dependency-free question-key helpers for forecast topics.
 *
 * Consumed by both the web mapper (apps/web) and the server guards
 * (upload route + attempt router) so every side agrees on which question
 * keys belong to a topic. MUST NOT import anything from the DB or server
 * runtime.
 *
 * Key formats:
 * - Part 1 main question:      `${topicId}-${index}`
 * - Part 2 cue card:           `${topicId}-c`
 * - Part 3 question:           `${topicId}-p3-${index}`
 * - Follow-up of any of above: `${key}-f`
 */

export interface ParsedTopicQuestions {
  cueCards: string[];
  part3Questions: string[];
  /** Present when the raw data is a plain question array (Part 1 bank). */
  part1Questions?: string[];
}

const CUE_PREFIX = "[Cue] ";
const PART3_PREFIX = "[Part 3] ";

function parseRawQuestions(questionsRaw: string | unknown): unknown {
  if (typeof questionsRaw !== "string") {
    return questionsRaw;
  }
  try {
    return JSON.parse(questionsRaw) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Normalizes every supported storage shape of topic questions:
 * - JSON string or parsed object `{ cueCards, part3 }` (Part 2/3 bank)
 * - Legacy prefixed array (`[Cue] `, `[Part 3] `)
 * - Plain unprefixed string array: returned as both `part1Questions` and
 *   `cueCards`; the caller resolves the ambiguity via the topic's `part`
 *   (Part 1 -> `part1Questions`, otherwise cue cards only, never Part 3).
 */
export function parseTopicQuestions(questionsRaw: string | unknown): ParsedTopicQuestions {
  const raw = parseRawQuestions(questionsRaw);

  if (Array.isArray(raw)) {
    const strings = raw.map((q) => (typeof q === "string" ? q : String(q)));
    const isLegacy = strings.some(
      (q) => q.startsWith(CUE_PREFIX) || q.startsWith(PART3_PREFIX),
    );
    if (!isLegacy) {
      return { cueCards: strings, part3Questions: [], part1Questions: strings };
    }
    const cueCards: string[] = [];
    const part3Questions: string[] = [];
    for (const q of strings) {
      if (q.startsWith(CUE_PREFIX)) {
        cueCards.push(q.slice(CUE_PREFIX.length));
      } else if (q.startsWith(PART3_PREFIX)) {
        part3Questions.push(q.slice(PART3_PREFIX.length));
      } else {
        cueCards.push(q);
      }
    }
    return { cueCards, part3Questions };
  }

  if (raw && typeof raw === "object" && "cueCards" in raw && "part3" in raw) {
    const obj = raw as { cueCards?: unknown; part3?: unknown };
    return {
      cueCards: Array.isArray(obj.cueCards) ? obj.cueCards.map(String) : [],
      part3Questions: Array.isArray(obj.part3) ? obj.part3.map(String) : [],
    };
  }

  return { cueCards: [], part3Questions: [] };
}

export function part1QuestionKey(topicId: string, index: number): string {
  return `${topicId}-${index}`;
}

export function cueCardKey(topicId: string): string {
  return `${topicId}-c`;
}

export function part3QuestionKey(topicId: string, index: number): string {
  return `${topicId}-p3-${index}`;
}

export function followUpKey(questionKey: string): string {
  return `${questionKey}-f`;
}

/** Total audio bytes a single attempt may accumulate across all answers. */
export const MAX_TOTAL_AUDIO_BYTES = 35 * 1024 * 1024;

/**
 * Every question key accepted for a topic (including follow-ups). When
 * `singleQuestionKey` is provided (single-question practice), only that
 * question and its follow-up are accepted.
 */
export function getValidQuestionKeysForTopic(
  topic: { id: string; part: number; questions: string | unknown },
  singleQuestionKey?: string | null,
): Set<string> {
  if (singleQuestionKey) {
    return new Set([singleQuestionKey, followUpKey(singleQuestionKey)]);
  }

  const parsed = parseTopicQuestions(topic.questions);
  const baseKeys =
    topic.part === 1
      ? (parsed.part1Questions ?? []).map((_, i) => part1QuestionKey(topic.id, i))
      : [
          cueCardKey(topic.id),
          ...parsed.part3Questions.map((_, i) => part3QuestionKey(topic.id, i)),
        ];

  const keys = new Set<string>();
  for (const key of baseKeys) {
    keys.add(key);
    keys.add(followUpKey(key));
  }
  return keys;
}
