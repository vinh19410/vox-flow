import { createFileRoute } from "@tanstack/react-router";

import { PaymentsScreen } from "@/features/admin/payments-screen";

export const Route = createFileRoute("/_admin/payments")({
  component: PaymentsAdminRoute,
});

function PaymentsAdminRoute() {
  return <PaymentsScreen />;
}
