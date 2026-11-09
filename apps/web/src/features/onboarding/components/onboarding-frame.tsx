import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "@/components/ds/logo";
import { cx } from "@/lib/cx";

export interface OnboardingFrameProps {
  children: ReactNode;
  step?: number;
  total?: number;
  onBack?: () => void;
}

export function OnboardingFrame({ children, step, total, onBack }: OnboardingFrameProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        {step !== undefined && total && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-subtle">
              Bước {step + 1}/{total}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={cx("h-1.5 rounded-full transition-all", i <= step ? "w-8 bg-ink" : "w-4 bg-ink/15")} />
              ))}
            </div>
          </div>
        )}
      </header>
      <div className="flex flex-1 items-start justify-center px-5 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-xl">
          {onBack && (
            <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-sm text-subtle hover:text-ink">
              <ArrowLeft size={16} /> Quay lại
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
