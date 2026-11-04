import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "good"
  | "warn"
  | "bad"
  | "info"
  | "dark";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tone === "neutral" && "bg-paper-2 text-ink-2",
        tone === "accent" && "bg-brand-soft text-brand",
        tone === "good" && "bg-good-soft text-good",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "bad" && "bg-bad-soft text-bad",
        tone === "info" && "bg-info-soft text-info",
        tone === "dark" && "bg-ink text-paper",
        className,
      )}
    >
      {children}
    </span>
  );
}
