import { createFileRoute } from "@tanstack/react-router";

import { SelectSetupScreen } from "@/features/select/select-setup-screen";

export const Route = createFileRoute("/_proto/app/select_/setup")({
  component: SelectSetupScreen,
});
