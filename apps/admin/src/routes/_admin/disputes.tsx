import { createFileRoute } from "@tanstack/react-router";

import { DisputesScreen } from "@/features/admin/disputes-screen";

export const Route = createFileRoute("/_admin/disputes")({
  component: DisputesAdminRoute,
});

function DisputesAdminRoute() {
  return <DisputesScreen />;
}
