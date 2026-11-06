import { Loader2 } from "lucide-react";
import { useState } from "react";

import { useApp } from "@/features/app-state/types";
import { authClient } from "@/lib/auth-client";

import { OnboardingFrame } from "../onboarding/components/onboarding-frame";

export type AuthSearchParams = {
  error?: string;
  redirect?: string;
};

export type AuthScreenProps = {
  search?: AuthSearchParams;
};

export function AuthScreen({ search }: AuthScreenProps = {}) {
  const { go } = useApp();
  const activeSearch =
    search ??
    (typeof window !== "undefined"
      ? {
          error: new URLSearchParams(window.location.search).get("error") ?? undefined,
          redirect: new URLSearchParams(window.location.search).get("redirect") ?? undefined,
        }
      : {});
  const [isPending, setIsPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const rawError = activeSearch?.error;
  const errorParam =
    typeof rawError === "string"
      ? rawError
      : Array.isArray(rawError) && typeof rawError[0] === "string"
        ? (rawError[0] as string)
        : undefined;

  const errorMessage =
    localError ??
    (errorParam
      ? "Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại."
      : null);

  const handleGoogleSignIn = async () => {
    if (isPending) return;
    setIsPending(true);
    setLocalError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const targetRedirect = activeSearch?.redirect;
      const isValidRedirect =
        targetRedirect &&
        targetRedirect.startsWith("/") &&
        !targetRedirect.startsWith("//") &&
        !targetRedirect.startsWith("/\\") &&
        !targetRedirect.startsWith("/auth") &&
        !targetRedirect.startsWith("/login");
      const callbackPath = isValidRedirect ? targetRedirect : "/app/dashboard";
      const callbackURL = `${origin}${callbackPath}`;
      const errorCallbackURL = isValidRedirect
        ? `${origin}/auth?redirect=${encodeURIComponent(targetRedirect)}`
        : `${origin}/auth`;

      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL,
      });

      if (res?.error) {
        setIsPending(false);
        setLocalError("Đăng nhập Google không thành công. Vui lòng thử lại.");
      }
    } catch {
      setIsPending(false);
      setLocalError("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
    }
  };
  return (
    <OnboardingFrame onBack={() => go("landing")}>
      <div className="animate-rise rounded-[28px] border border-line bg-white p-7 sm:p-10">
        <h1 className="text-[28px] font-bold tracking-tight">Đăng nhập Vox Flow</h1>
        <p className="mt-2 text-sm text-ink-2">Không cần thẻ thanh toán. Band tổng luôn miễn phí.</p>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isPending}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line font-semibold hover:border-ink/40 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="animate-spin text-ink" size={18} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
          )}
          {isPending ? "Đang kết nối..." : "Tiếp tục với Google"}
        </button>
      </div>
    </OnboardingFrame>
  );
}
