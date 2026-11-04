import { Badge } from "@/components/ds/badge";
import { Toggle } from "@/components/ds/toggle";
import { useApp } from "@/features/app-state/types";

export function ConsentRows() {
  const { s, set } = useApp();
  const rows = [
    { k: "save" as const, t: "Lưu bài chấm vào lịch sử", d: "Lưu audio, transcript và điểm để bạn xem lại và theo dõi tiến bộ. Tắt thì bài sẽ bị xóa sau khi bạn đóng màn kết quả." },
    { k: "train" as const, t: "Cho phép dùng giọng nói để cải thiện AI", d: "Ẩn danh và chỉ dùng để hiệu chuẩn chấm điểm. Mặc định tắt — không ảnh hưởng tính năng nào." },
  ];
  return (
    <div className="divide-y divide-line rounded-3xl border border-line bg-white">
      {rows.map((r) => (
        <div key={r.k} className="flex items-start gap-4 p-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 font-semibold">
              {r.t}
              {r.k === "train" && <Badge>Tùy chọn</Badge>}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{r.d}</p>
          </div>
          <Toggle on={s.consent[r.k]} label={r.t} onChange={(v) => set({ consent: { ...s.consent, [r.k]: v } })} />
        </div>
      ))}
    </div>
  );
}
