import { useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle, Sparkles } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";
import { invalidateBillingStatus, useBillingStatus } from "@/features/billing/use-billing-status";
import { trpcClient } from "@/utils/trpc";

import { invalidateScoredResults } from "../use-scored-result";

export interface SoftPaywallProps {
  /** Render inline in normal flow (for example below unlocked weakest-question content) instead of bottom-pinned overlay. */
  inline?: boolean;
  /** Server attempt ID when viewing a real scored result (enables per-attempt detail unlock). */
  attemptId?: string;
}

/** S15 — soft paywall overlay (or inline card) for locked result details. */
export function SoftPaywall({ inline = false, attemptId }: SoftPaywallProps) {
  const { openPaywall, toast } = useApp();
  const billing = useBillingStatus();
  const detailCredits = billing.status?.detailCredits ?? 0;
  const [unlocking, setUnlocking] = useState(false);

  const canUseCredit = Boolean(attemptId && detailCredits > 0);

  async function handleUnlockWithCredit() {
    if (!attemptId || unlocking) return;
    const unlockFn = trpcClient?.billing?.unlockDetail?.mutate;
    if (!unlockFn) return;

    setUnlocking(true);
    try {
      const res = await unlockFn({ attemptId });
      invalidateBillingStatus();
      invalidateScoredResults();
      toast(
        res.alreadyUnlocked
          ? "Bài thi này đã được mở khóa."
          : `Đã mở khóa chi tiết bài thi (còn ${res.remaining} lượt).`,
      );
    } catch {
      invalidateBillingStatus();
      toast("Không thể mở khóa bài thi lúc này. Vui lòng thử lại.");
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className={inline ? "mt-4 flex justify-center" : "absolute inset-x-0 bottom-0 flex justify-center px-2 pb-4"}>
      <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles size={20} />
        </div>
        <h3 className="mt-4 text-lg font-bold">Xem vì sao bạn được từng band</h3>
        <p className="mt-1.5 text-sm text-ink-2">Band 4 tiêu chí, lý do, trích dẫn câu nói và cách sửa — cho bài này và mọi bài sau.</p>
        {canUseCredit ? (
          <div className="mt-5 flex flex-col gap-2.5">
            <Button
              variant="accent"
              className="w-full"
              disabled={unlocking}
              onClick={() => void handleUnlockWithCredit()}
            >
              {unlocking ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Dùng 1 lượt để mở bài này (còn {detailCredits} lượt)
            </Button>
            <Button variant="outline" className="w-full" onClick={openPaywall}>
              Hoặc nâng cấp gói khác <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          <Button variant="accent" className="mt-5 w-full" onClick={openPaywall}>
            Mở khóa từ 49.000đ <ArrowRight size={16} />
          </Button>
        )}
        <p className="mt-3 text-xs text-subtle">Thanh toán QR · kích hoạt tự động trong vài giây</p>
      </div>
    </div>
  );
}
