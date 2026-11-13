import { Check, Clock, Layers } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { useApp } from "@/features/app-state/types";
import { MODES } from "@/features/exam/data";
import { cx } from "@/lib/cx";

import { isSelectMobileViewport } from "../use-select-mobile-viewport";

export function ModeGrid() {
  const { s, set, go } = useApp();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {MODES.map((m) => {
        const on = s.mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => {
              set({ mode: m.id });
              if (isSelectMobileViewport()) {
                go("select-setup");
              }
            }}
            className={cx("relative flex flex-col rounded-3xl border p-6 text-left transition-all", on ? "border-ink bg-ink text-paper shadow-xl" : "border-line bg-white hover:border-ink/30")}
          >
            {m.id === "full" && (
              <Badge tone="accent" className="absolute top-5 right-5">
                Khuyên dùng
              </Badge>
            )}
            <div className={cx("grid h-10 w-10 place-items-center rounded-xl", on ? "bg-white/10" : "bg-paper-2")}>{m.id === "full" ? <Layers size={18} /> : <span className="font-mono text-sm font-bold">P{m.parts[0]}</span>}</div>
            <div className="mt-6 text-xl font-bold">{m.title}</div>
            <div className={cx("mt-1 text-[13px]", on ? "text-white/60" : "text-ink-2")}>{m.sub}</div>
            <div className={cx("mt-6 flex items-center gap-1.5 text-xs", on ? "text-white/60" : "text-subtle")}>
              <Clock size={13} /> {m.time}
            </div>
            {on && (
              <span className="absolute right-5 bottom-5 grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
                <Check size={14} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
