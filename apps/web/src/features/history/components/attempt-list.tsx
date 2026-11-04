import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { modeLabel } from "@/features/exam/data";
import type { Attempt } from "@/features/history/types";

export function AttemptList({ list }: { list: Attempt[] }) {
  const { goResult } = useApp();
  return (
    <Card className="mt-5 divide-y divide-line overflow-hidden">
      {[...list].reverse().map((a, k) => (
        <button key={a.id} onClick={() => goResult(a.id)} className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-paper">
          <div className="tnum w-14 text-2xl font-extrabold">{a.band.toFixed(1)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{modeLabel(a.mode)}</span>
              {k === 0 && <Badge tone="accent">Mới nhất</Badge>}
            </div>
            <div className="truncate text-[13px] text-subtle">{a.topic}</div>
          </div>
          <span className="tnum hidden font-mono text-xs text-subtle sm:block">
            {a.range[0].toFixed(1)}–{a.range[1].toFixed(1)}
          </span>
          <span className="text-xs text-subtle">{new Date(a.date).toLocaleDateString("vi-VN")}</span>
          <ChevronRight size={16} className="text-subtle" />
        </button>
      ))}
    </Card>
  );
}
