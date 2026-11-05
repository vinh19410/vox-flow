import { fireEvent, render, screen } from "@testing-library/react";
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
  it("renders 8 band buttons, updates s.target, and advances to mic check", () => {
    const { set } = renderWithApp(<OnboardingScreen />);

    for (const band of [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]) {
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
    expect(screen.getByText("Kiểm tra micro & môi trường")).toBeTruthy();
  });

  it("advances from mic check to consent step", () => {
    renderWithApp(<OnboardingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ qua" }));
    expect(
      screen.getByText("Bạn quyết định dữ liệu của mình"),
    ).toBeTruthy();
  });
});

describe("ConsentRows", () => {
  it("toggles consent.save and consent.train via labelled switches", () => {
    const { set } = renderWithApp(<ConsentRows />);

    const saveToggle = screen.getByRole("switch", {
      name: "Lưu bài chấm vào lịch sử",
    });
    expect(saveToggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(saveToggle);
    expect(set).toHaveBeenCalledWith({ consent: { save: false, train: false } });
    expect(saveToggle.getAttribute("aria-checked")).toBe("false");

    const trainToggle = screen.getByRole("switch", {
      name: "Cho phép dùng giọng nói để cải thiện AI",
    });
    expect(trainToggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(trainToggle);
    expect(set).toHaveBeenLastCalledWith({
      consent: { save: false, train: true },
    });
    expect(trainToggle.getAttribute("aria-checked")).toBe("true");
  });
});

describe("AuthScreen", () => {
  it("switches between signup and login modes", () => {
    renderWithApp(<AuthScreen />);
    expect(screen.getByRole("heading", { name: "Tạo tài khoản" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(
      screen.getByRole("heading", { name: "Chào mừng trở lại" }),
    ).toBeTruthy();
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
});
