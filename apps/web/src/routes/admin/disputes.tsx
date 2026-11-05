import { createFileRoute, redirect } from "@tanstack/react-router";

import { DisputesScreen } from "@/features/admin/disputes-screen";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/admin/disputes")({
  beforeLoad: async () => {
    const session = await authClient.getSession().catch(() => null);
    if (!session?.data?.user) {
      throw redirect({
        to: "/auth",
      });
    }

    try {
      if (trpcClient?.disputeAdmin?.checkAdmin?.query) {
        await trpcClient.disputeAdmin.checkAdmin.query();
      }
    } catch {
      throw redirect({
        to: "/app/dashboard",
      });
    }

    return { session: session.data };
  },
  component: DisputesScreen,
});
