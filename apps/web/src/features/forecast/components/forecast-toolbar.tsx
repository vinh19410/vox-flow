import { Search } from "lucide-react";

import type { ForecastKind } from "@/features/forecast/types";
import { cx } from "@/lib/cx";

export type ForecastFilter = "all" | "hot" | "new" | "todo" | "saved";

export const FORECAST_FILTERS: [ForecastFilter, string][] = [
  ["all", "Tất cả"],
  ["hot", "Hay gặp"],
  ["new", "Mới trong quý"],
  ["todo", "Chưa luyện"],
  ["saved", "Đã lưu"],
];

export interface ForecastToolbarProps {
  counts: Record<ForecastKind, number>;
  kind: ForecastKind;
  onKind: (k: ForecastKind) => void;
  filter: ForecastFilter;
  onFilter: (f: ForecastFilter) => void;
  q: string;
  onQ: (q: string) => void;
}

export function ForecastToolbar({ counts, kind, onKind, filter, onFilter, q, onQ }: ForecastToolbarProps) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-full bg-paper-2 p-1">
        {(["p1", "p23"] as ForecastKind[]).map((k) => (
          <button key={k} onClick={() => onKind(k)} className={cx("h-10 rounded-full px-5 text-sm font-semibold transition-all", kind === k ? "bg-white shadow-sm" : "text-ink-2")}>
            {k === "p1" ? "Part 1" : "Part 2 & 3"} <span className="tnum ml-1 text-xs text-subtle">{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>
      <label className="flex h-11 min-w-56 flex-1 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-ink sm:max-w-xs">
        <Search size={16} className="text-subtle" />
        <input value={q} onChange={(e) => onQ(e.target.value)} placeholder="Tìm chủ đề hoặc câu hỏi…" className="flex-1 bg-transparent text-sm outline-none" />
      </label>
      <div className="flex flex-wrap gap-2">
        {FORECAST_FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => onFilter(k)} className={cx("h-9 rounded-full px-4 text-[13px] font-medium transition-colors", filter === k ? "bg-ink text-paper" : "border border-line bg-white hover:border-ink/30")}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
