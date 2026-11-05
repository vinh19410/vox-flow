import { useState } from "react";

import { Badge } from "@/components/ds/badge";
import { Toggle } from "@/components/ds/toggle";
import { useApp } from "@/features/app-state/types";
import { trpcClient } from "@/utils/trpc";

export function ConsentRows() {
  const { s, set } = useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rows = [
    {
      k: "save" as const,
      t: "Lưu bài chấm vào lịch sử",
      d: "Lưu audio, transcript và điểm để bạn xem lại và theo dõi tiến bộ. Tắt thì bài không hiện trong lịch sử.",
    },
    {
      k: "calibration" as const,
      t: "Hiệu chuẩn chấm điểm",
      d: "Ẩn danh và chỉ dùng để hiệu chuẩn chấm điểm. Mặc định tắt — không ảnh hưởng tính năng nào.",
    },
  ];

  const handleToggle = async (k: "save" | "calibration", nextVal: boolean) => {
    const prevConsent = s.consent;
    set({
      consent: {
        ...s.consent,
        [k]: nextVal,
        ...(k === "calibration" ? { calibration: nextVal, train: nextVal } : {}),
      },
    });
    setErrorMsg(null);

    try {
      if (trpcClient?.privacy?.setConsent?.mutate) {
        await trpcClient.privacy.setConsent.mutate({
          kind: k,
          granted: nextVal,
        });
      }
    } catch {
      set({ consent: prevConsent });
      setErrorMsg("Không thể lưu cài đặt quyền riêng tư. Vui lòng thử lại.");
    }
  };

  return (
    <div className="divide-y divide-line rounded-3xl border border-line bg-white">
      {rows.map((r) => {
        const isChecked =
          r.k === "save"
            ? s.consent.save
            : Boolean(s.consent.calibration ?? s.consent.train);
        return (
          <div key={r.k} className="flex items-start gap-4 p-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold">
                {r.t}
                {r.k === "calibration" && <Badge>Tùy chọn</Badge>}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{r.d}</p>
            </div>
            <Toggle
              on={isChecked}
              label={r.t}
              onChange={(v) => handleToggle(r.k, v)}
            />
          </div>
        );
      })}
      {errorMsg && (
        <div role="alert" className="p-4 text-xs text-bad">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
