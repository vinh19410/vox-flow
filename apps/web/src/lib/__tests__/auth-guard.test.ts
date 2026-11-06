import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

import { authClient } from "@/lib/auth-client";
import { requireSession } from "@/lib/auth-guard";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(),
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
