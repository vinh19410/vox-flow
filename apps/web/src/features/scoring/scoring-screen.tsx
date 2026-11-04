import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Logo } from "@/components/ds/logo";
import type { Attempt } from "@/features/history/types";
import { RESULT } from "@/features/results/data";
import { cx } from "@/lib/cx";

import { SCORING_STEPS } from "./data";

/**
 * S11 — scoring animation. Only a real exam submission (`pendingSubmission`
 * on mount) commits an attempt; direct /scoring visits just replay the
 * animation and fall through to the default result.
 */
export function ScoringScreen() {
  const { s, set, goResult, pendingSubmission, setPendingSubmission, setLastUnpersistedAttempt } = useApp();
  const [i, setI] = useState(0);
  const added = useRef(false);
  const newId = useRef<string | null>(null);
  // Mount snapshot: never re-commit after Back/refresh replays.
  const wasPending = useRef(pendingSubmission);

  useEffect(() => {
    if (i >= SCORING_STEPS.length) {
      if (!added.current) {
        added.current = true;
        if (wasPending.current) {
          const pr = s.practice;
          const attempt: Attempt = {
            id: `new${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            mode: pr ? (pr.kind === "p1" ? "p1" : "p2") : s.mode,
            band: RESULT.overall,
            range: RESULT.range,
            topic: pr ? `Forecast · ${pr.title}` : "Accommodation · Helping others",
          };
          newId.current = attempt.id;
          // Respect consent: keep the attempt transient when saving is off.
          set((prev) => ({
            ...(pr ? { practiced: { ...prev.practiced, [pr.topicId]: RESULT.overall } } : {}),
            practice: null,
            ...(s.consent.save ? { attempts: [...prev.attempts, attempt] } : {}),
          }));
          if (!s.consent.save) setLastUnpersistedAttempt(attempt);
          setPendingSubmission(false);
        }
      }
      const t = setTimeout(() => goResult(newId.current ?? "latest", { replace: true }), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setI((x) => x + 1), i < 2 ? 650 : 480);
    return () => clearTimeout(t);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.min(100, (i / SCORING_STEPS.length) * 100);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-5 py-5 sm:px-8">
        <Logo />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-md animate-rise">
          <div className="text-xs font-semibold tracking-[0.14em] text-subtle uppercase">Đang chấm</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Đang phân tích bài nói của bạn</h1>
          <p className="mt-2 text-sm text-ink-2">Thường mất dưới 5 giây. Bạn có thể giữ nguyên màn hình.</p>
          <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <ol className="mt-8 space-y-3">
            {SCORING_STEPS.map((st, k) => {
              const state = k < i ? "done" : k === i ? "now" : "todo";
              const run = k >= 2 && k <= 4 ? RESULT.runs[k - 2] : null;
              return (
                <li key={k} className={cx("flex items-center gap-3 transition-opacity", state === "todo" && "opacity-35")}>
                  <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-full", state === "done" ? "bg-good text-white" : state === "now" ? "bg-brand-soft text-brand" : "bg-paper-2")}>
                    {state === "done" ? <Check size={14} /> : state === "now" ? <LoaderCircle size={14} className="animate-spin" /> : null}
                  </span>
                  <span className="flex-1 text-[15px] font-medium">{st.t}</span>
                  {state === "done" && (
                    <span className="tnum animate-fade font-mono text-xs text-subtle">
                      {run !== null
                        ? `band ${run.toFixed(1)}`
                        : k === 5
                          ? `${RESULT.overall.toFixed(1)} (${RESULT.range[0].toFixed(1)}–${RESULT.range[1].toFixed(1)})`
                          : st.d}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
