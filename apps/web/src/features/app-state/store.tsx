import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { Attempt } from "../history/types";
import { createInitialState } from "./initial-state";
import type { AppState, AppStateUpdater, AppStoreValue } from "./types";

export const PROTO_STORAGE_KEY = "vox-flow-proto-state";

const ModeSchema = z.enum(["full", "p1", "p2", "p3"]);
const PartSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const ExamItemSchema = z.object({
  id: z.string(),
  part: PartSchema,
  text: z.string(),
  answer: z.string(),
  followUp: z
    .object({
      text: z.string(),
      trigger: z.string(),
      answer: z.string(),
    })
    .optional(),
  cue: z
    .object({
      title: z.string(),
      points: z.array(z.string()),
      ending: z.string(),
    })
    .optional(),
});

const AttemptSchema = z.object({
  id: z.string(),
  date: z.string(),
  mode: ModeSchema,
  band: z.number(),
  range: z.tuple([z.number(), z.number()]),
  topic: z.string(),
});

const PersistedAppStateSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    target: z.number(),
    examDate: z.string().nullable(),
    consent: z.object({
      save: z.boolean(),
      train: z.boolean(),
    }),
    plan: z
      .object({
        id: z.string(),
        name: z.string(),
        until: z.string(),
      })
      .nullable(),
    mode: ModeSchema,
    voice: z.string(),
    attempts: z.array(AttemptSchema),
    practice: z
      .object({
        topicId: z.string(),
        title: z.string(),
        kind: z.enum(["p1", "p23"]),
        items: z.array(ExamItemSchema),
      })
      .nullable(),
    practiced: z.record(z.string(), z.number()),
    saved: z.array(z.string()),
  })
  .partial();

function hydrateState(): AppState {
  const base = createInitialState();
  try {
    const raw = globalThis.sessionStorage?.getItem(PROTO_STORAGE_KEY);
    if (!raw) return base;
    const result = PersistedAppStateSchema.safeParse(JSON.parse(raw));
    if (!result.success) return base;
    const d = result.data;
    return {
      name: d.name ?? base.name,
      email: d.email ?? base.email,
      target: d.target ?? base.target,
      examDate: d.examDate !== undefined ? d.examDate : base.examDate,
      consent: d.consent ?? base.consent,
      plan: d.plan !== undefined ? d.plan : base.plan,
      mode: d.mode ?? base.mode,
      voice: d.voice ?? base.voice,
      attempts: d.attempts ?? base.attempts,
      practice: d.practice !== undefined ? d.practice : base.practice,
      practiced: d.practiced ?? base.practiced,
      saved: d.saved ?? base.saved,
    };
  } catch {
    return base;
  }
}

export function useAppStateStore(): AppStoreValue {
  const [s, setS] = useState<AppState>(hydrateState);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [lastUnpersistedAttempt, setLastUnpersistedAttempt] = useState<Attempt | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      globalThis.sessionStorage?.setItem(PROTO_STORAGE_KEY, JSON.stringify(s));
    } catch {
      // Ignore storage quota or restricted-mode errors
    }
  }, [s]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const set = useCallback((u: AppStateUpdater) => {
    setS((prev) => ({
      ...prev,
      ...(typeof u === "function" ? u(prev) : u),
    }));
  }, []);

  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const toast = useCallback((m: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMsg(m);
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToastMsg(null);
    }, 3200);
  }, []);

  return {
    s,
    set,
    paywallOpen,
    openPaywall,
    closePaywall,
    toastMsg,
    toast,
    lastUnpersistedAttempt,
    setLastUnpersistedAttempt,
    pendingSubmission,
    setPendingSubmission,
  };
}
