import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Badge } from "@/components/ds/badge";
import { Modal } from "@/components/ds/modal";

import { PlanGrid } from "./plan-grid";
import { PaymentPanel } from "./payment-panel";
import type { Plan } from "../data";

export interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

/** S15 — soft paywall shown from the result screen; mounted globally in _proto/route.tsx. */
export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const { s } = useApp();
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    if (open) setPlan(null);
  }, [open]);
  if (s.plan && !plan) return null;
  return (
    <Modal open={open} onClose={onClose} width="max-w-2xl">
      {plan ? (
        <PaymentPanel plan={plan} onBack={() => setPlan(null)} onDone={onClose} />
      ) : (
        <div className="p-7 sm:p-8">
          <Badge tone="accent">Mở khóa chi tiết</Badge>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">Biết chính xác cần sửa gì để lên {s.target.toFixed(1)}</h2>
          <div className="mt-5 grid gap-2 text-sm text-ink-2 sm:grid-cols-2">
            {[
              "Band + khoảng tin cậy cho 4 tiêu chí",
              "Lý do kèm trích dẫn câu bạn nói",
              "Đánh dấu lỗi ngữ pháp, từ vựng, phát âm",
              "Câu gợi ý nâng band cho từng lỗi",
            ].map((x) => (
              <div key={x} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-good" />
                {x}
              </div>
            ))}
          </div>
          <div className="mt-7">
            <PlanGrid onPick={setPlan} compact />
          </div>
          <p className="mt-5 text-center text-xs text-subtle">Band tổng vẫn miễn phí cho mọi lượt, kể cả khi bạn không nâng cấp.</p>
        </div>
      )}
    </Modal>
  );
}
