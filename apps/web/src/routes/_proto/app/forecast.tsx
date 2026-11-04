import { createFileRoute } from "@tanstack/react-router";

import { ForecastScreen } from "@/features/forecast/forecast-screen";

export const Route = createFileRoute("/_proto/app/forecast")({
  component: ForecastScreen,
});
