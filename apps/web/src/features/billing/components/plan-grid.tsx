import { ArrowRight, Check } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Badge } from "@/components/ds/badge";
import { cx } from "@/lib/cx";
import { daysUntil, vnd } from "@/lib/format";

import { PLANS } from "../data";
import type { Plan } from "../data";

export interface PlanGridProps {
  onPick: (p: Plan) => void;
  compact?: boolean;
}

export function PlanGrid({ onPick, compact }: PlanGridProps) {
  const { s } = useApp();
  const days = daysUntil(s.examDate);
  return (
    <div className={cx("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
      {PLANS.map((p) => (
        <button
          key={p.id}
          onClick={() => onPick(p)}
          className={cx(
            "group relative flex flex-col rounded-3xl border p-5 text-left transition-all",
            p.best ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40",
          )}
        >
          {p.best && (
            <Badge tone="accent" className="absolute top-4 right-4">
              Khuyên dùng
            </Badge>
          )}
          <div className="text-sm font-semibold">{p.name}</div>
          {p.id === "exam" && (
            <div className="mt-0.5 text-xs text-white/50">
              {days !== null ? `${days} ngày, đến ${new Date(s.examDate!).toLocaleDateString("vi-VN")}` : "Tối đa 60 ngày"}
            </div>
          )}
          <div className="tnum mt-3 text-2xl font-bold">
            {vnd(p.price)}
            <span className={cx("ml-1 text-xs font-medium", p.best ? "text-white/50" : "text-subtle")}>{p.unit}</span>
          </div>
          {!compact && (
            <ul className={cx("mt-4 space-y-1.5 text-[13px]", p.best ? "text-white/70" : "text-ink-2")}>
              {p.perks.map((x) => (
                <li key={x} className="flex gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-brand" />
                  {x}
                </li>
              ))}
            </ul>
          )}
          <span className={cx("mt-4 flex items-center gap-1 text-xs font-semibold", p.best ? "text-brand" : "text-ink")}>
            Chọn gói <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
