import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";

import { OnboardingFrame } from "../onboarding/components/onboarding-frame";

export function AuthScreen() {
  const { go, s, set } = useApp();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState(s.email);
  return (
    <OnboardingFrame onBack={() => go("landing")}>
      <div className="animate-rise rounded-[28px] border border-line bg-white p-7 sm:p-10">
        <h1 className="text-[28px] font-bold tracking-tight">{mode === "signup" ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
        <p className="mt-2 text-sm text-ink-2">Không cần thẻ thanh toán. Band tổng luôn miễn phí.</p>

        <button
          onClick={() => go(mode === "signup" ? "onboarding" : "dashboard")}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line font-semibold hover:border-ink/40"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Tiếp tục với Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-subtle">
          <span className="h-px flex-1 bg-line" />
          hoặc
          <span className="h-px flex-1 bg-line" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ email });
            go(mode === "signup" ? "onboarding" : "dashboard");
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Email</span>
            <div className="mt-1.5 flex h-12 items-center gap-2 rounded-2xl border border-line px-4 focus-within:border-ink">
              <Mail size={16} className="text-subtle" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent outline-none" placeholder="ban@email.com" />
            </div>
          </label>
          <Button type="submit" className="h-12 w-full">
            {mode === "signup" ? "Gửi link đăng nhập" : "Đăng nhập"} <ArrowRight size={16} />
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-2">
          {mode === "signup" ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="font-semibold text-ink underline underline-offset-4">
            {mode === "signup" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </p>
      </div>
    </OnboardingFrame>
  );
}
