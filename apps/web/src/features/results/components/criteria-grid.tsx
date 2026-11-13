import { Lock } from "lucide-react";

import { cx } from "@/lib/cx";
import type { Criterion, CritKey } from "../types";

export interface CriteriaGridProps {
  /** Currently selected criterion, or null to highlight nothing. */
  sel: CritKey | null;
  pro: boolean;
  onPick: (key: CritKey) => void;
  criteria?: Criterion[];
}

export function CriteriaGrid({ sel, pro, onPick, criteria = [] }: CriteriaGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {criteria.map((c) => {
        const on = sel === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onPick(c.key)}
            className={cx(
              "group relative flex flex-col overflow-hidden rounded-3xl border bg-white p-5 text-left transition-all",
              on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/30",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold text-subtle">{c.key}</span>
              {!pro && <Lock size={14} className="text-subtle" />}
            </div>
            <div className="mt-1 text-sm leading-tight font-semibold">{c.vi}</div>
            <div className="mt-auto flex items-end justify-between pt-5">
              <span className={cx("tnum text-[40px] leading-none font-extrabold tracking-tight", !pro && "blur-[9px] select-none")}>
                {c.band != null ? c.band.toFixed(1) : "—"}
              </span>
              {c.range && (
                <span className={cx("tnum font-mono text-xs text-subtle", !pro && "blur-[5px]")}>
                  {c.range[0].toFixed(1)}–{c.range[1].toFixed(1)}
                </span>
              )}
            </div>
            {!pro && <span className="mt-3 text-xs font-semibold text-brand group-hover:underline">Mở khóa chi tiết →</span>}
          </button>
        );
      })}
    </div>
  );
}
