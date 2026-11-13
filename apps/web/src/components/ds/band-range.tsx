import { cx } from "@/lib/cx";

export interface BandRangeProps {
  band: number;
  range: readonly [number, number];
  min?: number;
  max?: number;
  dark?: boolean;
  target?: number;
}

/** Band scale 4.0–9.0 with confidence range and point estimate (feature C). */
export function BandRange({
  band,
  range,
  min = 4,
  max = 9,
  dark = false,
  target,
}: BandRangeProps) {
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const widthPct = Math.max(pct(range[1]) - pct(range[0]), 1.5);
  const leftPct = Math.min(pct(range[0]), 100 - widthPct);
  const ticks = Array.from(
    { length: (max - min) * 2 + 1 },
    (_, i) => min + i * 0.5,
  );
  return (
    <div className="w-full">
      <div
        className={cx(
          "relative h-2.5 rounded-full",
          dark ? "bg-white/10" : "bg-paper-2",
        )}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-brand/35"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
          }}
        />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-brand bg-white shadow"
          style={{ left: `${pct(band)}%` }}
        />
        {target ? (
          <div
            className="absolute -top-1.5 h-5.5 w-0.5 -translate-x-1/2 rounded bg-good"
            style={{ left: `${pct(target)}%` }}
            title={`Mục tiêu ${target}`}
          />
        ) : null}
      </div>
      <div
        className={cx(
          "mt-2 flex justify-between font-mono text-[10px]",
          dark ? "text-white/40" : "text-subtle",
        )}
      >
        {ticks
          .filter((t) => t % 1 === 0)
          .map((t) => (
            <span key={t}>{t}</span>
          ))}
      </div>
    </div>
  );
}
