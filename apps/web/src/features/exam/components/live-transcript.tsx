import type { ExamAnswer, ExamPhase } from "../use-exam-session";

export interface LiveTranscriptProps {
  phase: Extract<ExamPhase, "recording" | "answered">;
  words: string[];
  spoken: number;
  ans?: ExamAnswer;
}

export function LiveTranscript({ phase, words, spoken, ans }: LiveTranscriptProps) {
  const shown = phase === "answered" ? (ans?.words ?? 0) : spoken;
  return (
    <div className="mt-8 animate-fade rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between text-xs text-white/45">
        <span>{phase === "recording" ? "Đang nhận dạng giọng nói…" : "Transcript"}</span>
        <span className="tnum font-mono">{shown} từ</span>
      </div>
      <p className="mt-3 text-[17px] leading-relaxed text-white/85">
        {words.slice(0, shown).join(" ")}
        {phase === "recording" && (
          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-brand align-middle" />
        )}
        {phase === "answered" && !ans?.words && <span className="text-white/35 italic">(Không nhận được giọng nói)</span>}
      </p>
    </div>
  );
}
