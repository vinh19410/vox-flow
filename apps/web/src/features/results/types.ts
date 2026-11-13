export type CritKey = "FC" | "LR" | "GRA" | "P";

export interface Evidence {
  quote: string;
  where: string;
  kind: "plus" | "minus";
  note: string;
}

export interface CriterionMetric {
  label: string;
  value: string;
}

export interface CriterionImprovement {
  from: string;
  to: string;
  why: string;
}

export interface Criterion {
  key: CritKey;
  name: string;
  vi: string;
  band: number | null;
  /** Prototype-only confidence range; hidden when absent (real scoring results). */
  range?: [number, number];
  /** Prototype-only independent run bands; hidden when absent. */
  runs?: number[];
  summary: string;
  metrics?: CriterionMetric[];
  evidence: Evidence[];
  improve: CriterionImprovement[];
}

export interface ResultData {
  overall: number;
  range: [number, number];
  runs: number[];
  oneLiner: string;
  criteria: Criterion[];
  reviews?: ReviewItem[];
}

export type MarkType = "grammar" | "vocab" | "pron";

export interface MarkedSeg {
  t: string;
  type: MarkType;
  fix: string;
  note: string;
}

export type Seg = string | MarkedSeg;

export interface ReviewItem {
  id: string;
  label: string;
  q: string;
  dur: number;
  followUp?: boolean;
  trigger?: string;
  segs: Seg[];
}

export interface MarkStyle {
  label: string;
  cls: string;
  dot: string;
}
