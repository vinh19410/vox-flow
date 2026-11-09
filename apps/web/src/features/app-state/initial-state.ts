import type { AppState } from "./types";

export function createInitialState(): AppState {
  return {
    name: "",
    email: "",
    target: 7.0,
    examDate: null,
    consent: { save: true, calibration: false, train: false },
    plan: null,
    mode: "full",
    voice: "uk-f",
    attempts: [],
    practice: null,
    lastPracticeSession: null,
    practiced: {},
    practicedQuestions: {},
    saved: [],
    reopenTopicId: null,
  };
}

export const INITIAL_STATE: AppState = createInitialState();
