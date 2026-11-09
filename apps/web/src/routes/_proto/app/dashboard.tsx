import { createFileRoute } from "@tanstack/react-router";

import { DashboardScreen } from "@/features/dashboard/dashboard-screen";

export const Route = createFileRoute("/_proto/app/dashboard")({
  component: DashboardScreen,
});
