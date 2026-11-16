import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CircleCheck, Copy, LoaderCircle, Receipt } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";
import { EmptyState } from "@/components/ds/empty-state";
import { invalidateScoredResults } from "@/features/results/use-scored-result";
import { invalidateQuotaStatus } from "@/features/select/use-quota-status";
import { FEATURES } from "@/lib/feature-flags";
import { cx } from "@/lib/cx";
import { mmss, vnd } from "@/lib/format";
import { trpcClient } from "@/utils/trpc";

import type { Plan } from "../data";
import { formatExpiryFull, planUntil } from "../plan-utils";
import { invalidateBillingStatus } from "../use-billing-status";

export type PaymentStatus = "creating" | "waiting" | "expired" | "active" | "restricted" | "error";

interface CreatedOrderInfo {
  orderId: string;
  planId: string;
  planName: string;
  amountVnd: number;
  transferCode: string;
  transferContent: string;
  bankCode: string;
  accountNumber: string;
  qrUrl: string;
  expiresAt: number;
  sepayId?: number | null;
}

export interface PaymentPanelProps {
  plan: Plan;
  onBack: () => void;
  onDone: () => void;
}

function readTrpcErrorMessage(err: unknown): { code?: string; message: string } {
  if (typeof err === "object" && err !== null) {
    const e = err as { data?: { code?: string }; message?: string };
    return { code: e.data?.code, message: e.message ?? "Không thể tạo đơn thanh toán." };
  }
  return { message: "Không thể tạo đơn thanh toán." };
}

function PaymentPanelInner({ plan, onBack, onDone }: PaymentPanelProps) {
  const { s, toast } = useApp();
  const [status, setStatus] = useState<PaymentStatus>("creating");
  const [order, setOrder] = useState<CreatedOrderInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("creating");
    setErrorMessage(null);
    setOrder(null);

    const createOrderFn = trpcClient?.billing?.createOrder?.mutate;
    if (!createOrderFn) {
      setStatus("error");
      setErrorMessage("Dịch vụ thanh toán chưa sẵn sàng.");
      return;
    }

    createOrderFn({ planId: plan.id })
      .then((res) => {
        if (cancelled) return;
        setOrder(res);
        setNowMs(Date.now());
        setStatus(res.status === "paid" ? "active" : "waiting");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const parsed = readTrpcErrorMessage(err);
        if (parsed.code === "FORBIDDEN" || parsed.message === "BILLING_DISABLED") {
          setStatus("restricted");
          return;
        }
        setStatus("error");
        setErrorMessage(
          parsed.message === "EXAM_DATE_PASSED"
            ? "Ngày thi trong hồ sơ đã qua. Vui lòng cập nhật ngày thi hoặc chọn gói khác."
            : parsed.message,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [plan.id]);

  // Countdown tick while waiting
  useEffect(() => {
    if (status !== "waiting" || !order) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= order.expiresAt) {
        setStatus("expired");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status, order]);

  // Poll order status every 3s while waiting (and even briefly after countdown in case transfer landed late)
  useEffect(() => {
    if ((status !== "waiting" && status !== "expired") || !order) return;
    const getOrderFn = trpcClient?.billing?.getOrder?.query;
    if (!getOrderFn) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const latest = await getOrderFn({ orderId: order.orderId });
        if (cancelled) return;
        if (latest.status === "paid") {
          setOrder((prev) => (prev ? { ...prev, sepayId: latest.sepayId } : prev));
          setStatus("active");
          invalidateQuotaStatus();
          invalidateBillingStatus();
          invalidateScoredResults();
          toast(`Đã kích hoạt gói ${plan.name}`);
        }
      } catch {
        // Ignore transient poll errors
      }
    };

    const id = setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status, order, plan.name, toast]);

  const secondsLeft = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, Math.ceil((order.expiresAt - nowMs) / 1000));
  }, [order, nowMs]);

  if (status === "restricted") {
    return (
      <div className="p-7 sm:p-8 text-center">
        <EmptyState
          size="md"
          icon={Receipt}
          title="Cổng thanh toán sắp ra mắt"
          description={`Gói ${plan.name} đang được kiểm thử nội bộ qua SePay VietQR trước khi mở thu tiền chính thức.`}
          action={{
            label: "Đóng",
            onClick: onBack,
            variant: "outline",
          }}
        />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-7 sm:p-8 text-center">
        <EmptyState
          size="md"
          icon={AlertCircle}
          title="Không tạo được mã thanh toán"
          description={errorMessage ?? "Vui lòng thử lại sau ít phút."}
          action={{
            label: "Quay lại",
            onClick: onBack,
            variant: "outline",
          }}
        />
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="animate-rise p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-good-soft text-good">
          <CircleCheck size={32} />
        </div>
        <h2 className="mt-5 text-2xl font-bold">Đã kích hoạt gói {plan.name}</h2>
        <p className="mt-2 text-sm text-ink-2">
          Hiệu lực: {planUntil(plan, s.examDate)}. Biên nhận thanh toán đã lưu trong tài khoản
          {order?.sepayId ? ` (mã GD #${order.sepayId})` : ""}.
        </p>
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

      {status === "creating" || !order ? (
        <div className="mt-8 flex items-center justify-center gap-2 py-12 text-sm text-subtle">
          <LoaderCircle size={18} className="animate-spin" />
          Đang tạo mã VietQR riêng cho đơn hàng…
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-white p-2">
            <img
              src={order.qrUrl}
              alt={`Mã VietQR thanh toán gói ${plan.name}`}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="space-y-3 text-sm">
            {[
              ["Gói", plan.name],
              ["Ngân hàng", order.bankCode],
              ["Số tài khoản", order.accountNumber],
              ["Số tiền", vnd(order.amountVnd)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line pb-3">
                <span className="text-subtle">{k}</span>
                <span className="tnum font-semibold">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
              <span className="text-subtle">Nội dung CK</span>
              <div className="flex items-center gap-2">
                <span className="tnum font-semibold">{order.transferContent}</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(order.transferContent);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs text-ink-2 hover:text-ink"
                  aria-label="Sao chép nội dung chuyển khoản"
                >
                  {copied ? <Check size={12} className="text-good" /> : <Copy size={12} />}
                  {copied ? "Đã chép" : "Chép"}
                </button>
              </div>
            </div>
            <div
              className={cx(
                "flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-medium",
                status === "expired" ? "bg-warn-soft text-ink" : "bg-paper text-ink-2",
              )}
            >
              {status === "expired" ? (
                <span>
                  Mã QR đã hết thời gian hiển thị ({formatExpiryFull(order.expiresAt)}). Nếu bạn vừa chuyển khoản, hệ thống vẫn tiếp tục kiểm tra tự động.
                </span>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand" />
                    <span className="h-2 w-2 rounded-full bg-brand" />
                  </span>
                  Đang chờ thanh toán · hết hạn sau {mmss(secondsLeft)}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentPanel({ plan, onBack, onDone }: PaymentPanelProps) {
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

  return <PaymentPanelInner plan={plan} onBack={onBack} onDone={onDone} />;
}
