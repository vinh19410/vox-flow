import { FORECAST } from "@/features/forecast/data";
import type { ForecastKind } from "@/features/forecast/types";
import { daysUntil } from "@/lib/format";

export interface CoverageBannerProps {
  practiced: Record<string, number>;
  examDate: string | null;
}

export function CoverageBanner({ practiced, examDate }: CoverageBannerProps) {
  const done = FORECAST.filter((t) => practiced[t.id] !== undefined);
  const days = daysUntil(examDate);
  const remaining = FORECAST.length - done.length;

  return (
    <div className="rounded-[28px] bg-ink p-7 text-paper">
      <div className="text-xs font-medium text-white/50">Độ phủ đề forecast của bạn</div>
      <div className="mt-2 flex items-end gap-3">
        <span className="tnum text-[56px] leading-none font-extrabold tracking-tight">{done.length}</span>
        <span className="pb-1.5 text-white/60">/ {FORECAST.length} chủ đề đã luyện</span>
      </div>
      <div className="mt-6 space-y-3">
        {(["p1", "p23"] as ForecastKind[]).map((k) => {
          const total = FORECAST.filter((t) => t.kind === k).length;
          const d = done.filter((t) => t.kind === k).length;
          return (
            <div key={k}>
              <div className="mb-1.5 flex justify-between text-xs text-white/60">
                <span>{k === "p1" ? "Part 1" : "Part 2 & 3"}</span>
                <span className="tnum">
                  {d}/{total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${(d / total) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {days !== null && remaining > 0 && (
        <div className="mt-6 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/75">
          Còn <b className="text-white">{days} ngày</b> đến ngày thi — luyện khoảng <b className="text-brand">{Math.max(1, Math.ceil(remaining / Math.max(days, 1)))} chủ đề/ngày</b> để phủ hết đề quý này.
        </div>
      )}
    </div>
  );
}
