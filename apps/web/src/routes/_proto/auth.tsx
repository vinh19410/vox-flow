import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/features/auth/auth-screen";

export const Route = createFileRoute("/_proto/auth")({
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
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <AuthScreen search={search} />;
}
