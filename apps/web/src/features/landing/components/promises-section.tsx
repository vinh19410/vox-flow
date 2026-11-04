import { Gauge, MessageCircle, Quote, ShieldCheck } from "lucide-react";

export function PromisesSection() {
  return (
    <section id="how" className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold tracking-[0.14em] text-subtle uppercase">Khác biệt</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Không còn điểm số “hộp đen”.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Gauge, t: "Band tổng miễn phí, mọi lượt", d: "Hết lượt free vẫn có band + một câu nhận xét. Chỉ phần chi tiết 4 tiêu chí mới cần trả phí." },
            { i: Quote, t: "Chấm minh bạch", d: "Mỗi tiêu chí có band, lý do và đoạn trích câu bạn nói. Không tin? Bấm “Báo lỗi chấm”." },
            { i: ShieldCheck, t: "Chấm ổn định", d: "Chấm 3 lần với đầu ra có cấu trúc, lấy trung vị và hiển thị khoảng tin cậy như 6.0–6.5." },
            { i: MessageCircle, t: "Giám khảo hỏi nối tiếp", d: "AI hỏi tiếp dựa trên chính câu trả lời của bạn — kể cả Part 1. Học vẹt sẽ lộ ngay." },
          ].map((f, k) => (
            <div key={k} className="rounded-3xl border border-line bg-paper p-6">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-paper">
                <f.i size={20} strokeWidth={1.8} />
              </div>
              <h3 className="mt-5 text-[17px] font-bold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
          {["Chọn Full Test hoặc từng Part", "Trả lời giám khảo AI — có câu hỏi nối tiếp", "Nhận band tổng ngay, trong vài giây", "Xem bằng chứng & luyện lại câu yếu"].map((t, k) => (
            <div key={k} className="bg-white p-6">
              <div className="font-mono text-xs text-brand">0{k + 1}</div>
              <div className="mt-3 text-[15px] font-semibold">{t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
