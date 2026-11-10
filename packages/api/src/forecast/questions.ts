/**
 * Shared parsing + canonical lookup for `forecast_topic.questions`.
 *
 * Used by `routers/forecast.ts` (listPublished) and the scoring pipeline.
 * `routers/forecast-admin.ts` intentionally keeps its own formatting: it maps
 * parsed questions back to legacy `[Cue] `/`[Part 3] ` strings for the admin
 * UI, a display shape this module must not know about.
 */

export type ForecastTopicQuestionsShape =
  | string[]
  | { cueCards: string[]; part3: string[]; isNew?: boolean };

export type CanonicalQuestionTopic = {
  id: string;
  title: string;
  part: number;
  questions: ForecastTopicQuestionsShape;
};

/**
 * Parses the `forecast_topic.questions` JSON column. Mirrors the historical
 * `listPublished` behavior exactly: no `[Cue] `/`[Part 3] ` marker sniffing
 * (that is a web-client display concern), and `isNew` is read from any object
 * payload, even one without `cueCards`/`part3`.
 */
export function parseForecastTopicQuestions(rawJson: string): {
  questions: ForecastTopicQuestionsShape;
  isNew: boolean;
} {
  let questions: ForecastTopicQuestionsShape = [];
  let isNew = false;
  try {
    const raw: unknown = JSON.parse(rawJson);
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const obj = raw as Record<string, unknown>;
      if ("isNew" in obj) {
        isNew = Boolean(obj.isNew);
      }
      if ("cueCards" in obj && "part3" in obj) {
        questions = {
          cueCards: Array.isArray(obj.cueCards) ? obj.cueCards.map(String) : [],
          part3: Array.isArray(obj.part3) ? obj.part3.map(String) : [],
          // Historical shape: listPublished embeds isNew in the questions
          // object too, and the web client reads it from there as a fallback.
          isNew,
        };
      }
    } else if (Array.isArray(raw)) {
      questions = raw.map(String);
    }
  } catch {
    questions = [];
  }
  return { questions, isNew };
}

/**
 * Resolves the canonical server-side question text for a learner answer key.
 *
 * Client keys are deterministic: part 1 is `${topicId}-${i}` (index into the
 * questions array), part 2 cue card is `${topicId}-c` (the topic title), and
 * part 3 is `${topicId}-p3-${i}` (index into `part3`). Keys that do not name a
 * real slot of this topic — junk keys, other topics' prefixes, follow-up
 * `-f` keys, out-of-range indexes, legacy plain arrays on part 2+ topics —
 * return `null`. Callers must treat `null` as "no server-side text": use a
 * neutral placeholder, never the client-supplied `questionText`.
 */
export function resolveCanonicalQuestionText(
  topic: CanonicalQuestionTopic,
  key: string,
): string | null {
  const prefix = `${topic.id}-`;
  if (!key.startsWith(prefix)) {
    return null;
  }
  const suffix = key.slice(prefix.length);

  if (Array.isArray(topic.questions)) {
    if (topic.part !== 1) {
      return null;
    }
    const match = /^(\d+)$/.exec(suffix);
    if (!match) {
      return null;
    }
    const text = topic.questions[Number(match[1])];
    // Blank bank entries are bad data, not a question: the caller's
    // placeholder path is more honest than an empty <question_text> block.
    return typeof text === "string" && text.trim() ? text : null;
  }

  if (topic.part < 2) {
    return null;
  }
  if (suffix === "c") {
    return topic.title.trim() ? topic.title : null;
  }
  const match = /^p3-(\d+)$/.exec(suffix);
  if (!match) {
    return null;
  }
  const text = topic.questions.part3[Number(match[1])];
  return typeof text === "string" && text.trim() ? text : null;
}
