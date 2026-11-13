import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("shows failure toast and does not sync state when updateUser returns { error }", async () => {
    vi.mocked(authClient.updateUser).mockResolvedValueOnce({
      error: { status: 400, code: "INVALID_IMAGE", message: "INVALID_IMAGE" },
    } as never);

    const { toast, set } = renderProfile();

    const nameInput = screen.getByDisplayValue("Lan Nguyễn");
    fireEvent.change(nameInput, { target: { value: "Tên Mới Không Được Lưu" } });

    fireEvent.click(screen.getByRole("button", { name: "Lưu tên" }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.",
      );
    });
    // Không sync state khi lỗi
    expect(set).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "Tên Mới Không Được Lưu" }),
    );
  });

  it("shows goal error banner when trpc profile.upsert rejects", async () => {
    vi.mocked(trpcClient.profile.upsert.mutate).mockRejectedValueOnce(
      new Error("network down"),
    );

    renderProfile({ target: 7.0, examDate: null });

    fireEvent.click(screen.getByRole("button", { name: "Lưu mục tiêu" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Không thể lưu mục tiêu. Vui lòng kiểm tra lại kết nối.",
        ),
      ).toBeTruthy();
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

  it("does not render redundant 'Mở bộ chọn ảnh đại diện' button and opens AvatarModal via camera button", () => {
    renderProfile();

    // Redundant text button is removed
    expect(
      screen.queryByRole("button", { name: "Mở bộ chọn ảnh đại diện" }),
    ).toBeNull();

    // Camera button on avatar still opens modal
    fireEvent.click(screen.getByRole("button", { name: "Đổi ảnh đại diện" }));

    expect(screen.getByText("Chọn ảnh đại diện")).toBeTruthy();
  });

  it("updates avatar through authClient.updateUser after choosing from modal", async () => {
    vi.mocked(authClient.updateUser).mockResolvedValue({} as never);

    renderProfile();

    // Open the modal
    fireEvent.click(
      screen.getByRole("button", { name: "Đổi ảnh đại diện" }),
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

  it("renders exam date input with overflow prevention and appearance-none classes", () => {
    renderProfile();

    const dateInput = document.getElementById("user-exam-date");
    expect(dateInput).toBeTruthy();
    expect(dateInput?.className).toContain("min-w-0");
    expect(dateInput?.className).toContain("max-w-full");
    expect(dateInput?.className).toContain("w-full");
    expect(dateInput?.className).toContain("appearance-none");
    expect(dateInput?.className).toContain("text-base");
    expect(dateInput?.className).toContain("sm:text-sm");
  });
  it("initializes with empty date string when examDate in app state is null", () => {
    renderProfile({ examDate: null });

    const dateInput = document.getElementById("user-exam-date") as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    expect(dateInput.value).toBe("");
  });

  it("clears examDate input when s.examDate changes to null dynamically", () => {
    let setStateFn: (val: Partial<AppState>) => void = () => {};
    function DynamicProvider({ children }: { children: ReactNode }) {
      const [state, setState] = useState<AppState>(() => ({
        ...createInitialState(),
        examDate: "2026-12-15",
      }));
      setStateFn = (upd) => setState((prev) => ({ ...prev, ...upd }));
      const value: AppCtxValue = {
        s: state,
        set: vi.fn(),
        go: vi.fn(),
        toast: vi.fn(),
      } as unknown as AppCtxValue;
      return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
    }

    render(
      <DynamicProvider>
        <ProfileScreen />
      </DynamicProvider>,
    );

    const dateInput = document.getElementById("user-exam-date") as HTMLInputElement;
    expect(dateInput.value).toBe("2026-12-15");

    act(() => {
      setStateFn({ examDate: null });
    });

    expect(dateInput.value).toBe("");
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

  it("renders 'Đã xác thực' badge when session user has email and emailVerified is true", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "u-123",
          email: "lan@example.com",
          emailVerified: true,
          name: "Lan Nguyễn",
          image: null,
        },
        session: { id: "s-123", userId: "u-123" },
      },
      isPending: false,
      error: null,
    } as never);

    renderProfile();

    expect(screen.getByText("lan@example.com")).toBeTruthy();
    expect(screen.getByText("Đã xác thực")).toBeTruthy();
  });

  it("hides 'Đã xác thực' badge when session user has emailVerified false", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "u-123",
          email: "lan@example.com",
          emailVerified: false,
          name: "Lan Nguyễn",
          image: null,
        },
        session: { id: "s-123", userId: "u-123" },
      },
      isPending: false,
      error: null,
    } as never);

    renderProfile();

    expect(screen.getByText("lan@example.com")).toBeTruthy();
    expect(screen.queryByText("Đã xác thực")).toBeNull();
  });

  it("hides 'Đã xác thực' badge when session is null or emailVerified is undefined", () => {
    // Subcase 1: default beforeEach mock omits emailVerified
    const { unmount } = renderProfile();
    expect(screen.getByText("lan@example.com")).toBeTruthy();
    expect(screen.queryByText("Đã xác thực")).toBeNull();
    unmount();

    // Subcase 2: session is null while app state has fallback email
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as never);

    renderProfile({ email: "fallback@example.com" });

    expect(screen.getByText("fallback@example.com")).toBeTruthy();
    expect(screen.queryByText("Đã xác thực")).toBeNull();
  });

  it("hides 'Đã xác thực' badge when email is empty even if emailVerified is true", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "u-123",
          email: "",
          emailVerified: true,
          name: "Lan Nguyễn",
          image: null,
        },
        session: { id: "s-123", userId: "u-123" },
      },
      isPending: false,
      error: null,
    } as never);

    renderProfile({ email: "" });

    expect(screen.getByText("Chưa thiết lập")).toBeTruthy();
    expect(screen.queryByText("Đã xác thực")).toBeNull();
  });

  it("hides 'Đã xác thực' badge when session email is empty and display falls back to s.email", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "u-123",
          email: "",
          emailVerified: true,
          name: "Lan Nguyễn",
          image: null,
        },
        session: { id: "s-123", userId: "u-123" },
      },
      isPending: false,
      error: null,
    } as never);

    const { unmount } = renderProfile({ email: "fallback@example.com" });

    expect(screen.getByText("fallback@example.com")).toBeTruthy();
    expect(screen.queryByText("Đã xác thực")).toBeNull();
    unmount();

    // Whitespace-only session email must also hide the badge
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "u-123",
          email: "   ",
          emailVerified: true,
          name: "Lan Nguyễn",
          image: null,
        },
        session: { id: "s-123", userId: "u-123" },
      },
      isPending: false,
      error: null,
    } as never);

    renderProfile({ email: "fallback@example.com" });

    expect(screen.queryByText("Đã xác thực")).toBeNull();
  });
});
