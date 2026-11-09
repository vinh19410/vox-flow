import { mmss } from "@/lib/format";

import type { ExamCue } from "../types";

export interface CueCardPanelProps {
  cue: ExamCue;
  prep: boolean;
  prepT: number;
  notes: string;
  onNotes: (v: string) => void;
}

export function CueCardPanel({ cue, prep, prepT, notes, onNotes }: CueCardPanelProps) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
      <div className="rounded-3xl bg-paper p-6 text-ink">
        <div className="font-mono text-[11px] tracking-wider text-subtle">CUE CARD</div>
        <div className="mt-3 text-xl leading-snug font-bold">{cue.title}</div>
        <div className="mt-4 text-sm text-ink-2">You should say:</div>
        <ul className="mt-2 space-y-1.5 text-[15px]">
          {cue.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-3 text-[15px] text-ink-2">{cue.ending}</div>
      </div>
      <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Ghi chú nháp</span>
          {prep && <span className="tnum font-mono text-base font-semibold text-brand">{mmss(prepT)}</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder={"cousin – uni exam\nmaths, weekends, 3 months\nfelt proud"}
          className="mt-3 min-h-32 flex-1 resize-none bg-transparent font-mono text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/25"
        />
      </div>
    </div>
  );
}
