import { createFileRoute } from "@tanstack/react-router";

import { UsersScreen } from "@/features/users/users-screen";

export const Route = createFileRoute("/_admin/users/")({
  component: UsersIndexRoute,
});

function UsersIndexRoute() {
  return <UsersScreen />;
}
