import { ArrowRight, Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";
import { cx } from "@/lib/cx";
import { trpcClient } from "@/utils/trpc";

const BANDS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export interface GoalStepProps {
  onNext: () => void;
  chosenDate?: string | null;
  onDateChange?: (date: string | null) => void;
}

export function GoalStep({
  onNext,
  chosenDate: propChosenDate,
  onDateChange,
}: GoalStepProps) {
  const { s, set } = useApp();
  const [localChosenDate, setLocalChosenDate] = useState<string | null>(null);
  const chosenDate =
    propChosenDate !== undefined ? propChosenDate : localChosenDate;
  const setChosenDate = onDateChange ?? setLocalChosenDate;

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAndNext = async (examDateToSend: string | null) => {
    setIsSaving(true);
    setError(null);

    try {
      if (trpcClient?.profile?.upsert?.mutate) {
        await trpcClient.profile.upsert.mutate({
          targetBand: s.target,
          examDate: examDateToSend,
        });
      }
      set({ target: s.target, examDate: examDateToSend });
      onNext();
    } catch {
      setError("Không thể lưu mục tiêu. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <>
      <h1 className="text-[30px] leading-tight font-bold tracking-tight">Mục tiêu của bạn là gì?</h1>
      <p className="mt-2 text-ink-2">Dùng để so sánh tiến độ và gợi ý việc cần luyện mỗi ngày.</p>
      <div className="mt-8 text-xs font-semibold text-ink-2">Band mục tiêu</div>
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {BANDS.map((b) => (
          <button
            key={b}
            type="button"
            disabled={isSaving}
            aria-pressed={s.target === b}
            onClick={() => set({ target: b })}
            className={cx(
              "tnum h-14 rounded-2xl border text-lg font-bold transition-all",
              s.target === b
                ? "border-ink bg-ink text-paper"
                : "border-line bg-white hover:border-ink/40",
            )}
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
        aria-label="Ngày thi"
        min={todayStr}
        disabled={isSaving}
        value={chosenDate ?? ""}
        onChange={(e) => setChosenDate(e.target.value || null)}
        className="mt-3 h-12 w-full rounded-2xl border border-line bg-white px-4 outline-none focus:border-ink disabled:opacity-50"
      />

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-bad-soft px-4 py-3 text-[13px] text-bad">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            setChosenDate(null);
            void saveAndNext(null);
          }}
          className="text-sm font-medium text-subtle hover:text-ink disabled:opacity-50"
        >
          Bỏ qua ngày thi
        </button>
        <Button
          disabled={isSaving}
          onClick={() => void saveAndNext(chosenDate)}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Đang lưu…
            </>
          ) : (
            <>
              Tiếp tục <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </>
  );
}
