import { Target } from "lucide-react";

import { BandRange } from "@/components/ds/band-range";
import { fmtBand } from "@/lib/format";

export interface ReadinessCardProps {
  estBand: number;
  target: number;
}

export function ReadinessCard({ estBand, target }: ReadinessCardProps) {
  const gap = target - estBand;
  return (
    <div className="rounded-[28px] bg-ink p-7 text-paper lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-white/50">Band ước lượng hiện tại</div>
          <div className="mt-2 flex items-end gap-4">
            <span className="tnum text-[72px] leading-none font-extrabold tracking-tight">{fmtBand(estBand)}</span>
            <div className="pb-2">
              <div className="tnum text-lg font-semibold">
                {fmtBand(estBand - 0.5)} – {fmtBand(estBand + 0.5 > 9 ? 9 : estBand)}
              </div>
              <div className="text-xs text-white/50">khoảng tin cậy · 4 bài gần nhất</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/[0.07] px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs text-white/50">
            <Target size={13} /> Mục tiêu
          </div>
          <div className="tnum text-2xl font-bold">{fmtBand(target)}</div>
          <div className="text-xs text-brand">{gap > 0 ? `còn thiếu ${fmtBand(gap)}` : "đã đạt"}</div>
        </div>
      </div>
      <div className="mt-8">
        <BandRange band={estBand} range={[estBand - 0.5, estBand]} target={target} dark />
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/[0.07] px-3 py-1.5">Điểm mạnh: Phát âm 7.0</span>
        <span className="rounded-full bg-brand/20 px-3 py-1.5 text-brand">Cần cải thiện: Ngữ pháp 6.0</span>
      </div>
    </div>
  );
}
