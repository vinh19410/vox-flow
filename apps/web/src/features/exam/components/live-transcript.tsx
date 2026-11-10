import { mmss } from "@/lib/format";

import type { ExamAnswer, ExamPhase } from "../use-exam-session";

export interface LiveTranscriptProps {
  phase: Extract<ExamPhase, "recording" | "answered" | "examiner-thinking">;
  ans?: ExamAnswer;
}

export function LiveTranscript({ phase, ans }: LiveTranscriptProps) {
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

  if (phase === "recording") {
    return (
      <div className="mt-8 animate-fade rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2 text-xs text-white/45">
          <div className="flex items-center gap-0.5" aria-hidden="true">
            <span className="inline-block h-3 w-1 animate-pulse rounded-full bg-brand" />
            <span className="inline-block h-4 w-1 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
            <span className="inline-block h-2 w-1 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
          </div>
          <span role="status">Đang ghi âm…</span>
        </div>
      </div>
    );
  }

  const secs = ans ? Math.round((ans.durationMs ?? ans.secs * 1000) / 1000) : 0;
  return (
    <div className="mt-8 animate-fade rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs text-white/45">
        <span>Đã ghi âm{secs > 0 ? ` · ${mmss(secs)}` : ""}</span>
      </div>
      <p className="mt-3 text-sm italic text-white/35">(Transcript không hiển thị trong phòng thi.)</p>
    </div>
  );
}
