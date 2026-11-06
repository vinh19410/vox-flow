export type Mode = "full" | "p1" | "p2" | "p3";
export type Part = 1 | 2 | 3;

export interface ExamFollowUp {
  text: string;
  trigger: string;
  answer: string;
}

export interface ExamCue {
  title: string;
  points: string[];
  ending: string;
}

export interface ExamItem {
  id: string;
  part: Part;
  text: string;
  answer?: string;
  followUp?: ExamFollowUp;
  cue?: ExamCue;
}

export interface ExamModeOption {
  id: Mode;
  title: string;
  sub: string;
  time: string;
  parts: Part[];
}

export interface ExaminerVoice {
  id: string;
  name: string;
  accent: string;
  tone: string;
}

export interface PartInfo {
  title: string;
  desc: string;
  time: string;
}

export type ExamPhase = "intro" | "asking" | "ready" | "prep" | "recording" | "answered" | "examiner-thinking";

export interface ExamAnswer {
  secs: number;
  words: number;
  durationMs?: number;
  audioKey?: string;
  blob?: Blob;
}

/** One question card in the exam room; `-f` suffixed keys are AI follow-ups. */
export interface ExamStep {
  key: string;
  part: Part;
  text: string;
  answer: string;
  /** Trigger phrase quoted in the chip when this is an AI follow-up. */
  follow?: string;
  cue?: ExamCue;
}
