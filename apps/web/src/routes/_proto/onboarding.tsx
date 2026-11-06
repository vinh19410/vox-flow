import { createFileRoute } from "@tanstack/react-router";

import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/_proto/onboarding")({
  beforeLoad: ({ location }) => requireSession(location.href),
  component: OnboardingScreen,
});
