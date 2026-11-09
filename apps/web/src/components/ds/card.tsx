import type { HTMLAttributes } from "react";

import { cx } from "@/lib/cx";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...p }: CardProps) {
  return (
    <div
      {...p}
      className={cx("rounded-3xl border border-line bg-white", className)}
    >
      {children}
    </div>
  );
}
