import { createFileRoute } from "@tanstack/react-router";

import { ResultsScreen } from "@/features/results/results-screen";

export const Route = createFileRoute("/_proto/app/history/$attemptId")({
  component: ProtoResults,
});

function ProtoResults() {
  const { attemptId } = Route.useParams();

  return <ResultsScreen key={attemptId} attemptId={attemptId} />;
}
