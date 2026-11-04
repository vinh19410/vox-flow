import { createFileRoute } from "@tanstack/react-router";

import { PrivacyScreen } from "@/features/privacy/privacy-screen";

export const Route = createFileRoute("/_proto/app/privacy")({
  component: PrivacyScreen,
});
