import { History, TrendingUp } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ds/card";
import { EmptyState } from "@/components/ds/empty-state";
import { useApp } from "@/features/app-state/types";
import { MODES } from "@/features/exam/data";
import type { Mode } from "@/features/exam/types";
import { cx } from "@/lib/cx";
import { PageHead } from "@/layouts/page-head";

import { AttemptList } from "./components/attempt-list";
import { TrendChart } from "./components/trend-chart";

export function HistoryScreen() {
  const { s, go } = useApp();
  const [filter, setFilter] = useState<Mode | "all">("all");
  const list = s.attempts.filter((a) => filter === "all" || a.mode === filter);

  return (
    <>
      <PageHead eyebrow="S19" title="Lịch sử bài làm" sub="Vùng mờ là khoảng tin cậy của từng bài — giúp bạn thấy tiến bộ thật, không phải dao động ngẫu nhiên." />

      <div className="mb-5 flex flex-wrap gap-2">
        {([{ id: "all", title: "Tất cả" }, ...MODES] as { id: Mode | "all"; title: string }[]).map((m) => (
          <button key={m.id} onClick={() => setFilter(m.id)} className={cx("h-9 rounded-full px-4 text-sm font-medium transition-colors", filter === m.id ? "bg-ink text-paper" : "border border-line bg-white hover:border-ink/30")}>
            {m.title}
          </button>
        ))}
      </div>

      <Card className="min-w-0 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Band theo thời gian</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-subtle sm:gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-brand" /> Band
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-brand/15" /> Khoảng tin cậy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-good" /> Mục tiêu
            </span>
          </div>
        </div>
        {list.length ? (
          <TrendChart list={list} target={s.target} />
        ) : (
          <EmptyState
            size="md"
            icon={TrendingUp}
            title="Chưa có bài nào cho bộ lọc này."
            description="Hãy thử chọn bộ lọc chế độ thi khác hoặc làm thêm bài thi để xem biểu đồ tiến độ."
            className="py-12"
          />
        )}
      </Card>

      {list.length ? (
        <AttemptList list={list} />
      ) : s.attempts.length === 0 ? (
        <Card className="mt-5 p-6">
          <EmptyState
            size="md"
            icon={History}
            title="Chưa có lịch sử làm bài"
            description="Mọi bài thi thử và kết quả đánh giá sẽ được ghi nhận tại đây để bạn tiện theo dõi sự tiến bộ."
            action={{
              label: "Thi thử ngay",
              onClick: () => go("select"),
            }}
          />
        </Card>
      ) : null}
    </>
  );
}
