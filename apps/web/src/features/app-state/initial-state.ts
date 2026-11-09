import { HISTORY } from "../history/data";
import type { AppState } from "./types";

export function createInitialState(): AppState {
  const inThreeWeeks = new Date(Date.now() + 23 * 86400000).toISOString().slice(0, 10);
  return {
    name: "Minh Anh",
    email: "minhanh@gmail.com",
    target: 7.0,
    examDate: inThreeWeeks,
    consent: { save: true, calibration: false, train: false },
    plan: null,
    mode: "full",
    voice: "uk-f",
    attempts: [...HISTORY],
    practice: null,
    lastPracticeSession: null,
    practiced: { "f-helped": 6.0, "f-weather": 6.5 },
    practicedQuestions: {},
    saved: ["f-ai"],
  };
}

export const INITIAL_STATE: AppState = createInitialState();
