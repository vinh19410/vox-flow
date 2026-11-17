import type { HTMLAttributes } from "react";

import { cn } from "../lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...p }: CardProps) {
  return (
    <div
      {...p}
      className={cn("rounded-3xl border border-line bg-white", className)}
    >
      {children}
    </div>
  );
}
