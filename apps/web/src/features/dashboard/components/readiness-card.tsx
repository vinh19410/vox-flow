import { Target } from "lucide-react";

import { BandRange } from "@/components/ds/band-range";
import { fmtBand } from "@/lib/format";

export interface ReadinessCardProps {
  estBand: number | null;
  target: number;
}

export function ReadinessCard({ estBand, target }: ReadinessCardProps) {
  const hasEst = estBand !== null && estBand > 0;
  const gap = hasEst ? target - estBand : null;
  return (
    <div className="min-w-0 rounded-[28px] bg-ink p-5 text-paper sm:p-7 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium text-white/50">Band ước lượng hiện tại</div>
          <div className="mt-2 flex flex-wrap items-end gap-3 sm:gap-4">
            <span className="tnum text-[56px] leading-none font-extrabold tracking-tight sm:text-[72px]">
              {hasEst ? fmtBand(estBand) : "—"}
            </span>
            <div className="pb-1 sm:pb-2">
              <div className="tnum text-base font-semibold sm:text-lg">
                {hasEst
                  ? `${fmtBand(estBand - 0.5)} – ${fmtBand(estBand + 0.5 > 9 ? 9 : estBand)}`
                  : "Chưa đủ dữ liệu"}
              </div>
              <div className="text-xs text-white/50">
                {hasEst ? "khoảng tin cậy · 4 bài gần nhất" : "cần tối thiểu 1 bài thi"}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/[0.07] px-3.5 py-2.5 text-left sm:px-4 sm:py-3 sm:text-right">
          <div className="flex items-center gap-1.5 text-xs text-white/50 sm:justify-end">
            <Target size={13} /> Mục tiêu
          </div>
          <div className="tnum text-xl font-bold sm:text-2xl">{fmtBand(target)}</div>
          <div className="text-xs text-brand">
            {gap !== null ? (gap > 0 ? `còn thiếu ${fmtBand(gap)}` : "đã đạt") : "mục tiêu đề ra"}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <BandRange band={estBand ?? target} range={[estBand ? estBand - 0.5 : target, estBand ?? target]} target={target} dark />
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {hasEst ? (
          <>
            <span className="rounded-full bg-white/[0.07] px-3 py-1.5">Ước lượng: Band {fmtBand(estBand)}</span>
            <span className="rounded-full bg-brand/20 px-3 py-1.5 text-brand">Mục tiêu: Band {fmtBand(target)}</span>
          </>
        ) : (
          <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-white/70">
            Làm bài thi thử để hệ thống bắt đầu ước lượng band
          </span>
        )}
      </div>
    </div>
  );
}
