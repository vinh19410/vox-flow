import type { ScoringResult } from "@vox-flow/api/scoring/types";

import type { CritKey, Criterion, ReviewItem } from "./types";

export const CRITERION_ORDER: readonly CritKey[] = ["FC", "LR", "GRA", "P"];

export const CRITERION_LABELS: Record<CritKey, { name: string; vi: string }> = {
  FC: { name: "Fluency & Coherence", vi: "Độ trôi chảy & mạch lạc" },
  LR: { name: "Lexical Resource", vi: "Vốn từ vựng" },
  GRA: { name: "Grammatical Range & Accuracy", vi: "Ngữ pháp" },
  P: { name: "Pronunciation", vi: "Phát âm" },
};

/** Real scoring criteria in display order. No range/runs: a scored result shows one band per criterion. */
export function toCriteria(result: ScoringResult): Criterion[] {
  return CRITERION_ORDER.flatMap((key) => {
    const c = result.criteria.find((x) => x.key === key);
    if (!c) return [];
    return [
      {
        key,
        ...CRITERION_LABELS[key],
        band: c.band,
        summary: c.summary,
        evidence: c.evidence.map(({ quote, where, kind, note }) => ({ quote, where, kind, note })),
        improve: c.improve,
      },
    ];
  });
}

/** One review card per answer, transcript as a single plain segment. */
export function toReviewItems(result: ScoringResult): ReviewItem[] {
  const perPart = new Map<number, number>();
  return result.answers.map((a) => {
    const n = (perPart.get(a.partNumber) ?? 0) + 1;
    perPart.set(a.partNumber, n);
    return {
      id: a.questionKey,
      label: `Part ${a.partNumber} · Câu ${n}`,
      q: a.questionText,
      dur: Math.max(0, Math.round(a.durationMs / 1000)),
      segs: [a.transcript.trim() || "(Không nhận diện được lời nói)"],
    };
  });
}
