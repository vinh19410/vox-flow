import { createFileRoute } from "@tanstack/react-router";

import { LandingScreen } from "@/features/landing/landing-screen";

export const Route = createFileRoute("/_proto/")({
  component: LandingScreen,
});
