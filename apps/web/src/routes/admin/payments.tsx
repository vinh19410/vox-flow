import { createFileRoute, redirect } from "@tanstack/react-router";

import { PaymentsScreen } from "@/features/admin/payments-screen";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/admin/payments")({
  beforeLoad: async () => {
    const session = await authClient.getSession().catch(() => null);
    if (!session?.data?.user) {
      throw redirect({
        to: "/auth",
      });
    }

    try {
      if (trpcClient?.adminBilling?.checkAdmin?.query) {
        await trpcClient.adminBilling.checkAdmin.query();
      }
    } catch {
      throw redirect({
        to: "/app/dashboard",
      });
    }

    return { session: session.data };
  },
  component: PaymentsScreen,
});
