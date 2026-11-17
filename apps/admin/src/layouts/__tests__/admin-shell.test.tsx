import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateSpy = vi.fn();
let mockPathname = "/users";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useRouterState: ({
    select,
  }: {
    select: (st: { location: { pathname: string } }) => string;
  }) => select({ location: { pathname: mockPathname } }),
  useNavigate: () => navigateSpy,
}));

const signOutSpy = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOutSpy(...args),
    useSession: () => ({ data: null }),
  },
}));

const toastErrorSpy = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorSpy(...args),
  },
}));

import {
  ADMIN_NAV_ITEMS,
  AdminShell,
  resolveAdminActiveNav,
} from "../admin-shell";

describe("resolveAdminActiveNav", () => {
  it("resolves exact and nested admin routes", () => {
    expect(resolveAdminActiveNav("/users")).toBe("users");
    expect(resolveAdminActiveNav("/users/usr_123")).toBe("users");
    expect(resolveAdminActiveNav("/forecast")).toBe("forecast");
    expect(resolveAdminActiveNav("/payments")).toBe("payments");
    expect(resolveAdminActiveNav("/disputes")).toBe("disputes");
  });

  it("returns null outside admin nav routes", () => {
    expect(resolveAdminActiveNav("/login")).toBeNull();
    expect(resolveAdminActiveNav("/unknown")).toBeNull();
  });
});

describe("AdminShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/users";
  });

  it("renders all 4 navigation items, user card, and children", () => {
    render(
      <AdminShell adminUser={{ name: "Admin Linh", email: "linh@voxflow.vn" }}>
        <div>Nội dung chính</div>
      </AdminShell>,
    );

    expect(ADMIN_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Người dùng",
      "Đề Forecast",
      "Thanh toán",
      "Khiếu nại",
    ]);

    expect(screen.getAllByText("Người dùng").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Đề Forecast").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Thanh toán").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Khiếu nại").length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText("Admin Linh").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("linh@voxflow.vn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Nội dung chính")).toBeTruthy();
  });

  it("signs out and navigates to /login when Đăng xuất is clicked", async () => {
    signOutSpy.mockResolvedValueOnce({ data: { success: true }, error: null });
    navigateSpy.mockResolvedValueOnce(undefined);

    render(
      <AdminShell adminUser={{ name: "Admin Linh", email: "linh@voxflow.vn" }}>
        <div>Body</div>
      </AdminShell>,
    );

    const signOutButtons = screen.getAllByRole("button", { name: /Đăng xuất/i });
    fireEvent.click(signOutButtons[0]!);

    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith({ to: "/login" });
    });
  });

  it("shows error toast and stays on page when signOut fails", async () => {
    signOutSpy.mockResolvedValueOnce({ error: { message: "Sign out failed" } });

    render(
      <AdminShell adminUser={{ name: "Admin Linh", email: "linh@voxflow.vn" }}>
        <div>Body</div>
      </AdminShell>,
    );

    const signOutButtons = screen.getAllByRole("button", { name: /Đăng xuất/i });
    fireEvent.click(signOutButtons[0]!);

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith("Đăng xuất thất bại. Vui lòng thử lại.");
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});
