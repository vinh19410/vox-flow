import { ArrowRight, Lightbulb, Minus, Plus, Quote } from "lucide-react";

import { Card } from "@/components/ds/card";
import { cx } from "@/lib/cx";

import type { Criterion } from "../types";

export interface CriterionDetailProps {
  c: Criterion;
}

export function CriterionDetail({ c }: CriterionDetailProps) {
  return (
    <div className="grid animate-rise gap-5 lg:grid-cols-[1fr_1.5fr]">
      <Card className="p-7">
        <div className="font-mono text-xs font-semibold text-subtle">{c.name}</div>
        <div className="mt-1 text-xl font-bold">{c.vi}</div>
        <div className="mt-5 flex items-end gap-3">
          <span className="tnum text-6xl leading-none font-extrabold">{c.band != null ? c.band.toFixed(1) : "—"}</span>
          {c.range && (
            <span className="tnum pb-1 font-mono text-sm text-subtle">
              {c.range[0].toFixed(1)}–{c.range[1].toFixed(1)}
            </span>
          )}
        </div>
        {c.summary && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{c.summary}</p>}
        {c.metrics && c.metrics.length > 0 && (
          <div className="mt-6 divide-y divide-line border-y border-line">
            {c.metrics.map((m) => (
              <div key={m.label} className="flex justify-between py-3 text-sm">
                <span className="text-ink-2">{m.label}</span>
                <span className="tnum font-semibold">{m.value}</span>
              </div>
            ))}
          </div>
        )}
        {c.runs && c.runs.length > 0 && (
          <div className="mt-5 flex items-center gap-2 text-xs text-subtle">
            3 lần chấm:
            {c.runs.map((r, k) => (
              <span key={k} className="tnum rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-ink">
                {r.toFixed(1)}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-5">
        <Card className="p-7">
          <h3 className="flex items-center gap-2 font-bold">
            <Quote size={16} className="text-brand" /> Bằng chứng từ câu bạn nói
          </h3>
          <div className="mt-5 space-y-3">
            {c.evidence.length === 0 && <p className="text-sm text-subtle">Chưa có trích dẫn cho tiêu chí này.</p>}
            {c.evidence.map((e, k) => (
              <div key={k} className="flex gap-4 rounded-2xl bg-paper p-4">
                <span
                  className={cx(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
                    e.kind === "plus" ? "bg-good text-white" : "bg-bad text-white",
                  )}
                >
                  {e.kind === "plus" ? <Plus size={13} /> : <Minus size={13} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug font-medium">“{e.quote}”</p>
                  <p className="mt-1.5 text-[13px] text-ink-2">{e.note}</p>
                  {e.where && <p className="mt-1.5 text-[11px] text-subtle sm:hidden">{e.where}</p>}
                </div>
                {e.where && <span className="hidden shrink-0 text-[11px] text-subtle sm:block">{e.where}</span>}
              </div>
            ))}
          </div>
        </Card>
        {c.improve.length > 0 && (
        <Card className="p-7">
          <h3 className="flex items-center gap-2 font-bold">
            <Lightbulb size={16} className="text-warn" /> Cách nâng lên band tiếp theo
          </h3>
          <div className="mt-5 space-y-3">
            {c.improve.map((im, k) => (
              <div key={k} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2 text-[15px]">
                  <span className="text-subtle line-through decoration-bad/60">{im.from}</span>
                  <ArrowRight size={14} className="text-subtle" />
                  <span className="font-semibold text-good">{im.to}</span>
                </div>
                <div className="mt-1.5 text-[13px] text-ink-2">{im.why}</div>
              </div>
            ))}
          </div>
        </Card>
        )}
      </div>
    </div>
  );
}
