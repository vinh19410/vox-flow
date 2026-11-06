import { createFileRoute } from "@tanstack/react-router";

import { ScoringScreen } from "@/features/scoring/scoring-screen";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/_proto/scoring")({
  beforeLoad: ({ location }) => requireSession(location.href),
  component: ScoringScreen,
});
