import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";
import { cx } from "@/lib/cx";

const BANDS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5];

export function GoalStep({ onNext }: { onNext: () => void }) {
  const { s, set } = useApp();
  return (
    <>
      <h1 className="text-[30px] leading-tight font-bold tracking-tight">Mục tiêu của bạn là gì?</h1>
      <p className="mt-2 text-ink-2">Dùng để so sánh tiến độ và gợi ý việc cần luyện mỗi ngày.</p>
      <div className="mt-8 text-xs font-semibold text-ink-2">Band mục tiêu</div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {BANDS.map((b) => (
          <button
            key={b}
            onClick={() => set({ target: b })}
            className={cx("tnum h-14 rounded-2xl border text-lg font-bold transition-all", s.target === b ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40")}
          >
            {b.toFixed(1)}
          </button>
        ))}
      </div>
      <div className="mt-8 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-2">Ngày thi</span>
        <span className="text-xs text-subtle">Không bắt buộc</span>
      </div>
      <input
        type="date"
        value={s.examDate ?? ""}
        onChange={(e) => set({ examDate: e.target.value || null })}
        className="mt-3 h-12 w-full rounded-2xl border border-line bg-white px-4 outline-none focus:border-ink"
      />
      <div className="mt-10 flex items-center justify-between">
        <button onClick={() => (set({ examDate: null }), onNext())} className="text-sm font-medium text-subtle hover:text-ink">
          Bỏ qua ngày thi
        </button>
        <Button onClick={onNext}>
          Tiếp tục <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}
