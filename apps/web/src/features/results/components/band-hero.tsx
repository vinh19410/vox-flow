import { ArrowRight, Quote } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { BandRange } from "@/components/ds/band-range";

export interface BandHeroProps {
  band: number;
  /** Confidence range; the range label is hidden when absent. */
  range?: readonly [number, number];
  /** Overall band of the parent attempt when this attempt is a retake (D-05). */
  previousOverall?: number | null;
  target: number;
  /** Independent run bands; the runs panel is hidden when absent. */
  runs?: readonly number[];
  oneLiner?: string;
}

/** S12 — overall band card, always free. */
export function BandHero({
  band,
  range,
  previousOverall,
  target,
  runs,
  oneLiner = "Điểm số và khoảng tin cậy được tính toán từ các lượt chấm độc lập.",
}: BandHeroProps) {
  const rawDelta = typeof previousOverall === "number" ? Math.round((band - previousOverall) * 10) / 10 : null;
  const delta = rawDelta === 0 ? 0 : rawDelta;
  return (
    <div className="rounded-[28px] bg-ink p-7 text-paper">
      <div className="flex items-center justify-between">
        <Badge tone="dark" className="bg-white/10">
          Band tổng · Miễn phí
        </Badge>
        <span className="text-xs text-white/45">Mục tiêu {target.toFixed(1)}</span>
      </div>
      <div className="mt-6 flex items-end gap-5">
        <span className="tnum text-[96px] leading-[0.85] font-extrabold tracking-tight">{band.toFixed(1)}</span>
        {range && (
          <div className="pb-1">
            <div className="text-xs text-white/45">Khoảng tin cậy</div>
            <div className="tnum text-xl font-semibold">
              {range[0].toFixed(1)} – {range[1].toFixed(1)}
            </div>
          </div>
        )}
      </div>
      {typeof previousOverall === "number" && delta !== null && (
        <div
          data-testid="retake-band-comparison"
          className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2 text-xs"
        >
          <span className="text-white/65">Band trước {previousOverall.toFixed(1)}</span>
          <ArrowRight size={13} className="text-white/45" />
          <span className="font-semibold text-white">Band mới {band.toFixed(1)}</span>
          <span
            className={`tnum rounded-full px-2 py-0.5 font-semibold ${
              delta > 0 ? "bg-good/20 text-good" : delta < 0 ? "bg-bad/20 text-bad" : "bg-white/10 text-white/75"
            }`}
          >
            {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
          </span>
        </div>
      )}
      <div className="mt-7">
        {/* Without a range the scale shows the point estimate only. */}
        <BandRange band={band} range={range ?? [band, band]} target={target} dark />
      </div>
      {runs && runs.length > 0 && (
      <div className="mt-6 rounded-2xl bg-white/[0.06] p-4">
        <div className="text-[11px] font-semibold tracking-wider text-white/45 uppercase">Chấm 3 lần độc lập</div>
        <div className="mt-2 flex items-center gap-2 font-mono text-sm">
          {runs.map((r, k) => (
            <span key={k} className="rounded-lg bg-white/10 px-2 py-1">
              {r.toFixed(1)}
            </span>
          ))}
          <ArrowRight size={14} className="text-white/40" />
          <span className="rounded-lg bg-brand px-2 py-1 font-semibold text-white">trung vị {band.toFixed(1)}</span>
        </div>
        <div className="mt-2 text-xs text-white/45">Chênh lệch giữa các lần: 0.5 — trong ngưỡng ổn định.</div>
      </div>
      )}
      {oneLiner && (
        <p className="mt-5 text-[15px] leading-relaxed text-white/80">
          <Quote size={14} className="mr-1.5 inline text-brand" />
          {oneLiner}
        </p>
      )}
    </div>
  );
}
