import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Flag, Repeat } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
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
import { RESULT } from "./data";
import type { ExamItem } from "@/features/exam/types";
import type { Attempt } from "@/features/history/types";
import type { CritKey } from "./types";

/** S12–S15 — result page. Binds `latest` to the prototype default RESULT and
 * concrete ids (or the transient unsaved attempt) to the attempt's own band. */
export function ResultsScreen({ attemptId }: { attemptId: string }) {
  const { s, set, go, openPaywall, lastUnpersistedAttempt } = useApp();
  const { isDefaultLatest, attempt } = resolveAttemptView(s.attempts, attemptId, lastUnpersistedAttempt);
  const pro = !!s.plan;
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
  const active: Attempt | null = isDefaultLatest ? null : attempt;
  const band = active?.band ?? RESULT.overall;
  const range = active?.range ?? RESULT.range;
  const lastSession = s.lastPracticeSession;
  const isViewingCurrentPracticeAttempt = Boolean(
    lastSession?.singleQuestionId &&
      ((attempt && lastSession.attemptId === attempt.id) ||
        (isDefaultLatest && (!lastSession.attemptId || lastSession.attemptId === s.attempts[s.attempts.length - 1]?.id))),
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

  const eyebrow = active
    ? `Kết quả · ${active.topic} · ${new Date(active.date).toLocaleDateString("vi-VN")}`
    : `Kết quả · ${lastSession ? `Forecast: ${lastSession.title}` : s.practice ? `Forecast: ${s.practice.title}` : modeLabel(s.mode)} · ${new Date().toLocaleDateString("vi-VN")}`;
  const crit = RESULT.criteria.find((c) => c.key === sel)!;
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
                set({ lastPracticeSession: null });
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
        <BandHero band={band} range={range} target={s.target} />
        <CriteriaGrid sel={tab === "criteria" ? sel : null} pro={pro} onPick={pickCriterion} />
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
              <CriterionDetail key={sel} c={crit} />
            </div>
            {!pro && <SoftPaywall />}
          </div>
        ) : (
          <ReviewList pro={pro} />
        )}
      </div>

      <Card className="mt-5 flex flex-wrap items-center gap-5 p-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Repeat size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Luyện lại câu yếu nhất</div>
          <div className="text-sm text-ink-2">“Why do some people prefer not to ask others for help?” — nói lại và so sánh trước/sau.</div>
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
