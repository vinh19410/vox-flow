import { Button } from "@/components/ds/button";
import { Logo } from "@/components/ds/logo";
import { useApp } from "@/features/app-state/types";

import { Hero } from "./components/hero";
import { PricingTeaser } from "./components/pricing-teaser";
import { PrivacyCta } from "./components/privacy-cta";
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
          <a href="#privacy" className="hover:text-ink">Dữ liệu của bạn</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => go("auth")}>Đăng nhập</Button>
          <Button size="sm" onClick={() => go("auth")}>Thi thử miễn phí</Button>
        </div>
      </header>

      <Hero />
      <PromisesSection />
      <PricingTeaser />
      <PrivacyCta />
    </div>
  );
}
