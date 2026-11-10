import type { ExamItem } from "../exam/types";

export type ForecastKind = "p1" | "p23";

export interface ForecastTopic {
  id: string;
  kind: ForecastKind;
  title: string;
  category: string;
  tag?: "new" | "hot";
  /** số thí sinh báo đã gặp trong quý */
  reports: number;
  lastSeen: string;
  items: ExamItem[];
}

export interface Follow {
  at: number;
  text: string;
  trigger: string;
  answer: string;
}
