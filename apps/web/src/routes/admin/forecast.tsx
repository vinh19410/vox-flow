import { createFileRoute, redirect } from "@tanstack/react-router";

import { ForecastAdminScreen } from "@/features/admin/forecast-admin-screen";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/admin/forecast")({
  beforeLoad: async () => {
    const session = await authClient.getSession().catch(() => null);
    if (!session?.data?.user) {
      throw redirect({
        to: "/auth",
      });
    }

    try {
      if (trpcClient?.forecastAdmin?.checkAdmin?.query) {
        await trpcClient.forecastAdmin.checkAdmin.query();
      }
    } catch {
      throw redirect({
        to: "/app/dashboard",
      });
    }

    return { session: session.data };
  },
  component: ForecastAdminScreen,
});
