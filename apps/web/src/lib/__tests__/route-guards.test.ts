import { isRedirect } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { clearOnboardedUserCache } from "@/lib/auth-guard";
import { Route as AppRoute } from "@/routes/_proto/app/route";
import { Route as ExamRoute } from "@/routes/_proto/exam";
import { Route as ScoringRoute } from "@/routes/_proto/scoring";

describe("Protected proto routes beforeLoad", () => {
  beforeEach(() => {
    clearOnboardedUserCache();
    vi.clearAllMocks();
  });

  const routes = [
    { name: "/_proto/app", route: AppRoute, path: "/_proto/app/dashboard" },
    { name: "/_proto/exam", route: ExamRoute, path: "/_proto/exam" },
    { name: "/_proto/scoring", route: ScoringRoute, path: "/_proto/scoring" },
  ];

  for (const { name, route, path } of routes) {
    describe(`${name} guard`, () => {
      const beforeLoad = route.options.beforeLoad;

      it("throws redirect to /auth when no active session exists", async () => {
        getSessionSpy.mockResolvedValueOnce({ data: null });
        if (!beforeLoad) throw new Error("beforeLoad is undefined");

        try {
          await beforeLoad({ location: { href: path } } as never);
          expect.fail("Expected beforeLoad to throw redirect");
        } catch (err: unknown) {
          expect(isRedirect(err)).toBe(true);
          if (isRedirect(err)) {
            expect(err.options.to).toBe("/auth");
          }
        }
      });

      it("throws redirect to /onboarding when user has not completed onboarding", async () => {
        getSessionSpy.mockResolvedValueOnce({
          data: { user: { id: "usr_unonboarded", name: "New Student" } },
        });
        profileGetSpy.mockResolvedValueOnce({
          userId: "usr_unonboarded",
          targetBand: null,
          examDate: null,
          onboardedAt: null,
        });

        if (!beforeLoad) throw new Error("beforeLoad is undefined");

        try {
          await beforeLoad({ location: { href: path } } as never);
          expect.fail("Expected beforeLoad to throw redirect");
        } catch (err: unknown) {
          expect(isRedirect(err)).toBe(true);
          if (isRedirect(err)) {
            expect(err.options.to).toBe("/onboarding");
          }
        }
      });

      it("allows access when user has completed onboarding", async () => {
        getSessionSpy.mockResolvedValueOnce({
          data: { user: { id: "usr_done", name: "Graduated Student" } },
        });
        profileGetSpy.mockResolvedValueOnce({
          userId: "usr_done",
          targetBand: 7.0,
          examDate: "2029-12-31",
          onboardedAt: 1730000000000,
        });

        if (!beforeLoad) throw new Error("beforeLoad is undefined");

        await expect(
          beforeLoad({ location: { href: path } } as never),
        ).resolves.not.toThrow();
      });
    });
  }
});
