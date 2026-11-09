import { CalendarDays } from "lucide-react";

import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { cx } from "@/lib/cx";
import { daysUntil } from "@/lib/format";

export function CountdownCard({ examDate }: { examDate: string | null }) {
  const { set } = useApp();
  const days = daysUntil(examDate);
  return (
    <Card className="flex min-w-0 flex-col p-5 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-medium text-subtle">
        <CalendarDays size={14} /> Ngày thi
      </div>
      {days !== null ? (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tnum text-[56px] leading-none font-extrabold tracking-tight">{days}</span>
            <span className="text-ink-2">ngày nữa</span>
          </div>
          <div className="mt-1 text-sm text-subtle">
            {new Date(examDate!).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </div>
          <div className="mt-auto pt-6">
            <div className="flex justify-between text-xs text-subtle">
              <span>Nhịp luyện đề xuất</span>
              <span className="font-semibold text-ink">1 bài / ngày</span>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className={cx("h-2 rounded-full", i < 4 ? "bg-good" : i === 4 ? "bg-brand" : "bg-paper-2")} />
              ))}
            </div>
            <div className="mt-2 text-xs text-subtle">Chuỗi 4 ngày liên tiếp</div>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-ink-2">Thêm ngày thi để có nhịp luyện phù hợp và gói “Đến ngày thi”.</p>
          <input
            type="date"
            onChange={(e) => set({ examDate: e.target.value || null })}
            className="mt-4 h-11 rounded-2xl border border-line px-4"
          />
        </>
      )}
    </Card>
  );
}
