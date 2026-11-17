import { isRedirect } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSafeRedirect,
  redirectIfAuthenticated,
  requireAdminAccess,
} from "@/lib/admin-guard";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(),
  },
}));

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    adminUsers: {
      checkAdmin: {
        query: vi.fn(),
      },
    },
  },
}));

const mockAdminSession = {
  user: { id: "usr_admin_1", email: "admin@voxflow.vn", name: "Admin Vox" },
  session: { id: "sess_1", userId: "usr_admin_1" },
};

describe("getSafeRedirect", () => {
  it("allows relative app paths", () => {
    expect(getSafeRedirect("/users")).toBe("/users");
    expect(getSafeRedirect("/users/usr_1?tab=orders")).toBe("/users/usr_1?tab=orders");
  });

  it("rejects external, protocol-relative, and auth-loop paths", () => {
    expect(getSafeRedirect(undefined)).toBeNull();
    expect(getSafeRedirect("")).toBeNull();
    expect(getSafeRedirect("https://evil.example/users")).toBeNull();
    expect(getSafeRedirect("//evil.example/users")).toBeNull();
    expect(getSafeRedirect("/\\evil.example")).toBeNull();
    expect(getSafeRedirect("/login")).toBeNull();
    expect(getSafeRedirect("/login?redirect=/users")).toBeNull();
    expect(getSafeRedirect("/auth")).toBeNull();
  });
});

describe("requireAdminAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when session is absent", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: null,
      error: null,
    } as never);

    try {
      await requireAdminAccess("/payments");
      expect.unreachable("Expected redirect to /login");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/login");
        expect(err.options.search).toEqual({ redirect: "/payments" });
      }
    }
  });

  it("strips unsafe redirect targets when redirecting unauthenticated users", async () => {
    vi.mocked(authClient.getSession).mockRejectedValueOnce(new Error("Network error"));

    try {
      await requireAdminAccess("//evil.com");
      expect.unreachable("Expected redirect to /login");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/login");
        expect(err.options.search).toBeUndefined();
      }
    }
  });

  it("redirects to /login when checkAdmin returns UNAUTHORIZED", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: mockAdminSession,
      error: null,
    } as never);
    vi.mocked(trpcClient.adminUsers.checkAdmin.query).mockRejectedValueOnce({
      data: { code: "UNAUTHORIZED" },
      message: "Authentication required",
    });

    try {
      await requireAdminAccess("/users/usr_42");
      expect.unreachable("Expected redirect to /login");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/login");
        expect(err.options.search).toEqual({ redirect: "/users/usr_42" });
      }
    }
  });

  it("returns isAdmin=false when checkAdmin returns FORBIDDEN without redirecting", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: mockAdminSession,
      error: null,
    } as never);
    vi.mocked(trpcClient.adminUsers.checkAdmin.query).mockRejectedValueOnce({
      data: { code: "FORBIDDEN" },
      message: "Admin access required",
    });

    const result = await requireAdminAccess("/users");
    expect(result).toEqual({
      session: mockAdminSession,
      isAdmin: false,
    });
  });

  it("returns isAdmin=true when session and checkAdmin succeed", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: mockAdminSession,
      error: null,
    } as never);
    vi.mocked(trpcClient.adminUsers.checkAdmin.query).mockResolvedValueOnce({
      isAdmin: true,
    });

    const result = await requireAdminAccess("/users");
    expect(result).toEqual({
      session: mockAdminSession,
      isAdmin: true,
    });
  });
});

describe("redirectIfAuthenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when user has no session", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: null,
      error: null,
    } as never);

    await expect(redirectIfAuthenticated("/users")).resolves.toBeUndefined();
    expect(trpcClient.adminUsers.checkAdmin.query).not.toHaveBeenCalled();
  });

  it("redirects to target when session exists and checkAdmin succeeds", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: mockAdminSession,
      error: null,
    } as never);
    vi.mocked(trpcClient.adminUsers.checkAdmin.query).mockResolvedValueOnce({
      isAdmin: true,
    });

    try {
      await redirectIfAuthenticated("/payments");
      expect.unreachable("Expected redirect to /payments");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/payments");
      }
    }
  });

  it("stays on /login when user is signed in but FORBIDDEN", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: mockAdminSession,
      error: null,
    } as never);
    vi.mocked(trpcClient.adminUsers.checkAdmin.query).mockRejectedValueOnce({
      data: { code: "FORBIDDEN" },
      message: "Admin access required",
    });

    await expect(redirectIfAuthenticated("/users")).resolves.toBeUndefined();
  });
});
