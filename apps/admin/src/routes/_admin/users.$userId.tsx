import { createFileRoute } from "@tanstack/react-router";

import { UserDetailScreen } from "@/features/users/user-detail-screen";

export const Route = createFileRoute("/_admin/users/$userId")({
  component: UserDetailRoute,
});

function UserDetailRoute() {
  const { userId } = Route.useParams();
  return <UserDetailScreen userId={userId} />;
}
