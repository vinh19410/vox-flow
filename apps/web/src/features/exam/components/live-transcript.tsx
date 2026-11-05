import type { ExamAnswer, ExamPhase } from "../use-exam-session";

export interface LiveTranscriptProps {
  phase: Extract<ExamPhase, "recording" | "answered" | "examiner-thinking">;
  words: string[];
  spoken: number;
  ans?: ExamAnswer;
}

export function LiveTranscript({ phase, words, spoken, ans }: LiveTranscriptProps) {
  const shown = phase === "answered" ? (ans?.words ?? 0) : spoken;

  if (phase === "examiner-thinking") {
    return (
      <div className="mt-8 animate-fade rounded-3xl border border-brand/20 bg-brand/[0.04] p-5">
        <div className="flex items-center gap-2 text-xs text-brand">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-brand" />
          <span>Giám khảo AI đang phân tích câu trả lời…</span>
        </div>
        <p className="mt-3 text-sm text-white/60">
          Hệ thống đang chuẩn bị câu hỏi nối tiếp bám sát ý tưởng bạn vừa chia sẻ.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-fade rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between text-xs text-white/45">
        <div className="flex items-center gap-2">
          {phase === "recording" && (
            <div className="flex items-center gap-0.5" aria-hidden="true">
              <span className="inline-block h-3 w-1 animate-pulse rounded-full bg-brand" />
              <span className="inline-block h-4 w-1 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
              <span className="inline-block h-2 w-1 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
            </div>
          )}
          <span>{phase === "recording" ? "Đang ghi âm & nhận dạng giọng nói…" : "Transcript"}</span>
        </div>
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
