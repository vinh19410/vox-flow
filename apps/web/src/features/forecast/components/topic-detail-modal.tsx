import { ArrowRight, Bookmark, BookmarkCheck, CornerDownRight, Flame, Info, Users } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Modal } from "@/components/ds/modal";
import type { ForecastTopic } from "@/features/forecast/types";

export interface TopicDetailModalProps {
  topic: ForecastTopic | null;
  practicedBand: number | undefined;
  saved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onStart: () => void;
}

export function TopicDetailModal({ topic: open, practicedBand, saved, onClose, onToggleSave, onStart }: TopicDetailModalProps) {
  return (
    <Modal open={!!open} onClose={onClose} width="max-w-2xl">
      {open && (
        <div className="p-7 sm:p-8">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="dark">{open.kind === "p1" ? "Part 1" : "Part 2 & 3"}</Badge>
            <Badge>{open.category}</Badge>
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
            {open.items.map((it, k) =>
              it.cue ? (
                <div key={it.id} className="rounded-2xl bg-paper p-5">
                  <div className="font-mono text-[11px] tracking-wider text-subtle">PART 2 · CUE CARD</div>
                  <div className="mt-2 font-bold">{it.cue.title}</div>
                  <div className="mt-2 text-sm text-ink-2">You should say: {it.cue.points.join(", ")} {it.cue.ending}</div>
                </div>
              ) : (
                <div key={it.id}>
                  <div className="flex gap-3 rounded-2xl border border-line px-4 py-3">
                    <span className="font-mono text-xs text-subtle">
                      P{it.part}·{open.kind === "p1" ? k + 1 : k}
                    </span>
                    <span className="text-sm font-medium">{it.text}</span>
                  </div>
                  {it.followUp && (
                    <div className="mt-1 ml-6 flex items-center gap-2 text-xs text-brand">
                      <CornerDownRight size={12} /> Có thể có câu hỏi nối tiếp tùy câu trả lời
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-info-soft px-4 py-3 text-[13px] text-info">
            <Info size={15} className="mt-0.5 shrink-0" />
            Câu hỏi thật có thể khác cách diễn đạt. Hãy trả lời tự nhiên thay vì học thuộc — giám khảo AI sẽ hỏi sâu vào ý bạn vừa nói.
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onToggleSave}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {saved ? "Đã lưu" : "Lưu vào danh sách ôn"}
            </Button>
            <Button variant="accent" onClick={onStart}>
              {practicedBand !== undefined ? "Luyện lại" : "Luyện chủ đề này"} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
