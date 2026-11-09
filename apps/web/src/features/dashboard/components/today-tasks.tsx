import { Check, ChevronRight, Ear, Flame, Repeat } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { cx } from "@/lib/cx";

const tasks = [
  { i: Repeat, t: "Luyện lại câu yếu nhất", d: "“people there is…” — lỗi chủ–vị", m: "3 phút", done: false, to: "select" as const },
  { i: Flame, t: "Đề forecast mới · Part 2", d: "Describe an app that you find useful", m: "4 phút", done: false, to: "forecast" as const },
  { i: Ear, t: "Âm cuối /s/ /ts/", d: "7 từ bị nuốt âm trong bài gần nhất", m: "2 phút", done: true, to: "select" as const },
];

export function TodayTasks() {
  const { go } = useApp();
  return (
    <Card className="min-w-0 p-5 sm:p-7 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Việc hôm nay</h2>
        <Badge tone="neutral">Dựa trên bài 23/04</Badge>
      </div>
      <div className="mt-5 space-y-2">
        {tasks.map((t, k) => (
          <button
            key={k}
            onClick={() => !t.done && go(t.to)}
            className={cx("group flex w-full min-w-0 items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors sm:gap-4 sm:p-4", t.done ? "border-transparent bg-paper" : "border-line hover:border-ink/30")}
          >
            <div className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", t.done ? "bg-good text-white" : "bg-paper-2 text-ink")}>
              {t.done ? <Check size={18} /> : <t.i size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={cx("font-semibold", t.done && "text-subtle line-through")}>{t.t}</div>
              <div className="truncate text-[13px] text-subtle">{t.d}</div>
            </div>
            <span className="text-xs text-subtle">{t.m}</span>
            {!t.done && <ChevronRight size={18} className="text-subtle transition-transform group-hover:translate-x-0.5" />}
          </button>
        ))}
      </div>
    </Card>
  );
}
