import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/layouts/app-shell";

export const Route = createFileRoute("/_proto/app")({
  component: ProtoAppLayout,
});

function ProtoAppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
