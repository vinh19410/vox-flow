import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSignOut } from "../use-sign-out";

const { signOutMock, navigateMock, toastErrorMock, clearOnboardedUserCacheMock } = vi.hoisted(
  () => ({
    signOutMock: vi.fn(),
    navigateMock: vi.fn(),
    toastErrorMock: vi.fn(),
    clearOnboardedUserCacheMock: vi.fn(),
  }),
);

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: signOutMock,
  },
}));

vi.mock("@/lib/auth-guard", () => ({
  clearOnboardedUserCache: clearOnboardedUserCacheMock,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

const SIGN_OUT_ERROR = "Đăng xuất thất bại. Vui lòng thử lại.";

describe("useSignOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ data: null, error: null });
    navigateMock.mockResolvedValue(undefined);
  });

  it("navigates to /auth once without toasting on successful sign-out", async () => {
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current();
    });

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith({ to: "/auth" });
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(clearOnboardedUserCacheMock).toHaveBeenCalledTimes(1);
  });

  it("toasts and stays on the page when sign-out resolves with an error", async () => {
    signOutMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current();
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith(SIGN_OUT_ERROR);
    expect(clearOnboardedUserCacheMock).not.toHaveBeenCalled();
  });

  it("toasts and stays on the page when sign-out rejects", async () => {
    signOutMock.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current();
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith(SIGN_OUT_ERROR);
    expect(clearOnboardedUserCacheMock).not.toHaveBeenCalled();
  });

  it("uses the custom redirect target when provided", async () => {
    const { result } = renderHook(() => useSignOut("/terms"));

    await act(async () => {
      await result.current();
    });

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(clearOnboardedUserCacheMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith({ to: "/terms" });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});
