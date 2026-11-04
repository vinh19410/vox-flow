import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { modeLabel } from "@/features/exam/data";
import type { Attempt } from "@/features/history/types";
import { fmtBand } from "@/lib/format";

export function RecentAttemptCard({ attempts }: { attempts: Attempt[] }) {
  const { go, goResult } = useApp();
  const last = attempts[attempts.length - 1];
  return (
    <Card className="p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Bài gần nhất</h2>
        <button onClick={() => go("history")} className="text-xs font-semibold text-subtle hover:text-ink">
          Tất cả
        </button>
      </div>
      <button onClick={() => goResult(last.id)} className="mt-5 w-full rounded-2xl bg-paper p-5 text-left hover:bg-paper-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-subtle">
            {modeLabel(last.mode)} · {new Date(last.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </span>
          <ArrowRight size={16} />
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="tnum text-4xl font-extrabold">{fmtBand(last.band)}</span>
          <span className="tnum pb-1 text-sm text-subtle">
            ({fmtBand(last.range[0])}–{fmtBand(last.range[1])})
          </span>
        </div>
        <div className="mt-1 truncate text-[13px] text-ink-2">{last.topic}</div>
      </button>
      <div className="mt-4 flex items-end gap-1.5">
        {attempts.slice(-8).map((a) => (
          <div key={a.id} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-md bg-ink/80" style={{ height: `${(a.band - 4) * 14}px` }} />
            <span className="tnum text-[10px] text-subtle">{a.band.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
