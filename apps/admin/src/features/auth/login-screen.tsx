import { Card } from "@vox-flow/ui/ds/card";
import { Logo } from "@vox-flow/ui/ds/logo";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { getSafeRedirect } from "@/lib/admin-guard";
import { authClient } from "@/lib/auth-client";

export { getSafeRedirect };

export type LoginSearchParams = {
  error?: string;
  redirect?: string;
};

export interface LoginScreenProps {
  search?: LoginSearchParams;
}

const DEFAULT_ADMIN_REDIRECT = "/users";

function getEmailSignInErrorMessage(
  error: { status?: number; code?: string; message?: string } | undefined,
): string {
  if (error?.status === 429) {
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây.";
  }
  if (error?.code === "INVALID_EMAIL_OR_PASSWORD") {
    return "Sai email hoặc mật khẩu.";
  }
  return "Đăng nhập không thành công. Vui lòng thử lại.";
}

const inputClassName =
  "mt-2 h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm outline-none focus:border-ink disabled:opacity-50";
const labelClassName = "mt-4 block text-xs font-semibold text-ink-2";

export function LoginScreen({ search }: LoginScreenProps = {}) {
  const activeSearch =
    search ??
    (typeof window !== "undefined"
      ? {
          error: new URLSearchParams(window.location.search).get("error") ?? undefined,
          redirect: new URLSearchParams(window.location.search).get("redirect") ?? undefined,
        }
      : {});

  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isEmailPending, setIsEmailPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isBusy = isGooglePending || isEmailPending;
  const safeRedirect = getSafeRedirect(activeSearch?.redirect);
  const callbackPath = safeRedirect ?? DEFAULT_ADMIN_REDIRECT;

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
    setIsGooglePending(true);
    setLocalError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const callbackURL = `${origin}${callbackPath}`;
      const errorCallbackURL = safeRedirect
        ? `${origin}/login?redirect=${encodeURIComponent(safeRedirect)}`
        : `${origin}/login`;

      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL,
      });

      if (res?.error) {
        setIsGooglePending(false);
        setLocalError(
          res.error.status === 429
            ? "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."
            : "Đăng nhập Google không thành công. Vui lòng thử lại.",
        );
      }
    } catch {
      setIsGooglePending(false);
      setLocalError("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    setIsEmailPending(true);
    setLocalError(null);
    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (res?.error) {
        setIsEmailPending(false);
        setLocalError(getEmailSignInErrorMessage(res.error));
        return;
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      window.location.assign(`${origin}${callbackPath}`);
    } catch {
      setIsEmailPending(false);
      setLocalError("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12 text-ink">
      <Card className="w-full max-w-md animate-rise p-7 sm:p-10">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1 text-[11px] font-semibold text-ink-2">
            <ShieldCheck size={14} className="text-brand" />
            Admin Portal
          </span>
        </div>

        <h1 className="mt-6 text-[26px] font-bold tracking-tight">Vox Flow Admin</h1>
        <p className="mt-1.5 text-sm text-ink-2">
          Đăng nhập bằng tài khoản quản trị viên được cấp quyền.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={isBusy}
          className="mt-7 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-line bg-white font-semibold hover:border-ink/40 disabled:opacity-60"
        >
          {isGooglePending ? (
            <Loader2 className="animate-spin text-ink" size={18} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
              />
            </svg>
          )}
          {isGooglePending ? "Đang kết nối..." : "Tiếp tục với Google"}
        </button>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink-2">
          <span className="h-px flex-1 bg-line" />
          <span>hoặc</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={(e) => void handleEmailSubmit(e)}>
          <label htmlFor="admin-login-email" className={labelClassName}>
            Email
          </label>
          <input
            id="admin-login-email"
            type="email"
            autoComplete="email"
            placeholder="admin@voxflow.vn"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isBusy}
            className={inputClassName}
          />

          <label htmlFor="admin-login-password" className={labelClassName}>
            Mật khẩu
          </label>
          <input
            id="admin-login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isBusy}
            className={inputClassName}
          />

          <button
            type="submit"
            disabled={isBusy}
            className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink font-semibold text-paper hover:bg-ink/90 disabled:opacity-60"
          >
            {isEmailPending && <Loader2 className="animate-spin" size={18} />}
            Đăng nhập
          </button>
        </form>
      </Card>
    </div>
  );
}
