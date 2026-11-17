import { isRedirect, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export interface AdminSessionData {
  user: AdminSessionUser;
  session: {
    id: string;
    userId: string;
  };
}

export type AdminAccessResult =
  | { session: AdminSessionData; isAdmin: true }
  | { session: AdminSessionData; isAdmin: false };

/**
 * Returns the redirect path only when it is a same-origin app path that does
 * not loop back to login/auth screens; otherwise null (open-redirect guard).
 */
export function getSafeRedirect(target: string | undefined): string | null {
  if (
    target &&
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.startsWith("/\\") &&
    !target.startsWith("/login") &&
    !target.startsWith("/auth")
  ) {
    return target;
  }
  return null;
}

function getTrpcErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const record = err as {
    data?: { code?: unknown };
    shape?: { data?: { code?: unknown } };
    code?: unknown;
  };
  if (typeof record.data?.code === "string") return record.data.code;
  if (typeof record.shape?.data?.code === "string") return record.shape.data.code;
  if (typeof record.code === "string") return record.code;
  return undefined;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return String(err);
}

function isUnauthorizedError(err: unknown): boolean {
  const code = getTrpcErrorCode(err);
  if (code === "UNAUTHORIZED") return true;
  const msg = getErrorMessage(err);
  return msg.includes("UNAUTHORIZED") || msg.includes("Authentication required");
}

function isForbiddenError(err: unknown): boolean {
  const code = getTrpcErrorCode(err);
  if (code === "FORBIDDEN") return true;
  const msg = getErrorMessage(err);
  return msg.includes("FORBIDDEN") || msg.includes("Admin access required");
}

function buildRouterRedirect(redirectTo: string) {
  return redirectTo.includes("?") || redirectTo.includes("#")
    ? redirect({ href: redirectTo })
    : redirect({ to: redirectTo });
}

/**
 * Route guard for `/_admin/*` routes.
 * - Redirects to `/login` when session is missing or tRPC returns UNAUTHORIZED.
 * - Returns `{ session, isAdmin: false }` when signed in as a non-admin (FORBIDDEN)
 *   so the layout can render an Access Denied screen with sign-out instead of looping.
 * - Returns `{ session, isAdmin: true }` when admin access is verified.
 */
export async function requireAdminAccess(redirectPath?: string): Promise<AdminAccessResult> {
  const safeRedirect = getSafeRedirect(redirectPath);
  const session = await authClient.getSession().catch(() => null);
  const sessionData = session?.data as AdminSessionData | null | undefined;

  if (!sessionData?.user) {
    throw redirect({
      to: "/login",
      search: safeRedirect ? { redirect: safeRedirect } : undefined,
    });
  }

  try {
    const result = await trpcClient.adminUsers.checkAdmin.query();
    if (result && result.isAdmin === false) {
      return { session: sessionData, isAdmin: false };
    }
    return { session: sessionData, isAdmin: true };
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }
    if (isUnauthorizedError(err)) {
      throw redirect({
        to: "/login",
        search: safeRedirect ? { redirect: safeRedirect } : undefined,
      });
    }
    if (isForbiddenError(err)) {
      return { session: sessionData, isAdmin: false };
    }
    throw err;
  }
}

/**
 * Route guard for `/login` that redirects already-authenticated admins away
 * from the sign-in screen while allowing unauthenticated or non-admin users to
 * remain on `/login` without creating a redirect loop.
 */
export async function redirectIfAuthenticated(redirectTo: string = "/users"): Promise<void> {
  const session = await authClient.getSession?.()?.catch(() => null);
  const sessionData = session?.data as AdminSessionData | null | undefined;
  if (!sessionData?.user) {
    return;
  }

  try {
    const result = await trpcClient.adminUsers.checkAdmin.query();
    if (result?.isAdmin) {
      const safeTarget = getSafeRedirect(redirectTo) ?? "/users";
      throw buildRouterRedirect(safeTarget);
    }
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }
    // Stay on /login on FORBIDDEN, UNAUTHORIZED, or transient check failures.
  }
}
