import { createFileRoute } from "@tanstack/react-router";

import { HistoryScreen } from "@/features/history/history-screen";

export const Route = createFileRoute("/_proto/app/history/")({
  component: HistoryScreen,
});
