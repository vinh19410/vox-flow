import { ArrowRight, Sparkles } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";

/** S15 — soft paywall overlay for the locked criteria pane. */
export function SoftPaywall() {
  const { openPaywall } = useApp();
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center px-2 pb-4">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles size={20} />
        </div>
        <h3 className="mt-4 text-lg font-bold">Xem vì sao bạn được từng band</h3>
        <p className="mt-1.5 text-sm text-ink-2">Band 4 tiêu chí, lý do, trích dẫn câu nói và cách sửa — cho bài này và mọi bài sau.</p>
        <Button variant="accent" className="mt-5 w-full" onClick={openPaywall}>
          Mở khóa từ 49.000đ <ArrowRight size={16} />
        </Button>
        <p className="mt-3 text-xs text-subtle">Thanh toán QR · kích hoạt tự động trong vài giây</p>
      </div>
    </div>
  );
}
