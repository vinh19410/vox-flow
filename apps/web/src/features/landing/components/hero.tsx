import { ArrowRight, Quote, Sparkles } from "lucide-react";

import { BandRange } from "@/components/ds/band-range";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";
import { RESULT } from "@/features/results/data";

export function Hero() {
  const { go } = useApp();
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
      <div className="animate-rise">
        <Badge tone="accent">
          <Sparkles size={12} /> Giám khảo AI cho IELTS Speaking
        </Badge>
        <h1 className="mt-6 text-[44px] leading-[1.02] font-extrabold tracking-[-0.03em] sm:text-[64px]">
          Biết rõ <span className="text-brand">vì sao</span>
          <br />
          bạn được 6.5.
        </h1>
        <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-2">
          Mỗi tiêu chí đều có band, lý do và trích đúng câu bạn đã nói làm bằng chứng. Chấm 3 lần lấy trung vị, nên điểm không nhảy lung tung giữa các lần thử.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="accent" size="lg" onClick={() => go("auth")}>
            Thi thử ngay — miễn phí <ArrowRight size={18} />
          </Button>
          <span className="text-sm text-subtle">Không cần thẻ · Có band tổng cho mọi lượt</span>
        </div>
        <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
          {[
            ["±0.5", "độ chênh mục tiêu giữa 3 lần chấm"],
            ["< 2s", "từ lúc vào trang đến lúc ghi âm"],
            ["0", "giọng nói dùng huấn luyện nếu bạn không bật"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="tnum text-2xl font-bold">{k}</div>
              <div className="mt-1 text-xs leading-snug text-subtle">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product preview */}
      <div className="relative animate-rise [animation-delay:120ms]">
        <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_70%_20%,#ffd8c8,transparent_60%)]" />
        <div className="rounded-[28px] bg-ink p-6 text-paper shadow-2xl sm:p-7">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Full Test · 23/04</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-good" /> Chấm 3 lần · trung vị
            </span>
          </div>
          <div className="mt-5 flex items-end gap-4">
            <div className="tnum text-[76px] leading-none font-extrabold tracking-tight">6.5</div>
            <div className="pb-2">
              <div className="text-xs text-white/50">Khoảng tin cậy</div>
              <div className="tnum text-lg font-semibold">6.0 – 7.0</div>
            </div>
          </div>
          <div className="mt-5">
            <BandRange band={6.5} range={[6.0, 7.0]} dark />
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {RESULT.criteria.map((c) => (
              <div key={c.key} className="rounded-2xl bg-white/[0.06] p-3">
                <div className="text-[10px] font-semibold tracking-wider text-white/45">{c.key}</div>
                <div className="tnum mt-1 text-xl font-bold">{c.band.toFixed(1)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 text-ink">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-subtle">
              <Quote size={13} className="text-brand" /> Bằng chứng · Ngữ pháp 6.0
            </div>
            <p className="mt-2 text-[15px] leading-snug">
              “Also <span className="rounded bg-bad-soft px-1 text-bad underline decoration-wavy underline-offset-4">people there is</span> very friendly.”
            </p>
            <p className="mt-2 text-xs text-ink-2">
              Lỗi hòa hợp chủ–vị lặp lại 3 lần → <b>people there are</b>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
