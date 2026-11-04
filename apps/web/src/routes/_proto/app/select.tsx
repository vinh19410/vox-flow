import { createFileRoute } from "@tanstack/react-router";

import { SelectScreen } from "@/features/select/select-screen";

export const Route = createFileRoute("/_proto/app/select")({
  component: SelectScreen,
});
