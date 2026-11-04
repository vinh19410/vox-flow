import { Bookmark, BookmarkCheck, Flame, Users } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { Card } from "@/components/ds/card";
import type { ForecastTopic } from "@/features/forecast/types";
import { cx } from "@/lib/cx";

export interface TopicCardProps {
  topic: ForecastTopic;
  band?: number;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}

export function TopicCard({ topic: t, band, saved, onOpen, onToggleSave }: TopicCardProps) {
  const cue = t.items.find((i) => i.cue);
  return (
    <Card className="group flex cursor-pointer flex-col p-6 transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg" onClick={onOpen}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge>{t.category}</Badge>
          {t.tag === "hot" && (
            <Badge tone="accent">
              <Flame size={11} /> Hay gặp
            </Badge>
          )}
          {t.tag === "new" && <Badge tone="info">Mới</Badge>}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className={cx("-mt-1 -mr-1 grid h-8 w-8 place-items-center rounded-full hover:bg-paper", saved ? "text-brand" : "text-subtle")}
          aria-label="Lưu chủ đề"
        >
          {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
        </button>
      </div>
      <h3 className="mt-4 text-lg leading-snug font-bold">{t.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{cue ? cue.text : t.items.map((i) => i.text).join(" · ")}</p>
      <div className="mt-5 flex items-center gap-3 border-t border-line pt-4 text-xs text-subtle">
        <span className="flex items-center gap-1">
          <Users size={13} /> {t.reports}
        </span>
        <span>{t.items.length} câu</span>
        <span className="truncate">Gặp {t.lastSeen}</span>
        <span className="ml-auto">{band !== undefined ? <Badge tone="good">Band {band.toFixed(1)}</Badge> : <span className="font-semibold text-ink group-hover:text-brand">Luyện →</span>}</span>
      </div>
    </Card>
  );
}
