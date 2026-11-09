import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { AppCtx } from "@/features/app-state/types";
import type { AppCtxValue, AppState } from "@/features/app-state/types";
import { authClient } from "@/lib/auth-client";

import { DashboardScreen } from "../dashboard-screen";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

function mockSession(user: { id: string; email: string; name?: string } | null) {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: user
      ? {
          user,
          session: { id: "s-123", userId: user.id },
        }
      : null,
    isPending: false,
    error: null,
  } as never);
}

function renderDashboard(seed?: Partial<AppState>) {
  const go = vi.fn();
  const goResult = vi.fn();
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
      toast: vi.fn(),
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt: vi.fn(),
      pendingSubmission: false,
      setPendingSubmission: vi.fn(),
      go,
      goResult,
    };
    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
  }

  render(
    <Provider>
      <DashboardScreen />
    </Provider>,
  );

  return { go, goResult, set };
}

describe("DashboardScreen greeting name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("greets the session user's given name instead of the seed name", () => {
    mockSession({ id: "u-123", email: "lan@example.com", name: "Trần Thị Lan" });
    renderDashboard();

    expect(screen.getByText("Chào Lan, sẵn sàng nói chưa?")).toBeTruthy();
    expect(screen.queryByText(/Chào Anh/)).toBeNull();
  });

  it("greets the session user's given name in the empty state and starts the first attempt", () => {
    mockSession({ id: "u-123", email: "lan@example.com", name: "Trần Thị Lan" });
    const { go } = renderDashboard({ attempts: [] });

    expect(screen.getByText("Chào Lan!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Thi thử bài đầu tiên/ }));
    expect(go).toHaveBeenCalledWith("select");
  });

  it("falls back to the seed name when the session is absent", () => {
    mockSession(null);
    renderDashboard({ attempts: [] });

    expect(screen.getByText("Chào Anh!")).toBeTruthy();
  });

  it("falls back to the seed name when the session user has no name", () => {
    mockSession({ id: "u-456", email: "user@example.com" });
    renderDashboard();

    expect(screen.getByText("Chào Anh, sẵn sàng nói chưa?")).toBeTruthy();
  });

  it("falls back to the seed name when the session name is whitespace only", () => {
    mockSession({ id: "u-789", email: "user@example.com", name: "   " });
    renderDashboard({ attempts: [] });

    expect(screen.getByText("Chào Anh!")).toBeTruthy();
    expect(screen.queryByText("Chào !")).toBeNull();
  });
});
