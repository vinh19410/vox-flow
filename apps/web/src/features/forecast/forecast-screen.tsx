import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Loader2, Mic, RotateCcw, Shuffle, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { mapApiTopicToForecastTopic } from "./builders";
import { CoverageBanner } from "./components/coverage-banner";
import { ForecastToolbar } from "./components/forecast-toolbar";
import type { ForecastFilter } from "./components/forecast-toolbar";
import { TopicCard } from "./components/topic-card";
import { TopicDetailModal } from "./components/topic-detail-modal";
import { QUARTER } from "@/features/forecast/data";
import type { ExamItem } from "@/features/exam/types";
import type { ForecastKind, ForecastTopic } from "@/features/forecast/types";
import { PageHead } from "@/layouts/page-head";
import { trpc } from "@/utils/trpc";

export function ForecastScreen() {
  const { s, set, go, toast } = useApp();
  const [kind, setKind] = useState<ForecastKind>("p1");
  const [filter, setFilter] = useState<ForecastFilter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<ForecastTopic | null>(null);

  const {
    data: apiTopics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(trpc.forecast.listPublished.queryOptions({ quarter: QUARTER.id }));

  const topics = useMemo(
    () => (apiTopics ?? []).map(mapApiTopicToForecastTopic),
    [apiTopics],
  );

  useEffect(() => {
    if (s.lastPracticeSession?.topicId && !open && topics.length > 0) {
      const match = topics.find((t) => t.id === s.lastPracticeSession?.topicId);
      if (match) {
        setOpen(match);
      }
    }
  }, [s.lastPracticeSession?.topicId, topics, open]);
  const counts = useMemo(
    () => ({
      p1: topics.filter((t) => t.kind === "p1").length,
      p23: topics.filter((t) => t.kind === "p23").length,
    }),
    [topics],
  );

  const suggestion = useMemo(
    () =>
      [...topics]
        .filter((t) => s.practiced[t.id] === undefined)
        .sort((a, b) => b.reports - a.reports)[0],
    [topics, s.practiced],
  );

  const list = useMemo(
    () =>
      topics
        .filter((t) => t.kind === kind)
        .filter((t) =>
          filter === "hot"
            ? t.tag === "hot"
            : filter === "new"
              ? t.tag === "new"
              : filter === "todo"
                ? s.practiced[t.id] === undefined
                : filter === "saved"
                  ? s.saved.includes(t.id)
                  : true,
        )
        .filter((t) => {
          if (!q) return true;
          const searchableText = [
            t.title,
            t.category,
            ...t.items.flatMap((i) => [
              i.text,
              ...(i.cue?.points ?? []),
              i.cue?.ending ?? "",
            ]),
          ]
            .join(" ")
            .toLowerCase();
          return searchableText.includes(q.toLowerCase());
        })
        .sort((a, b) => b.reports - a.reports),
    [topics, kind, filter, q, s.practiced, s.saved],
  );

  const start = (t: ForecastTopic) => {
    set({ practice: { topicId: t.id, title: t.title, kind: t.kind, items: t.items } });
    go("exam");
  };

  const startQuestion = (t: ForecastTopic, item: ExamItem, allItems: ExamItem[]) => {
    const singleItem: ExamItem = {
      ...item,
      cue: undefined,
    };
    set({
      practice: {
        topicId: t.id,
        title: t.title,
        kind: t.kind,
        items: [singleItem],
        singleQuestionId: item.id,
        topicItems: allItems,
      },
    });
    go("exam");
  };
  const toggleSave = (id: string) => {
    const on = s.saved.includes(id);
    set({ saved: on ? s.saved.filter((x) => x !== id) : [...s.saved, id] });
    toast(on ? "Đã bỏ khỏi danh sách ôn" : "Đã lưu vào danh sách ôn");
  };

  const random = () => {
    const pool = topics.filter((t) => t.tag === "hot" && s.practiced[t.id] === undefined);
    const pick = (pool.length ? pool : topics)[Math.floor(Math.random() * (pool.length || topics.length))];
    if (pick) setOpen(pick);
  };

  return (
    <>
      <PageHead
        eyebrow={`Đề forecast · ${QUARTER.label} · ${QUARTER.range}`}
        title="Luyện theo đề dự đoán"
        sub={`Tổng hợp từ báo cáo của thí sinh vừa thi, cập nhật ${QUARTER.updated}. Giám khảo AI vẫn hỏi nối tiếp theo câu trả lời của bạn — không thể học vẹt.`}
        right={
          <Button variant="outline" onClick={random} disabled={isLoading || topics.length === 0}>
            <Shuffle size={16} /> Bốc ngẫu nhiên đề hot
          </Button>
        }
      />

      {/* Coverage + suggestion */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <CoverageBanner topics={topics} practiced={s.practiced} examDate={s.examDate} />
        {isLoading ? (
          <Card className="flex flex-col p-7 animate-pulse" data-testid="suggestion-loading">
            <div className="h-4 w-1/3 rounded bg-paper-2" />
            <div className="mt-3 h-6 w-3/4 rounded bg-paper-2" />
            <div className="mt-2 h-4 w-1/2 rounded bg-paper-2" />
            <div className="mt-auto h-10 w-full rounded-full bg-paper-2" />
          </Card>
        ) : suggestion ? (
          <Card className="flex flex-col p-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand">
              <Sparkles size={14} /> Gợi ý luyện tiếp
            </div>
            <div className="mt-3 text-xl font-bold">{suggestion.title}</div>
            <div className="mt-1 text-sm text-ink-2">
              {suggestion.kind === "p1" ? "Part 1" : "Part 2 & 3"} · {suggestion.category}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[13px] text-subtle">
              <Users size={14} /> {suggestion.reports} thí sinh báo gặp · bạn chưa luyện
            </div>
            <Button variant="accent" className="mt-auto w-full" onClick={() => start(suggestion)}>
              <Mic size={16} /> Luyện ngay
            </Button>
          </Card>
        ) : !isLoading && !isError && topics.length > 0 ? (
          <Card className="grid place-items-center p-7 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good">
                <Check />
              </div>
              <div className="mt-3 font-bold">Bạn đã phủ hết đề quý này!</div>
            </div>
          </Card>
        ) : null}
      </div>

      <ForecastToolbar
        counts={counts}
        kind={kind}
        onKind={setKind}
        filter={filter}
        onFilter={setFilter}
        q={q}
        onQ={setQ}
      />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="forecast-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-4 w-1/3 rounded bg-paper-2" />
              <div className="mt-4 h-6 w-3/4 rounded bg-paper-2" />
              <div className="mt-3 h-4 w-1/2 rounded bg-paper-2" />
              <div className="mt-6 flex justify-between">
                <div className="h-4 w-1/4 rounded bg-paper-2" />
                <div className="h-4 w-1/4 rounded bg-paper-2" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Card className="mt-5 border-bad/30 p-8 text-center text-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-bad-soft text-bad">
            <AlertCircle size={24} />
          </div>
          <div className="mt-3 font-bold text-ink">Không thể tải danh sách đề forecast</div>
          <p className="mt-1 text-subtle">{error?.message ?? "Lỗi kết nối máy chủ"}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RotateCcw size={14} /> Thử lại
          </Button>
        </Card>
      )}

      {/* Topic grid */}
      {!isLoading && !isError && list.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              band={s.practiced[t.id]}
              saved={s.saved.includes(t.id)}
              onOpen={() => setOpen(t)}
              onToggleSave={() => toggleSave(t.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <Card className="mt-5 py-16 text-center text-sm text-subtle">
          Không có chủ đề nào khớp bộ lọc.
        </Card>
      )}

      <TopicDetailModal
        topic={open}
        practicedBand={open ? s.practiced[open.id] : undefined}
        practicedQuestions={s.practicedQuestions}
        saved={open ? s.saved.includes(open.id) : false}
        target={s.target}
        onClose={() => {
          setOpen(null);
          if (s.lastPracticeSession) {
            set({ lastPracticeSession: null });
          }
        }}
        onToggleSave={() => open && toggleSave(open.id)}
        onStart={() => open && start(open)}
        onStartQuestion={(item, allItems) => open && startQuestion(open, item, allItems)}
      />
    </>
  );
}
