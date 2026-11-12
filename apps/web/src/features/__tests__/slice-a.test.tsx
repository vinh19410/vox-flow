import { isRedirect } from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { ProtoToast } from "@/features/app-state/toast";
import { AppCtx, type AppCtxValue, type AppState } from "@/features/app-state/types";
import { AuthScreen } from "@/features/auth/auth-screen";
import { PLANS } from "@/features/billing/data";
import { LandingScreen } from "@/features/landing/landing-screen";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { authClient } from "@/lib/auth-client";
import { clearOnboardedUserCache, redirectIfOnboarded } from "@/lib/auth-guard";
import type * as AuthGuardModule from "@/lib/auth-guard";
import { trpcClient } from "@/utils/trpc";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
    getSession: vi.fn(),
    useSession: vi.fn(() => ({ data: null, isPending: false, error: null })),
  },
}));

const markUserOnboardedSpy = vi.fn();

vi.mock("@/lib/auth-guard", async (importOriginal) => {
  const actual: typeof AuthGuardModule = await importOriginal();
  return {
    ...actual,
    markUserOnboarded: (userId: string) => {
      markUserOnboardedSpy(userId);
      actual.markUserOnboarded(userId);
    },
  };
});

const profileUpsertSpy = vi.fn().mockResolvedValue({ targetBand: 6.5, examDate: null });
const profileCompleteSpy = vi.fn().mockResolvedValue({ onboardedAt: new Date() });

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    profile: {
      upsert: {
        mutate: (...args: unknown[]) => profileUpsertSpy(...args),
      },
      completeOnboarding: {
        mutate: (...args: unknown[]) => profileCompleteSpy(...args),
      },
      get: {
        query: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));

type MockMicReturn = {
  level: number;
  real: boolean | null;
  status: "idle" | "listening" | "denied" | "unavailable";
  denied: boolean;
};

const micLevelMock = vi.fn((active: boolean): MockMicReturn => ({
  level: active ? 0.6 : 0,
  real: active ? true : null,
  status: active ? "listening" : "idle",
  denied: false,
}));

vi.mock("@/hooks/use-mic-level", () => ({
  useMicLevel: (active: boolean) => micLevelMock(active),
}));
/**
 * Test harness mirroring AppStateProvider: real AppState transitions through
 * `set`, spyable `go`/`goResult`/`toast`, and the real ProtoToast renderer.
 */
function createHarness(seed?: Partial<AppState>) {
  const go = vi.fn();
  const goResult = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();

  function Provider({ children }: { children: ReactNode }) {
    const [s, setS] = useState<AppState>(() => ({
      ...createInitialState(),
      ...seed,
    }));
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const value: AppCtxValue = {
      s,
      set: (u) => {
        set(u);
        setS((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
      },
      paywallOpen: false,
      openPaywall: vi.fn(),
      closePaywall: vi.fn(),
      toastMsg,
      toast: (m) => {
        toast(m);
        setToastMsg(m);
      },
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt: vi.fn(),
      pendingSubmission: false,
      setPendingSubmission: vi.fn(),
      go,
      goResult,
    };
    return (
      <AppCtx.Provider value={value}>
        {children}
        <ProtoToast message={toastMsg} />
      </AppCtx.Provider>
    );
  }

  return { Provider, go, goResult, toast, set };
}

function renderWithApp(ui: ReactNode, seed?: Partial<AppState>) {
  const harness = createHarness(seed);
  const utils = render(<harness.Provider>{ui}</harness.Provider>);
  return { ...utils, ...harness };
}

describe("LandingScreen", () => {
  it("renders hero headline, 3 paid teaser plans, and footer terms link", () => {
    renderWithApp(<LandingScreen />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Biết rõ");
    expect(h1.textContent).toContain("vì sao");

    const paidPlans = PLANS.filter((p) => p.id !== "month");
    expect(paidPlans).toHaveLength(3);
    for (const plan of paidPlans) {
      expect(screen.getByText(plan.name)).toBeTruthy();
    }
    expect(screen.getByText("Miễn phí")).toBeTruthy();

    expect(screen.getByText("Điều khoản dịch vụ & Chính sách sử dụng")).toBeTruthy();
  });

  it("states quota accurately and contains no misleading promises in free tier and hero", () => {
    renderWithApp(<LandingScreen />);

    const freeHeading = screen.getByText("Miễn phí");
    const freeCard = freeHeading.closest("div.rounded-3xl") ?? freeHeading.parentElement;
    expect(freeCard).not.toBeNull();
    expect(freeCard?.textContent).not.toMatch(/không giới hạn|mọi lượt|hết lượt free/i);
    expect(freeCard?.textContent).toContain("3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)");

    expect(screen.getByText("Không cần thẻ · 3 điểm miễn phí mỗi ngày")).toBeTruthy();
    expect(screen.getByText("Band tổng miễn phí trong hạn mức")).toBeTruthy();
    expect(
      screen.getByText(/Mỗi ngày 3 điểm miễn phí: Full Test 3 điểm, mỗi Part 1 điểm/),
    ).toBeTruthy();

    expect(screen.queryByText(/mọi lượt/i)).toBeNull();
    expect(screen.queryByText(/hết lượt free/i)).toBeNull();
  });

  it("navigates to auth from hero CTA and header buttons, and to terms from footer", () => {
    const { go } = renderWithApp(<LandingScreen />);
    fireEvent.click(
      screen.getByRole("button", { name: "Thi thử ngay — miễn phí" }),
    );
    expect(go).toHaveBeenCalledWith("auth");
    expect(go).toHaveBeenCalledTimes(1);
    go.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Thi thử miễn phí" }));
    expect(go).toHaveBeenCalledWith("auth");
    expect(go).toHaveBeenCalledTimes(1);
    go.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(go).toHaveBeenCalledWith("auth");
    expect(go).toHaveBeenCalledTimes(1);
    go.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "Điều khoản dịch vụ & Chính sách sử dụng" }));
    expect(go).toHaveBeenCalledWith("terms");
    expect(go).toHaveBeenCalledTimes(1);
  });
});

describe("OnboardingScreen", () => {
  it("renders 9 band buttons (5.0-9.0), updates s.target, and advances to mic check with null exam date", async () => {
    const { set } = renderWithApp(<OnboardingScreen />);

    for (const band of [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]) {
      expect(
        screen.getByRole("button", { name: band.toFixed(1) }),
      ).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "6.5" }));
    expect(set).toHaveBeenCalledWith({ target: 6.5 });
    expect(screen.getByRole("button", { name: "6.5" }).className).toContain(
      "bg-ink",
    );

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await waitFor(() => {
      expect(profileUpsertSpy).toHaveBeenCalledWith({
        targetBand: 6.5,
        examDate: null,
      });
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });
  });

  it("saves explicitly chosen exam date", async () => {
    renderWithApp(<OnboardingScreen />);
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeTruthy();
    fireEvent.change(dateInput!, { target: { value: "2029-12-31" } });

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await waitFor(() => {
      expect(profileUpsertSpy).toHaveBeenCalledWith({
        targetBand: 7.0,
        examDate: "2029-12-31",
      });
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });
  });

  it("preserves chosen exam date when navigating Back from mic check and submitting again", async () => {
    renderWithApp(<OnboardingScreen />);
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeTruthy();
    fireEvent.change(dateInput!, { target: { value: "2029-12-31" } });

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await waitFor(() => {
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });

    // Click Back to return to GoalStep
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
    await waitFor(() => {
      expect(screen.getByText("Mục tiêu của bạn là gì?")).toBeTruthy();
    });

    const dateInputAfterBack = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInputAfterBack.value).toBe("2029-12-31");

    // Click Tiếp tục again
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await waitFor(() => {
      expect(profileUpsertSpy).toHaveBeenLastCalledWith({
        targetBand: 7.0,
        examDate: "2029-12-31",
      });
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });
  });

  it("shows persistent blocked warning and retry button when mic permission is denied", async () => {
    micLevelMock.mockImplementation((active: boolean): MockMicReturn => ({
      level: 0,
      real: active ? false : null,
      status: active ? "denied" : "idle",
      denied: active,
    }));

    renderWithApp(<OnboardingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    await waitFor(() => {
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ghi thử 5 giây" }));

    await waitFor(() => {
      expect(screen.getByText("Trình duyệt đang chặn micro.")).toBeTruthy();
      expect(screen.getByText("Micro bị chặn")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Thử lại quyền micro" }),
      ).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Bỏ qua" })).toBeNull();
      expect(
        screen.queryByText("Bạn quyết định dữ liệu của mình"),
      ).toBeNull();
    });
  });

  it("completes 5-second mic check and completes onboarding directly (2-step flow)", async () => {
    micLevelMock.mockImplementation((active: boolean): MockMicReturn => ({
      level: active ? 0.7 : 0,
      real: active ? true : null,
      status: active ? "listening" : "idle",
      denied: false,
    }));

    const { go } = renderWithApp(<OnboardingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Bỏ qua ngày thi" }));

    await waitFor(() => {
      expect(profileUpsertSpy).toHaveBeenCalledWith({
        targetBand: 7.0,
        examDate: null,
      });
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });

    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    fireEvent.click(screen.getByRole("button", { name: "Ghi thử 5 giây" }));

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Micro ổn, tiếp tục" }),
      ).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Micro ổn, tiếp tục" }));

    await waitFor(() => {
      expect(profileCompleteSpy).toHaveBeenCalledTimes(1);
      expect(go).toHaveBeenCalledWith("dashboard");
    });
  });

  it("does not pass mic check if microphone is completely silent (level stays 0)", async () => {
    micLevelMock.mockImplementation((active: boolean): MockMicReturn => ({
      level: 0,
      real: active ? true : null,
      status: active ? "listening" : "idle",
      denied: false,
    }));

    renderWithApp(<OnboardingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Bỏ qua ngày thi" }));

    await waitFor(() => {
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });

    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    fireEvent.click(screen.getByRole("button", { name: "Ghi thử 5 giây" }));

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(
        screen.getByText("Không nghe thấy tiếng micro."),
      ).toBeTruthy();
      expect(
        screen.queryByRole("button", { name: "Micro ổn, tiếp tục" }),
      ).toBeNull();
      expect(
        screen.getByRole("button", { name: "Thử lại âm thanh" }),
      ).toBeTruthy();
    });
  });

  it("progresses timer and passes mic check even when level updates rapidly on each render", async () => {
    micLevelMock.mockImplementation((active: boolean): MockMicReturn => ({
      level: active ? 0.2 + Math.random() * 0.5 : 0,
      real: active ? true : null,
      status: active ? "listening" : "idle",
      denied: false,
    }));

    renderWithApp(<OnboardingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Bỏ qua ngày thi" }));

    await waitFor(() => {
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });

    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    fireEvent.click(screen.getByRole("button", { name: "Ghi thử 5 giây" }));

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Micro ổn, tiếp tục" }),
      ).toBeTruthy();
      expect(
        screen.getByText("Đã nhận tín hiệu micro thành công"),
      ).toBeTruthy();
    });
  });
  it("displays error banner and stays on goal step when profile upsert fails", async () => {
    profileUpsertSpy.mockRejectedValueOnce(new Error("Lỗi kết nối máy chủ"));

    renderWithApp(<OnboardingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    await waitFor(() => {
      expect(screen.getByText("Không thể lưu mục tiêu. Vui lòng kiểm tra kết nối và thử lại.")).toBeTruthy();
      expect(screen.queryByText("Kiểm tra micro & môi trường")).toBeNull();
    });
  });

  it("displays error banner and does not navigate when completeOnboarding fails", async () => {
    micLevelMock.mockImplementation((active: boolean): MockMicReturn => ({
      level: active ? 0.7 : 0,
      real: active ? true : null,
      status: active ? "listening" : "idle",
      denied: false,
    }));
    profileCompleteSpy.mockRejectedValueOnce(new Error("Không thể hoàn tất"));

    const { go } = renderWithApp(<OnboardingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Bỏ qua ngày thi" }));

    await waitFor(() => {
      expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
    });

    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    fireEvent.click(screen.getByRole("button", { name: "Ghi thử 5 giây" }));

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Micro ổn, tiếp tục" }),
      ).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Micro ổn, tiếp tục" }));

    await waitFor(() => {
      expect(screen.getByText("Không thể hoàn tất onboarding. Vui lòng thử lại.")).toBeTruthy();
      expect(go).not.toHaveBeenCalled();
    });
  });

  it("marks the active session user u1 as onboarded in auth-guard cache upon finishing onboarding", async () => {
    clearOnboardedUserCache();
    markUserOnboardedSpy.mockClear();
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "u1", name: "User One", email: "u1@example.com" } },
      isPending: false,
      error: null,
    } as never);
    micLevelMock.mockImplementation((active: boolean): MockMicReturn => ({
      level: active ? 0.7 : 0,
      real: active ? true : null,
      status: active ? "listening" : "idle",
      denied: false,
    }));

    try {
      const { go } = renderWithApp(<OnboardingScreen />);
      fireEvent.click(screen.getByRole("button", { name: "Bỏ qua ngày thi" }));

      await waitFor(() => {
        expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
      });

      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
      fireEvent.click(screen.getByRole("button", { name: "Ghi thử 5 giây" }));

      act(() => {
        vi.advanceTimersByTime(5200);
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Micro ổn, tiếp tục" })).toBeTruthy();
      });
      fireEvent.click(screen.getByRole("button", { name: "Micro ổn, tiếp tục" }));

      await waitFor(() => {
        expect(profileCompleteSpy).toHaveBeenCalled();
        expect(markUserOnboardedSpy).toHaveBeenCalledWith("u1");
        expect(go).toHaveBeenCalledWith("dashboard");
      });

      vi.mocked(authClient.getSession).mockResolvedValueOnce({
        data: {
          user: { id: "u1", name: "User One", email: "u1@example.com" },
          session: { id: "sess_u1", userId: "u1" },
        },
        error: null,
      } as never);
      vi.mocked(trpcClient.profile.get.query).mockClear();

      try {
        await redirectIfOnboarded("/app/dashboard");
        expect.unreachable("Expected redirectIfOnboarded to throw redirect for cached user u1");
      } catch (err) {
        expect(isRedirect(err)).toBe(true);
      }
      expect(trpcClient.profile.get.query).not.toHaveBeenCalled();
    } finally {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
        error: null,
      } as never);
      clearOnboardedUserCache();
    }
  });
});


describe("AuthScreen", () => {
  it("renders Google login, an 'hoặc' divider, and the email sign-in form (no magic link)", () => {
    renderWithApp(<AuthScreen />);
    expect(screen.getByRole("heading", { name: "Đăng nhập Vox Flow" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tiếp tục với Google/i })).toBeTruthy();
    expect(screen.getByText("hoặc")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Mật khẩu")).toBeTruthy();
    expect(screen.queryByLabelText("Tên hiển thị")).toBeNull();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeTruthy();
    expect(screen.queryByText("Gửi link đăng nhập")).toBeNull();
  });

  describe("email/password", () => {
    let assignSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.mocked(authClient.signIn.email).mockClear();
      vi.mocked(authClient.signUp.email).mockClear();
      assignSpy = vi.fn();
      vi.spyOn(window, "location", "get").mockReturnValue({
        ...window.location,
        origin: window.location.origin,
        search: "",
        assign: assignSpy,
      } as unknown as Location);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function fillAndSubmit(fields: { name?: string; email: string; password: string }) {
      if (fields.name !== undefined) {
        fireEvent.change(screen.getByLabelText("Tên hiển thị"), {
          target: { value: fields.name },
        });
      }
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: fields.email } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), {
        target: { value: fields.password },
      });
      const submit = screen.getByRole("button", { name: /^(Đăng nhập|Tạo tài khoản)$/ });
      fireEvent.submit(submit.closest("form")!);
    }

    it("signs in with email/password and navigates to the dashboard", async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
        data: { user: { id: "u1" } },
        error: null,
      } as never);

      renderWithApp(<AuthScreen search={{}} />);
      fillAndSubmit({ email: " user@example.com ", password: "Password123!" });

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledWith(`${window.location.origin}/app/dashboard`);
      });
      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123!",
      });
    });

    it("shows a Vietnamese error on invalid credentials and does not navigate", async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
        data: null,
        error: { status: 401, code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid" },
      } as never);

      renderWithApp(<AuthScreen search={{}} />);
      fillAndSubmit({ email: "user@example.com", password: "wrong-pass" });

      await waitFor(() => {
        expect(screen.getByText("Sai email hoặc mật khẩu.")).toBeTruthy();
      });
      expect(assignSpy).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Đăng nhập" }).getAttribute("disabled"),
      ).toBeNull();
    });

    it("falls back to a generic error for unknown error codes", async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
        data: null,
        error: { status: 500, code: "SOMETHING_ELSE", message: "Boom" },
      } as never);

      renderWithApp(<AuthScreen search={{}} />);
      fillAndSubmit({ email: "user@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(
          screen.getByText("Đăng nhập không thành công. Vui lòng thử lại."),
        ).toBeTruthy();
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("toggles to sign-up, creates the account, and honours a valid redirect", async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
        data: { user: { id: "u2" } },
        error: null,
      } as never);

      renderWithApp(<AuthScreen search={{ redirect: "/app/history/att-123" }} />);
      fireEvent.click(screen.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }));
      expect(screen.getByText("Tối thiểu 8 ký tự.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Tạo tài khoản" })).toBeTruthy();

      fillAndSubmit({ name: " Lan ", email: "lan@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledWith(
          `${window.location.origin}/app/history/att-123`,
        );
      });
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        name: "Lan",
        email: "lan@example.com",
        password: "Password123!",
      });
      expect(authClient.signIn.email).not.toHaveBeenCalled();
    });
    it("toggles to sign-up, creates the account, and redirects to /onboarding when no redirect is provided", async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
        data: { user: { id: "u3" } },
        error: null,
      } as never);

      renderWithApp(<AuthScreen search={{}} />);
      fireEvent.click(screen.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }));
      expect(screen.getByRole("button", { name: "Tạo tài khoản" })).toBeTruthy();

      fillAndSubmit({ name: "Minh", email: "minh@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledWith(
          `${window.location.origin}/onboarding`,
        );
      });
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        name: "Minh",
        email: "minh@example.com",
        password: "Password123!",
      });
      expect(authClient.signIn.email).not.toHaveBeenCalled();
    });


    it("shows 'Email đã được sử dụng' when sign-up hits a duplicate email", async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
        data: null,
        error: { status: 422, code: "USER_ALREADY_EXISTS", message: "User already exists" },
      } as never);

      renderWithApp(<AuthScreen search={{}} />);
      fireEvent.click(screen.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }));
      fillAndSubmit({ name: "Lan", email: "taken@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(screen.getByText("Email đã được sử dụng.")).toBeTruthy();
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("ignores a malicious redirect and navigates to the dashboard after sign-in", async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
        data: { user: { id: "u1" } },
        error: null,
      } as never);

      renderWithApp(<AuthScreen search={{ redirect: "//evil.com/hack" }} />);
      fillAndSubmit({ email: "user@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledTimes(1);
      });
      expect(assignSpy).toHaveBeenCalledWith(`${window.location.origin}/app/dashboard`);
      expect(String(assignSpy.mock.calls[0]?.[0])).not.toContain("evil.com");
    });
    it("ignores a malicious redirect and redirects to /onboarding after sign-up", async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
        data: { user: { id: "u4" } },
        error: null,
      } as never);

      renderWithApp(<AuthScreen search={{ redirect: "//evil.com/hack" }} />);
      fireEvent.click(screen.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }));

      fillAndSubmit({ name: "Hacker", email: "hacker@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledTimes(1);
      });
      expect(assignSpy).toHaveBeenCalledWith(`${window.location.origin}/onboarding`);
      expect(String(assignSpy.mock.calls[0]?.[0])).not.toContain("evil.com");
    });


    it("shows a connection error when the auth request throws", async () => {
      vi.mocked(authClient.signIn.email).mockRejectedValueOnce(new Error("network"));

      renderWithApp(<AuthScreen search={{}} />);
      fillAndSubmit({ email: "user@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(
          screen.getByText("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau."),
        ).toBeTruthy();
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("renders display name input with maxLength 50 in sign-up mode", () => {
      renderWithApp(<AuthScreen search={{}} />);
      fireEvent.click(screen.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }));
      const nameInput = screen.getByLabelText("Tên hiển thị");
      expect(nameInput.getAttribute("maxLength")).toBe("50");
    });

    it("shows rate-limit message when signIn.email returns status 429", async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
        data: null,
        error: { status: 429, code: "TOO_MANY_REQUESTS", message: "Too many requests" },
      } as never);

      renderWithApp(<AuthScreen search={{}} />);
      fillAndSubmit({ email: "user@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(
          screen.getByText("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."),
        ).toBeTruthy();
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("shows invalid display name message when signUp.email returns code INVALID_NAME", async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
        data: null,
        error: { status: 400, code: "INVALID_NAME", message: "INVALID_NAME" },
      } as never);

      renderWithApp(<AuthScreen search={{}} />);
      fireEvent.click(screen.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }));
      fillAndSubmit({ name: "x".repeat(51), email: "user@example.com", password: "Password123!" });

      await waitFor(() => {
        expect(
          screen.getByText("Tên hiển thị không hợp lệ (1–50 ký tự)."),
        ).toBeTruthy();
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });
  });

  it("invokes authClient.signIn.social with Google provider on button click", async () => {
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: { url: "https://accounts.google.com", redirect: true },
      error: null,
    } as never);

    renderWithApp(<AuthScreen />);
    const googleBtn = screen.getByRole("button", { name: /Tiếp tục với Google/i });
    fireEvent.click(googleBtn);

    expect(authClient.signIn.social).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        callbackURL: `${window.location.origin}/app/dashboard`,
        newUserCallbackURL: `${window.location.origin}/onboarding`,
        errorCallbackURL: `${window.location.origin}/auth`,
      }),
    );
  });

  it("preserves valid redirect deep link in callbackURL and errorCallbackURL", async () => {
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: { url: "https://accounts.google.com", redirect: true },
      error: null,
    } as never);

    renderWithApp(<AuthScreen search={{ redirect: "/app/history/att-123" }} />);
    const googleBtn = screen.getByRole("button", { name: /Tiếp tục với Google/i });
    fireEvent.click(googleBtn);

    expect(authClient.signIn.social).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        callbackURL: `${window.location.origin}/app/history/att-123`,
        newUserCallbackURL: `${window.location.origin}/app/history/att-123`,
        errorCallbackURL: expect.stringContaining(
          encodeURIComponent("/app/history/att-123"),
        ),
      }),
    );
  });
  it("rejects malicious or invalid redirect paths and defaults to dashboard", async () => {
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: { url: "https://accounts.google.com", redirect: true },
      error: null,
    } as never);

    renderWithApp(<AuthScreen search={{ redirect: "//evil.com/hack" }} />);
    const googleBtn = screen.getByRole("button", { name: /Tiếp tục với Google/i });
    fireEvent.click(googleBtn);

    expect(authClient.signIn.social).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        callbackURL: `${window.location.origin}/app/dashboard`,
        newUserCallbackURL: `${window.location.origin}/onboarding`,
        errorCallbackURL: `${window.location.origin}/auth`,
      }),
    );
  });

  it("displays error message for oauth_error search param", () => {
    renderWithApp(<AuthScreen search={{ error: "oauth_error" }} />);
    expect(
      screen.getByText(/Đăng nhập Google không thành công hoặc đã bị hủy/i),
    ).toBeTruthy();
  });

  it("tells the user to sign in with a password when Google cannot link to a password account", () => {
    renderWithApp(<AuthScreen search={{ error: "account_not_linked" }} />);
    expect(screen.getByText(/đã đăng ký bằng mật khẩu/i)).toBeTruthy();
  });

  it("displays error message when search param is an array (duplicate error query keys)", () => {
    renderWithApp(
      <AuthScreen
        search={{
          error: ["oauth_error", "access_denied"] as unknown as string,
        }}
      />,
    );
    expect(
      screen.getByText(/Đăng nhập Google không thành công hoặc đã bị hủy/i),
    ).toBeTruthy();
  });

  it("handles sign-in error response without freezing the button", async () => {
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: null,
      error: {
        status: 400,
        statusText: "Bad Request",
        message: "OAuth server error",
      },
    } as never);

    renderWithApp(<AuthScreen />);
    const googleBtn = screen.getByRole("button", { name: /Tiếp tục với Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Đăng nhập Google không thành công. Vui lòng thử lại."),
      ).toBeTruthy();
    });
    expect(googleBtn.getAttribute("disabled")).toBeNull();
  });

  it("shows rate-limit message when Google sign-in initiation returns status 429", async () => {
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: null,
      error: {
        status: 429,
        statusText: "Too Many Requests",
        message: "Too many requests",
      },
    } as never);

    renderWithApp(<AuthScreen />);
    const googleBtn = screen.getByRole("button", { name: /Tiếp tục với Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."),
      ).toBeTruthy();
    });
    expect(googleBtn.getAttribute("disabled")).toBeNull();
  });
    it("renders terms link and navigates to terms on click", () => {
      const { go } = renderWithApp(<AuthScreen />);
      const termsLink = screen.getByRole("link", { name: /Điều khoản dịch vụ/i });
      expect(termsLink).toBeTruthy();
      fireEvent.click(termsLink);
      expect(go).toHaveBeenCalledWith("terms");
    });
  });

