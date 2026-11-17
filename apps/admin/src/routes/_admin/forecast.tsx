import { createFileRoute } from "@tanstack/react-router";

import { ForecastAdminScreen } from "@/features/admin/forecast-admin-screen";

export const Route = createFileRoute("/_admin/forecast")({
  component: ForecastAdminRoute,
});

function ForecastAdminRoute() {
  return <ForecastAdminScreen />;
}
