import { AlertCircle, Clock, Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";
import { cx } from "@/lib/cx";

import { GLOBAL_CAP_NEUTRAL_MESSAGE, useQuotaStatus } from "../use-quota-status";

export interface QuotaBannerProps {
  className?: string;
}

export function QuotaBanner({ className }: QuotaBannerProps) {
  const { go } = useApp();
  const quota = useQuotaStatus();

  if (!quota.isLoaded || !quota.status) {
    return null;
  }

  const { status } = quota;

  if (status.entitlement === "paid") {
    return (
      <div
        data-testid="quota-banner"
        className={cx(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-good/25 bg-good-soft/60 px-4 py-3 text-sm text-good",
          className,
        )}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Crown size={16} />
          <span>Gói trả phí · Luyện không giới hạn</span>
        </div>
        <span className="text-xs text-good/90">Không áp dụng giới hạn điểm ngày &amp; trần hệ thống</span>
      </div>
    );
  }

  if (status.globalCapReached) {
    return (
      <div
        data-testid="quota-banner"
        role="alert"
        className={cx(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/35 bg-warn-soft px-4 py-3 text-sm text-ink",
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <div className="font-semibold">{GLOBAL_CAP_NEUTRAL_MESSAGE}</div>
            <div className="mt-0.5 text-xs text-ink-2">
              Hạn mức cá nhân của bạn: Còn {status.remainingPoints}/{status.dailyLimit} điểm hôm nay · Đặt lại lúc 00:00 (giờ Việt Nam)
            </div>
          </div>
        </div>
        <Button size="sm" variant="accent" onClick={() => go("billing")}>
          Xem gói trả phí
        </Button>
      </div>
    );
  }

  if (status.remainingPoints === 0) {
    return (
      <div
        data-testid="quota-banner"
        role="alert"
        className={cx(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bad/25 bg-bad-soft px-4 py-3 text-sm text-ink",
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <Clock size={17} className="mt-0.5 shrink-0 text-bad" />
          <div>
            <div className="font-semibold">
              Còn 0/{status.dailyLimit} điểm hôm nay · Đặt lại lúc 00:00 (giờ Việt Nam)
            </div>
            <div className="mt-0.5 text-xs text-ink-2">
              Lần luyện lại câu yếu đầu tiên của mỗi bài vẫn miễn phí (0 điểm).
            </div>
          </div>
        </div>
        <Button size="sm" variant="accent" onClick={() => go("billing")}>
          Xem gói trả phí
        </Button>
      </div>
    );
  }

  return (
    <div
      data-testid="quota-banner"
      className={cx(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-brand">
          <Sparkles size={14} />
        </span>
        <div>
          <span className="font-semibold text-ink">
            Còn {status.remainingPoints}/{status.dailyLimit} điểm hôm nay
          </span>
          {status.remainingPoints < 3 && (
            <span className="ml-2 text-xs text-ink-2">· Đủ cho Part lẻ hoặc Forecast</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="flex items-center gap-1">
          <Clock size={13} /> Đặt lại lúc 00:00 (giờ Việt Nam)
        </span>
      </div>
    </div>
  );
}
