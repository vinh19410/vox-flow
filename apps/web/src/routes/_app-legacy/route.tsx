import { Outlet, createFileRoute } from "@tanstack/react-router";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

export const Route = createFileRoute("/_app-legacy")({
  component: AppLegacyLayout,
});

function AppLegacyLayout() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <div className="grid h-svh grid-rows-[auto_1fr]">
        <Header />
        <Outlet />
      </div>
    </ThemeProvider>
  );
}
