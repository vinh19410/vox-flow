import { useEffect, useMemo, useRef, useState } from "react";

import { useApp } from "@/features/app-state/types";
import {
  invalidateQuotaStatus,
  parseQuotaErrorCode,
  type QuotaErrorCode,
} from "@/features/select/use-quota-status";
import { useMicLevel } from "@/hooks/use-mic-level";
import { useRecorder } from "@/hooks/use-recorder";
import { cancelSpeech, prefetchSpeech, speakText } from "@/lib/speech";
import { buildAttemptTtsUrl, buildForecastTtsUrl, buildMockTtsUrl } from "@/lib/tts-url";
import { trpcClient } from "@/utils/trpc";

import { ITEMS, MODES, VOICES } from "./data";
import { trackAnswerUpload, withGeneration, type AnswerUpload } from "./answer-uploads";
import { deleteAudioBlob, saveAudioBlob } from "./storage";
import type { ExamAnswer, ExamPhase, ExamStep, ExaminerVoice, Part } from "./types";
export type { ExamAnswer, ExamPhase, ExamStep } from "./types";

const ATTEMPT_SYNC_TIMEOUT_MS = 15_000; // hung attempt.start/getActive must not lock submit forever (#106)
const PREP_TIMEOUT_MS = 12_000; // safety cap so linked question prep never traps learner in examiner-thinking

interface LinkedOverride {
  text: string;
  trigger?: string;
}

interface PrepareNextQuestionResult {
  linked: boolean;
  questionText?: string | null;
  triggerPhrase?: string | null;
}

type AttemptClientWithPrepare = typeof trpcClient.attempt & {
  prepareNextQuestion?: {
    mutate: (
      input: {
        attemptId: string;
        previousQuestionKey: string;
        nextQuestionKey: string;
        previousGeneration?: number;
        prepToken?: string;
      },
      options?: { signal?: AbortSignal },
    ) => Promise<PrepareNextQuestionResult>;
  };
  invalidateLinkedPrompt?: {
    mutate: (input: { attemptId: string; questionKey: string; prepToken?: string }) => Promise<unknown>;
  };
};

export interface ExamSessionValue {
  parts: Part[];
  steps: ExamStep[];
  step: ExamStep;
  idx: number;
  phase: ExamPhase;
  typed: number; recT: number;
  maxRec: number; prepT: number; partT: number;
  notes: string; setNotes: (v: string) => void;
  answers: Record<string, ExamAnswer>;
  voice: ExaminerVoice; muted: boolean; level: number;
  toggleMuted: () => void;
  review: boolean; setReview: (v: boolean) => void;
  exitOpen: boolean; setExitOpen: (v: boolean) => void; returnToReview: boolean;
  begin: () => void; startRec: () => void; stopRec: () => void;
  restart: () => void; next: () => void; retryStep: (k: number) => void;
  attemptId?: string | null;
  attemptStatus: "pending" | "ready" | "failed";
  quotaBlock: QuotaErrorCode | null;
}

const voiceLang = (id: string) => (id.startsWith("uk") ? "en-GB" : id.startsWith("au") ? "en-AU" : "en-US");

export function useExamSession(): ExamSessionValue {
  const { s } = useApp();
  const voice = VOICES.find((v) => v.id === s.voice) ?? VOICES[0];
  const source = s.practice?.items ?? ITEMS;
  const parts = useMemo<Part[]>(
    () => (s.practice ? [...new Set(s.practice.items.map((i) => i.part))] : (MODES.find((m) => m.id === s.mode)?.parts ?? [1, 2, 3])),
    [s.practice, s.mode],
  );

  const baseSteps = useMemo<ExamStep[]>(() => {
    const out: ExamStep[] = [];
    for (const i of source) {
      if (!parts.includes(i.part)) continue;
      out.push({ key: i.id, part: i.part, text: i.text, answer: i.answer ?? "", cue: i.cue });
      if (i.followUp) out.push({ key: `${i.id}-f`, part: i.part, text: i.followUp.text, answer: i.followUp.answer ?? "", follow: i.followUp.trigger });
    }
    return out;
  }, [parts, source]);

  const isLinkedPractice = Boolean(s.practice && !s.practice.singleQuestionId && baseSteps.length >= 2);
  const [linkedOverrides, setLinkedOverrides] = useState<Record<string, LinkedOverride>>({});

  const steps = useMemo<ExamStep[]>(() => {
    if (!isLinkedPractice) return baseSteps;
    return baseSteps.map((base) => {
      const override = linkedOverrides[base.key];
      if (!override) return base;
      return {
        ...base,
        text: override.text,
        follow: override.trigger ?? base.follow,
      };
    });
  }, [baseSteps, isLinkedPractice, linkedOverrides]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [typed, setTyped] = useState(0);
  const [recT, setRecT] = useState(0);
  const [prepT, setPrepT] = useState(60);
  const [partT, setPartT] = useState(0);
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, ExamAnswer>>({});
  const [muted, setMuted] = useState(false);
  const [review, setReview] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const clientSessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "session-local",
  );
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<"pending" | "ready" | "failed">("pending");
  const [quotaBlock, setQuotaBlock] = useState<QuotaErrorCode | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  // Recordings stopped before the attempt id arrived, keyed by question. The
  // entry promise only settles once the device copy has been written, so the
  // backfill can never delete a session copy mid-write.
  const pendingSessionRef = useRef(new Map<string, Promise<AnswerUpload | null>>());
  const mountedRef = useRef(true);
  const prepTokensRef = useRef(new Map<number, number>());
  const prepPromisesRef = useRef(new Map<number, Promise<void>>());
  const prepAbortControllersRef = useRef(new Map<number, AbortController>());
  const activePrepCleanupsRef = useRef(new Set<() => void>());
  const practiceKey = s.practice
    ? `${s.practice.topicId ?? "mock"}::${s.practice.singleQuestionId ?? ""}::${s.practice.attemptId ?? ""}`
    : "";
  const prevPracticeKeyRef = useRef(practiceKey);
  useEffect(() => {
    if (prevPracticeKeyRef.current !== practiceKey) {
      prevPracticeKeyRef.current = practiceKey;
      setLinkedOverrides({});
      for (const cleanup of [...activePrepCleanupsRef.current]) cleanup();
      activePrepCleanupsRef.current.clear();
      prepTokensRef.current.clear();
      prepPromisesRef.current.clear();
      for (const controller of prepAbortControllersRef.current.values()) controller.abort();
      prepAbortControllersRef.current.clear();
    }
  }, [practiceKey]);
  const recorder = useRecorder();
  const recorderCancelRef = useRef(recorder.cancel);
  recorderCancelRef.current = recorder.cancel;
  const startParamsRef = useRef({
    examMode: s.practice
      ? s.practice.singleQuestionId
        ? s.practice.items[0]?.part === 3
          ? ("part3" as const)
          : s.practice.items[0]?.part === 2
            ? ("part2" as const)
            : ("part1" as const)
        : s.practice.kind === "p1"
          ? ("part1" as const)
          : ("part2" as const)
      : s.mode === "p1"
        ? ("part1" as const)
        : s.mode === "p2"
          ? ("part2" as const)
          : s.mode === "p3"
            ? ("part3" as const)
            : ("full" as const),
    topicId: s.practice?.topicId ?? undefined,
    questionKey: s.practice?.singleQuestionId,
    isPractice: Boolean(s.practice),
    prestartedAttemptId: s.practice?.attemptId,
  });

  const applyAttemptId = (id: string) => {
    attemptIdRef.current = id;
    // Drain pending session recordings synchronously, before any state update
    // lets the user record again or submit, so they get their upload tickets
    // before anything newer can race them.
    const pending = [...pendingSessionRef.current];
    pendingSessionRef.current.clear();
    for (const [questionKey, recording] of pending) {
      void trackAnswerUpload(id, recording.then((r) => r && { ...r, attemptId: id })).then((ok) => {
        // Drop the session copy only once the server confirmed the recording.
        if (ok) void deleteAudioBlob(clientSessionIdRef.current, questionKey).catch(() => {});
      });
    }
    setAttemptStatus("ready");
    setAttemptId(id);
  };

  useEffect(() => {
    let active = true;
    const { examMode, topicId, questionKey, isPractice, prestartedAttemptId } = startParamsRef.current;

    if (prestartedAttemptId) {
      applyAttemptId(prestartedAttemptId);
      trpcClient.attempt.getActive
        .query()
        .then((activeAttempt) => {
          if (!active) return;
          if (activeAttempt?.attempt?.id === prestartedAttemptId && activeAttempt.answers?.length) {
            const rehydrated: Record<string, ExamAnswer> = {};
            for (const a of activeAttempt.answers) {
              rehydrated[a.questionKey] = {
                secs: Math.round(a.durationMs / 1000),
                durationMs: a.durationMs,
                audioKey: a.audioKey,
              };
            }
            setAnswers((prev) => ({ ...rehydrated, ...prev }));
          }
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }

    // attemptStatus only leaves "pending" when getActive/start settle. A hung
    // request (httpBatchLink has no timeout) would lock submit forever, so fail
    // the bootstrap after a grace period. The request keeps running: a late id
    // still lands via applyAttemptId while this screen is mounted.
    const syncTimer = setTimeout(() => {
      if (active) setAttemptStatus((status) => (status === "pending" ? "failed" : status));
    }, ATTEMPT_SYNC_TIMEOUT_MS);

    trpcClient.attempt.getActive
      .query()
      .then((activeAttempt) => {
        if (!active) return;
        const att = activeAttempt?.attempt;
        const isPracticeMatch = Boolean(
          isPractice &&
            att &&
            !att.retakeOfAttemptId &&
            att.topicId === (topicId ?? null) &&
            att.questionKey === (questionKey ?? null),
        );
        const isMockMatch = Boolean(!isPractice && att && !att.topicId && !att.questionKey && att.mode === examMode);

        if (att && (isPracticeMatch || isMockMatch)) {
          applyAttemptId(att.id);
          if (activeAttempt.answers && activeAttempt.answers.length > 0) {
            const rehydrated: Record<string, ExamAnswer> = {};
            for (const a of activeAttempt.answers) {
              rehydrated[a.questionKey] = {
                secs: Math.round(a.durationMs / 1000),
                durationMs: a.durationMs,
                audioKey: a.audioKey,
              };
            }
            setAnswers((prev) => ({ ...rehydrated, ...prev }));
          }
        } else {
          return trpcClient.attempt.start
            .mutate({
              mode: examMode,
              topicId,
              questionKey,
            })
            .then((res) => {
              if (active) {
                applyAttemptId(res.attemptId);
                invalidateQuotaStatus();
              }
            });
        }
      })
      .catch((err) => {
        if (!active) return;
        const quotaCode = parseQuotaErrorCode(err);
        if (quotaCode) {
          cancelSpeech();
          recorderCancelRef.current();
          setQuotaBlock(quotaCode);
          invalidateQuotaStatus();
        }
        // Gracefully continue in offline / mock test mode for non-quota errors
        setAttemptStatus("failed");
      })
      .finally(() => clearTimeout(syncTimer));

    return () => {
      active = false;
      clearTimeout(syncTimer);
    };
  }, []);
  const step = steps[idx];
  const { level } = useMicLevel(phase === "recording");
  const maxRec = step?.part === 2 ? 120 : step?.part === 3 ? 60 : 40;
  // All exam timers pause while the exit, pre-submit modal, or quota block is open.
  const paused = exitOpen || review || Boolean(quotaBlock);
  const practiceTopicId = s.practice?.topicId?.trim();
  const clearLinkedOverride = (questionKey: string) => {
    setLinkedOverrides((prev) => {
      if (!(questionKey in prev)) return prev;
      const nextOverrides = { ...prev };
      delete nextOverrides[questionKey];
      return nextOverrides;
    });
  };
  const invalidateServerLinkedPrompt = (
    activeAttemptId: string | null | undefined,
    questionKey: string,
    prepToken?: string,
  ) => {
    if (!activeAttemptId) return;
    const attemptClient = trpcClient.attempt as AttemptClientWithPrepare | undefined;
    if (typeof attemptClient?.invalidateLinkedPrompt?.mutate === "function") {
      void attemptClient.invalidateLinkedPrompt
        .mutate({ attemptId: activeAttemptId, questionKey, ...(prepToken ? { prepToken } : {}) })
        .catch(() => {});
    }
  };
  const invalidatePrep = (stepIndex: number, clearNextOverride: boolean) => {
    const prevToken = prepTokensRef.current.get(stepIndex);
    const prevPrepToken = prevToken !== undefined ? `s${stepIndex}-t${prevToken}` : undefined;
    prepTokensRef.current.set(stepIndex, (prevToken ?? 0) + 1);
    const controller = prepAbortControllersRef.current.get(stepIndex);
    if (controller) {
      controller.abort();
      prepAbortControllersRef.current.delete(stepIndex);
    }
    prepPromisesRef.current.delete(stepIndex);
    if (clearNextOverride) {
      const nextBase = baseSteps[stepIndex + 1];
      if (nextBase) {
        clearLinkedOverride(nextBase.key);
        invalidateServerLinkedPrompt(attemptIdRef.current ?? attemptId, nextBase.key, prevPrepToken);
      }
    }
  };
  const stepAudioUrl = (targetStep: ExamStep): string | undefined => {
    if (
      (Boolean(s.practice?.retakeOfAttemptId && practiceTopicId && !targetStep.follow) ||
        s.practice?.hasLinkedPrompt ||
        (isLinkedPractice && linkedOverrides[targetStep.key])) &&
      attemptId
    ) {
      return buildAttemptTtsUrl(attemptId, voice.id, targetStep.key, targetStep.text);
    }
    if (practiceTopicId) {
      if (targetStep.follow) return undefined;
      return buildForecastTtsUrl(voice.id, practiceTopicId, targetStep.key, targetStep.text);
    }
    return buildMockTtsUrl(voice.id, targetStep.key, targetStep.text);
  };

  useEffect(() => {
    cancelSpeech();
    return () => cancelSpeech();
  }, []);

  // Prefetch current and next examiner prompts so audio is warm before "asking" starts.
  // In linked practice, skip prefetching the static forecast audio for the upcoming step
  // until prepareNextQuestion completes (or attempt bootstrap failed offline).
  useEffect(() => {
    if (muted || steps.length === 0) return;
    const currentUrl = steps[idx] ? stepAudioUrl(steps[idx]) : undefined;
    if (currentUrl) void prefetchSpeech(currentUrl);
    const upcomingStep = steps[idx + 1];
    const shouldPrefetchNext =
      Boolean(upcomingStep) &&
      (!isLinkedPractice || attemptStatus === "failed" || Boolean(linkedOverrides[upcomingStep!.key]));
    const upcomingUrl = shouldPrefetchNext && upcomingStep ? stepAudioUrl(upcomingStep) : undefined;
    if (upcomingUrl) void prefetchSpeech(upcomingUrl);
  }, [idx, muted, steps, practiceTopicId, voice.id, isLinkedPractice, attemptStatus, linkedOverrides, attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Examiner reads the question aloud while the text reveals char by char.
  useEffect(() => {
    if (phase !== "asking" || !step) return;
    setTyped(0);
    if (!muted) {
      speakText(step.text, {
        audioUrl: stepAudioUrl(step),
        lang: voiceLang(voice.id),
        rate: 0.95,
      });
    }
  }, [phase, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reveal interval — paused while a modal is open, resumes at the frozen caret.
  useEffect(() => {
    if (phase !== "asking" || paused) return;
    const id = setInterval(() => setTyped((t) => t + 1), 28);
    return () => clearInterval(id);
  }, [phase, idx, paused]);

  useEffect(() => {
    if (phase === "asking" && typed >= step.text.length + 12) setPhase(step.part === 2 && !step.follow ? "prep" : "ready");
  }, [typed, phase, step]);

  useEffect(() => {
    if (phase === "intro" || paused) return;
    const id = setInterval(() => setPartT((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase, step.part, paused]);

  useEffect(() => {
    if (phase !== "recording" || paused) return;
    const id = setInterval(() => setRecT((t) => t + 0.1), 100);
    return () => clearInterval(id);
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== "prep" || paused) return;
    const id = setInterval(() => setPrepT((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, paused]);

  function startRec() {
    cancelSpeech();
    setRecT(0);
    void recorder.start();
    setPhase("recording");
  }

  function stopRec() {
    const currentRecT = recT;
    const stepIdx = idx;
    const currentStep = step;
    const nextStep = baseSteps[stepIdx + 1];
    const activeAttemptId = attemptIdRef.current ?? attemptId;

    setAnswers((a) => ({
      ...a,
      [currentStep.key]: {
        secs: Math.round(currentRecT),
        durationMs: Math.round(currentRecT * 1000),
      },
    }));
    setPhase("answered");

    const recorded = recorder.stop().then((audio): AnswerUpload | null => {
      if (!audio) return null;
      const durationMs = audio.durationMs ?? Math.round(currentRecT * 1000);
      const mimeType = audio.mimeType ?? "audio/webm";

      setAnswers((a) => ({
        ...a,
        [currentStep.key]: {
          secs: Math.round(currentRecT),
          durationMs,
          blob: audio.blob,
        },
      }));

      if (!audio.blob) return null;
      // The version is stamped once, at creation, so every path (tracked upload,
      // device copy, later flush) carries the same generation.
      return withGeneration({
        attemptId: attemptIdRef.current ?? clientSessionIdRef.current,
        questionKey: currentStep.key,
        blob: audio.blob,
        durationMs,
        mimeType,
        part: currentStep.part,
        order: stepIdx,
        questionText: currentStep.text,
      });
    });

    if (activeAttemptId) {
      // Tracked from the moment recording stops, so the scoring screen waits for
      // (and retries) this upload before submitting, even if the user submits
      // before the recorder has finished encoding.
      const uploadPromise = trackAnswerUpload(activeAttemptId, recorded);
      const attemptClient = trpcClient.attempt as AttemptClientWithPrepare | undefined;
      if (
        isLinkedPractice &&
        !returnToReview &&
        nextStep &&
        typeof attemptClient?.prepareNextQuestion?.mutate === "function"
      ) {
        const token = (prepTokensRef.current.get(stepIdx) ?? 0) + 1;
        const prepToken = `s${stepIdx}-t${token}`;
        prepTokensRef.current.set(stepIdx, token);
        prepAbortControllersRef.current.get(stepIdx)?.abort();
        const abortController = new AbortController();
        prepAbortControllersRef.current.set(stepIdx, abortController);
        const isCurrentToken = () => mountedRef.current && prepTokensRef.current.get(stepIdx) === token;

        let prepPromise!: Promise<void>;
        prepPromise = (async () => {
          let timedOut = false;
          let timeoutId: ReturnType<typeof setTimeout> | null = null;
          let resolveTimeout: (value: "timeout") => void = () => {};
          const timeoutPromise = new Promise<"timeout">((resolve) => {
            resolveTimeout = resolve;
          });
          const settleTimeout = (asTimeout: boolean) => {
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            activePrepCleanupsRef.current.delete(cleanupOnUnmount);
            if (asTimeout) {
              timedOut = true;
              abortController.abort();
            }
            resolveTimeout("timeout");
          };
          const cleanupOnUnmount = () => {
            abortController.abort();
            settleTimeout(false);
          };
          activePrepCleanupsRef.current.add(cleanupOnUnmount);
          timeoutId = setTimeout(() => settleTimeout(true), PREP_TIMEOUT_MS);

          const workPromise = (async (): Promise<"done"> => {
            try {
              const [ok, record] = await Promise.all([uploadPromise, recorded]);
              if (!ok || !record || timedOut || !isCurrentToken()) {
                if (isCurrentToken()) {
                  clearLinkedOverride(nextStep.key);
                  invalidateServerLinkedPrompt(activeAttemptId, nextStep.key, prepToken);
                }
                return "done";
              }
              const res = await attemptClient.prepareNextQuestion!.mutate(
                {
                  attemptId: activeAttemptId,
                  previousQuestionKey: currentStep.key,
                  nextQuestionKey: nextStep.key,
                  previousGeneration: record.generation,
                  prepToken,
                },
                { signal: abortController.signal },
              );
              if (timedOut || !isCurrentToken()) return "done";
              if (res.linked && res.questionText) {
                const trigger = res.triggerPhrase?.trim() || undefined;
                setLinkedOverrides((prev) => ({
                  ...prev,
                  [nextStep.key]: { text: res.questionText!, trigger },
                }));
                if (!muted) {
                  void prefetchSpeech(buildAttemptTtsUrl(activeAttemptId, voice.id, nextStep.key, res.questionText));
                }
              } else {
                clearLinkedOverride(nextStep.key);
              }
            } catch {
              if (!timedOut && isCurrentToken()) {
                clearLinkedOverride(nextStep.key);
                invalidateServerLinkedPrompt(activeAttemptId, nextStep.key, prepToken);
              }
            }
            return "done";
          })();

          const winner = await Promise.race([workPromise, timeoutPromise]);
          if (winner === "timeout" && isCurrentToken()) {
            clearLinkedOverride(nextStep.key);
            invalidateServerLinkedPrompt(activeAttemptId, nextStep.key, prepToken);
          }
          settleTimeout(false);
        })().finally(() => {
          if (prepAbortControllersRef.current.get(stepIdx) === abortController) {
            prepAbortControllersRef.current.delete(stepIdx);
          }
          if (prepPromisesRef.current.get(stepIdx) === prepPromise) {
            prepPromisesRef.current.delete(stepIdx);
          }
        });

        prepPromisesRef.current.set(stepIdx, prepPromise);
      }
      return;
    }
    // attempt.start has not answered yet: keep the recording pending. The
    // registry entry only settles once the device copy has been written, so the
    // backfill can never delete it mid-write. If the id arrives while the
    // encoder is still running, the decision below runs at resolve time against
    // the ref — and drops any pending entry so an older take can never
    // supersede the newer one.
    void recorded.then((record) => {
      if (!record) return;
      const id = attemptIdRef.current;
      if (id) {
        pendingSessionRef.current.delete(currentStep.key);
        void trackAnswerUpload(id, record);
        return;
      }
      pendingSessionRef.current.set(
        currentStep.key,
        saveAudioBlob(record).catch(() => {}).then(() => record),
      );
    });
  }
  // Leaving the exam with pending recordings: only forget them in memory. The
  // session-id device copies stay — they may be the only remaining copy.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pendingSessionRef.current.clear();
      for (const cleanup of [...activePrepCleanupsRef.current]) cleanup();
      activePrepCleanupsRef.current.clear();
      prepAbortControllersRef.current.clear();
      prepPromisesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (phase === "recording" && recT >= maxRec && !paused) stopRec();
  }, [recT, maxRec, phase, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "prep" && prepT <= 0 && !paused) startRec();
  }, [prepT, phase, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  function advanceToStep(nextIdx: number, previousPart: Part) {
    const nextStep = baseSteps[nextIdx];
    if (!nextStep) return;
    const newPart = nextStep.part !== previousPart;
    setIdx(nextIdx);
    if (newPart) {
      setPartT(0);
      setPhase("intro");
    } else setPhase("asking");
  }

  function next() {
    if (phase === "examiner-thinking") return;
    if (returnToReview) {
      setReturnToReview(false);
      setReview(true);
      return;
    }
    const n = idx + 1;
    if (n >= steps.length) {
      setReview(true);
      return;
    }
    const activePrep = isLinkedPractice ? prepPromisesRef.current.get(idx) : undefined;
    if (activePrep) {
      const waitingIdx = idx;
      const previousPart = step.part;
      const tokenAtWait = prepTokensRef.current.get(waitingIdx);
      setPhase("examiner-thinking");
      void activePrep.then(() => {
        if (!mountedRef.current) return;
        if (prepTokensRef.current.get(waitingIdx) !== tokenAtWait) return;
        advanceToStep(n, previousPart);
      });
      return;
    }
    advanceToStep(n, step.part);
  }

  // Space = record / stop, Enter = next; never while a modal is open or when a focusable control holds focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (review || exitOpen || quotaBlock) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (phase === "ready") startRec();
        else if (phase === "recording") stopRec();
      }
      if (e.code === "Enter" && phase === "answered") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggleMuted = () => {
    setMuted((m) => !m);
    cancelSpeech();
  };
  const begin = () => setPhase("asking");
  const restart = () => {
    invalidatePrep(idx, !returnToReview);
    recorder.cancel();
    setRecT(0);
    setPhase("ready");
  };
  const retryStep = (k: number) => {
    invalidatePrep(k, false);
    setReview(false);
    setIdx(k);
    setReturnToReview(true);
    setRecT(0);
    setPhase("ready");
  };

  return {
    parts, steps, step, idx, phase, typed, recT, maxRec,
    prepT, partT, notes, setNotes, answers,
    voice, muted, toggleMuted, level,
    review, setReview, exitOpen, setExitOpen, returnToReview,
    begin, startRec, stopRec, restart, next, retryStep,
    attemptId,
    attemptStatus,
    quotaBlock,
  };
}
