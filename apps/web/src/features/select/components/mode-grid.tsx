import { Check, Clock, Layers } from "lucide-react";
import { useEffect, useRef } from "react";

import { Badge } from "@/components/ds/badge";
import { useApp } from "@/features/app-state/types";
import { MODES } from "@/features/exam/data";
import { cx } from "@/lib/cx";

import { canStartMode, useQuotaStatus } from "../use-quota-status";
import { isSelectMobileViewport } from "../use-select-mobile-viewport";

export function ModeGrid() {
  const { s, set, go } = useApp();
  const quota = useQuotaStatus();
  const autoFallbackDoneRef = useRef(false);

  const fullAllowed = canStartMode(quota, "full").allowed;
  const p1Allowed = canStartMode(quota, "p1").allowed;

  useEffect(() => {
    if (!quota.isLoaded) {
      autoFallbackDoneRef.current = false;
      return;
    }
    if (autoFallbackDoneRef.current) return;
    autoFallbackDoneRef.current = true;
    if (quota.status?.entitlement === "free" && s.mode === "full" && !fullAllowed && p1Allowed) {
      set({ mode: "p1" });
    }
  }, [quota.isLoaded, quota.status?.entitlement, s.mode, fullAllowed, p1Allowed, set]);

  const isPaid = quota.isLoaded && quota.status?.entitlement === "paid";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {MODES.map((m) => {
        const on = s.mode === m.id;
        const check = canStartMode(quota, m.id);
        const blocked = quota.isLoaded && !check.allowed;

        return (
          <button
            key={m.id}
            onClick={() => {
              set({ mode: m.id });
              if (isSelectMobileViewport()) {
                go("select-setup");
              }
            }}
            aria-disabled={blocked || undefined}
            className={cx(
              "relative flex h-full flex-col rounded-3xl border p-6 text-left transition-all",
              on ? "border-ink bg-ink text-paper shadow-xl" : "border-line bg-white hover:border-ink/30",
              blocked && !on && "opacity-60",
            )}
          >
            {m.id === "full" && (
              <Badge tone="accent" className="absolute top-5 right-5">
                Khuyên dùng
              </Badge>
            )}
            <div className={cx("grid h-10 w-10 place-items-center rounded-xl", on ? "bg-white/10" : "bg-paper-2")}>{m.id === "full" ? <Layers size={18} /> : <span className="font-mono text-sm font-bold">P{m.parts[0]}</span>}</div>
            <div className="mt-6 text-xl font-bold">{m.title}</div>
            <div className={cx("mt-1 text-[13px]", on ? "text-white/60" : "text-ink-2")}>{m.sub}</div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span
                className={cx(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold",
                  on ? "bg-white/15 text-paper" : "bg-paper-2 text-ink",
                )}
              >
                {isPaid ? "Không giới hạn" : `${check.cost} điểm`}
              </span>
              {blocked && (
                <span className={cx("text-[11px] font-medium", on ? "text-amber-300" : "text-bad")}>
                  {check.reason === "GLOBAL_CAP_REACHED" ? "Trần hôm nay đã đầy" : "Không đủ điểm"}
                </span>
              )}
            </div>
            <div className={cx("mt-auto flex items-center gap-1.5 pt-6 text-xs", on ? "text-white/60" : "text-subtle")}>
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
