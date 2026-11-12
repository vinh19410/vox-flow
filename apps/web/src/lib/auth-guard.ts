import { isRedirect, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

/**
 * In-memory cache tracking user IDs known to have completed onboarding.
 * Avoids repeated network queries to profile.get across sidebar navigations in /app/*.
 */
const onboardedUserCache = new Set<string>();

export function clearOnboardedUserCache() {
  onboardedUserCache.clear();
}

export function markUserOnboarded(userId: string) {
  onboardedUserCache.add(userId);
}

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

/**
 * Route guard enforcing both an active session and completed onboarding.
 * - Redirects to /auth if no session.
 * - Redirects to /onboarding if profile.onboardedAt is null or missing.
 * - Fails open on unexpected network/server errors when querying profile.
 */
export async function requireOnboarded(redirectPath?: string) {
  const { session } = await requireSession(redirectPath);
  const userId = session.data?.user?.id;

  if (userId && onboardedUserCache.has(userId)) {
    return { session, onboarded: true };
  }

  try {
    if (trpcClient?.profile?.get?.query) {
      const profile = await trpcClient.profile.get.query();
      if (!profile?.onboardedAt) {
        throw redirect({
          to: "/onboarding",
        });
      }
      if (userId) {
        onboardedUserCache.add(userId);
      }
      return { session, profile, onboarded: true };
    }
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }
    console.warn("requireOnboarded: failed to fetch profile, failing open", err);
  }

  return { session };
}

/**
 * Route guard for /auth that redirects already-onboarded users away from the
 * sign-in screen while allowing unauthenticated or un-onboarded users (or
 * unexpected profile fetch errors) to remain on /auth.
 */
export async function redirectIfOnboarded(
  redirectTo: string = "/app/dashboard",
): Promise<void> {
  const session = await authClient.getSession?.()?.catch(() => null);
  const userId = session?.data?.user?.id;
  if (!session?.data?.user) {
    return;
  }

  if (userId && onboardedUserCache.has(userId)) {
    throw redirect({ to: redirectTo });
  }

  try {
    if (trpcClient?.profile?.get?.query) {
      const profile = await trpcClient.profile.get.query();
      if (profile?.onboardedAt) {
        if (userId) {
          onboardedUserCache.add(userId);
        }
        throw redirect({ to: redirectTo });
      }
    }
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }
  }
}
