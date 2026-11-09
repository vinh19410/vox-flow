import { Check } from "lucide-react";

import { Badge } from "@/components/ds/badge";
import { PLANS } from "@/features/billing/data";
import { vnd } from "@/lib/format";

export function PricingTeaser() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.14em] text-subtle uppercase">Bảng giá</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Trả theo ngày thi, không phải theo tháng.</h2>
        </div>
        <p className="max-w-sm text-sm text-ink-2">Thanh toán QR tự kích hoạt trong vài giây. Không cần nhắn tin xác nhận.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-line bg-white p-6">
          <div className="text-sm font-semibold">Miễn phí</div>
          <div className="tnum mt-3 text-3xl font-bold">0đ</div>
          <ul className="mt-5 space-y-2 text-sm text-ink-2">
            {["3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)", "Band tổng + khoảng tin cậy", "1 câu nhận xét mỗi bài"].map((p) => (
              <li key={p} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-good" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        {PLANS.filter((p) => p.id !== "month").map((p) => (
          <div key={p.id} className={p.best ? "relative rounded-3xl bg-ink p-6 text-paper" : "rounded-3xl border border-line bg-white p-6"}>
            {p.best && <Badge tone="accent" className="absolute top-5 right-5">Phổ biến</Badge>}
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="tnum mt-3 text-3xl font-bold">
              {vnd(p.price)}
              <span className={p.best ? "ml-1 text-sm font-medium text-white/50" : "ml-1 text-sm font-medium text-subtle"}>{p.unit}</span>
            </div>
            <ul className={p.best ? "mt-5 space-y-2 text-sm text-white/75" : "mt-5 space-y-2 text-sm text-ink-2"}>
              {p.perks.map((x) => (
                <li key={x} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
