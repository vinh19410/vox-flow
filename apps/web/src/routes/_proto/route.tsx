import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

import { AppStateProvider } from "@/features/app-state/app-state-provider";
import { useApp } from "@/features/app-state/types";
import { PaywallModal } from "@/features/billing/components/paywall-modal";
import { ScreenMap } from "@/layouts/screen-map";

export const Route = createFileRoute("/_proto")({
  component: ProtoLayout,
});

function ProtoLayout() {
  useLayoutEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, []);

  return (
    <AppStateProvider>
      <ProtoShell />
    </AppStateProvider>
  );
}

/** Inside AppStateProvider so the global paywall can read the store. */
function ProtoShell() {
  const { paywallOpen, closePaywall } = useApp();

  return (
    <div className="proto-root isolate min-h-screen bg-paper text-ink">
      <Outlet />
      <PaywallModal open={paywallOpen} onClose={closePaywall} />
      {import.meta.env.DEV ? <ScreenMap /> : null}
    </div>
  );
}
