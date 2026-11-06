import { redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

/**
 * Route guard enforcing an active Better Auth session.
 * Throws a TanStack Router redirect to /auth if the session is absent or invalid.
 */
export async function requireSession(redirectPath?: string) {
  const session = await authClient.getSession().catch(() => null);
  if (!session?.data) {
    throw redirect({
      to: "/auth",
      search: redirectPath ? { redirect: redirectPath } : undefined,
    });
  }
  return { session };
}
