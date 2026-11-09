import { Mic } from "lucide-react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";
import { authClient } from "@/lib/auth-client";
import { PageHead } from "@/layouts/page-head";

import { CountdownCard } from "./components/countdown-card";
import { RecentAttemptCard } from "./components/recent-attempt-card";
import { ReadinessCard } from "./components/readiness-card";
import { TodayTasks } from "./components/today-tasks";

export function DashboardScreen() {
  const { s, go } = useApp();
  const { data: session } = authClient.useSession();
  // Session user wins over the prototype state seed ("Minh Anh") so real
  // accounts see their own name; seed only covers the not-yet-loaded window.
  const firstName =
    (session?.user?.name?.trim() || s.name).trim().split(/\s+/).pop() || s.name;
  if (!s.attempts.length) {
    return (
      <>
        <PageHead
          eyebrow="Trang chủ"
          title={`Chào ${firstName}!`}
          sub="Chưa có bài làm nào. Làm bài đầu tiên để có band ước lượng và việc cần luyện mỗi ngày."
        />
        <Button variant="accent" size="lg" onClick={() => go("select")}>
          <Mic size={18} /> Thi thử bài đầu tiên
        </Button>
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
        title={`Chào ${firstName}, sẵn sàng nói chưa?`}
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
        <TodayTasks />
        <RecentAttemptCard attempts={s.attempts} />
      </div>
    </>
  );
}
