import { useState } from "react";
import { Check } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";
import { Modal } from "@/components/ds/modal";
import { cx } from "@/lib/cx";

import { RESULT } from "../data";
import type { CritKey } from "../types";

export interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReportModal({ open, onClose }: ReportModalProps) {
  const { toast } = useApp();
  const [crit, setCrit] = useState<CritKey | "ALL">("GRA");
  const [expect, setExpect] = useState("6.5");
  return (
    <Modal open={open} onClose={onClose}>
      <form
        className="p-7 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
          toast("Đã gửi báo lỗi kèm bài làm. Phản hồi trong 48 giờ.");
        }}
      >
        <h2 className="text-2xl font-bold tracking-tight">Báo lỗi chấm</h2>
        <p className="mt-1.5 text-sm text-ink-2">
          Bài làm (audio + transcript) sẽ được gửi kèm để đội ngũ giám khảo xem lại và hiệu chuẩn hệ thống.
        </p>
        <div className="mt-6 text-xs font-semibold text-ink-2">Tiêu chí bạn thấy chưa đúng</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[{ key: "ALL" as const, vi: "Band tổng" }, ...RESULT.criteria].map((c) => (
            <button
              type="button"
              key={c.key}
              onClick={() => setCrit(c.key)}
              className={cx("h-9 rounded-full border px-4 text-sm font-medium", crit === c.key ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40")}
            >
              {c.vi}
            </button>
          ))}
        </div>
        <label className="mt-5 block">
          <span className="text-xs font-semibold text-ink-2">Band bạn kỳ vọng</span>
          <select value={expect} onChange={(e) => setExpect(e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-line bg-white px-4">
            {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="mt-5 block">
          <span className="text-xs font-semibold text-ink-2">Mô tả (tùy chọn)</span>
          <textarea
            rows={3}
            placeholder="Ví dụ: Mình có dùng nhiều câu phức ở Part 3 nhưng không được ghi nhận…"
            className="mt-2 w-full resize-none rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-ink"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">
            <Check size={16} /> Gửi báo lỗi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
