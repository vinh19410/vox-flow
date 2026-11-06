import { isRedirect } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authClient } from "@/lib/auth-client";
import { clearOnboardedUserCache, requireOnboarded, requireSession } from "@/lib/auth-guard";
import { trpcClient } from "@/utils/trpc";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(),
  },
}));

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    profile: {
      get: {
        query: vi.fn(),
      },
    },
  },
}));
describe("requireSession route guard (WI-07)", () => {
  it("throws redirect to /auth when session is null", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    try {
      await requireSession();
      expect.unreachable("Expected requireSession to throw a redirect");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/auth");
        expect(err.options.search).toBeUndefined();
      }
    }
  });

  it("throws redirect to /auth with redirect search param when path is provided", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    try {
      await requireSession("/app/history/123");
      expect.unreachable("Expected requireSession to throw a redirect");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/auth");
        expect(err.options.search).toEqual({ redirect: "/app/history/123" });
      }
    }
  });

  it("throws redirect to /auth when getSession throws a network error", async () => {
    vi.mocked(authClient.getSession).mockRejectedValueOnce(
      new Error("Network failed"),
    );

    try {
      await requireSession();
      expect.unreachable("Expected requireSession to throw a redirect");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/auth");
      }
    }
  });

  it("returns session when session data exists", async () => {
    const mockSession = {
      user: { id: "user_123", email: "student@voxflow.vn", name: "Student" },
      session: { id: "sess_123", userId: "user_123" },
    };

    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: mockSession,
      error: null,
    });

    const result = await requireSession();
    expect(result).toBeDefined();
    expect(result.session.data).toEqual(mockSession);
  });
});

describe("requireOnboarded route guard", () => {
  beforeEach(() => {
    clearOnboardedUserCache();
    vi.clearAllMocks();
  });

  it("throws redirect to /auth when session is null", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    try {
      await requireOnboarded();
      expect.unreachable("Expected requireOnboarded to throw redirect to /auth");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/auth");
      }
    }
  });

  it("throws redirect to /onboarding when user exists but profile is null", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: {
        user: { id: "user_new", email: "new@voxflow.vn", name: "New User" },
        session: { id: "sess_new", userId: "user_new" },
      },
      error: null,
    });
    vi.mocked(trpcClient.profile.get.query).mockResolvedValueOnce(null as never);

    try {
      await requireOnboarded();
      expect.unreachable("Expected requireOnboarded to throw redirect to /onboarding");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/onboarding");
      }
    }
  });

  it("throws redirect to /onboarding when profile exists but onboardedAt is null", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: {
        user: { id: "user_partial", email: "partial@voxflow.vn", name: "Partial User" },
        session: { id: "sess_partial", userId: "user_partial" },
      },
      error: null,
    });
    vi.mocked(trpcClient.profile.get.query).mockResolvedValueOnce({
      userId: "user_partial",
      targetBand: 6.5,
      examDate: "2029-12-31",
      onboardedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    try {
      await requireOnboarded();
      expect.unreachable("Expected requireOnboarded to throw redirect to /onboarding");
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/onboarding");
      }
    }
  });

  it("allows access when profile has onboardedAt", async () => {
    const mockUser = { id: "user_done", email: "done@voxflow.vn", name: "Done User" };
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: {
        user: mockUser,
        session: { id: "sess_done", userId: "user_done" },
      },
      error: null,
    });
    vi.mocked(trpcClient.profile.get.query).mockResolvedValueOnce({
      userId: "user_done",
      targetBand: 7.0,
      examDate: "2029-10-10",
      onboardedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await requireOnboarded();
    expect(result.onboarded).toBe(true);
    expect(result.session.data?.user?.id).toBe("user_done");
  });

  it("memoizes positive onboarded status and skips second profile.get query", async () => {
    const mockUser = { id: "user_cached", email: "cached@voxflow.vn", name: "Cached User" };
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: {
        user: mockUser,
        session: { id: "sess_cached", userId: "user_cached" },
      },
      error: null,
    });
    vi.mocked(trpcClient.profile.get.query).mockResolvedValueOnce({
      userId: "user_cached",
      targetBand: 7.5,
      examDate: null,
      onboardedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    // First call: queries profile.get
    const firstResult = await requireOnboarded();
    expect(firstResult.onboarded).toBe(true);
    expect(trpcClient.profile.get.query).toHaveBeenCalledTimes(1);

    // Second call: hits in-memory cache, no second profile.get query
    const secondResult = await requireOnboarded();
    expect(secondResult.onboarded).toBe(true);
    expect(trpcClient.profile.get.query).toHaveBeenCalledTimes(1);
  });

  it("fails open when profile query fails unexpectedly, allowing user through", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(authClient.getSession).mockResolvedValueOnce({
      data: {
        user: { id: "user_err", email: "err@voxflow.vn", name: "Error User" },
        session: { id: "sess_err", userId: "user_err" },
      },
      error: null,
    });
    vi.mocked(trpcClient.profile.get.query).mockRejectedValueOnce(
      new Error("D1 connection lost"),
    );

    const result = await requireOnboarded();
    expect(result.session.data?.user?.id).toBe("user_err");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("requireOnboarded: failed to fetch profile"),
      expect.any(Error),
    );
    consoleWarnSpy.mockRestore();
  });
});
