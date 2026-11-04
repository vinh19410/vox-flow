import { ArrowRight, Check, Mic, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ds/button";
import { Wave } from "@/components/ds/wave";
import { useMicLevel } from "@/hooks/use-mic-level";
import { cx } from "@/lib/cx";

export interface MicCheckProps {
  onNext: () => void;
  compact?: boolean;
}

export function MicCheck({ onNext, compact }: MicCheckProps) {
  const [phase, setPhase] = useState<"idle" | "rec" | "done">("idle")
  const [t, setT] = useState(0)
  const { level, real } = useMicLevel(phase === "rec")
  useEffect(() => {
    if (phase !== "rec") return
    const id = setInterval(() => setT((x) => x + 0.1), 100)
    return () => clearInterval(id)
  }, [phase])
  useEffect(() => {
    if (t >= 5) setPhase("done")
  }, [t])
  const noise = 32 // dB, simulated ambient reading
  return (
    <>
      {!compact && (
        <>
          <h1 className="text-[30px] leading-tight font-bold tracking-tight">Kiểm tra micro & môi trường</h1>
          <p className="mt-2 text-ink-2">Thử ghi 5 giây. Âm thanh rõ giúp chấm phát âm chính xác hơn.</p>
        </>
      )}
      <div className="mt-8 rounded-3xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cx("relative grid h-11 w-11 place-items-center rounded-full", phase === "rec" ? "bg-brand text-white" : "bg-paper-2 text-ink")}>
              {phase === "rec" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand" />}
              <Mic size={20} className="relative" />
            </div>
            <div>
              <div className="text-sm font-semibold">{phase === "idle" ? "Micro mặc định" : phase === "rec" ? "Đang ghi… đọc to câu bên dưới" : "Ghi thử xong"}</div>
              <div className="text-xs text-subtle">{real === false ? "Chế độ mô phỏng (trình duyệt chặn micro)" : "Đang dùng micro hệ thống"}</div>
            </div>
          </div>
          <span className="tnum font-mono text-sm text-subtle">{Math.min(t, 5).toFixed(1)}s / 5.0s</span>
        </div>
        <Wave level={level} active={phase === "rec"} bars={48} className="mt-6" />
        <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-[15px] italic text-ink-2">“I usually spend my weekends reading books and meeting friends.”</p>
        {phase === "done" && (
          <div className="mt-5 grid animate-rise grid-cols-3 gap-3">
            {[
              ["Âm lượng", "Tốt", "good"],
              ["Độ ồn nền", `${noise} dB`, "good"],
              ["Độ rõ", "94%", "good"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-good-soft p-3">
                <div className="text-[11px] text-good">{k}</div>
                <div className="mt-0.5 flex items-center gap-1 font-bold text-good">
                  <Check size={14} /> {v}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3 text-[13px] text-warn">
        <TriangleAlert size={16} className="mt-0.5 shrink-0" />
        Nếu độ ồn trên 50 dB: đóng cửa sổ, tắt quạt gần micro hoặc dùng tai nghe có mic.
      </div>
      <div className="mt-8 flex items-center justify-between">
        <button onClick={onNext} className="text-sm font-medium text-subtle hover:text-ink">
          Bỏ qua
        </button>
        {phase === "done" ? (
          <Button onClick={onNext}>
            Micro ổn, tiếp tục <ArrowRight size={16} />
          </Button>
        ) : (
          <Button variant="accent" disabled={phase === "rec"} onClick={() => (setT(0), setPhase("rec"))}>
            <Mic size={16} /> {phase === "rec" ? "Đang ghi…" : "Ghi thử 5 giây"}
          </Button>
        )}
      </div>
    </>
  )
}
