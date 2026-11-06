import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

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

type EmailMode = "signIn" | "signUp";

const DEFAULT_REDIRECT = "/app/dashboard";

/**
 * Returns the redirect path only when it is a same-origin app path that does
 * not loop back to the auth screens; otherwise null (open-redirect guard).
 */
function getSafeRedirect(target: string | undefined): string | null {
  if (
    target &&
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.startsWith("/\\") &&
    !target.startsWith("/auth") &&
    !target.startsWith("/login")
  ) {
    return target;
  }
  return null;
}

function getEmailAuthErrorMessage(mode: EmailMode, code: string | undefined): string {
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "Sai email hoặc mật khẩu.";
  if (code?.startsWith("USER_ALREADY_EXISTS")) return "Email đã được sử dụng.";
  return mode === "signIn"
    ? "Đăng nhập không thành công. Vui lòng thử lại."
    : "Đăng ký không thành công. Vui lòng thử lại.";
}

const inputClassName =
  "mt-2 h-12 w-full rounded-2xl border border-line bg-white px-4 outline-none focus:border-ink disabled:opacity-50";
const labelClassName = "mt-4 block text-xs font-semibold text-ink-2";

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
  const [isEmailPending, setIsEmailPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState<EmailMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isBusy = isPending || isEmailPending;
  const safeRedirect = getSafeRedirect(activeSearch?.redirect);
  const callbackPath = safeRedirect ?? DEFAULT_REDIRECT;

  const rawError = activeSearch?.error;
  const errorParam =
    typeof rawError === "string"
      ? rawError
      : Array.isArray(rawError) && typeof rawError[0] === "string"
        ? (rawError[0] as string)
        : undefined;

  const errorMessage =
    localError ??
    (errorParam === "account_not_linked"
      ? "Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu."
      : errorParam
        ? "Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại."
        : null);

  const handleGoogleSignIn = async () => {
    if (isBusy) return;
    setIsPending(true);
    setLocalError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const callbackURL = `${origin}${callbackPath}`;
      const errorCallbackURL = safeRedirect
        ? `${origin}/auth?redirect=${encodeURIComponent(safeRedirect)}`
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

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    setIsEmailPending(true);
    setLocalError(null);
    try {
      const trimmedEmail = email.trim();
      const res =
        emailMode === "signIn"
          ? await authClient.signIn.email({ email: trimmedEmail, password })
          : await authClient.signUp.email({ name: name.trim(), email: trimmedEmail, password });

      if (res?.error) {
        setIsEmailPending(false);
        setLocalError(getEmailAuthErrorMessage(emailMode, res.error.code));
        return;
      }

      // Full page load, like the end of the Google flow, so the app boots with the new session.
      window.location.assign(`${window.location.origin}${callbackPath}`);
    } catch {
      setIsEmailPending(false);
      setLocalError("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
    }
  };

  const toggleEmailMode = () => {
    setEmailMode((m) => (m === "signIn" ? "signUp" : "signIn"));
    setLocalError(null);
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
          disabled={isBusy}
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
        <div className="mt-6 flex items-center gap-3 text-xs text-ink-2">
          <span className="h-px flex-1 bg-line" />
          <span>hoặc</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleEmailSubmit}>
          {emailMode === "signUp" && (
            <>
              <label htmlFor="auth-name" className={labelClassName}>
                Tên hiển thị
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isBusy}
                className={inputClassName}
              />
            </>
          )}

          <label htmlFor="auth-email" className={labelClassName}>
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isBusy}
            className={inputClassName}
          />

          <label htmlFor="auth-password" className={labelClassName}>
            Mật khẩu
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={emailMode === "signIn" ? "current-password" : "new-password"}
            required
            minLength={emailMode === "signUp" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isBusy}
            className={inputClassName}
          />
          {emailMode === "signUp" && (
            <p className="mt-2 text-xs text-ink-2">Tối thiểu 8 ký tự.</p>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-paper hover:bg-ink/90 disabled:opacity-60"
          >
            {isEmailPending && <Loader2 className="animate-spin" size={18} />}
            {emailMode === "signIn" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleEmailMode}
          disabled={isBusy}
          className="mt-4 w-full text-center text-sm text-ink-2 hover:text-ink disabled:opacity-60"
        >
          {emailMode === "signIn" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>

        <p className="mt-6 text-center text-xs text-subtle">
          Bằng việc tiếp tục, bạn đồng ý với{" "}
          <a
            href="/terms"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                go("terms");
              }
            }}
            className="font-medium text-ink underline underline-offset-2 hover:text-ink/80"
          >
            Điều khoản dịch vụ & Chính sách sử dụng
          </a>
        </p>
      </div>
    </OnboardingFrame>
  );
}
