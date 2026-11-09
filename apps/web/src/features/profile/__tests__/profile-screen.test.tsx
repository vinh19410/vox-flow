import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { AppCtx } from "@/features/app-state/types";
import type { AppCtxValue, AppState } from "@/features/app-state/types";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

import { ProfileScreen } from "../profile-screen";

const navigateMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    profile: {
      upsert: {
        mutate: vi.fn(),
      },
    },
  },
}));

function renderProfile(seed?: Partial<AppState>) {
  const go = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();

  function Provider({ children }: { children: ReactNode }) {
    const [state] = useState<AppState>(() => ({
      ...createInitialState(),
      ...seed,
    }));
    const value: AppCtxValue = {
      s: state,
      set,
      go,
      toast,
    } as unknown as AppCtxValue;
    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
  }

  const utils = render(
    <Provider>
      <ProfileScreen />
    </Provider>,
  );

  return { ...utils, go, set, toast };
}

describe("ProfileScreen component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "u-123",
          email: "lan@example.com",
          name: "Lan Nguyễn",
          image: null,
        },
        session: { id: "s-123", userId: "u-123" },
      },
      isPending: false,
      error: null,
    } as never);
  });

  it("renders profile header with title and current session identity", () => {
    renderProfile();

    expect(screen.getByText("Hồ sơ cá nhân")).toBeTruthy();
    expect(screen.getByDisplayValue("Lan Nguyễn")).toBeTruthy();
    expect(screen.getByText("lan@example.com")).toBeTruthy();
  });

  it("updates user name through authClient.updateUser and syncs app state", async () => {
    vi.mocked(authClient.updateUser).mockResolvedValueOnce({} as never);

    renderProfile();

    const nameInput = screen.getByDisplayValue("Lan Nguyễn");
    fireEvent.change(nameInput, { target: { value: "Lan Nguyễn Mới" } });

    const saveBtn = screen.getByRole("button", { name: "Lưu tên" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authClient.updateUser).toHaveBeenCalledWith({
        name: "Lan Nguyễn Mới",
        image: undefined,
      });
    });
  });

  it("saves IELTS goal through trpc profile.upsert with target band and exam date", async () => {
    vi.mocked(trpcClient.profile.upsert.mutate).mockResolvedValueOnce(
      {} as never,
    );

    renderProfile({ target: 7.0, examDate: null });

    // Pick target band 8.0
    fireEvent.click(screen.getByRole("button", { name: "8.0" }));

    // Set exam date
    const dateInput = screen.getByLabelText(
      "Ngày thi dự kiến (tuỳ chọn)",
    ) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-12-15" } });

    const saveGoalBtn = screen.getByRole("button", { name: "Lưu mục tiêu" });
    fireEvent.click(saveGoalBtn);

    await waitFor(() => {
      expect(trpcClient.profile.upsert.mutate).toHaveBeenCalledWith({
        targetBand: 8.0,
        examDate: "2026-12-15",
      });
    });
  });

  it("shows validation error when exam date is in the past", async () => {
    renderProfile({ target: 7.0, examDate: null });

    const dateInput = screen.getByLabelText(
      "Ngày thi dự kiến (tuỳ chọn)",
    ) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2020-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Lưu mục tiêu" }));

    await waitFor(() => {
      expect(
        screen.getByText("Ngày thi dự kiến không thể ở trong quá khứ."),
      ).toBeTruthy();
    });
    expect(trpcClient.profile.upsert.mutate).not.toHaveBeenCalled();
  });

  it("opens AvatarModal when clicking 'Mở bộ chọn ảnh đại diện'", () => {
    renderProfile();

    fireEvent.click(
      screen.getByRole("button", { name: "Mở bộ chọn ảnh đại diện" }),
    );

    expect(screen.getByText("Chọn ảnh đại diện")).toBeTruthy();
  });

  it("updates avatar through authClient.updateUser after choosing from modal", async () => {
    vi.mocked(authClient.updateUser).mockResolvedValue({} as never);

    renderProfile();

    // Open the modal
    fireEvent.click(
      screen.getByRole("button", { name: "Mở bộ chọn ảnh đại diện" }),
    );

    // Confirm with a preset
    fireEvent.click(
      screen.getByRole("button", { name: "Xác nhận đổi ảnh" }),
    );

    await waitFor(() => {
      expect(authClient.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Lan Nguyễn",
          image: expect.stringMatching(/^\/avatars\//),
        }),
      );
    });
  });

  it("navigates to billing screen when clicking 'Quản lý & Nâng cấp gói'", () => {
    const { go } = renderProfile({
      plan: { id: "monthly", name: "Gói Tháng", until: "2026-12-31" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Quản lý & Nâng cấp gói/ }),
    );

    expect(go).toHaveBeenCalledWith("billing");
  });

  it("renders free plan card when user has no active plan", () => {
    renderProfile({ plan: null });

    expect(screen.getByText("Gói Miễn phí")).toBeTruthy();
  });
});
