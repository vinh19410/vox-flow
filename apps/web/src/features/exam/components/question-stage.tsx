import { CornerDownRight } from "lucide-react";

import { cx } from "@/lib/cx";

import type { ExaminerVoice } from "../types";
import type { ExamPhase, ExamStep } from "../use-exam-session";

export interface QuestionStageProps {
  voice: ExaminerVoice;
  phase: ExamPhase;
  typed: number;
  step: ExamStep;
}

export function QuestionStage({ voice, phase, typed, step }: QuestionStageProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative">
          {phase === "asking" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/40" />}
          <div className="relative grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#ffb08f] to-brand font-bold text-white">
            {voice.name[0]}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">{voice.name} · Giám khảo</div>
          <div className="text-xs text-white/45">
            {phase === "asking"
              ? "Đang hỏi…"
              : phase === "recording"
                ? "Đang lắng nghe"
                : phase === "prep"
                  ? "Đang chờ bạn chuẩn bị"
                  : phase === "examiner-thinking"
                    ? "Đang chuẩn bị câu tiếp theo…"
                    : voice.accent}
          </div>
        </div>
      </div>

      {step.follow && phase !== "examiner-thinking" && (
        <div className="mt-6 flex w-fit animate-fade items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs text-brand">
          <CornerDownRight size={13} /> Hỏi nối tiếp · dựa trên “{step.follow}” trong câu trả lời của bạn
        </div>
      )}

      {phase !== "examiner-thinking" && (
        <h2 className={cx("mt-5 text-[26px] leading-snug font-semibold tracking-tight sm:text-[32px]", step.cue && "sr-only")}>
          {step.text.slice(0, phase === "asking" ? typed : undefined)}
          {phase === "asking" && typed < step.text.length && (
            <span className="ml-0.5 inline-block h-7 w-0.5 animate-pulse bg-brand align-middle" />
          )}
        </h2>
      )}
    </>
  );
}
