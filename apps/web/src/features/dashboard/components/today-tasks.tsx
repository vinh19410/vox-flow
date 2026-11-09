import { CalendarCheck } from "lucide-react";

import { Card } from "@/components/ds/card";
import { EmptyState } from "@/components/ds/empty-state";
import { useApp } from "@/features/app-state/types";
import type { Attempt } from "@/features/history/types";

export function TodayTasks({ attempts = [] }: { attempts?: Attempt[] }) {
  const { go } = useApp();

  return (
    <Card className="min-w-0 p-5 sm:p-7 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Việc hôm nay</h2>
      </div>
      <EmptyState
        size="sm"
        icon={CalendarCheck}
        title="Chưa có việc cần làm hôm nay"
        description={
          attempts.length > 0
            ? "Bạn đã hoàn thành các mục tiêu gần nhất. Tiếp tục luyện tập thêm các chủ đề forecast hoặc làm bài thi thử mới."
            : "Hoàn thành bài thi thử đầu tiên để AI phân tích lỗi sai và đề xuất các bài luyện tập trọng tâm hàng ngày."
        }
        action={{
          label: attempts.length > 0 ? "Luyện đề forecast" : "Làm bài thi thử",
          onClick: () => go(attempts.length > 0 ? "forecast" : "select"),
        }}
        className="py-8"
      />
    </Card>
  );
}
