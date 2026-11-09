import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, LoaderCircle, QrCode, Receipt } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";
import { EmptyState } from "@/components/ds/empty-state";
import { FEATURES } from "@/lib/feature-flags";
import { cx } from "@/lib/cx";
import { mmss, vnd } from "@/lib/format";
import { FakeQR } from "./fake-qr";
import { planUntil } from "../plan-utils";
import type { Plan } from "../data";

export type PaymentStatus = "waiting" | "received" | "active";

export interface PaymentPanelProps {
  plan: Plan;
  onBack: () => void;
  onDone: () => void;
}

export function PaymentPanel({ plan, onBack, onDone }: PaymentPanelProps) {
  const { s, set, toast } = useApp();
  const [left, setLeft] = useState(600);
  const [status, setStatus] = useState<PaymentStatus>("waiting");
  const code = `CR${(s.email ? s.email.slice(0, 4) : "USER").toUpperCase()}7Q`;

  if (!FEATURES.billing) {
    return (
      <div className="p-7 sm:p-8 text-center">
        <EmptyState
          size="md"
          icon={Receipt}
          title="Cổng thanh toán sắp ra mắt"
          description={`Gói ${plan.name} đang được tích hợp cổng thanh toán tự động VietQR qua SePay. Trong thời gian thử nghiệm Beta, toàn bộ tính năng đều được mở miễn phí.`}
          action={{
            label: "Đóng",
            onClick: onBack,
            variant: "outline",
          }}
        />
      </div>
    );
  }

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (status !== "received") return;
    const t = setTimeout(() => {
      setStatus("active");
      set({ plan: { id: plan.id, name: plan.name, until: planUntil(plan, s.examDate) } });
      toast(`Đã kích hoạt gói ${plan.name}`);
    }, 1200);
    return () => clearTimeout(t);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "active") {
    return (
      <div className="animate-rise p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-good-soft text-good">
          <CircleCheck size={32} />
        </div>
        <h2 className="mt-5 text-2xl font-bold">Đã kích hoạt gói {plan.name}</h2>
        <p className="mt-2 text-sm text-ink-2">Hiệu lực: {planUntil(plan, s.examDate)}. Hóa đơn đã gửi tới {s.email}.</p>
        <Button variant="accent" className="mt-7 w-full" onClick={onDone}>
          Xem chi tiết 4 tiêu chí <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="p-7 sm:p-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-subtle hover:text-ink">
        <ArrowLeft size={15} /> Đổi gói
      </button>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Quét mã để thanh toán</h2>
      <p className="mt-1 text-sm text-ink-2">Dùng app ngân hàng hoặc ví bất kỳ. Gói kích hoạt tự động ngay khi nhận tiền.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr]">
        <div className="relative aspect-square rounded-3xl border border-line bg-white p-3">
          <FakeQR />
          {status === "received" && (
            <div className="absolute inset-0 grid animate-fade place-items-center rounded-3xl bg-white/90">
              <LoaderCircle className="animate-spin text-good" />
            </div>
          )}
        </div>
        <div className="space-y-3 text-sm">
          {[
            ["Gói", plan.name],
            ["Số tiền", vnd(plan.price)],
            ["Nội dung CK", code],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line pb-3">
              <span className="text-subtle">{k}</span>
              <span className="tnum font-semibold">{v}</span>
            </div>
          ))}
          <div className={cx("flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-medium", status === "waiting" ? "bg-paper text-ink-2" : "bg-good-soft text-good")}>
            {status === "waiting" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand" />
                  <span className="h-2 w-2 rounded-full bg-brand" />
                </span>
                Đang chờ thanh toán · hết hạn sau {mmss(left)}
              </>
            ) : (
              <>
                <Check size={15} /> Đã nhận tiền, đang kích hoạt…
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line p-3 pl-4">
        <span className="text-xs text-subtle">Prototype: giả lập webhook ngân hàng</span>
        <Button size="sm" variant="soft" disabled={status !== "waiting"} onClick={() => setStatus("received")}>
          <QrCode size={14} /> Đã chuyển khoản
        </Button>
      </div>
    </div>
  );
}
