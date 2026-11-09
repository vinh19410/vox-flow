import { Button } from "@/components/ds/button";
import { Logo } from "@/components/ds/logo";
import { useApp } from "@/features/app-state/types";

import { Hero } from "./components/hero";
import { PricingTeaser } from "./components/pricing-teaser";
import { PromisesSection } from "./components/promises-section";

export function LandingScreen() {
  const { go } = useApp();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-ink-2 md:flex">
          <a href="#how" className="hover:text-ink">Cách chấm</a>
          <a href="#pricing" className="hover:text-ink">Bảng giá</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => go("auth")}>Đăng nhập</Button>
          <Button size="sm" onClick={() => go("auth")}>Thi thử miễn phí</Button>
        </div>
      </header>

      <Hero />
      <PromisesSection />
      <PricingTeaser />
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-5 pb-12 pt-8 text-xs text-subtle sm:px-8">
        <span>© 2026 Vox Flow</span>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/terms"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                go("terms");
              }
            }}
            className="hover:text-ink hover:underline"
          >
            Điều khoản dịch vụ & Chính sách sử dụng
          </a>
          <span>Điểm chỉ mang tính tham khảo, không thay thế kỳ thi IELTS chính thức.</span>
        </div>
      </footer>
    </div>
  );
}
