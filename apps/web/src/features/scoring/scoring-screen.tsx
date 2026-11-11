import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Loader2, TriangleAlert, WifiOff } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Card } from "@/components/ds/card";
import { EmptyState } from "@/components/ds/empty-state";
import { Logo } from "@/components/ds/logo";

import {
  DAILY_RETRY_LIMIT_EXCEEDED,
  DAILY_RETRY_LIMIT_MESSAGE,
  RETRY_LIMIT_EXCEEDED,
  RETRY_LIMIT_MESSAGE,
  useScoringJob,
  type ScoringView,
} from "./use-scoring-job";

export const SCORING_STEPS = [
  "Chuyển giọng nói thành chữ",
  "Chấm 4 tiêu chí",
  "Tổng hợp kết quả",
] as const;

export function ScoringScreen() {
  const { s, set, go, goResult, pendingSubmission, setPendingSubmission } = useApp();
  const added = useRef(false);
  const wasPending = useRef(pendingSubmission);
  // Captured once: the job is cleared from app state on hand-off without unmounting this screen.
  const [job] = useState(() => s.scoringAttempt);

  useEffect(() => {
    if (wasPending.current && !added.current) {
      added.current = true;
      set({ practice: null });
      setPendingSubmission(false);
    }
  }, [set, setPendingSubmission]);

  const scoring = useScoringJob(job?.kind === "attempt" ? job : null, {
    onSubmitted: (attemptId) =>
      set((prev) =>
        prev.scoringAttempt?.kind === "attempt" && prev.scoringAttempt.attemptId === attemptId
          ? { scoringAttempt: { kind: "attempt", attemptId, submitted: true } }
          : {},
      ),
    onDone: (attemptId) => {
      set({ scoringAttempt: null });
      goResult(attemptId, { replace: true });
    },
    onNotScorable: () => set({ scoringAttempt: null }),
  });

  const content =
    job?.kind === "local_only" ? (
      <LocalOnlyState onHome={() => go("dashboard")} onMore={() => go("forecast")} />
    ) : !job || scoring.view.kind === "not_scorable" ? (
      <RecordedState onHome={() => go("dashboard")} onMore={() => go("forecast")} />
    ) : (
      <ScoringJobState
        view={scoring.view}
        busy={scoring.busy}
        actionError={scoring.actionError}
        onResubmit={() => void scoring.resubmit()}
        onSubmitWithoutMissing={() => void scoring.submitWithoutMissing()}
        onRetry={() => void scoring.retryScoring()}
        onResume={scoring.resumePolling}
        onHome={() => go("dashboard")}
      />
    );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-5 py-5 sm:px-8">
        <Logo />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-md animate-rise text-center">{content}</div>
      </div>
    </div>
  );
}

/** Direct `/scoring` entry without a job (deep link), or the version-skew fallback when the server marks the attempt `not_scorable`. */
function RecordedState({ onHome, onMore }: { onHome: () => void; onMore: () => void }) {
  return (
    <EmptyState
      size="lg"
      icon={CheckCircle2}
      title="Bài thi đã được ghi nhận!"
      description="Hệ thống đã lưu lại toàn bộ câu trả lời của bạn. Tính năng chấm điểm AI chi tiết đang trong giai đoạn thử nghiệm Beta."
      action={{ label: "Về trang chủ", onClick: onHome }}
      secondaryAction={{ label: "Luyện thêm đề khác", onClick: onMore, variant: "outline" }}
      bordered
      className="bg-white p-8"
    />
  );
}

/** Submitted with no server attempt: nothing was uploaded. Honest state — no success icon, no retry promise (#119). */
function LocalOnlyState({ onHome, onMore }: { onHome: () => void; onMore: () => void }) {
  return (
    <EmptyState
      size="lg"
      icon={TriangleAlert}
      title="Chưa gửi được bài thi lên máy chủ"
      description="Phiên thi chưa đồng bộ được với máy chủ nên câu trả lời của bạn chưa được ghi nhận. Bản ghi âm có thể vẫn còn lưu tạm trên thiết bị này nhưng chưa thể chấm điểm hay khôi phục tự động."
      action={{ label: "Về trang chủ", onClick: onHome }}
      secondaryAction={{ label: "Luyện thêm đề khác", onClick: onMore, variant: "outline" }}
      bordered
      className="bg-white p-8"
    />
  );
}

interface ScoringJobStateProps {
  view: Exclude<ScoringView, { kind: "not_scorable" }>;
  busy: boolean;
  actionError: string | null;
  onResubmit: () => void;
  onSubmitWithoutMissing: () => void;
  onRetry: () => void;
  onResume: () => void;
  onHome: () => void;
}

function ScoringJobState({
  view,
  busy,
  actionError,
  onResubmit,
  onSubmitWithoutMissing,
  onRetry,
  onResume,
  onHome,
}: ScoringJobStateProps) {
  if (view.kind === "submitting" || view.kind === "in_progress" || view.kind === "done") {
    return <ScoringProgress view={view} />;
  }

  const home = { label: "Về trang chủ", onClick: onHome, variant: "outline" as const, disabled: busy };
  // The server's machine-readable quota codes surface as learner-friendly wording.
  const errorText =
    actionError === DAILY_RETRY_LIMIT_EXCEEDED
      ? DAILY_RETRY_LIMIT_MESSAGE
      : actionError === RETRY_LIMIT_EXCEEDED
        ? RETRY_LIMIT_MESSAGE
        : actionError;
  const error = errorText ? (
    <p role="alert" className="mt-4 text-sm font-medium text-bad">
      {errorText}
    </p>
  ) : null;

  if (view.kind === "submit_error") {
    return (
      <div data-testid="scoring-submit-error">
        <EmptyState
          size="lg"
          icon={TriangleAlert}
          title="Chưa gửi được bài thi"
          description="Kết nối gặp sự cố khi gửi bài. Câu trả lời của bạn vẫn được lưu, hãy gửi lại để bắt đầu chấm."
          action={{ label: busy ? "Đang gửi…" : "Gửi lại", onClick: onResubmit, disabled: busy }}
          secondaryAction={home}
          bordered
          className="bg-white p-8"
        />
        {error}
      </div>
    );
  }

  if (view.kind === "upload_error") {
    return (
      <div data-testid="scoring-upload-error">
        <EmptyState
          size="lg"
          icon={TriangleAlert}
          title="Chưa tải lên đủ câu trả lời"
          description={
            view.missing > 0
              ? `${view.missing} câu trả lời chưa tải lên được nên bài chưa được nộp. Bản ghi âm vẫn được giữ trên thiết bị này, hãy kiểm tra kết nối rồi gửi lại.`
              : "Chưa đọc được các bản ghi âm lưu trên thiết bị nên chưa chắc bài đã đủ câu trả lời. Bài chưa được nộp, hãy thử gửi lại."
          }
          action={{ label: busy ? "Đang gửi…" : "Gửi lại", onClick: onResubmit, disabled: busy }}
          secondaryAction={home}
          bordered
          className="bg-white p-8"
        />
        <button
          type="button"
          onClick={onSubmitWithoutMissing}
          disabled={busy}
          className="mt-4 text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-ink disabled:opacity-50"
        >
          {view.missing > 0 ? "Bỏ qua câu bị lỗi và nộp bài" : "Vẫn nộp bài"}
        </button>
        {error}
      </div>
    );
  }

  if (view.kind === "slow") {
    return (
      <div data-testid="scoring-slow">
        <EmptyState
          size="lg"
          icon={Clock}
          title="Đang chậm hơn bình thường"
          description="Bài thi vẫn đang được chấm và đã được lưu an toàn. Bạn có thể kiểm tra lại, hoặc quay lại sau và xem kết quả trong lịch sử luyện tập."
          action={{ label: "Kiểm tra lại", onClick: onResume }}
          secondaryAction={home}
          bordered
          className="bg-white p-8"
        />
      </div>
    );
  }

  if (view.kind === "connection_error") {
    return (
      <div data-testid="scoring-connection-error">
        <EmptyState
          size="lg"
          icon={WifiOff}
          title="Mất kết nối khi kiểm tra kết quả"
          description="Bài thi vẫn đang được chấm trên hệ thống. Kiểm tra kết nối mạng rồi thử lại."
          action={{ label: "Thử lại", onClick: onResume }}
          secondaryAction={home}
          bordered
          className="bg-white p-8"
        />
      </div>
    );
  }

  // canRetry === false: re-scoring this attempt is no longer offered. The
  // copy must match the reason: a spent per-attempt retry is permanent, while
  // a full daily quota comes back tomorrow.
  const retryExhausted = view.canRetry === false;
  const retrySpentOnThisAttempt = (view.manualRetries ?? 0) >= 1;
  return (
    <div data-testid="scoring-failed">
      <EmptyState
        size="lg"
        icon={TriangleAlert}
        title="Chấm điểm chưa thành công"
        description={
          retryExhausted
            ? retrySpentOnThisAttempt
              ? "Bài thi đã được thử lại tối đa 1 lần. Vui lòng tạo bài luyện tập mới."
              : "Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai."
            : "Hệ thống gặp lỗi khi chấm bài này. Bài thi của bạn vẫn được lưu đầy đủ, bạn có thể chấm lại ngay."
        }
        action={{ label: busy ? "Đang gửi yêu cầu…" : "Chấm lại", onClick: onRetry, disabled: busy || retryExhausted }}
        secondaryAction={home}
        bordered
        className="bg-white p-8"
      />
      {error}
    </div>
  );
}

function ScoringProgress({ view }: { view: Extract<ScoringView, { kind: "submitting" | "in_progress" | "done" }> }) {
  const title = view.kind === "submitting" ? "Đang gửi bài thi…" : "Đang chấm bài của bạn";
  const sub =
    view.kind === "submitting"
      ? "Hệ thống đang nhận câu trả lời của bạn."
      : view.kind === "in_progress" && view.status === "queued"
        ? "Bài thi đang chờ đến lượt chấm."
        : "AI đang phân tích phần nói của bạn.";

  return (
    <Card className="p-7 text-left sm:p-8" data-testid="scoring-progress" aria-live="polite">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Loader2 size={22} className="animate-spin" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-lg leading-tight font-bold sm:text-xl">{title}</h1>
          <p className="mt-1 text-sm text-ink-2" data-testid="scoring-status">
            {sub}
          </p>
        </div>
      </div>
      <ol className="mt-6 space-y-2.5">
        {SCORING_STEPS.map((label, k) => (
          <li
            key={label}
            data-testid="scoring-step"
            className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-sm font-medium"
          >
            <span className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white font-mono text-[11px] font-semibold text-subtle">
              {k + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <p className="mt-5 text-xs leading-relaxed text-subtle">
        Bài thi đã được lưu an toàn. Giữ trang này mở để xem kết quả ngay khi chấm xong.
      </p>
    </Card>
  );
}
