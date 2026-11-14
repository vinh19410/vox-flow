import { AlertCircle, ArrowRight, Info, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";

import { canStartMode, getQuotaErrorMessage, useQuotaStatus } from "../use-quota-status";

export function PreExamCard() {
  const { s, set, go, setPendingSubmission } = useApp();
  const quota = useQuotaStatus();
  const check = canStartMode(quota, s.mode);
  const isFreeLoaded = quota.isLoaded && quota.status?.entitlement === "free";

  const blockedMessage = !check.allowed && check.reason
    ? check.reason === "QUOTA_EXCEEDED" && (quota.status?.remainingPoints ?? 0) > 0
      ? `Chế độ này cần ${check.cost} điểm (bạn còn ${quota.status?.remainingPoints ?? 0}/${quota.status?.dailyLimit ?? 3} điểm hôm nay). Hãy chọn Part lẻ hoặc nâng cấp gói trả phí.`
      : getQuotaErrorMessage(check.reason, "start")
    : null;

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
            Ghi âm được xử lý bảo mật để chấm bài và tự động lưu vào lịch sử làm bài của bạn.
          </span>
        </li>
      </ul>

      {isFreeLoaded && (
        <div className="mt-4 text-xs text-subtle">
          Chi phí lượt thi này: <span className="font-mono font-semibold text-ink">{check.cost} điểm</span> · Đặt lại lúc 00:00 (giờ Việt Nam)
        </div>
      )}

      {blockedMessage && (
        <div
          role="alert"
          data-testid="pre-exam-quota-alert"
          className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-bad/25 bg-bad-soft px-4 py-3 text-xs text-ink"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-bad" />
            <span>{blockedMessage}</span>
          </div>
          <div>
            <Button size="sm" variant="outline" onClick={() => go("billing")}>
              Xem gói trả phí
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="accent"
        size="lg"
        className="mt-8 w-full lg:mt-auto"
        disabled={!check.allowed}
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
