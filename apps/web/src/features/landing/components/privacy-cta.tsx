import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";

export function PrivacyCta() {
  const { go } = useApp();
  return (
    <section id="privacy" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <div className="grid gap-8 rounded-[32px] bg-ink p-8 text-paper sm:p-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <ShieldCheck className="text-brand" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight">Giọng nói của bạn là của bạn.</h2>
          <p className="mt-4 max-w-md text-white/65">Đồng ý được tách riêng: lưu bài chấm và dùng dữ liệu để huấn luyện AI là hai công tắc khác nhau — huấn luyện luôn tắt mặc định. Xóa toàn bộ dữ liệu chỉ với 1 chạm.</p>
        </div>
        <div className="flex flex-col justify-end gap-4">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Zap size={16} className="text-brand" /> Vào phòng thi trong dưới 2 giây, không màn hình chờ.
          </div>
          <Button variant="accent" size="lg" onClick={() => go("auth")} className="self-start">
            Bắt đầu thi thử <ArrowRight size={18} />
          </Button>
        </div>
      </div>
      <footer className="mt-10 flex flex-wrap justify-between gap-4 text-xs text-subtle">
        <span>© 2025 ChấmRõ — Prototype</span>
        <span>Điểm chỉ mang tính tham khảo, không thay thế kỳ thi IELTS chính thức.</span>
      </footer>
    </section>
  );
}
