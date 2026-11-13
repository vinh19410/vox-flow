import type { ScoringResult } from "@vox-flow/api/scoring/types";

import type { CritKey, Criterion, CriterionImprovement, Evidence, ReviewItem } from "./types";

export const CRITERION_ORDER: readonly CritKey[] = ["FC", "LR", "GRA", "P"];

export const CRITERION_LABELS: Record<CritKey, { name: string; vi: string }> = {
  FC: { name: "Fluency & Coherence", vi: "Độ trôi chảy & mạch lạc" },
  LR: { name: "Lexical Resource", vi: "Vốn từ vựng" },
  GRA: { name: "Grammatical Range & Accuracy", vi: "Ngữ pháp" },
  P: { name: "Pronunciation", vi: "Phát âm" },
};

export interface WeakestQuestionDetail {
  questionKey: string;
  partNumber: number;
  questionText: string;
  transcript: string;
  evidence: Array<Evidence & { criterionKey: CritKey; criterionLabel: string }>;
  improve: CriterionImprovement[];
}

/** Real scoring criteria in display order; locked criteria omit band & summary from server. */
export function toCriteria(result: ScoringResult): Criterion[] {
  return CRITERION_ORDER.flatMap((key) => {
    const c = result.criteria.find((x) => x.key === key);
    if (!c) return [];
    return [
      {
        key,
        ...CRITERION_LABELS[key],
        band: c.band ?? null,
        summary: c.summary ?? "",
        evidence: c.evidence.map(({ quote, where, kind, note }) => ({ quote, where, kind, note })),
        improve: c.improve,
      },
    ];
  });
}

/** Unlocked evidence/improve/transcript for the single weakest question returned in locked results. */
export function toWeakestQuestionDetail(result: ScoringResult): WeakestQuestionDetail | null {
  if (!result.weakestQuestionKey) return null;
  const answer = result.answers.find((a) => a.questionKey === result.weakestQuestionKey) ?? result.answers[0];
  if (!answer) return null;

  const evidence: WeakestQuestionDetail["evidence"] = [];
  const improve: CriterionImprovement[] = [];

  for (const key of CRITERION_ORDER) {
    const c = result.criteria.find((x) => x.key === key);
    if (!c) continue;
    for (const ev of c.evidence) {
      if (ev.questionKey === answer.questionKey) {
        evidence.push({
          quote: ev.quote,
          where: ev.where,
          kind: ev.kind,
          note: ev.note,
          criterionKey: key,
          criterionLabel: CRITERION_LABELS[key].vi,
        });
      }
    }
    for (const im of c.improve) {
      improve.push(im);
    }
  }

  return {
    questionKey: answer.questionKey,
    partNumber: answer.partNumber,
    questionText: answer.questionText,
    transcript: answer.transcript.trim() || "(Không nhận diện được lời nói)",
    evidence,
    improve,
  };
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
