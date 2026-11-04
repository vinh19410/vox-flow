import type { Mode } from "../exam/types";

export interface Attempt {
  id: string;
  date: string;
  mode: Mode;
  band: number;
  range: [number, number];
  topic: string;
}
