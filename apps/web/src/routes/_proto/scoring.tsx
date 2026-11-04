import { createFileRoute } from "@tanstack/react-router";

import { ScoringScreen } from "@/features/scoring/scoring-screen";

export const Route = createFileRoute("/_proto/scoring")({
  component: ScoringScreen,
});
