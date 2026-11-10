import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Flag, Loader2, Repeat, Sparkles, TriangleAlert } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { EmptyState } from "@/components/ds/empty-state";
import { PageHead } from "@/layouts/page-head";
import { FEATURES } from "@/lib/feature-flags";
import { modeLabel } from "@/features/exam/data";
import { resolveAttemptView } from "@/features/history/data";
import { cx } from "@/lib/cx";
import { trpcClient } from "@/utils/trpc";

import { BandHero } from "./components/band-hero";
import { CriteriaGrid } from "./components/criteria-grid";
import { CriterionDetail } from "./components/criterion-detail";
import { ReportModal } from "./components/report-modal";
import { ReviewList } from "./components/review-list";
import { SoftPaywall } from "./components/soft-paywall";
import { toCriteria, toReviewItems } from "./scored-result";
import { useScoredResult } from "./use-scored-result";
import type { CritKey, ResultData, ReviewItem } from "./types";
import type { ExamItem } from "@/features/exam/types";
import type { Attempt } from "@/features/history/types";

export function ResultsScreen({
  attemptId,
  resultData,
  reviews,
}: {
  attemptId: string;
  resultData?: ResultData;
  reviews?: ReviewItem[];
}) {
/** S12–S15 — result page. Binds `latest` to the prototype default RESULT and
 * concrete ids (or the transient unsaved attempt) to the attempt's own band. */
  const { s, set, go, openPaywall, lastUnpersistedAttempt } = useApp();
  const { isDefaultLatest, attempt } = resolveAttemptView(s.attempts, attemptId, lastUnpersistedAttempt);
  // Server attempts (not the prototype "latest", injected data or a local attempt) load real scoring.
  const remoteEnabled = attemptId !== "latest" && !resultData && isDefaultLatest;
  const remote = useScoredResult(attemptId, remoteEnabled);
  const scored = remote.state === "ready" ? remote.result : null;
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [tab, setTab] = useState<"criteria" | "review">("criteria");
  const [sel, setSel] = useState<CritKey>("GRA");
  const [report, setReport] = useState(false);
  const [disputeInfo, setDisputeInfo] = useState<{
    enabled: boolean;
    dispute: {
      id: string;
      status: string;
      dueAt: number | Date | string;
      targetCriterion?: string;
    } | null;
  } | null>(null);

  const loadDispute = useCallback(() => {
    if (isDefaultLatest || !attemptId || attemptId === "latest") return;
    if (trpcClient?.dispute?.get?.query) {
      trpcClient.dispute.get
        .query({ attemptId })
        .then((res) => {
          setDisputeInfo(res);
        })
        .catch((err) => {
          console.warn("Failed to load dispute status:", err);
        });
    }
  }, [isDefaultLatest, attemptId]);

  useEffect(() => {
    loadDispute();
  }, [loadDispute]);

  const openScoring = () => {
    set({ scoringAttempt: { attemptId, submitted: true } });
    go("scoring");
  };
  const retryScoring = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      await trpcClient.scoring.retry.mutate({ attemptId });
      openScoring();
    } catch (err) {
      console.warn("Scoring retry failed:", err);
      setRetryError("Chưa gửi được yêu cầu chấm lại. Vui lòng thử lại sau ít phút.");
    } finally {
      setRetrying(false);
    }
  };

  if (remoteEnabled && !scored) {
    if (remote.state === "loading" || remote.state === "idle") {
      return (
        <div className="py-6" data-testid="results-loading">
          <Card className="mt-6 flex items-center justify-center gap-3 p-10 text-sm text-ink-2">
            <Loader2 size={18} className="animate-spin text-brand" aria-hidden /> Đang tải kết quả…
          </Card>
        </div>
      );
    }
    if (remote.state === "error") {
      return (
        <div className="py-6" data-testid="results-error">
          <Card className="mt-6 p-8">
            <EmptyState
              size="lg"
              icon={TriangleAlert}
              title="Không tải được kết quả"
              description="Kết nối gặp sự cố. Bài thi của bạn vẫn được lưu, hãy thử tải lại."
              action={{ label: "Tải lại", onClick: remote.reload }}
              secondaryAction={{ label: "Về trang chủ", onClick: () => go("dashboard"), variant: "outline" }}
            />
          </Card>
        </div>
      );
    }
    const { status } = remote;
    if (status.scorable && (status.status === "queued" || status.status === "processing")) {
      return (
        <div className="py-6" data-testid="results-scoring">
          <Card className="mt-6 p-8">
            <EmptyState
              size="lg"
              icon={<Loader2 size={32} className="animate-spin text-brand" aria-hidden />}
              title="Bài thi đang được chấm"
              description="Kết quả 4 tiêu chí sẽ sẵn sàng ngay khi hệ thống chấm xong."
              action={{ label: "Xem tiến trình chấm", onClick: openScoring }}
              secondaryAction={{ label: "Về trang chủ", onClick: () => go("dashboard"), variant: "outline" }}
            />
          </Card>
        </div>
      );
    }
    if (status.scorable && status.status === "failed") {
      return (
        <div className="py-6" data-testid="results-failed">
          <Card className="mt-6 p-8">
            <EmptyState
              size="lg"
              icon={TriangleAlert}
              title="Chấm điểm chưa thành công"
              description="Bài thi của bạn vẫn được lưu đầy đủ, bạn có thể chấm lại ngay."
              action={{ label: retrying ? "Đang gửi yêu cầu…" : "Chấm lại", onClick: () => void retryScoring(), disabled: retrying }}
              secondaryAction={{ label: "Về trang chủ", onClick: () => go("dashboard"), variant: "outline" }}
            />
            {retryError && (
              <p role="alert" className="mt-4 text-center text-sm font-medium text-bad">
                {retryError}
              </p>
            )}
          </Card>
        </div>
      );
    }
  }

  if (!scored && !FEATURES.scoring) {
    return (
      <div className="py-6">
        <PageHead
          eyebrow="Kết quả bài thi"
          title="Bài thi đã được lưu"
          sub="Hệ thống đã ghi nhận toàn bộ phần nói của bài thi."
        />
        <Card className="mt-6 p-8">
          <EmptyState
            size="lg"
            icon={Sparkles}
            title="Tính năng chấm điểm AI sắp ra mắt"
            description="Bài thi của bạn đã được ghi nhận và lưu trữ an toàn. Tính năng chấm điểm 4 tiêu chí và trích xuất bằng chứng tự động đang trong giai đoạn hoàn thiện cho bản Beta."
            action={{
              label: "Về trang chủ",
              onClick: () => go("dashboard"),
            }}
            secondaryAction={{
              label: "Luyện đề khác",
              onClick: () => go("forecast"),
              variant: "outline",
            }}
          />
        </Card>
      </div>
    );
  }

  const active: Attempt | null = isDefaultLatest ? null : attempt;
  const band = scored ? scored.overall : (active?.band ?? resultData?.overall ?? 6.5);
  // Scored results show a single band: no confidence range or per-run values.
  const range = scored ? undefined : (active?.range ?? resultData?.range ?? [6.0, 7.0]);
  const runs = scored ? undefined : (resultData?.runs ?? [band, band, band]);
  const oneLiner = scored ? scored.oneLiner : resultData?.oneLiner;
  // Beta: every scored result is fully unlocked.
  const pro = scored ? true : !!s.plan;
  const criteria = scored ? toCriteria(scored) : resultData?.criteria;
  const reviewItems = scored ? toReviewItems(scored) : (reviews ?? resultData?.reviews);
  const lastSession = s.lastPracticeSession;
  const isViewingCurrentPracticeAttempt = Boolean(
    lastSession?.singleQuestionId &&
      lastSession.attemptId &&
      ((attempt && lastSession.attemptId === attempt.id) ||
        (isDefaultLatest && lastSession.attemptId === s.attempts[s.attempts.length - 1]?.id)),
  );
  const isSinglePractice = isViewingCurrentPracticeAttempt;
  const topicItems = lastSession?.topicItems ?? [];
  const currentIdx = topicItems.findIndex((it) => it.id === lastSession?.singleQuestionId);
  const nextItem =
    currentIdx >= 0 && currentIdx < topicItems.length - 1
      ? topicItems.slice(currentIdx + 1).find((it) => !it.cue)
      : undefined;

  const handleNextQuestion = () => {
    if (!lastSession || !nextItem) return;
    const singleItem: ExamItem = {
      ...nextItem,
      cue: undefined,
    };
    set({
      practice: {
        topicId: lastSession.topicId,
        title: lastSession.title,
        kind: lastSession.kind,
        items: [singleItem],
        singleQuestionId: nextItem.id,
        topicItems: lastSession.topicItems,
      },
      lastPracticeSession: null,
    });
    go("exam");
  };

  const eyebrow = scored
    ? `Kết quả · Luyện đề Forecast · ${new Date(scored.scoredAt).toLocaleDateString("vi-VN")}`
    : active
    ? `Kết quả · ${active.topic} · ${new Date(active.date).toLocaleDateString("vi-VN")}`
    : `Kết quả · ${lastSession ? `Forecast: ${lastSession.title}` : s.practice ? `Forecast: ${s.practice.title}` : modeLabel(s.mode)} · ${new Date().toLocaleDateString("vi-VN")}`;
  const crit = criteria?.find((c) => c.key === sel);
  const pickCriterion = (key: CritKey) => {
    setSel(key);
    setTab("criteria");
    if (!pro) openPaywall();
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-subtle uppercase">{eyebrow}</div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">Bạn đạt band {band.toFixed(1)}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {disputeInfo?.dispute && (disputeInfo.dispute.status === "open" || disputeInfo.dispute.status === "reviewing") ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-800">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Báo lỗi đang xử lý · Cam kết phản hồi trước{" "}
              {new Date(disputeInfo.dispute.dueAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              {new Date(disputeInfo.dispute.dueAt).toLocaleDateString("vi-VN")}
            </div>
          ) : disputeInfo?.dispute?.status === "resolved" ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Báo lỗi đã xử lý
            </div>
          ) : disputeInfo?.dispute?.status === "rejected" ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700">
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" />
              Báo lỗi không được chấp nhận
            </div>
          ) : disputeInfo?.enabled && !isDefaultLatest && attemptId && attemptId !== "latest" ? (
            <Button variant="outline" size="sm" onClick={() => setReport(true)}>
              <Flag size={14} /> Báo lỗi chấm
            </Button>
          ) : null}
          {isSinglePractice && nextItem && (
            <Button variant="accent" size="sm" onClick={handleNextQuestion} data-testid="next-question-btn">
              Luyện câu kế tiếp trong chủ đề <ArrowRight size={14} />
            </Button>
          )}
          {isSinglePractice && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (lastSession?.topicId) {
                  set({ reopenTopicId: lastSession.topicId });
                }
                go("forecast");
              }}
              data-testid="back-to-topic-btn"
            >
              Quay lại chủ đề
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              set({ lastPracticeSession: null });
              go("select");
            }}
          >
            <Repeat size={14} /> Thi lại
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <BandHero band={band} range={range} target={s.target} runs={runs} oneLiner={oneLiner} />
        <CriteriaGrid criteria={criteria} sel={tab === "criteria" ? sel : null} pro={pro} onPick={pickCriterion} />
      </div>

      <div className="mt-10 flex gap-1 rounded-full bg-paper-2 p-1 sm:w-fit">
        {[
          ["criteria", "Bằng chứng theo tiêu chí"],
          ["review", "Xem lại từng câu"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k as typeof tab)}
            className={cx("h-10 flex-1 rounded-full px-5 text-sm font-semibold transition-all sm:flex-none", tab === k ? "bg-white shadow-sm" : "text-ink-2")}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "criteria" ? (
          <div className="relative">
            <div className={cx(!pro && "pointer-events-none max-h-[420px] overflow-hidden select-none [mask-image:linear-gradient(to_bottom,black_30%,transparent)]")}>
            {crit && <CriterionDetail key={sel} c={crit} />}
            </div>
            {!pro && <SoftPaywall />}
          </div>
        ) : (
          <ReviewList pro={pro} items={reviewItems} playback={!scored} />
        )}
      </div>

      <Card className="mt-5 flex flex-wrap items-center gap-5 p-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Repeat size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Luyện lại câu yếu nhất</div>
          <div className="text-sm text-ink-2">Thực hành nói lại các câu cần cải thiện để so sánh trước và sau.</div>
        </div>
        <Button
          onClick={() => {
            set({ lastPracticeSession: null });
            go("select");
          }}
        >
          Luyện ngay <ArrowRight size={16} />
        </Button>
      </Card>

      <ReportModal
        open={report}
        onClose={() => setReport(false)}
        attemptId={attemptId}
        onSubmitted={loadDispute}
      />
    </>
  );
}
