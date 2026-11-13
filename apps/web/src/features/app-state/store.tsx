import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { Attempt } from "../history/types";
import { createInitialState } from "./initial-state";
import type { AppState, AppStateUpdater, AppStoreValue } from "./types";

export const PROTO_STORAGE_KEY = "vox-flow-proto-state-v3";

const ModeSchema = z.enum(["full", "p1", "p2", "p3"]);
const PartSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const ExamItemSchema = z.object({
  id: z.string(),
  part: PartSchema,
  text: z.string(),
  answer: z.string().optional().default(""),
  followUp: z
    .object({
      text: z.string(),
      trigger: z.string(),
      answer: z.string().optional().default(""),
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


const PracticeSessionSchema = z.object({
  topicId: z.string().nullable(),
  title: z.string(),
  kind: z.enum(["p1", "p23"]),
  items: z.array(ExamItemSchema),
  singleQuestionId: z.string().optional(),
  topicItems: z.array(ExamItemSchema).optional(),
  attemptId: z.string().optional(),
  retakeOfAttemptId: z.string().optional(),
  hasLinkedPrompt: z.boolean().optional(),
});

const ScoringJobSchema = z.preprocess(
  // Payloads persisted before #119 carry no `kind` — always the attempt variant.
  // Belt-and-suspenders only: the v3 storage key below means pre-#119 payloads
  // are never read at all; this guards future writers that forget `kind`.
  (raw) =>
    raw && typeof raw === "object" && !("kind" in raw)
      ? { kind: "attempt", ...(raw as Record<string, unknown>) }
      : raw,
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("attempt"), attemptId: z.string().min(1), submitted: z.boolean() }),
    z.object({ kind: z.literal("local_only") }),
  ]),
);

const PersistedAppStateSchema = z
  .object({
    mode: ModeSchema,
    voice: z.string(),
    practice: PracticeSessionSchema.nullable(),
    scoringAttempt: ScoringJobSchema.nullable(),
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
      ...base,
      mode: d.mode ?? base.mode,
      voice: d.voice ?? base.voice,
      practice: d.practice !== undefined ? d.practice : base.practice,
      scoringAttempt: d.scoringAttempt !== undefined ? d.scoringAttempt : base.scoringAttempt,
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
      const persisted = {
        mode: s.mode,
        voice: s.voice,
        practice: s.practice,
        scoringAttempt: s.scoringAttempt,
      };
      globalThis.sessionStorage?.setItem(PROTO_STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Ignore storage quota or restricted-mode errors
    }
  }, [s.mode, s.voice, s.practice, s.scoringAttempt]);

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
