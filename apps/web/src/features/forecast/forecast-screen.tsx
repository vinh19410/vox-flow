import { Check, Mic, Shuffle, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { CoverageBanner } from "./components/coverage-banner";
import { ForecastToolbar } from "./components/forecast-toolbar";
import type { ForecastFilter } from "./components/forecast-toolbar";
import { TopicCard } from "./components/topic-card";
import { TopicDetailModal } from "./components/topic-detail-modal";
import { FORECAST, QUARTER } from "@/features/forecast/data";
import type { ForecastKind, ForecastTopic } from "@/features/forecast/types";
import { PageHead } from "@/layouts/page-head";

export function ForecastScreen() {
  const { s, set, go, toast } = useApp();
  const [kind, setKind] = useState<ForecastKind>("p1");
  const [filter, setFilter] = useState<ForecastFilter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<ForecastTopic | null>(null);

  const suggestion = useMemo(
    () => [...FORECAST].filter((t) => s.practiced[t.id] === undefined).sort((a, b) => b.reports - a.reports)[0],
    [s.practiced],
  );

  const list = useMemo(
    () =>
      FORECAST.filter((t) => t.kind === kind)
        .filter((t) => (filter === "hot" ? t.tag === "hot" : filter === "new" ? t.tag === "new" : filter === "todo" ? s.practiced[t.id] === undefined : filter === "saved" ? s.saved.includes(t.id) : true))
        .filter((t) => !q || (t.title + t.category + t.items.map((i) => i.text).join(" ")).toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.reports - a.reports),
    [kind, filter, q, s.practiced, s.saved],
  );

  const start = (t: ForecastTopic) => {
    set({ practice: { topicId: t.id, title: t.title, kind: t.kind, items: t.items } });
    go("exam");
  };
  const toggleSave = (id: string) => {
    const on = s.saved.includes(id);
    set({ saved: on ? s.saved.filter((x) => x !== id) : [...s.saved, id] });
    toast(on ? "Đã bỏ khỏi danh sách ôn" : "Đã lưu vào danh sách ôn");
  };
  const random = () => {
    const pool = FORECAST.filter((t) => t.tag === "hot" && s.practiced[t.id] === undefined);
    const pick = (pool.length ? pool : FORECAST)[Math.floor(Math.random() * (pool.length || FORECAST.length))];
    setOpen(pick);
  };

  return (
    <>
      <PageHead
        eyebrow={`Đề forecast · ${QUARTER.label} · ${QUARTER.range}`}
        title="Luyện theo đề dự đoán"
        sub={`Tổng hợp từ báo cáo của thí sinh vừa thi, cập nhật ${QUARTER.updated}. Giám khảo AI vẫn hỏi nối tiếp theo câu trả lời của bạn — không thể học vẹt.`}
        right={
          <Button variant="outline" onClick={random}>
            <Shuffle size={16} /> Bốc ngẫu nhiên đề hot
          </Button>
        }
      />

      {/* Coverage + suggestion */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <CoverageBanner practiced={s.practiced} examDate={s.examDate} />
        {suggestion ? (
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
        ) : (
          <Card className="grid place-items-center p-7 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good">
                <Check />
              </div>
              <div className="mt-3 font-bold">Bạn đã phủ hết đề quý này!</div>
            </div>
          </Card>
        )}
      </div>

      <ForecastToolbar kind={kind} onKind={setKind} filter={filter} onFilter={setFilter} q={q} onQ={setQ} />

      {/* Topic grid */}
      {list.length ? (
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
      ) : (
        <Card className="mt-5 py-16 text-center text-sm text-subtle">Không có chủ đề nào khớp bộ lọc.</Card>
      )}

      <TopicDetailModal
        topic={open}
        practicedBand={open ? s.practiced[open.id] : undefined}
        saved={open ? s.saved.includes(open.id) : false}
        onClose={() => setOpen(null)}
        onToggleSave={() => open && toggleSave(open.id)}
        onStart={() => open && start(open)}
      />
    </>
  );
}
