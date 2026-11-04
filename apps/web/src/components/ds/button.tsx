import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost" | "soft";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...p
}: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-13 px-7 text-[15px]",
        variant === "primary" && "bg-ink text-paper hover:bg-ink-2",
        variant === "accent" &&
          "bg-brand text-white hover:brightness-105 shadow-[0_8px_24px_-8px_rgba(255,91,36,0.6)]",
        variant === "outline" &&
          "border border-line bg-white text-ink hover:border-ink/40",
        variant === "ghost" && "text-ink-2 hover:bg-ink/5",
        variant === "soft" && "bg-ink/[0.06] text-ink hover:bg-ink/10",
        className,
      )}
    />
  );
}
