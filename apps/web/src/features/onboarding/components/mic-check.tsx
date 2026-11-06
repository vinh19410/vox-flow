import { ArrowRight, Check, Lock, Mic, RefreshCw, TriangleAlert } from "lucide-react";
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
  const [phase, setPhase] = useState<"idle" | "rec" | "done">("idle");
  const [t, setT] = useState(0);
  const [blocked, setBlocked] = useState<null | "denied" | "unavailable">(null);
  const [maxLevel, setMaxLevel] = useState(0);
  const [tooQuiet, setTooQuiet] = useState(false);
  const { level, status, denied } = useMicLevel(phase === "rec");

  useEffect(() => {
    if (phase === "rec") {
      setMaxLevel((m) => Math.max(m, level));
    }
  }, [phase, level]);

  useEffect(() => {
    if (phase !== "rec") return;
    if (denied || status === "denied" || status === "unavailable") {
      setBlocked(status === "unavailable" ? "unavailable" : "denied");
      setPhase("idle");
      setT(0);
      return;
    }
    if (status !== "listening") return;

    const id = setInterval(() => setT((x) => x + 0.1), 100);
    return () => clearInterval(id);
  }, [phase, status, denied]);

  useEffect(() => {
    if (t >= 5 && status === "listening") {
      if (maxLevel >= 0.05) {
        setPhase("done");
        setTooQuiet(false);
      } else {
        setPhase("idle");
        setTooQuiet(true);
        setT(0);
      }
    }
  }, [t, status, maxLevel]);

  const handleRetry = () => {
    setBlocked(null);
    setTooQuiet(false);
    setMaxLevel(0);
    setT(0);
    setPhase("rec");
  };

  const isBlocked = Boolean(blocked || denied || status === "denied" || status === "unavailable");

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
            <div
              className={cx(
                "relative grid h-11 w-11 place-items-center rounded-full",
                isBlocked
                  ? "bg-bad-soft text-bad"
                  : tooQuiet
                    ? "bg-warn-soft text-warn"
                    : phase === "rec"
                      ? "bg-brand text-white"
                      : "bg-paper-2 text-ink",
              )}
            >
              {phase === "rec" && !isBlocked && (
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand" />
              )}
              {isBlocked ? <Lock size={20} /> : <Mic size={20} className="relative" />}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {isBlocked
                  ? "Micro bị chặn"
                  : tooQuiet
                    ? "Không nghe thấy tiếng"
                    : phase === "idle"
                      ? "Micro mặc định"
                      : phase === "rec"
                        ? "Đang ghi… đọc to câu bên dưới"
                        : "Ghi thử xong"}
              </div>
              <div className="text-xs text-subtle">
                {isBlocked
                  ? "Chưa cấp quyền truy cập micro"
                  : tooQuiet
                    ? "Tín hiệu âm thanh quá nhỏ"
                    : status === "listening"
                      ? "Đang dùng micro hệ thống"
                      : "Sẵn sàng kiểm tra micro"}
              </div>
            </div>
          </div>
          <span className="tnum font-mono text-sm text-subtle">{Math.min(t, 5).toFixed(1)}s / 5.0s</span>
        </div>

        <Wave level={level} active={phase === "rec" && !isBlocked} bars={48} className="mt-6" />
        <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-[15px] italic text-ink-2">
          “I usually spend my weekends reading books and meeting friends.”
        </p>

        {phase === "done" && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-good-soft p-4 font-semibold text-good">
            <Check size={18} /> Đã nhận tín hiệu micro thành công
          </div>
        )}
      </div>

      {isBlocked ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-bad-soft px-4 py-3 text-[13px] text-bad">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Trình duyệt đang chặn micro.</div>
            <div className="mt-0.5 text-ink-2">
              Vui lòng bấm vào biểu tượng ổ khóa trên thanh địa chỉ, bật quyền Micro, sau đó bấm nút “Thử lại quyền micro”.
            </div>
          </div>
        </div>
      ) : tooQuiet ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3 text-[13px] text-warn">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Không nghe thấy tiếng micro.</div>
            <div className="mt-0.5 text-ink-2">
              Vui lòng kiểm tra micro không bị tắt tiếng (mute), nói to hơn gần micro và bấm nút “Thử lại âm thanh”.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3 text-[13px] text-warn">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          Nếu độ ồn trên 50 dB: đóng cửa sổ, tắt quạt gần micro hoặc dùng tai nghe có mic.
        </div>
      )}

      <div className="mt-8 flex items-center justify-end">
        {phase === "done" ? (
          <Button onClick={onNext}>
            Micro ổn, tiếp tục <ArrowRight size={16} />
          </Button>
        ) : isBlocked ? (
          <Button variant="accent" onClick={handleRetry}>
            <RefreshCw size={16} /> Thử lại quyền micro
          </Button>
        ) : tooQuiet ? (
          <Button variant="accent" onClick={handleRetry}>
            <RefreshCw size={16} /> Thử lại âm thanh
          </Button>
        ) : (
          <Button
            variant="accent"
            disabled={phase === "rec"}
            onClick={() => {
              setMaxLevel(0);
              setT(0);
              setPhase("rec");
            }}
          >
            <Mic size={16} /> {phase === "rec" ? "Đang ghi…" : "Ghi thử 5 giây"}
          </Button>
        )}
      </div>
    </>
  );
}
