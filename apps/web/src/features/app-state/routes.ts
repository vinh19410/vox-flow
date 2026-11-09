import type { NavOptions, ProtoScreen } from "./types";

export type RouteTarget =
  | { to: string; params?: Record<string, string> }
  | string;

export const SCREEN_ROUTES: Record<ProtoScreen, RouteTarget> = {
  landing: "/",
  auth: "/auth",
  onboarding: "/onboarding",
  exam: "/exam",
  scoring: "/scoring",
  dashboard: "/app/dashboard",
  select: "/app/select",
  forecast: "/app/forecast",
  history: "/app/history",
  results: { to: "/app/history/$attemptId", params: {} },
  billing: "/app/billing",
  profile: "/app/profile",
  terms: "/terms",
};

export function screenToRoute(
  screen: ProtoScreen,
  attemptId: string = "latest",
): RouteTarget {
  if (screen !== "results") return SCREEN_ROUTES[screen];
  return {
    to: "/app/history/$attemptId",
    params: { attemptId },
  };
}

export function resolveRouteTarget(
  target: RouteTarget,
  opts?: NavOptions,
): { to: string; params?: Record<string, string>; replace?: boolean } {
  if (typeof target === "string") {
    return opts?.replace ? { to: target, replace: true } : { to: target };
  }
  return {
    to: target.to,
    params: target.params,
    ...(opts?.replace ? { replace: true } : {}),
  };
}
