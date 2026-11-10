import { ArrowRight, Check, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ds/button";
import { Modal } from "@/components/ds/modal";
import { cx } from "@/lib/cx";

import type { Part } from "../types";
import type { ExamAnswer, ExamStep } from "../use-exam-session";

export interface PreSubmitModalProps {
  open: boolean;
  onClose: () => void;
  steps: ExamStep[];
  answers: Record<string, ExamAnswer>;
  short: (k: string, p: Part) => boolean;
  flaggedCount: number;
  onRetry: (k: number) => void;
  onSubmit: () => void;
  /** True while the exam attempt is still syncing (no attempt id yet). */
  submitLocked?: boolean;
  /** Submit pipeline stage: drives the busy label and locks answer-changing controls. */
  submitPhase?: "idle" | "flushing" | "submitting";
  /** Error from the submit pipeline; rendered with a retry action. */
  submitError?: string | null;
  /** True when only the device copies could not be read: submit remains an informed choice. */
  allowSubmitAnyway?: boolean;
  /** Runs the submit bypassing the upload flush (used with `allowSubmitAnyway`). */
  onSubmitAnyway?: () => void;
}

const STORAGE_WARNING_MESSAGE =
  "Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận.";

/** S10 — pre-submit check listing every step with its word count. */
export function PreSubmitModal({
  open,
  onClose,
  steps,
  answers,
  short,
  flaggedCount,
  onRetry,
  onSubmit,
  submitLocked = false,
  submitPhase = "idle",
  submitError = null,
  allowSubmitAnyway = false,
  onSubmitAnyway,
}: PreSubmitModalProps) {
  const busy = submitPhase !== "idle";
  return (
    <Modal open={open} onClose={onClose} width="max-w-xl">
      <div className="p-7 text-ink sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight">Kiểm tra trước khi nộp</h2>
        <p className="mt-1.5 text-sm text-ink-2">
          {flaggedCount
            ? `${flaggedCount} câu có thể làm giảm điểm. Bạn có thể nói lại trước khi chấm.`
            : "Tất cả câu trả lời đều đủ độ dài. Sẵn sàng chấm!"}
        </p>
        <div className="mt-6 max-h-[46vh] space-y-2 overflow-y-auto">
          {steps.map((st, k) => {
            const a = answers[st.key];
            const bad = !!a && short(st.key, st.part);
            return (
              <div
                key={st.key}
                className={cx("flex items-center gap-3 rounded-2xl border p-3.5", bad ? "border-warn/30 bg-warn-soft/50" : "border-line")}
              >
                <div className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold", bad ? "bg-warn text-white" : "bg-good-soft text-good")}>
                  {bad ? <TriangleAlert size={14} /> : <Check size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-subtle">
                    Part {st.part} · {st.follow ? "Nối tiếp" : `Câu ${steps.filter((x, j) => j <= k && x.part === st.part && !x.follow).length}`}
                  </div>
                  <div className="truncate text-sm font-medium">{st.text}</div>
                </div>
                <span className="tnum text-xs text-subtle">{a ? `${a.words} từ` : "—"}</span>
                {bad && (
                  <button
                    disabled={busy}
                    onClick={() => onRetry(k)}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-paper disabled:opacity-50"
                  >
                    Nói lại
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {(submitError || allowSubmitAnyway) && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
            <TriangleAlert size={18} className="shrink-0" />
            <p className="min-w-0 flex-1">{submitError ?? STORAGE_WARNING_MESSAGE}</p>
            <button onClick={onSubmit} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-paper">
              Thử lại
            </button>
            {allowSubmitAnyway && (
              <button
                onClick={() => onSubmitAnyway?.()}
                className="rounded-full bg-warn px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Vẫn nộp
              </button>
            )}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Quay lại
          </Button>
          <Button variant="accent" onClick={onSubmit} disabled={submitLocked || busy}>
            {submitLocked
              ? "Đang đồng bộ phiên thi…"
              : submitPhase === "flushing"
                ? "Đang tải lên bản ghi…"
                : submitPhase === "submitting"
                  ? "Đang nộp…"
                  : flaggedCount
                    ? "Vẫn nộp & chấm"
                    : "Nộp & chấm điểm"}{" "}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
