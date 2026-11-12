import { isRedirect } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionSpy = vi.fn();
const profileGetSpy = vi.fn();
const disputeCheckAdminSpy = vi.fn();
const forecastCheckAdminSpy = vi.fn();

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
    disputeAdmin: {
      checkAdmin: {
        query: () => disputeCheckAdminSpy(),
      },
    },
    forecastAdmin: {
      checkAdmin: {
        query: () => forecastCheckAdminSpy(),
      },
    },
  },
}));

import { clearOnboardedUserCache } from "@/lib/auth-guard";
import { Route as AppRoute } from "@/routes/_proto/app/route";
import { Route as ExamRoute } from "@/routes/_proto/exam";
import { Route as ScoringRoute } from "@/routes/_proto/scoring";
import { Route as AuthRoute } from "@/routes/_proto/auth";
import { Route as AdminDisputesRoute } from "@/routes/admin/disputes";
import { Route as AdminForecastRoute } from "@/routes/admin/forecast";

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

describe("/_proto/auth route", () => {
  beforeEach(() => {
    clearOnboardedUserCache();
    vi.clearAllMocks();
  });

  describe("validateSearch", () => {
    const validateSearch = AuthRoute.options.validateSearch as (
      search: Record<string, unknown>,
    ) => { error?: string; redirect?: string };

    it("normalizes string error and redirect search params", () => {
      expect(
        validateSearch({ error: "account_not_linked", redirect: "/app/history/att-1" }),
      ).toEqual({
        error: "account_not_linked",
        redirect: "/app/history/att-1",
      });
    });

    it("extracts the first string from an array error param", () => {
      expect(
        validateSearch({ error: ["oauth_error", "access_denied"], redirect: "/app/select" }),
      ).toEqual({
        error: "oauth_error",
        redirect: "/app/select",
      });
    });

    it("drops non-string error and redirect values", () => {
      expect(validateSearch({ error: 123, redirect: ["not-a-string"] })).toEqual({
        error: undefined,
        redirect: undefined,
      });
      expect(validateSearch({ error: [456], redirect: false })).toEqual({
        error: undefined,
        redirect: undefined,
      });
    });
  });

  describe("beforeLoad", () => {
    const beforeLoad = AuthRoute.options.beforeLoad;

    it("allows unauthenticated users to stay on /auth", async () => {
      getSessionSpy.mockResolvedValueOnce({ data: null });
      if (!beforeLoad) throw new Error("beforeLoad is undefined");

      await expect(beforeLoad({ search: {} } as never)).resolves.toBeUndefined();
      expect(profileGetSpy).not.toHaveBeenCalled();
    });

    it("allows authenticated but un-onboarded users to stay on /auth", async () => {
      getSessionSpy.mockResolvedValueOnce({
        data: { user: { id: "usr_new", name: "New User" } },
      });
      profileGetSpy.mockResolvedValueOnce({
        userId: "usr_new",
        targetBand: null,
        examDate: null,
        onboardedAt: null,
      });
      if (!beforeLoad) throw new Error("beforeLoad is undefined");

      await expect(beforeLoad({ search: {} } as never)).resolves.toBeUndefined();
    });

    it("redirects onboarded users to /app/dashboard when no redirect param is given", async () => {
      getSessionSpy.mockResolvedValueOnce({
        data: { user: { id: "usr_onboarded", name: "Onboarded User" } },
      });
      profileGetSpy.mockResolvedValueOnce({
        userId: "usr_onboarded",
        targetBand: 7.0,
        examDate: null,
        onboardedAt: 1730000000000,
      });
      if (!beforeLoad) throw new Error("beforeLoad is undefined");

      try {
        await beforeLoad({ search: {} } as never);
        expect.fail("Expected beforeLoad to throw redirect");
      } catch (err: unknown) {
        expect(isRedirect(err)).toBe(true);
        if (isRedirect(err)) {
          expect(err.options.to).toBe("/app/dashboard");
        }
      }
    });

    it("redirects onboarded users to a safe redirect deep link", async () => {
      getSessionSpy.mockResolvedValueOnce({
        data: { user: { id: "usr_onboarded_deep", name: "Onboarded User" } },
      });
      profileGetSpy.mockResolvedValueOnce({
        userId: "usr_onboarded_deep",
        targetBand: 7.0,
        examDate: null,
        onboardedAt: 1730000000000,
      });
      if (!beforeLoad) throw new Error("beforeLoad is undefined");

      try {
        await beforeLoad({ search: { redirect: "/app/history/att-123" } } as never);
        expect.fail("Expected beforeLoad to throw redirect");
      } catch (err: unknown) {
        expect(isRedirect(err)).toBe(true);
        if (isRedirect(err)) {
          expect(err.options.to).toBe("/app/history/att-123");
        }
      }
    });

    it("falls back to /app/dashboard when redirect param is malicious or points to auth routes", async () => {
      getSessionSpy.mockResolvedValue({
        data: { user: { id: "usr_mal", name: "Onboarded User" } },
      });
      profileGetSpy.mockResolvedValueOnce({
        userId: "usr_mal",
        targetBand: 7.0,
        examDate: null,
        onboardedAt: 1730000000000,
      });
      if (!beforeLoad) throw new Error("beforeLoad is undefined");

      for (const unsafeRedirect of ["//evil.com/hack", "/auth", "/login"]) {
        try {
          await beforeLoad({ search: { redirect: unsafeRedirect } } as never);
          expect.fail(`Expected beforeLoad to redirect for ${unsafeRedirect}`);
        } catch (err: unknown) {
          expect(isRedirect(err)).toBe(true);
          if (isRedirect(err)) {
            expect(err.options.to).toBe("/app/dashboard");
          }
        }
      }
    });

    it("does not redirect when search.error is present even if user is onboarded", async () => {
      getSessionSpy.mockResolvedValueOnce({
        data: { user: { id: "usr_err_stay", name: "Onboarded User" } },
      });
      profileGetSpy.mockResolvedValueOnce({
        userId: "usr_err_stay",
        targetBand: 7.0,
        examDate: null,
        onboardedAt: 1730000000000,
      });
      if (!beforeLoad) throw new Error("beforeLoad is undefined");

      await expect(
        beforeLoad({
          search: { error: "account_not_linked", redirect: "/app/history/att-123" },
        } as never),
      ).resolves.toBeUndefined();
      expect(getSessionSpy).not.toHaveBeenCalled();
    });
  });
});

describe("Admin routes beforeLoad", () => {
  beforeEach(() => {
    clearOnboardedUserCache();
    vi.clearAllMocks();
  });

  const adminRoutes = [
    {
      name: "/admin/disputes",
      route: AdminDisputesRoute,
      checkAdminSpy: disputeCheckAdminSpy,
    },
    {
      name: "/admin/forecast",
      route: AdminForecastRoute,
      checkAdminSpy: forecastCheckAdminSpy,
    },
  ];

  for (const { name, route, checkAdminSpy } of adminRoutes) {
    describe(`${name} guard`, () => {
      const beforeLoad = route.options.beforeLoad;

      it("redirects to /auth when no active session exists", async () => {
        getSessionSpy.mockResolvedValueOnce({ data: null });
        if (!beforeLoad) throw new Error("beforeLoad is undefined");

        try {
          await beforeLoad({} as never);
          expect.fail("Expected beforeLoad to throw redirect to /auth");
        } catch (err: unknown) {
          expect(isRedirect(err)).toBe(true);
          if (isRedirect(err)) {
            expect(err.options.to).toBe("/auth");
          }
        }
        expect(checkAdminSpy).not.toHaveBeenCalled();
      });

      it("redirects to /app/dashboard when checkAdmin throws FORBIDDEN", async () => {
        getSessionSpy.mockResolvedValueOnce({
          data: { user: { id: "usr_regular", name: "Regular User" } },
        });
        checkAdminSpy.mockRejectedValueOnce(new Error("FORBIDDEN"));
        if (!beforeLoad) throw new Error("beforeLoad is undefined");

        try {
          await beforeLoad({} as never);
          expect.fail("Expected beforeLoad to throw redirect to /app/dashboard");
        } catch (err: unknown) {
          expect(isRedirect(err)).toBe(true);
          if (isRedirect(err)) {
            expect(err.options.to).toBe("/app/dashboard");
          }
        }
      });

      it("redirects to /app/dashboard when checkAdmin fails with a network error", async () => {
        getSessionSpy.mockResolvedValueOnce({
          data: { user: { id: "usr_admin", name: "Admin User" } },
        });
        checkAdminSpy.mockRejectedValueOnce(new Error("Network error"));
        if (!beforeLoad) throw new Error("beforeLoad is undefined");

        try {
          await beforeLoad({} as never);
          expect.fail("Expected beforeLoad to throw redirect to /app/dashboard");
        } catch (err: unknown) {
          expect(isRedirect(err)).toBe(true);
          if (isRedirect(err)) {
            expect(err.options.to).toBe("/app/dashboard");
          }
        }
      });

      it("returns { session } when session is valid and checkAdmin succeeds", async () => {
        const sessionData = {
          user: { id: "usr_admin", name: "Admin User", email: "admin@voxflow.vn" },
          session: { id: "sess_admin", userId: "usr_admin" },
        };
        getSessionSpy.mockResolvedValueOnce({ data: sessionData });
        checkAdminSpy.mockResolvedValueOnce({ ok: true });
        if (!beforeLoad) throw new Error("beforeLoad is undefined");

        const result = await beforeLoad({} as never);
        expect(checkAdminSpy).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ session: sessionData });
      });
    });
  }
});
