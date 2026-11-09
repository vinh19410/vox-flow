import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { AppCtx } from "@/features/app-state/types";
import type { AppCtxValue, AppState } from "@/features/app-state/types";
import { authClient } from "@/lib/auth-client";

import { BottomNav } from "../bottom-nav";

const navigateMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tanstack/react-router", () => ({
  useRouterState: (opts: { select: (st: { location: { pathname: string } }) => string }) =>
    opts.select({ location: { pathname: "/app/dashboard" } }),
  useNavigate: () => navigateMock,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

function renderBottomNav(seed?: Partial<AppState>) {
  const go = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();

  function Provider({ children }: { children: ReactNode }) {
    const [s, setS] = useState<AppState>(() => ({
      ...createInitialState(),
      ...seed,
    }));
    const value: AppCtxValue = {
      s,
      set: (u) => {
        set(u);
        setS((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
      },
      paywallOpen: false,
      openPaywall: vi.fn(),
      closePaywall: vi.fn(),
      toastMsg: null,
      toast,
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt: vi.fn(),
      pendingSubmission: false,
      setPendingSubmission: vi.fn(),
      go,
      goResult: vi.fn(),
    };
    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
  }

  const utils = render(
    <Provider>
      <BottomNav />
    </Provider>,
  );

  return { ...utils, go, set, toast };
}

describe("BottomNav component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "u-123",
          email: "lan@example.com",
          name: "Lan Nguyễn",
        },
        session: { id: "s-123", userId: "u-123" },
      },
      isPending: false,
      error: null,
    } as never);
    vi.mocked(authClient.signOut).mockResolvedValue({} as never);
  });

  it("renders mobile header with logo, avatar trigger initial, and 5 nav items", () => {
    renderBottomNav();

    const avatarBtn = screen.getByRole("button", { name: "Tài khoản người dùng" });
    expect(avatarBtn).toBeTruthy();
    // Session name "Lan Nguyễn" wins over the state seed "Minh Anh"
    expect(avatarBtn.textContent).toBe("L");

    // 5 bottom nav items
    expect(screen.getByText("Trang chủ")).toBeTruthy();
    expect(screen.getByText("Thi thử")).toBeTruthy();
    expect(screen.getByText("Forecast")).toBeTruthy();
    expect(screen.getByText("Lịch sử")).toBeTruthy();
    expect(screen.getByText("Gói")).toBeTruthy();
  });

  it("opens user menu on avatar click and displays session name over state seed, with email and plan", async () => {
    renderBottomNav({
      name: "Bảo Châu",
      plan: { id: "starter", name: "Cơ bản", until: "2026-12-31" },
    });

    const avatarBtn = screen.getByRole("button", { name: "Tài khoản người dùng" });
    expect(avatarBtn.textContent).toBe("L");

    fireEvent.click(avatarBtn);

    await waitFor(() => {
      expect(screen.getByText("Lan Nguyễn")).toBeTruthy();
      expect(screen.getByText("lan@example.com")).toBeTruthy();
      expect(screen.getByText("Gói Cơ bản")).toBeTruthy();
      // Session identity wins over the prototype state seed
      expect(screen.queryByText("Bảo Châu")).toBeNull();
    });

    expect(screen.getByRole("menuitem", { name: /Gói & thanh toán/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Đăng xuất/i })).toBeTruthy();
  });

  it("navigates to billing when clicking 'Gói & thanh toán'", async () => {
    const { go } = renderBottomNav();

    fireEvent.click(screen.getByRole("button", { name: "Tài khoản người dùng" }));

    const billingItem = await screen.findByRole("menuitem", { name: /Gói & thanh toán/i });
    fireEvent.click(billingItem);

    expect(go).toHaveBeenCalledWith("billing");
  });

  it("calls authClient.signOut and navigates to /auth on 'Đăng xuất' click", async () => {
    renderBottomNav();

    fireEvent.click(screen.getByRole("button", { name: "Tài khoản người dùng" }));

    const logoutItem = await screen.findByRole("menuitem", { name: /Đăng xuất/i });
    fireEvent.click(logoutItem);

    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith({ to: "/auth" });
    });
  });

  it("falls back gracefully when session email is absent", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as never);

    renderBottomNav({ name: "Tuấn Kiệt", plan: null });

    fireEvent.click(screen.getByRole("button", { name: "Tài khoản người dùng" }));

    await waitFor(() => {
      // No session data → falls back to the state seed name
      expect(screen.getByText("Tuấn Kiệt")).toBeTruthy();
      expect(screen.getByText("Gói Miễn phí")).toBeTruthy();
      expect(screen.queryByText("lan@example.com")).toBeNull();
    });
  });
});
