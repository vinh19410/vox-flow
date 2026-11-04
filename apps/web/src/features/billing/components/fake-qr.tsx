import { useMemo } from "react";

/** Deterministic QR-looking mock (seeded PRNG + finder patterns + brand mark). */
export function FakeQR() {
  const cells = useMemo(() => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: 25 * 25 }, () => rnd() > 0.52);
  }, []);
  const finder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, 18) || inBox(18, 0);
  };
  return (
    <svg viewBox="0 0 25 25" className="h-full w-full" shapeRendering="crispEdges">
      {cells.map((on, i) => {
        const r = Math.floor(i / 25);
        const c = i % 25;
        if (finder(r, c)) return null;
        return on ? <rect key={i} x={c} y={r} width="1" height="1" fill="#12141c" /> : null;
      })}
      {[
        [0, 0],
        [0, 18],
        [18, 0],
      ].map(([r, c]) => (
        <g key={`${r}${c}`}>
          <rect x={c} y={r} width="7" height="7" fill="#12141c" />
          <rect x={c + 1} y={r + 1} width="5" height="5" fill="white" />
          <rect x={c + 2} y={r + 2} width="3" height="3" fill="#12141c" />
        </g>
      ))}
      <rect x="10" y="10" width="5" height="5" rx="1" fill="#ff5b24" />
    </svg>
  );
}
