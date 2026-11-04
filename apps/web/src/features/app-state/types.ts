import { createContext, useContext } from "react";

import type { ExamItem, Mode } from "../exam/types";
import type { ForecastKind } from "../forecast/types";
import type { Attempt } from "../history/types";

export type ProtoScreen =
  | "landing"
  | "auth"
  | "onboarding"
  | "dashboard"
  | "select"
  | "forecast"
  | "exam"
  | "scoring"
  | "results"
  | "history"
  | "billing"
  | "privacy";

export interface PracticeSession {
  topicId: string;
  title: string;
  kind: ForecastKind;
  items: ExamItem[];
}

export interface ActivePlan {
  id: string;
  name: string;
  until: string;
}

export interface ConsentSettings {
  save: boolean;
  train: boolean;
}

export interface AppState {
  name: string;
  email: string;
  target: number;
  examDate: string | null;
  consent: ConsentSettings;
  plan: ActivePlan | null;
  mode: Mode;
  voice: string;
  attempts: Attempt[];
  /** Active forecast-topic practice session; null for a regular mock test. */
  practice: PracticeSession | null;
  practiced: Record<string, number>;
  saved: string[];
}

export type AppStateUpdater = Partial<AppState> | ((prev: AppState) => Partial<AppState>);

export interface NavOptions {
  replace?: boolean;
}

export interface AppStoreValue {
  s: AppState;
  set: (u: AppStateUpdater) => void;
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  toastMsg: string | null;
  toast: (m: string) => void;
  lastUnpersistedAttempt: Attempt | null;
  setLastUnpersistedAttempt: (a: Attempt | null) => void;
  pendingSubmission: boolean;
  setPendingSubmission: (v: boolean) => void;
}

export interface AppCtxValue extends AppStoreValue {
  go: (sc: ProtoScreen, opts?: NavOptions) => void;
  goResult: (attemptId: string, opts?: NavOptions) => void;
}

export const AppCtx = createContext<AppCtxValue | null>(null);

export function useApp(): AppCtxValue {
  const ctx = useContext(AppCtx);
  if (!ctx) {
    throw new Error("useApp must be used within AppStateProvider");
  }
  return ctx;
}
