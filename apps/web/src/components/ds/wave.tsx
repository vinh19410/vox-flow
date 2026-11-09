import { useEffect, useState } from "react";

import { cx } from "@/lib/cx";

export interface WaveProps {
  level: number;
  active: boolean;
  bars?: number;
  className?: string;
  color?: string;
}

export function Wave({
  level,
  active,
  bars = 36,
  className,
  color = "bg-brand",
}: WaveProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className={cx("flex h-12 items-center gap-[3px]", className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const shape = Math.sin((i / bars) * Math.PI);
        const jitter = Math.abs(Math.sin(i * 12.9898 + tick * 0.9));
        const h = active ? 10 + shape * jitter * level * 90 : 8;
        return (
          <span
            key={i}
            className={cx(
              "w-[3px] rounded-full transition-[height] duration-100",
              active ? color : "bg-ink/15",
            )}
            style={{ height: `${Math.min(h, 100)}%` }}
          />
        );
      })}
    </div>
  );
}
