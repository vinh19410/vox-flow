import type { Attempt } from "@/features/history/types";

export interface TrendChartProps {
  list: Attempt[];
  target: number;
}

/** Band-over-time SVG chart; hex fills preserved from the prototype design. */
export function TrendChart({ list, target }: TrendChartProps) {
  // Chart geometry
  const W = 720;
  const H = 220;
  const pad = { l: 36, r: 16, t: 16, b: 28 };
  const min = 4.5;
  const max = 8;
  const x = (i: number) => pad.l + (list.length <= 1 ? (W - pad.l - pad.r) / 2 : (i / (list.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const line = list.map((a, i) => `${i ? "L" : "M"}${x(i)},${y(a.band)}`).join(" ");
  const area = list.length ? list.map((a, i) => `${i ? "L" : "M"}${x(i)},${y(a.range[1])}`).join(" ") + " " + [...list].reverse().map((a, j) => `L${x(list.length - 1 - j)},${y(a.range[0])}`).join(" ") + " Z" : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full">
      {[5, 6, 7, 8].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#e6e2d8" />
          <text x={pad.l - 10} y={y(v) + 4} textAnchor="end" className="fill-subtle font-mono text-[11px]">
            {v}.0
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="#128a5c" strokeWidth="1.5" strokeDasharray="5 5" />
      <path d={area} fill="#ff5b24" opacity="0.13" />
      <path d={line} fill="none" stroke="#ff5b24" strokeWidth="2.5" strokeLinejoin="round" />
      {list.map((a, i) => (
        <g key={a.id}>
          <circle cx={x(i)} cy={y(a.band)} r="5" fill="white" stroke="#ff5b24" strokeWidth="2.5" />
          <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-subtle font-mono text-[10px]">
            {new Date(a.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </text>
        </g>
      ))}
    </svg>
  );
}
