import { AlertCircle, ArrowRight, Bookmark, BookmarkCheck, CornerDownRight, Flame, Info, Mic, RotateCcw, Users } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Modal } from "@/components/ds/modal";
import { useApp, type QuestionPracticeRecord } from "@/features/app-state/types";
import type { ExamItem } from "@/features/exam/types";
import type { ForecastTopic } from "@/features/forecast/types";
import { canStartForecast, forecastPointCost, getQuotaErrorMessage, useQuotaStatus } from "@/features/select/use-quota-status";

export interface TopicDetailModalProps {
  topic: ForecastTopic | null;
  practicedBand: number | undefined;
  saved: boolean;
  target?: number;
  practicedQuestions?: Record<string, QuestionPracticeRecord>;
  onClose: () => void;
  onToggleSave: () => void;
  onStart: () => void;
  onStartQuestion?: (item: ExamItem, allItems: ExamItem[]) => void;
}

export function TopicDetailModal({
  topic: open,
  practicedBand,
  saved,
  target,
  practicedQuestions,
  onClose,
  onToggleSave,
  onStart,
  onStartQuestion,
}: TopicDetailModalProps) {
  const { go } = useApp();
  const quota = useQuotaStatus();
  const topicCheck = open ? canStartForecast(quota, open.kind, false) : null;
  const singleCheck = open ? canStartForecast(quota, open.kind, true) : null;
  const isPaid = quota.isLoaded && quota.status?.entitlement === "paid";

  const topicBlockedMessage =
    open && topicCheck && quota.isLoaded && !topicCheck.allowed && topicCheck.reason
      ? topicCheck.reason === "QUOTA_EXCEEDED" && (quota.status?.remainingPoints ?? 0) > 0
        ? `Luyện cả chủ đề này cần ${topicCheck.cost} điểm (bạn còn ${quota.status?.remainingPoints ?? 0}/${quota.status?.dailyLimit ?? 3} điểm hôm nay). Bạn có thể luyện từng câu (1 điểm) hoặc nâng cấp gói trả phí.`
        : getQuotaErrorMessage(topicCheck.reason, "start")
      : null;

  return (
    <Modal open={!!open} onClose={onClose} width="max-w-2xl">
      {open && (
        <div className="p-7 sm:p-8">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="dark">{open.kind === "p1" ? "Part 1" : "Part 2 & 3"}</Badge>
            <Badge>{open.category}</Badge>
            <Badge>{isPaid ? "Không giới hạn" : `${forecastPointCost(open.kind)} điểm`}</Badge>
            {open.tag === "hot" && (
              <Badge tone="accent">
                <Flame size={11} /> Hay gặp
              </Badge>
            )}
            {open.tag === "new" && <Badge tone="info">Mới trong quý</Badge>}
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">{open.title}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-subtle">
            <span className="flex items-center gap-1">
              <Users size={13} /> {open.reports} thí sinh báo gặp
            </span>
            <span>Gặp gần nhất: {open.lastSeen}</span>
            {practicedBand !== undefined && <span className="font-semibold text-good">Lần luyện trước: band {practicedBand.toFixed(1)}</span>}
          </div>

          <div className="mt-6 space-y-2">
            {open.items.map((it, k) => {
              const qHistory = practicedQuestions?.[it.id];
              return it.cue ? (
                <div key={it.id} className="rounded-2xl bg-paper p-5">
                  <div className="font-mono text-[11px] tracking-wider text-subtle">PART 2 · CUE CARD</div>
                  <div className="mt-2 font-bold">{it.cue.title}</div>
                  <div className="mt-2 text-sm text-ink-2">You should say: {it.cue.points.join(", ")} {it.cue.ending}</div>
                </div>
              ) : (
                <div key={it.id}>
                  <div className="flex flex-col gap-2 rounded-2xl border border-line p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 transition-colors hover:border-ink/20">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 font-mono text-xs text-subtle shrink-0">
                        P{it.part}·{open.kind === "p1" ? k + 1 : k}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <span className="text-sm font-medium leading-snug">{it.text}</span>
                        {qHistory && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge tone={target !== undefined && qHistory.band >= target ? "good" : "accent"}>
                              Band {qHistory.band.toFixed(1)}
                            </Badge>
                            <span className="font-mono text-[11px] text-subtle">
                              {qHistory.count} lần luyện
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {onStartQuestion && (
                      <div className="flex shrink-0 items-center justify-end gap-2 sm:self-center">
                        {!isPaid && (
                          <span className="font-mono text-[11px] text-subtle">1 điểm</span>
                        )}
                        <Button
                          size="sm"
                          variant={qHistory ? "outline" : "soft"}
                          disabled={Boolean(quota.isLoaded && singleCheck && !singleCheck.allowed)}
                          onClick={() => onStartQuestion(it, open.items)}
                          className="h-8 px-3 text-xs"
                          aria-label={qHistory ? `Luyện lại: ${it.text}` : `Luyện câu này: ${it.text}`}
                        >
                          {qHistory ? (
                            <>
                              <RotateCcw size={13} /> Luyện lại
                            </>
                          ) : (
                            <>
                              <Mic size={13} /> Luyện câu này
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  {it.followUp && (
                    <div className="mt-1 ml-6 flex items-center gap-2 text-xs text-brand">
                      <CornerDownRight size={12} /> Có thể có câu hỏi nối tiếp tùy câu trả lời
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-info-soft px-4 py-3 text-[13px] text-info">
            <Info size={15} className="mt-0.5 shrink-0" />
            Câu hỏi thật có thể khác cách diễn đạt. Hãy trả lời tự nhiên thay vì học thuộc — giám khảo AI sẽ hỏi sâu vào ý bạn vừa nói.
          </div>

          {topicBlockedMessage && (
            <div
              role="alert"
              data-testid="forecast-modal-quota-alert"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bad/25 bg-bad-soft px-4 py-3 text-xs text-ink"
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-bad" />
                <span>{topicBlockedMessage}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClose();
                  go("billing");
                }}
              >
                Xem gói trả phí
              </Button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onToggleSave}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {saved ? "Đã lưu" : "Lưu vào danh sách ôn"}
            </Button>
            <Button
              variant="accent"
              disabled={Boolean(quota.isLoaded && topicCheck && !topicCheck.allowed)}
              onClick={onStart}
            >
              {practicedBand !== undefined ? "Luyện lại" : "Luyện chủ đề này"} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
