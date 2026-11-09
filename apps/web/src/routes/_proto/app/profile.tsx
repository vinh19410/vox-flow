import { createFileRoute } from "@tanstack/react-router";

import { ProfileScreen } from "@/features/profile/profile-screen";

export const Route = createFileRoute("/_proto/app/profile")({
  component: ProfileScreen,
});
