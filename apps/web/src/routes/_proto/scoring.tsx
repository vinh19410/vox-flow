import { createFileRoute } from "@tanstack/react-router";

import { ScoringScreen } from "@/features/scoring/scoring-screen";
import { requireOnboarded } from "@/lib/auth-guard";

export const Route = createFileRoute("/_proto/scoring")({
  beforeLoad: ({ location }) => requireOnboarded(location.href),
  component: ScoringScreen,
});
