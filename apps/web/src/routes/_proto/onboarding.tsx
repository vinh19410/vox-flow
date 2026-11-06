import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";

import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/_proto/onboarding")({
  beforeLoad: async () => {
    const session = await authClient.getSession().catch(() => null);
    if (!session?.data?.user) {
      throw redirect({
        to: "/auth",
      });
    }

    try {
      if (trpcClient?.profile?.get?.query) {
        const profile = await trpcClient.profile.get.query().catch(() => null);
        if (profile?.onboardedAt) {
          throw redirect({
            to: "/app/dashboard",
          });
        }
      }
    } catch (err) {
      if (isRedirect(err)) {
        throw err;
      }
    }
  },
  component: OnboardingScreen,
});
