import { useState } from "react";
import { Download, Receipt } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { Card } from "@/components/ds/card";
import { EmptyState } from "@/components/ds/empty-state";
import { Modal } from "@/components/ds/modal";
import { useApp } from "@/features/app-state/types";
import { useQuotaStatus } from "@/features/select/use-quota-status";
import { PageHead } from "@/layouts/page-head";
import { vnd } from "@/lib/format";

import { PaymentPanel } from "./components/payment-panel";
import { PlanGrid } from "./components/plan-grid";
import type { Plan } from "./data";
import { formatExpiryFull, formatExpiryShort } from "./plan-utils";
import { useBillingOrders, useBillingStatus, type BillingReceiptItem } from "./use-billing-status";

function downloadReceipt(item: BillingReceiptItem) {
  const paidDate = item.paidAt
    ? new Date(item.paidAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : new Date(item.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const lines = [
    "BIEN NHAN THANH TOAN - VOX FLOW",
    "================================",
    `Ma don hang: ${item.id}`,
    `Ma chuyen khoan: ${item.transferCode}`,
    `Ma giao dich SePay: ${item.sepayId ?? "N/A"}`,
    `Goi dich vu: ${item.planName}`,
    `So tien: ${vnd(item.amountVnd)}`,
    `Thoi gian thanh toan: ${paidDate}`,
    "Trang thai: Da thanh toan",
    "",
    "Day la bien nhan thanh toan dien tu (chua bao gom hoa don VAT).",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bien-nhan-${item.transferCode}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** S22–S24 — pricing, checkout and account. */
export function BillingScreen() {
  const { toast } = useApp();
  const [plan, setPlan] = useState<Plan | null>(null);
  const billing = useBillingStatus();
  const quota = useQuotaStatus();
  const { orders } = useBillingOrders();

  const sub = billing.status?.subscription ?? quota.status?.subscription ?? null;
  const subExpiresAtMs =
    billing.status?.subscription?.expiresAt ?? quota.status?.subscription?.expiresAtMs ?? 0;
  const detailCredits = billing.status?.detailCredits ?? 0;
  const freeRemaining = quota.status?.remainingPoints ?? 3;
  const freeLimit = quota.status?.dailyLimit ?? 3;

  return (
    <>
      <PageHead
        eyebrow="S22–S24"
        title="Gói & thanh toán"
        sub="Trả theo ngày thi hoặc theo lượt. Không tự gia hạn ngầm, không cần nhắn tin xác nhận chuyển khoản."
      />

      <Card className="mb-8 flex min-w-0 flex-wrap items-center gap-6 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-subtle">Gói hiện tại</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold">
            {sub ? `Gói ${sub.planName}` : "Miễn phí"}
            {sub ? (
              sub.pointsRemaining > 0 ? (
                <Badge tone="good">
                  Còn {sub.pointsRemaining}/{sub.planPointsTotal} điểm · hết hạn {formatExpiryShort(subExpiresAtMs)}
                </Badge>
              ) : (
                <Badge tone="warn">Đã dùng hết điểm gói</Badge>
              )
            ) : (
              <Badge tone="neutral">
                {quota.status ? `${freeRemaining}/${freeLimit} điểm miễn phí hôm nay` : "3 điểm miễn phí/ngày"}
              </Badge>
            )}
            {detailCredits > 0 && (
              <Badge tone="accent">{detailCredits} lượt mở chi tiết</Badge>
            )}
          </div>
          <div className="mt-1.5 text-sm text-ink-2">
            {sub ? (
              sub.pointsRemaining > 0 ? (
                `Hiệu lực đến hết ${formatExpiryFull(subExpiresAtMs)} · Mở chi tiết 4 tiêu chí trong thời hạn gói.`
              ) : (
                `Đã dùng hết điểm gói, đang dùng mức miễn phí (${freeRemaining}/${freeLimit} điểm hôm nay). Vẫn mở chi tiết mọi bài tới ${formatExpiryFull(subExpiresAtMs)}.`
              )
            ) : detailCredits > 0 ? (
              `Bạn còn ${detailCredits} lượt mở chi tiết bài thi và dùng mức ${freeRemaining}/${freeLimit} điểm miễn phí/ngày.`
            ) : (
              "Nâng cấp để xem chi tiết 4 tiêu chí, bằng chứng và có thêm điểm luyện thi."
            )}
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Chọn gói</h2>
        <p className="text-xs text-subtle">Điểm thi chưa dùng hết sẽ mất khi gói hết hạn; mua thêm gói sẽ được cộng dồn ngày và điểm.</p>
      </div>
      <PlanGrid onPick={setPlan} />

      <h2 className="mt-10 mb-4 text-lg font-bold">Biên nhận thanh toán</h2>
      {orders.length > 0 ? (
        <Card className="min-w-0 divide-y divide-line overflow-hidden">
          {orders.map((ord) => (
            <div key={ord.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <span className="font-medium text-ink">Gói {ord.planName}</span>
                <span className="font-mono text-xs text-subtle">{ord.transferCode}</span>
                <span className="text-xs text-subtle">
                  {formatExpiryFull(ord.paidAt ?? ord.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tnum font-semibold">{vnd(ord.amountVnd)}</span>
                <Badge tone="good">Đã thanh toán</Badge>
                <button
                  type="button"
                  className="text-subtle hover:text-ink"
                  aria-label="Tải biên nhận thanh toán"
                  onClick={() => {
                    downloadReceipt(ord);
                    toast("Đã tải biên nhận thanh toán");
                  }}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-6">
          <EmptyState
            size="sm"
            icon={Receipt}
            title="Chưa có biên nhận nào"
            description="Lịch sử các biên nhận thanh toán gói luyện thi sẽ được lưu trữ tại đây."
          />
        </Card>
      )}
      <Modal open={!!plan} onClose={() => setPlan(null)} width="max-w-2xl">
        {plan && <PaymentPanel plan={plan} onBack={() => setPlan(null)} onDone={() => setPlan(null)} />}
      </Modal>
    </>
  );
}
