import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { AppCtx } from "@/features/app-state/types";
import type { AppCtxValue, AppState } from "@/features/app-state/types";
import { authClient } from "@/lib/auth-client";

import { UserCard } from "../user-card";

const navigateMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

function renderUserCard(seed?: Partial<AppState>) {
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
      <UserCard />
    </Provider>,
  );

  return { ...utils, go, set, toast };
}

describe("UserCard component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authClient.signOut).mockResolvedValue({
      data: null,
      error: null,
    } as never);
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
  });

  it("renders session user name and avatar initial over app state seed", () => {
    renderUserCard({ name: "Minh Anh" });

    // Session name "Lan Nguyễn" wins over the state seed "Minh Anh"
    expect(screen.getByText("Lan Nguyễn")).toBeTruthy();
    expect(screen.queryByText("Minh Anh")).toBeNull();

    // Initial 'L' from "Lan Nguyễn"
    expect(screen.getByText("L")).toBeTruthy();
  });

  it("falls back to app state seed name when session is absent", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as never);

    renderUserCard({ name: "Bảo Châu" });

    expect(screen.getByText("Bảo Châu")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
  });

  it("falls back to app state seed name when session user has no name", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { id: "u-456", email: "user@example.com" },
        session: { id: "s-456", userId: "u-456" },
      },
      isPending: false,
      error: null,
    } as never);

    renderUserCard({ name: "Tuấn Kiệt" });

    expect(screen.getByText("Tuấn Kiệt")).toBeTruthy();
    expect(screen.getByText("T")).toBeTruthy();
  });

  it("renders active plan name or default 'Miễn phí'", () => {
    const { unmount } = renderUserCard({
      plan: { id: "pro", name: "Chuyên nghiệp", until: "2026-12-31" },
    });
    expect(screen.getByText("Gói Chuyên nghiệp")).toBeTruthy();

    unmount();

    renderUserCard({ plan: null });
    expect(screen.getByText("Miễn phí")).toBeTruthy();
  });

  it("calls signOut and navigates to /auth when clicking 'Đăng xuất' button", async () => {
    renderUserCard();

    const logoutBtn = screen.getByRole("button", { name: "Đăng xuất" });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith({ to: "/auth" });
    });
  });
});
