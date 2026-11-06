import type { Follow, ForecastCueInput, ForecastTopic } from "./types";

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
    id: `${id}-${i}`,
    part: 1,
    text,
    answer,
    followUp:
      follow && follow.at === i
        ? { text: follow.text, trigger: follow.trigger, answer: follow.answer }
        : undefined,
  })),
});

export const p23 = (
  id: string,
  title: string,
  category: string,
  reports: number,
  lastSeen: string,
  cue: ForecastCueInput,
  p3: [string, string][],
  tag?: ForecastTopic["tag"],
  follow?: Follow,
): ForecastTopic => ({
  id,
  kind: "p23",
  title,
  category,
  tag,
  reports,
  lastSeen,
  items: [
    {
      id: `${id}-c`,
      part: 2,
      text: cue.title,
      answer: cue.answer,
      cue: { title: cue.title, points: cue.points, ending: cue.ending },
    },
    ...p3.map(([text, answer], i) => ({
      id: `${id}-${i}`,
      part: 3 as const,
      text,
      answer,
      followUp:
        follow && follow.at === i
          ? { text: follow.text, trigger: follow.trigger, answer: follow.answer }
          : undefined,
    })),
  ],
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
  if (t.part === 1) {
    const rawQs = Array.isArray(t.questions) ? t.questions.map(String) : [];
    return {
      id: t.id,
      kind: "p1",
      title: t.title,
      category: "Part 1",
      tag: isHot ? "hot" : undefined,
      reports: t.realReportCount,
      lastSeen: "Gần đây",
      items: rawQs.map((text, i) => ({
        id: `${t.id}-${i}`,
        part: 1,
        text,
      })),
    };
  }

  const raw = t.questions;
  let cueCards: string[] = [];
  let part3: string[] = [];

  if (raw && typeof raw === "object" && !Array.isArray(raw) && "cueCards" in raw && "part3" in raw) {
    const obj = raw as { cueCards?: unknown[]; part3?: unknown[] };
    cueCards = Array.isArray(obj.cueCards) ? obj.cueCards.map(String) : [];
    part3 = Array.isArray(obj.part3) ? obj.part3.map(String) : [];
  } else if (Array.isArray(raw)) {
    for (const q of raw.map(String)) {
      if (q.startsWith("[Cue] ")) cueCards.push(q.slice(6));
      else if (q.startsWith("[Part 3] ")) part3.push(q.slice(9));
      else cueCards.push(q);
    }
  }

  const points = cueCards.length > 1 ? cueCards.slice(0, -1) : cueCards;
  const ending = cueCards.length > 1 ? cueCards[cueCards.length - 1] ?? "" : "";
  let isNew = Boolean(t.isNew);
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
        id: `${t.id}-c`,
        part: 2,
        text: t.title,
        cue: {
          title: t.title,
          points,
          ending,
        },
      },
      ...part3.map((text, i) => ({
        id: `${t.id}-p3-${i}`,
        part: 3 as const,
        text,
      })),
    ],
  };
}
