import type { ReactNode } from "react";

export interface PageHeadProps {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}

export function PageHead({ eyebrow, title, sub, right }: PageHeadProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-subtle uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-2xl text-[15px] text-ink-2">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
