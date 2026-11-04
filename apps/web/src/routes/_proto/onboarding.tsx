import { createFileRoute } from "@tanstack/react-router";

import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";

export const Route = createFileRoute("/_proto/onboarding")({
  component: OnboardingScreen,
});
