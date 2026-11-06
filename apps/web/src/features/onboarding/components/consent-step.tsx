import { ArrowRight, Loader2, ShieldCheck, TriangleAlert, Volume2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";
import { trpcClient } from "@/utils/trpc";

import { ConsentRows } from "./consent-rows";

export function ConsentStep({ onDone }: { onDone: () => void }) {
  const { s } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDone = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      try {
        if (trpcClient?.privacy?.setConsent?.mutate) {
          await trpcClient.privacy.setConsent.mutate({
            save: s.consent.save,
            calibration: s.consent.calibration,
          });
        }
      } catch {
        // Best-effort consent setting (owned by #15)
      }

      if (trpcClient?.profile?.completeOnboarding?.mutate) {
        await trpcClient.profile.completeOnboarding.mutate();
      }
      onDone();
    } catch {
      setError("Không thể hoàn tất onboarding. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-paper">
        <ShieldCheck size={22} />
      </div>
      <h1 className="mt-5 text-[30px] leading-tight font-bold tracking-tight">Bạn quyết định dữ liệu của mình</h1>
      <p className="mt-2 text-ink-2">
        Hai lựa chọn tách riêng. Bạn có thể đổi hoặc xóa toàn bộ dữ liệu bất cứ lúc nào trong mục Quyền riêng tư.
      </p>
      <div className="mt-8">
        <ConsentRows />
      </div>
      <div className="mt-4 flex items-center gap-2 text-[13px] text-subtle">
        <Volume2 size={14} /> Ghi âm chỉ bắt đầu khi bạn bấm nút micro trong phòng thi.
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-bad-soft px-4 py-3 text-[13px] text-bad">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-10 flex justify-end">
        <Button variant="accent" disabled={isSubmitting} onClick={handleDone}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Đang hoàn tất…
            </>
          ) : (
            <>
              Vào trang chủ <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </>
  );
}
