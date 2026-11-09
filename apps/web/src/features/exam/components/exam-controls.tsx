import { ArrowRight, Mic, RotateCcw, Square } from "lucide-react";

import { Button } from "@/components/ds/button";
import { Wave } from "@/components/ds/wave";
import { cx } from "@/lib/cx";
import { mmss } from "@/lib/format";

import type { ExamPhase } from "../use-exam-session";

export interface ExamControlsProps {
  phase: ExamPhase;
  level: number;
  recT: number;
  maxRec: number;
  nextLabel: string;
  onStartRec: () => void;
  onStopRec: () => void;
  onRestart: () => void;
  onNext: () => void;
}

export function ExamControls({ phase, level, recT, maxRec, nextLabel, onStartRec, onStopRec, onRestart, onNext }: ExamControlsProps) {
  return (
    <div className="mt-auto flex flex-col items-center pt-10">
      {phase === "prep" && (
        <Button variant="accent" size="lg" onClick={onStartRec}>
          <Mic size={18} /> Sẵn sàng, bắt đầu nói
        </Button>
      )}
      {(phase === "ready" || phase === "recording" || phase === "asking") && (
        <>
          <Wave level={level} active={phase === "recording"} bars={44} className="mb-6 h-14 w-full max-w-md justify-center" />
          <div className="relative">
            {phase === "recording" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand" />}
            <button
              disabled={phase === "asking"}
              onClick={phase === "recording" ? onStopRec : onStartRec}
              className={cx(
                "relative grid h-20 w-20 place-items-center rounded-full transition-all",
                phase === "recording" ? "bg-brand" : "bg-white text-ink hover:scale-105",
                phase === "asking" && "opacity-30",
              )}
              aria-label={phase === "recording" ? "Dừng ghi" : "Bắt đầu ghi"}
            >
              {phase === "recording" ? <Square size={24} fill="white" className="text-white" /> : <Mic size={28} />}
            </button>
          </div>
          <div className="tnum mt-4 font-mono text-sm text-white/55">
            {phase === "recording" ? (
              <>
                <span className="text-brand">●</span> {mmss(recT)} <span className="text-white/30">/ {mmss(maxRec)}</span>
              </>
            ) : phase === "asking" ? (
              "Hãy lắng nghe câu hỏi"
            ) : (
              "Bấm micro hoặc nhấn Space để trả lời"
            )}
          </div>
        </>
      )}
      {phase === "answered" && (
        <div className="flex animate-rise items-center gap-3">
          <Button variant="ghost" className="text-white/70 hover:bg-white/5" onClick={onRestart}>
            <RotateCcw size={16} /> Nói lại
          </Button>
          <Button variant="accent" size="lg" onClick={onNext}>
            {nextLabel} <ArrowRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
