import { useState } from "react";
import { Download } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { Modal } from "@/components/ds/modal";
import { PageHead } from "@/layouts/page-head";
import { vnd } from "@/lib/format";

import { PlanGrid } from "./components/plan-grid";
import { PaymentPanel } from "./components/payment-panel";
import { PLANS } from "./data";
import type { Plan } from "./data";

/** S22–S24 — pricing, checkout and account. */
export function BillingScreen() {
  const { s, set, toast } = useApp();
  const [plan, setPlan] = useState<Plan | null>(null);
  return (
    <>
      <PageHead
        eyebrow="S22–S24"
        title="Gói & thanh toán"
        sub="Trả theo ngày thi hoặc theo lượt. Không tự gia hạn ngầm, không cần nhắn tin xác nhận chuyển khoản."
      />

      <Card className="mb-8 flex flex-wrap items-center gap-6 p-6">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-subtle">Gói hiện tại</div>
          <div className="mt-1 flex items-center gap-2 text-xl font-bold">
            {s.plan ? s.plan.name : "Miễn phí"}
            <Badge tone={s.plan ? "good" : "neutral"}>{s.plan ? "Đang hoạt động" : "Band tổng không giới hạn"}</Badge>
          </div>
          <div className="mt-1 text-sm text-ink-2">
            {s.plan ? `Hiệu lực đến: ${s.plan.until}` : "Nâng cấp để xem chi tiết 4 tiêu chí và bằng chứng."}
          </div>
        </div>
        {s.plan && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              set({ plan: null });
              toast("Đã chuyển về gói Miễn phí (prototype)");
            }}
          >
            Về gói miễn phí
          </Button>
        )}
      </Card>

      <h2 className="mb-4 text-lg font-bold">Chọn gói</h2>
      <PlanGrid onPick={setPlan} />

      <h2 className="mt-10 mb-4 text-lg font-bold">Hóa đơn</h2>
      <Card className="divide-y divide-line overflow-hidden">
        {(s.plan
          ? [{ d: new Date().toLocaleDateString("vi-VN"), n: s.plan.name, a: PLANS.find((p) => p.id === s.plan!.id)!.price }]
          : []
        )
          .concat([{ d: "02/04/2025", n: "Theo lượt", a: 49000 }])
          .map((iv, k) => (
            <div key={k} className="flex items-center gap-4 px-6 py-4 text-sm">
              <span className="w-24 text-subtle">{iv.d}</span>
              <span className="flex-1 font-medium">Gói {iv.n}</span>
              <span className="tnum font-semibold">{vnd(iv.a)}</span>
              <Badge tone="good">Đã thanh toán</Badge>
              <button className="text-subtle hover:text-ink" aria-label="Tải hóa đơn" onClick={() => toast("Đã tải hóa đơn PDF")}>
                <Download size={16} />
              </button>
            </div>
          ))}
      </Card>

      <Modal open={!!plan} onClose={() => setPlan(null)} width="max-w-2xl">
        {plan && <PaymentPanel plan={plan} onBack={() => setPlan(null)} onDone={() => setPlan(null)} />}
      </Modal>
    </>
  );
}
