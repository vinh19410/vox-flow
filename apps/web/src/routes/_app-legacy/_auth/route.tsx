import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app-legacy/_auth")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession().catch(() => null);
    if (!session?.data) {
      throw redirect({
        to: "/login",
      });
    }
    return { session };
  },
});

function AuthLayout() {
  return <Outlet />;
}
