/**
 * Router-level integration tests for the mobile select-setup flow.
 *
 * The unit tests in select-setup-flow.test.tsx mock `go`, so they cannot catch
 * route-tree wiring bugs (e.g. the setup route accidentally nesting under
 * select.tsx, which has no <Outlet /> and would swallow the child route).
 * These tests render the real generated routeTree through a memory-history
 * router so the registered route structure itself is what gets verified.
 */
import { RouterProvider, createRouter, createMemoryHistory } from "@tanstack/react-router";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SELECT_MOBILE_QUERY } from "@/features/select/use-select-mobile-viewport";
import { routeTree } from "@/routeTree.gen";
import { queryClient, trpc } from "@/utils/trpc";

vi.mock("@/lib/auth-guard", () => ({
  requireOnboarded: vi.fn().mockResolvedValue({ onboarded: true }),
  requireSession: vi.fn().mockResolvedValue({ session: null }),
  redirectIfOnboarded: vi.fn().mockResolvedValue(undefined),
  markUserOnboarded: vi.fn(),
  clearOnboardedUserCache: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: { user: { id: "u-1", name: "Tester", email: "tester@example.dev" } },
      isPending: false,
      error: null,
    })),
    signOut: vi.fn(),
  },
}));

vi.mock("@/features/app-state/use-profile-hydration", () => ({
  useProfileHydration: vi.fn(),
}));

/**
 * Renders the app router at `initialLocation` once its route is fully loaded.
 * Route components are code-split, and the first test to reach a route pays
 * for transforming and importing its chunk; on a busy machine that alone
 * outlasts `findBy*`'s polling window. Loading first keeps those waits about
 * rendering, not module loading.
 */
async function renderRouterAt(initialLocation: string) {
  const router = createRouter({
    routeTree,
    context: { trpc, queryClient },
    history: createMemoryHistory({ initialEntries: [initialLocation] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

function mockMobileViewport(matches: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matches && query === SELECT_MOBILE_QUERY,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

beforeEach(() => {
  // AppStateProvider persists to sessionStorage (PROTO_STORAGE_KEY).
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Select setup route (router integration)", () => {
  it("deep-link /app/select/setup renders the setup screen, not the select screen", async () => {
    await renderRouterAt("/app/select/setup");

    // Setup screen header shows the selected mode; the select screen's h1 is "Chọn bài thi".
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Full Test");
    expect(screen.getByRole("button", { name: "Chọn bài thi" })).toBeTruthy();
    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
  });

  it("mobile: tapping a mode card navigates to /app/select/setup and shows the setup screen", async () => {
    mockMobileViewport(true);
    const router = await renderRouterAt("/app/select");
    // Load the destination's code-split chunk up front, for the same reason as above.
    await router.preloadRoute({ to: "/app/select/setup" });

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });

    for (const title of ["Full Test", "Part 1", "Part 2", "Part 3"]) {
      expect(screen.getByRole("button", { name: new RegExp(title) })).toBeTruthy();
    }
    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Part 2 Cue card/ }));

    const heading = await screen.findByRole("heading", { level: 1, name: "Part 2" });
    expect(heading.textContent).toBe("Part 2");
    expect(router.state.location.pathname).toBe("/app/select/setup");
    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Chọn bài thi" }));
    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });
    expect(router.state.location.pathname).toBe("/app/select");
    expect(screen.getByRole("button", { name: /Part 2 Cue card/ }).className).toContain("bg-ink");
    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();
  });

  it("mobile: browser history back/forward preserves mode highlight and hides inline setup on /app/select", async () => {
    mockMobileViewport(true);
    const router = await renderRouterAt("/app/select");
    await router.preloadRoute({ to: "/app/select/setup" });

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });
    fireEvent.click(screen.getByRole("button", { name: /Part 2 Cue card/ }));

    await screen.findByRole("heading", { level: 1, name: "Part 2" });
    expect(router.state.location.pathname).toBe("/app/select/setup");
    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();

    act(() => {
      router.history.back();
    });

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });
    expect(router.state.location.pathname).toBe("/app/select");
    expect(screen.getByRole("button", { name: /Part 2 Cue card/ }).className).toContain("bg-ink");
    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();

    act(() => {
      router.history.forward();
    });

    await screen.findByRole("heading", { level: 1, name: "Part 2" });
    expect(router.state.location.pathname).toBe("/app/select/setup");
    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ })).toBeTruthy();
  });

  it("desktop: tapping a mode card keeps the user on /app/select", async () => {
    mockMobileViewport(false);
    const router = await renderRouterAt("/app/select");

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });
    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
    expect(screen.getByText("Trước khi bắt đầu")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Part 2 Cue card/ }));

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });
    expect(router.state.location.pathname).toBe("/app/select");
    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
    expect(screen.getByText("Trước khi bắt đầu")).toBeTruthy();
  });
});
