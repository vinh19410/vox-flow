import { createFileRoute } from "@tanstack/react-router";

import { BillingScreen } from "@/features/billing/billing-screen";

export const Route = createFileRoute("/_proto/app/billing")({
  component: BillingScreen,
});
