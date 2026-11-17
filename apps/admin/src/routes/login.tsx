import { createFileRoute } from "@tanstack/react-router";

import { LoginScreen, getSafeRedirect } from "@/features/auth/login-screen";
import { redirectIfAuthenticated } from "@/lib/admin-guard";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { error?: string; redirect?: string } => {
    const rawError = search.error;
    const error =
      typeof rawError === "string"
        ? rawError
        : Array.isArray(rawError) && typeof rawError[0] === "string"
          ? rawError[0]
          : undefined;
    const rawRedirect = search.redirect;
    const redirect = typeof rawRedirect === "string" ? rawRedirect : undefined;
    return { error, redirect };
  },
  beforeLoad: async ({ search }) => {
    if (search?.error) return;
    await redirectIfAuthenticated(getSafeRedirect(search?.redirect) ?? "/users");
  },
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  const search = Route.useSearch();
  return <LoginScreen search={search} />;
}
