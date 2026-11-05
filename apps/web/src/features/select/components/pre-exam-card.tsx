import { ArrowRight, Info, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";

export function PreExamCard() {
  const { s, set, go, setPendingSubmission } = useApp();
  return (
    <Card className="flex flex-col p-7">
      <h2 className="text-lg font-bold">Trước khi bắt đầu</h2>
      <ul className="mt-4 space-y-3 text-sm text-ink-2">
        <li className="flex gap-3">
          <Info size={16} className="mt-0.5 shrink-0 text-subtle" />
          Bấm micro (hoặc phím Space) để trả lời, bấm lại để dừng.
        </li>
        <li className="flex gap-3">
          <Info size={16} className="mt-0.5 shrink-0 text-subtle" />
          Câu ngắn ở Part 1 vẫn hợp lệ nếu đủ ý — hệ thống sẽ nhắc trước khi nộp.
        </li>
        <li className="flex gap-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-good" />
          <span>
            Ghi âm chỉ dùng để chấm bài này.{" "}
            <b className="text-ink">{s.consent.save ? "Lưu vào lịch sử: bật" : "Không lưu lịch sử"}</b> · Hiệu chuẩn chấm điểm: <b className="text-ink">{(s.consent.calibration ?? s.consent.train) ? "bật" : "tắt"}</b>.{" "}
            <button onClick={() => go("privacy")} className="font-semibold text-ink underline underline-offset-2">
              Đổi
            </button>
          </span>
        </li>
      </ul>
      <Button
        variant="accent"
        size="lg"
        className="mt-8 w-full lg:mt-auto"
        onClick={() => {
          set({ practice: null });
          setPendingSubmission(false);
          go("exam");
        }}
      >
        Đồng ý ghi âm & bắt đầu <ArrowRight size={18} />
      </Button>
    </Card>
  );
}
