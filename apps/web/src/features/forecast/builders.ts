import {
  cueCardKey,
  parseTopicQuestions,
  part1QuestionKey,
  part3QuestionKey,
} from "@vox-flow/api/scoring/forecast-keys";
import type { Follow, ForecastTopic } from "./types";

export const p1 = (
  id: string,
  title: string,
  category: string,
  reports: number,
  lastSeen: string,
  qs: [string, string][],
  tag?: ForecastTopic["tag"],
  follow?: Follow,
): ForecastTopic => ({
  id,
  kind: "p1",
  title,
  category,
  tag,
  reports,
  lastSeen,
  items: qs.map(([text, answer], i) => ({
    id: part1QuestionKey(id, i),
    part: 1,
    text,
    answer,
    followUp:
      follow && follow.at === i
        ? { text: follow.text, trigger: follow.trigger, answer: follow.answer }
        : undefined,
  })),
});

export function mapApiTopicToForecastTopic(t: {
  id: string;
  title: string;
  quarter: string;
  part: number;
  questions: unknown;
  isNew?: boolean;
  status: string;
  realReportCount: number;
}): ForecastTopic {
  const isHot = t.realReportCount >= 200;
  const parsed = parseTopicQuestions(t.questions);
  if (t.part === 1) {
    const rawQs = parsed.part1Questions ?? [];
    return {
      id: t.id,
      kind: "p1",
      title: t.title,
      category: "Part 1",
      tag: isHot ? "hot" : undefined,
      reports: t.realReportCount,
      lastSeen: "Gần đây",
      items: rawQs.map((text, i) => ({
        id: part1QuestionKey(t.id, i),
        part: 1,
        text,
      })),
    };
  }

  const { cueCards, part3Questions: part3 } = parsed;

  const points = cueCards.length > 1 ? cueCards.slice(0, -1) : cueCards;
  const ending = cueCards.length > 1 ? cueCards[cueCards.length - 1] ?? "" : "";
  let isNew = Boolean(t.isNew);
  const raw = t.questions;
  if (!isNew && raw && typeof raw === "object" && "isNew" in raw) {
    isNew = Boolean(raw.isNew);
  }
  const tag = isHot ? "hot" : isNew ? "new" : undefined;

  return {
    id: t.id,
    kind: "p23",
    title: t.title,
    category: "Part 2 & 3",
    tag,
    reports: t.realReportCount,
    lastSeen: "Gần đây",
    items: [
      {
        id: cueCardKey(t.id),
        part: 2,
        text: t.title,
        cue: {
          title: t.title,
          points,
          ending,
        },
      },
      ...part3.map((text, i) => ({
        id: part3QuestionKey(t.id, i),
        part: 3 as const,
        text,
      })),
    ],
  };
}
