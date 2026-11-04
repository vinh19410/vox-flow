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
