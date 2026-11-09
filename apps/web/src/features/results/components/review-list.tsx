import { useEffect, useState } from "react";
import { CornerDownRight, Lock, Pause, Play } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Badge } from "@/components/ds/badge";
import { Card } from "@/components/ds/card";
import { cx } from "@/lib/cx";
import { mmss } from "@/lib/format";

import { MARK } from "../review-data";
import type { ReviewItem, Seg } from "../types";

export interface ReviewListProps {
  pro: boolean;
  items?: ReviewItem[];
}

export function ReviewList({ pro, items = [] }: ReviewListProps) {
  const { openPaywall } = useApp();
  const [playing, setPlaying] = useState<string | null>(null);
  const [pos, setPos] = useState(0);
  const [mark, setMark] = useState<{ id: string; i: number } | null>(null);

  if (!items.length) {
    return (
      <div className="py-12 text-center text-sm text-subtle">
        Chưa có dữ liệu phân tích từng câu.
      </div>
    );
  }

  const current = playing ? (items.find((r) => r.id === playing) ?? null) : null;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPos((p) => p + 0.2), 200);
    return () => clearInterval(id);
  }, [playing]);

  // Stop cleanly at the end instead of resetting state inside setPos.
  useEffect(() => {
    if (current && pos >= current.dur) {
      setPlaying(null);
      setPos(0);
    }
  }, [pos, current]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-2">
        {Object.entries(MARK).map(([k, m]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cx("h-2 w-2 rounded-full", m.dot)} /> {m.label}
          </span>
        ))}
        {!pro && (
          <button onClick={openPaywall} className="ml-auto flex items-center gap-1.5 font-semibold text-brand">
            <Lock size={12} /> Mở khóa đánh dấu lỗi
          </button>
        )}
      </div>
      {items.map((r) => {
        const isPlaying = playing === r.id;
        const selected = mark?.id === r.id ? (r.segs[mark.i] as Exclude<Seg, string>) : null;
        return (
          <Card key={r.id} className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <button
                onClick={() => {
                  setPos(0);
                  setPlaying(isPlaying ? null : r.id);
                }}
                className={cx(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors",
                  isPlaying ? "bg-brand text-white" : "bg-ink text-paper hover:bg-ink-2",
                )}
                aria-label="Phát lại"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-subtle">{r.label}</span>
                  {r.followUp && (
                    <Badge tone="accent">
                      <CornerDownRight size={11} /> Nối tiếp từ “{r.trigger}”
                    </Badge>
                  )}
                  <span className="tnum ml-auto font-mono text-xs text-subtle">
                    {isPlaying ? `${mmss(pos)} / ` : ""}
                    {mmss(r.dur)}
                  </span>
                </div>
                <div className="mt-1 font-semibold">{r.q}</div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-paper-2">
                  <div className="h-full bg-brand transition-all" style={{ width: isPlaying ? `${(pos / r.dur) * 100}%` : "0%" }} />
                </div>
                <p className="mt-4 text-[15px] leading-[1.8] text-ink-2">
                  {r.segs.map((sg, i) => {
                    if (typeof sg === "string") return <span key={i}>{sg}</span>;
                    if (!pro) return <span key={i}>{sg.t}</span>;
                    const active = mark?.id === r.id && mark.i === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setMark(active ? null : { id: r.id, i })}
                        className={cx(
                          "rounded px-1 font-medium underline decoration-wavy decoration-1 underline-offset-4 transition-all",
                          MARK[sg.type].cls,
                          active && "ring-2 ring-current",
                        )}
                      >
                        {sg.t}
                      </button>
                    );
                  })}
                </p>
                {selected && (
                  <div className="mt-3 flex animate-rise items-start gap-3 rounded-2xl bg-paper p-4 text-sm">
                    <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", MARK[selected.type].dot)} />
                    <div>
                      <div>
                        <span className="text-subtle line-through">{selected.t}</span> → <b className="text-good">{selected.fix}</b>
                      </div>
                      <div className="mt-1 text-ink-2">{selected.note}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
