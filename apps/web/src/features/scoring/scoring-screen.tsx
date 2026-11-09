import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { EmptyState } from "@/components/ds/empty-state";
import { Logo } from "@/components/ds/logo";

export function ScoringScreen() {
  const { set, go, pendingSubmission, setPendingSubmission } = useApp();
  const added = useRef(false);
  const wasPending = useRef(pendingSubmission);

  useEffect(() => {
    if (wasPending.current && !added.current) {
      added.current = true;
      set({ practice: null });
      setPendingSubmission(false);
    }
  }, [set, setPendingSubmission]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-5 py-5 sm:px-8">
        <Logo />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-md animate-rise text-center">
          <EmptyState
            size="lg"
            icon={CheckCircle2}
            title="Bài thi đã được ghi nhận!"
            description="Hệ thống đã lưu lại toàn bộ câu trả lời của bạn. Tính năng chấm điểm AI chi tiết đang trong giai đoạn thử nghiệm Beta."
            action={{
              label: "Về trang chủ",
              onClick: () => go("dashboard"),
            }}
            secondaryAction={{
              label: "Luyện thêm đề khác",
              onClick: () => go("forecast"),
              variant: "outline",
            }}
            bordered
            className="bg-white p-8"
          />
        </div>
      </div>
    </div>
  );
}
