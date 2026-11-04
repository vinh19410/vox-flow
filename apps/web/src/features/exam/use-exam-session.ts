import { useEffect, useMemo, useState } from "react";

import { useApp } from "@/features/app-state/types";
import { useMicLevel } from "@/hooks/use-mic-level";
import { cancelSpeech, speakText } from "@/lib/speech";

import { ITEMS, MODES, VOICES } from "./data";
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
      out.push({ key: i.id, part: i.part, text: i.text, answer: i.answer, cue: i.cue });
      if (i.followUp) out.push({ key: `${i.id}-f`, part: i.part, text: i.followUp.text, answer: i.followUp.answer, follow: i.followUp.trigger });
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

  const step = steps[idx];
  const { level } = useMicLevel(phase === "recording");
  const words = step.answer.split(" ");
  const spoken = Math.min(words.length, Math.floor(recT * WPS));
  const maxRec = step.part === 2 ? 120 : step.part === 3 ? 60 : 40;
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
    setPhase("recording");
  }

  function stopRec() {
    setAnswers((a) => ({ ...a, [step.key]: { secs: recT, words: spoken } }));
    setPhase("answered");
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
  };
}
