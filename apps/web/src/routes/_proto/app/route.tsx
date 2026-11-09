import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/layouts/app-shell";
import { requireOnboarded } from "@/lib/auth-guard";

export const Route = createFileRoute("/_proto/app")({
  beforeLoad: ({ location }) => requireOnboarded(location.href),
  component: ProtoAppLayout,
});

function ProtoAppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
