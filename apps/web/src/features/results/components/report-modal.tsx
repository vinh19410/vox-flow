import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";
import { Modal } from "@/components/ds/modal";
import { cx } from "@/lib/cx";
import { trpcClient } from "@/utils/trpc";
import type { CritKey } from "../types";

const CRITERIA_OPTIONS: { key: CritKey | "ALL"; vi: string }[] = [
  { key: "ALL", vi: "Band tổng" },
  { key: "FC", vi: "Độ trôi chảy & mạch lạc" },
  { key: "LR", vi: "Vốn từ vựng" },
  { key: "GRA", vi: "Ngữ pháp" },
  { key: "P", vi: "Phát âm" },
];
export interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  attemptId: string;
  onSubmitted?: () => void;
}

export function ReportModal({ open, onClose, attemptId, onSubmitted }: ReportModalProps) {
  const { toast } = useApp();
  const [crit, setCrit] = useState<CritKey | "ALL">("GRA");
  const [expect, setExpect] = useState("6.5");
  const [reason, setReason] = useState("");
  const [shareConsent, setShareConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMessage(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (trpcClient?.dispute?.submit?.mutate) {
        const targetCriterion = crit === "P" ? "PRON" : crit;
        await trpcClient.dispute.submit.mutate({
          attemptId,
          targetCriterion,
          expectedBand: expect as "5.0" | "5.5" | "6.0" | "6.5" | "7.0" | "7.5" | "8.0",
          reason: reason.trim() || undefined,
          shareConsent,
        });
      }
      toast("Đã gửi báo lỗi. Chúng tôi cam kết phản hồi trong vòng 72 giờ.");
      onSubmitted?.();
      onClose();
    } catch (err: unknown) {
      let msg = "Không thể gửi báo lỗi. Vui lòng thử lại sau.";
      if (err && typeof err === "object" && "message" in err) {
        msg = String(err.message);
      }
      setErrorMessage(msg);
      toast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form className="p-7 sm:p-8" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold tracking-tight">Báo lỗi chấm</h2>
        <p className="mt-1.5 text-sm text-ink-2">
          Đội ngũ giám khảo sẽ xem xét lại bài thi của bạn theo cam kết phản hồi trong vòng 72 giờ.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 text-xs font-semibold text-ink-2">Tiêu chí bạn thấy chưa đúng</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {CRITERIA_OPTIONS.map((c) => (
            <button
              type="button"
              key={c.key}
              onClick={() => setCrit(c.key)}
              className={cx(
                "h-9 rounded-full border px-4 text-sm font-medium",
                crit === c.key ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40",
              )}
            >
              {c.vi}
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-semibold text-ink-2">Band bạn kỳ vọng</span>
          <select
            value={expect}
            onChange={(e) => setExpect(e.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-line bg-white px-4"
          >
            {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>

        <label className="mt-5 block">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-2">
            <span>Mô tả lý do (tùy chọn)</span>
            <span className="text-[11px] font-normal text-subtle">{reason.length}/1000</span>
          </div>
          <textarea
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Mình có dùng nhiều câu phức ở Part 3 nhưng không được ghi nhận…"
            className="mt-2 w-full resize-none rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-ink"
          />
        </label>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line/60 bg-paper-2/40 p-3.5">
          <input
            type="checkbox"
            checked={shareConsent}
            onChange={(e) => setShareConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line text-ink focus:ring-ink"
          />
          <span className="text-xs leading-relaxed text-ink-2">
            Đồng ý chia sẻ bản ghi âm và transcript của bài thi này cho giám khảo để phục vụ rà soát bài chấm (tùy chọn, mặc định không chia sẻ).
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang gửi...
              </>
            ) : (
              <>
                <Check size={16} /> Gửi báo lỗi
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
