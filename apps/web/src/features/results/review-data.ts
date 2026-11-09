import type { MarkStyle, MarkType } from "./types";

export const MARK: Record<MarkType, MarkStyle> = {
  grammar: { label: "Ngữ pháp", cls: "bg-bad-soft text-bad decoration-bad", dot: "bg-bad" },
  vocab: { label: "Từ vựng", cls: "bg-info-soft text-info decoration-info", dot: "bg-info" },
  pron: { label: "Phát âm", cls: "bg-warn-soft text-warn decoration-warn", dot: "bg-warn" },
};
