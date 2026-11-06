import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { ProtoToast } from "@/features/app-state/toast";
import { AppCtx, type AppCtxValue, type AppState } from "@/features/app-state/types";
import { AuthScreen } from "@/features/auth/auth-screen";
import { PLANS } from "@/features/billing/data";
import { LandingScreen } from "@/features/landing/landing-screen";
import { ConsentRows } from "@/features/onboarding/components/consent-rows";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { PrivacyScreen } from "@/features/privacy/privacy-screen";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
}));

const profileUpsertSpy = vi.fn().mockResolvedValue({ targetBand: 6.5, examDate: null });
const profileCompleteSpy = vi.fn().mockResolvedValue({ onboardedAt: new Date() });
const privacySetConsentSpy = vi.fn().mockResolvedValue({ success: true });

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
    privacy: {
      setConsent: {
        mutate: (...args: unknown[]) => privacySetConsentSpy(...args),
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
  it("renders hero headline, 3 paid teaser plans, and privacy CTA", () => {
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

    expect(screen.getByText("Giọng nói của bạn là của bạn.")).toBeTruthy();
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

  it("navigates to auth from the hero CTA and header/privacy buttons", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu thi thử" }));
    expect(go).toHaveBeenCalledWith("auth");
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

  it("completes 5-second mic check and advances to consent step, then completes onboarding", async () => {
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
      expect(
        screen.getByText("Bạn quyết định dữ liệu của mình"),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Vào trang chủ" }));

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
      expect(
        screen.getByText("Bạn quyết định dữ liệu của mình"),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Vào trang chủ" }));

    await waitFor(() => {
      expect(screen.getByText("Không thể hoàn tất onboarding. Vui lòng thử lại.")).toBeTruthy();
      expect(go).not.toHaveBeenCalled();
    });
  });
});

describe("ConsentRows", () => {
  it("toggles consent.save and consent.calibration via labelled switches", () => {
    const { set } = renderWithApp(<ConsentRows />);

    const saveToggle = screen.getByRole("switch", {
      name: "Lưu bài chấm vào lịch sử",
    });
    expect(saveToggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(saveToggle);
    expect(set).toHaveBeenCalledWith({
      consent: { save: false, calibration: false, train: false },
    });
    expect(saveToggle.getAttribute("aria-checked")).toBe("false");

    const calibToggle = screen.getByRole("switch", {
      name: "Hiệu chuẩn chấm điểm",
    });
    expect(calibToggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(calibToggle);
    expect(set).toHaveBeenLastCalledWith({
      consent: { save: false, calibration: true, train: true },
    });
    expect(calibToggle.getAttribute("aria-checked")).toBe("true");
  });
});

describe("AuthScreen", () => {
  it("renders Google login only and no email input", () => {
    renderWithApp(<AuthScreen />);
    expect(screen.getByRole("heading", { name: "Đăng nhập Vox Flow" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tiếp tục với Google/i })).toBeTruthy();
    expect(screen.queryByPlaceholderText("ban@email.com")).toBeNull();
    expect(screen.queryByText("Gửi link đăng nhập")).toBeNull();
    expect(screen.queryByText("hoặc")).toBeNull();
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
        callbackURL: expect.stringContaining("/app/dashboard"),
        errorCallbackURL: expect.stringMatching(/\/auth$/),
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
        callbackURL: expect.stringContaining("/app/history/att-123"),
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
        callbackURL: expect.stringMatching(/\/app\/dashboard$/),
        errorCallbackURL: expect.stringMatching(/\/auth$/),
      }),
    );
  });

  it("displays error message for oauth_error search param", () => {
    renderWithApp(<AuthScreen search={{ error: "oauth_error" }} />);
    expect(
      screen.getByText(/Đăng nhập Google không thành công hoặc đã bị hủy/i),
    ).toBeTruthy();
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
});

describe("PrivacyScreen", () => {
  it("opens confirm modal, wipes attempts, and shows toast", () => {
    const { toast } = renderWithApp(<PrivacyScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Xóa dữ liệu" }));
    expect(screen.getByText("Xóa 6 bài làm?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(toast).toHaveBeenCalledWith("Đã xóa dữ liệu bài làm");
    expect(screen.getByText("Đã xóa dữ liệu bài làm")).toBeTruthy();
    expect(screen.queryByText(/Xóa \d+ bài làm\?/)).toBeNull();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("triggers data export download", async () => {
    const createObjectURL = vi.fn(() => "blob:test");
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("exportData")) {
        return new Response(
          JSON.stringify([
            {
              result: {
                data: {
                  exportedAt: "2026-11-05T00:00:00Z",
                  userId: "usr_test",
                  data: { user: [] },
                },
              },
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify([{ result: { data: { success: true } } }]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const { toast } = renderWithApp(<PrivacyScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Xuất toàn bộ dữ liệu" }));

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith("Đã tải xuống file dữ liệu JSON");
    });
  });
});
