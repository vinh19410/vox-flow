import { useEffect, useMemo, useRef, useState } from "react";

import { ENV } from "@/env.public";
import { useApp } from "@/features/app-state/types";
import { useMicLevel } from "@/hooks/use-mic-level";
import { useRecorder } from "@/hooks/use-recorder";
import { cancelSpeech, speakText } from "@/lib/speech";
import { trpcClient } from "@/utils/trpc";

import { ITEMS, MODES, VOICES } from "./data";
import { deleteAudioBlob, saveAudioBlob } from "./storage";
import type { ExamAnswer, ExamPhase, ExamStep, ExaminerVoice, Part } from "./types";
export type { ExamAnswer, ExamPhase, ExamStep } from "./types";

const WPS = 2.6; // simulated words-per-second for the live transcript

export interface ExamSessionValue {
  parts: Part[];
  steps: ExamStep[];
  step: ExamStep;
  idx: number;
  phase: ExamPhase;
  typed: number; recT: number; spoken: number; words: string[];
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

  const steps = useMemo<ExamStep[]>(() => {
    const out: ExamStep[] = [];
    for (const i of source) {
      if (!parts.includes(i.part)) continue;
      out.push({ key: i.id, part: i.part, text: i.text, answer: i.answer ?? "", cue: i.cue });
      if (i.followUp) out.push({ key: `${i.id}-f`, part: i.part, text: i.followUp.text, answer: i.followUp.answer ?? "", follow: i.followUp.trigger });
    }
    return out;
  }, [parts, source]);

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
  const recorder = useRecorder();
  const startParamsRef = useRef({
    examMode: s.practice
      ? s.practice.singleQuestionId
        ? s.practice.items[0]?.part === 3
          ? ("part3" as const)
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
    topicId: s.practice?.topicId,
    questionKey: s.practice?.singleQuestionId,
    isPractice: Boolean(s.practice),
  });

  useEffect(() => {
    let active = true;
    const { examMode, topicId, questionKey, isPractice } = startParamsRef.current;

    trpcClient.attempt.getActive
      .query()
      .then((activeAttempt) => {
        if (!active) return;
        const att = activeAttempt?.attempt;
        const isPracticeMatch = Boolean(
          isPractice &&
            att &&
            att.topicId === topicId &&
            att.questionKey === (questionKey ?? null),
        );
        const isMockMatch = Boolean(!isPractice && att && !att.topicId && !att.questionKey && att.mode === examMode);

        if (att && (isPracticeMatch || isMockMatch)) {
          setAttemptId(att.id);
          if (activeAttempt.answers && activeAttempt.answers.length > 0) {
            const rehydrated: Record<string, ExamAnswer> = {};
            for (const a of activeAttempt.answers) {
              rehydrated[a.questionKey] = {
                secs: Math.round(a.durationMs / 1000),
                words: 20,
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
              if (active) setAttemptId(res.attemptId);
            });
        }
      })
      .catch(() => {
        // Gracefully continue in offline / mock test mode
      });

    return () => {
      active = false;
    };
  }, []);
  const step = steps[idx];
  const { level } = useMicLevel(phase === "recording");
  const words = step?.answer ? step.answer.split(" ").filter(Boolean) : [];
  const spoken = words.length > 0 ? Math.min(words.length, Math.floor(recT * WPS)) : Math.floor(recT * WPS);
  const maxRec = step?.part === 2 ? 120 : step?.part === 3 ? 60 : 40;
  // All exam timers pause while the exit or pre-submit modal is open.
  const paused = exitOpen || review;

  // Examiner reads the question aloud while the text reveals char by char.
  useEffect(() => {
    if (phase !== "asking") return;
    setTyped(0);
    if (!muted) speakText(step.text, { lang: voiceLang(voice.id), rate: 0.95 });
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
    cancelSpeech();
    return () => cancelSpeech();
  }, []);

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
    const currentSpoken = spoken;
    setAnswers((a) => ({
      ...a,
      [step.key]: {
        secs: currentRecT,
        words: currentSpoken,
        durationMs: Math.round(currentRecT * 1000),
      },
    }));
    setPhase("answered");

    void recorder.stop().then((audio) => {
      if (!audio) return;
      const durationMs = audio.durationMs ?? Math.round(currentRecT * 1000);
      const mimeType = audio.mimeType ?? "audio/webm";

      setAnswers((a) => ({
        ...a,
        [step.key]: {
          secs: currentRecT,
          words: currentSpoken,
          durationMs,
          blob: audio.blob,
        },
      }));

      const effectiveId = attemptId ?? clientSessionIdRef.current;
      if (audio.blob) {
        void saveAudioBlob({
          attemptId: effectiveId,
          questionKey: step.key,
          blob: audio.blob,
          durationMs,
          mimeType,
          part: step.part,
          order: idx,
          questionText: step.text,
        });

        if (attemptId) {
          const baseUrl = (ENV.VITE_SERVER_URL ?? "").replace(/\/$/, "");
          const query = new URLSearchParams({
            part: step.part.toString(),
            order: idx.toString(),
            durationMs: durationMs.toString(),
            questionText: step.text,
          });
          void fetch(
            `${baseUrl}/api/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(step.key)}/audio?${query}`,
            {
              method: "POST",
              headers: {
                "Content-Type": mimeType,
              },
              body: audio.blob,
              credentials: "include",
            },
          )
            .then((res) => {
              if (res.ok) {
                void deleteAudioBlob(effectiveId, step.key);
              }
            })
            .catch(() => {});
        }
      }
    });
  }
  useEffect(() => {
    if (phase === "recording" && recT >= maxRec && !paused) stopRec();
  }, [recT, maxRec, phase, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "prep" && prepT <= 0 && !paused) startRec();
  }, [prepT, phase, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
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
    const newPart = steps[n].part !== step.part;
    setIdx(n);
    if (newPart) {
      setPartT(0);
      setPhase("intro");
    } else setPhase("asking");
  }

  // Space = record / stop, Enter = next; never while a modal is open or when a focusable control holds focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (review || exitOpen) return;
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
    recorder.cancel();
    setRecT(0);
    setPhase("ready");
  };
  const retryStep = (k: number) => {
    setReview(false);
    setIdx(k);
    setReturnToReview(true);
    setRecT(0);
    setPhase("ready");
  };

  return {
    parts, steps, step, idx, phase, typed, recT, spoken, words, maxRec,
    prepT, partT, notes, setNotes, answers,
    voice, muted, toggleMuted, level,
    review, setReview, exitOpen, setExitOpen, returnToReview,
    begin, startRec, stopRec, restart, next, retryStep,
    attemptId,
  };
}
