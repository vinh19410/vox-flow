import { Mic } from "lucide-react";

import { Button } from "@/components/ds/button";
import { EmptyState } from "@/components/ds/empty-state";
import { useApp } from "@/features/app-state/types";
import { PageHead } from "@/layouts/page-head";

import { CountdownCard } from "./components/countdown-card";
import { RecentAttemptCard } from "./components/recent-attempt-card";
import { ReadinessCard } from "./components/readiness-card";
import { TodayTasks } from "./components/today-tasks";

export function DashboardScreen() {
  const { s, go } = useApp();
  const greetingName = s.name.trim() ? s.name.split(" ").pop() : "";

  if (!s.attempts.length) {
    return (
      <>
        <PageHead
          eyebrow="Trang chủ"
          title={greetingName ? `Chào ${greetingName}!` : "Chào bạn!"}
          sub="Chưa có bài làm nào. Làm bài đầu tiên để có band ước lượng và việc cần luyện mỗi ngày."
        />
        <EmptyState
          size="lg"
          icon={Mic}
          title="Bắt đầu bài thi thử đầu tiên"
          description="Làm bài đầu tiên để có band ước lượng và việc cần luyện mỗi ngày."
          action={{
            label: "Thi thử bài đầu tiên",
            onClick: () => go("select"),
            icon: Mic,
          }}
          bordered
          className="mt-6 bg-white py-14"
        />
      </>
    );
  }

  const recent = s.attempts.slice(-4);
  const est = recent.reduce((a, b) => a + b.band, 0) / recent.length;
  const estBand = Math.round(est * 2) / 2;

  return (
    <>
      <PageHead
        eyebrow={new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
        title={greetingName ? `Chào ${greetingName}, sẵn sàng nói chưa?` : "Chào bạn, sẵn sàng nói chưa?"}
        right={
          <Button variant="accent" size="lg" onClick={() => go("select")}>
            <Mic size={18} /> Thi thử ngay
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ReadinessCard estBand={estBand} target={s.target} />
        <CountdownCard examDate={s.examDate} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TodayTasks attempts={s.attempts} />
        <RecentAttemptCard attempts={s.attempts} />
      </div>
    </>
  );
}
