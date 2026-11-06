import { isRedirect } from "@tanstack/react-router";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getSessionSpy = vi.fn();
const profileGetSpy = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: () => getSessionSpy(),
  },
}));

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    profile: {
      get: {
        query: () => profileGetSpy(),
      },
    },
  },
}));

import { useProfileHydration } from "@/features/app-state/use-profile-hydration";
import { Route as OnboardingRoute } from "@/routes/_proto/onboarding";

describe("_proto/onboarding route beforeLoad", () => {
  const beforeLoad = OnboardingRoute.options.beforeLoad;

  it("throws redirect to /auth when no active session exists", async () => {
    getSessionSpy.mockResolvedValueOnce({ data: null });

    if (!beforeLoad) throw new Error("beforeLoad is undefined");

    try {
      await beforeLoad({ location: { href: "/_proto/onboarding" } } as never);
      expect.fail("Expected beforeLoad to throw redirect");
    } catch (err: unknown) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/auth");
      }
    }
  });

  it("throws redirect to /app/dashboard when user has already completed onboarding", async () => {
    getSessionSpy.mockResolvedValueOnce({
      data: { user: { id: "usr_completed", name: "Completed User" } },
    });
    profileGetSpy.mockResolvedValueOnce({
      targetBand: 7.0,
      examDate: "2029-12-31",
      onboardedAt: 1730000000000,
    });

    if (!beforeLoad) throw new Error("beforeLoad is undefined");

    try {
      await beforeLoad({ location: { href: "/_proto/onboarding" } } as never);
      expect.fail("Expected beforeLoad to throw redirect");
    } catch (err: unknown) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe("/app/dashboard");
      }
    }
  });

  it("allows access to onboarding when user has session but has not completed onboarding", async () => {
    getSessionSpy.mockResolvedValueOnce({
      data: { user: { id: "usr_new", name: "New User" } },
    });
    profileGetSpy.mockResolvedValueOnce(null);

    if (!beforeLoad) throw new Error("beforeLoad is undefined");

    await expect(
      beforeLoad({ location: { href: "/_proto/onboarding" } } as never),
    ).resolves.not.toThrow();
  });
});

describe("useProfileHydration hook", () => {
  it("hydrates profile when session transitions from null to an active user, and handles re-login", async () => {
    const setSpy = vi.fn();
    profileGetSpy.mockResolvedValue({
      targetBand: 8.0,
      examDate: "2029-10-10",
      onboardedAt: 1730000000000,
    });

    const { rerender } = renderHook(
      ({ uid }: { uid: string | null }) => useProfileHydration(uid, setSpy),
      { initialProps: { uid: null as string | null } },
    );

    expect(profileGetSpy).not.toHaveBeenCalled();

    // User logs in
    rerender({ uid: "usr_alice" });

    await waitFor(() => {
      expect(profileGetSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith({
        target: 8.0,
        examDate: "2029-10-10",
      });
    });

    // Same user re-renders (should not re-fetch)
    rerender({ uid: "usr_alice" });
    expect(profileGetSpy).toHaveBeenCalledTimes(1);

    // User logs out, then Bob logs in
    profileGetSpy.mockResolvedValueOnce({
      targetBand: 6.5,
      examDate: null,
      onboardedAt: 1730000000000,
    });
    rerender({ uid: null });
    rerender({ uid: "usr_bob" });

    await waitFor(() => {
      expect(profileGetSpy).toHaveBeenCalledTimes(2);
      expect(setSpy).toHaveBeenCalledWith({
        target: 6.5,
        examDate: null,
      });
    });
  });
});
