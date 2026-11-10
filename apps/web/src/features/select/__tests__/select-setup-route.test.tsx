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
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { queryClient, trpc } from "@/utils/trpc";

const MOBILE_QUERY = "(max-width: 1023.98px)";

vi.mock("@/lib/auth-guard", () => ({
  requireOnboarded: vi.fn().mockResolvedValue({ onboarded: true }),
  requireSession: vi.fn().mockResolvedValue({ session: null }),
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

function makeRouter(initialLocation: string) {
  return createRouter({
    routeTree,
    context: { trpc, queryClient },
    history: createMemoryHistory({ initialEntries: [initialLocation] }),
  });
}

function mockMobileViewport(matches: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matches && query === MOBILE_QUERY,
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
    const router = makeRouter("/app/select/setup");
    render(<RouterProvider router={router} />);

    // Setup screen header shows the selected mode; the select screen's h1 is "Chọn bài thi".
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Full Test");
    expect(screen.getByRole("button", { name: "Chọn bài thi" })).toBeTruthy();
    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
  });

  it("mobile: tapping a mode card navigates to /app/select/setup and shows the setup screen", async () => {
    mockMobileViewport(true);
    const router = makeRouter("/app/select");
    render(<RouterProvider router={router} />);

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });

    fireEvent.click(screen.getByRole("button", { name: /Part 2 Cue card/ }));

    const heading = await screen.findByRole("heading", { level: 1, name: "Part 2" });
    expect(heading.textContent).toBe("Part 2");
    expect(router.state.location.pathname).toBe("/app/select/setup");
  });

  it("desktop: tapping a mode card keeps the user on /app/select", async () => {
    // Default matchMedia stub resolves matches: false (desktop).
    const router = makeRouter("/app/select");
    render(<RouterProvider router={router} />);

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });

    fireEvent.click(screen.getByRole("button", { name: /Part 2 Cue card/ }));

    await screen.findByRole("heading", { level: 1, name: "Chọn bài thi" });
    expect(router.state.location.pathname).toBe("/app/select");
  });
});
