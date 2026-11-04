import { Check, Volume2, VolumeX, X } from "lucide-react";

import { cx } from "@/lib/cx";
import { mmss } from "@/lib/format";

import { PART_INFO } from "../data";
import type { Part } from "../types";

export interface ExamHeaderProps {
  parts: Part[];
  activePart: Part;
  partT: number;
  muted: boolean;
  onToggleMuted: () => void;
  onExit: () => void;
}

export function ExamHeader({ parts, activePart, partT, muted, onToggleMuted, onExit }: ExamHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <button
        onClick={onExit}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
      >
        <X size={16} /> Thoát
      </button>
      <div className="flex items-center gap-1.5">
        {parts.map((p) => (
          <div
            key={p}
            className={cx(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
              p === activePart ? "bg-white text-ink" : p < activePart ? "text-good" : "text-white/35",
            )}
          >
            {p < activePart && <Check size={12} />}Part {p}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="tnum hidden font-mono text-sm text-white/60 sm:inline">
          {mmss(partT)} <span className="text-white/30">/ {PART_INFO[activePart].time}</span>
        </span>
        <button
          onClick={onToggleMuted}
          className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/5"
          aria-label="Bật/tắt giọng giám khảo"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </header>
  );
}
