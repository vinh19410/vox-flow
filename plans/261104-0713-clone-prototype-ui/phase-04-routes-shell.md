---
phase: 4
title: "Routes, router provider bridge + app shell"
status: completed
priority: P1
effort: "2h"
dependencies: [2, 3]
---

# Phase 4: TanStack Router File Routes, `AppStateProvider` Bridge, and App Shell

<!-- Updated: Validation Session 1 - Added exact TanStack Router pathless _proto + /app shell hierarchy, DEV-only ScreenMap, TDD route-shell test, and Failure Protocol -->
<!-- Updated: Red Team Session 1 - Unified history.index.tsx across all manifests, moved typed router bridge (routes.ts + app-state-provider.tsx) into Phase 4, closed paywallOpen on pathname change, and added token grep + ! history.tsx checks -->

## Goal
Create all 12 `_proto` TanStack Router file routes (using `history.index.tsx` + `history.$attemptId.tsx`), wire `AppStateProvider` with typed TanStack Router navigation (`go`, `goResult` with `{ replace }`, and automatic `paywallOpen` reset on URL change), and build the responsive `AppShell` + DEV-only `ScreenMap`.

## Files to Create / Modify
- Create: `apps/web/src/features/app-state/routes.ts` (`screenToRoute`)
- Create: `apps/web/src/features/app-state/app-state-provider.tsx` (`AppStateProvider`, `useApp`)
- Create: `apps/web/src/layouts/nav-items.ts` (`NAV_ITEMS`, `resolveActiveNav`)
- Create: `apps/web/src/layouts/user-card.tsx` (`UserCard`)
- Create: `apps/web/src/layouts/sidebar.tsx` (`Sidebar`)
- Create: `apps/web/src/layouts/bottom-nav.tsx` (`BottomNav`)
- Create: `apps/web/src/layouts/app-shell.tsx` (`AppShell`)
- Create: `apps/web/src/layouts/screen-map.tsx` (`ScreenMap`, `SCREEN_MAP`)
- Modify: `apps/web/src/routes/_proto/route.tsx` (mount `AppStateProvider` + DEV `ScreenMap`)
- Create: `apps/web/src/routes/_proto/auth.tsx`
- Create: `apps/web/src/routes/_proto/onboarding.tsx`
- Create: `apps/web/src/routes/_proto/exam.tsx`
- Create: `apps/web/src/routes/_proto/scoring.tsx`
- Create: `apps/web/src/routes/_proto/app/route.tsx` (renders `<AppShell><Outlet /></AppShell>`)
- Create: `apps/web/src/routes/_proto/app/dashboard.tsx`
- Create: `apps/web/src/routes/_proto/app/select.tsx`
- Create: `apps/web/src/routes/_proto/app/forecast.tsx`
- Create: `apps/web/src/routes/_proto/app/history.index.tsx`
- Create: `apps/web/src/routes/_proto/app/history.$attemptId.tsx`
- Create: `apps/web/src/routes/_proto/app/billing.tsx`
- Create: `apps/web/src/routes/_proto/app/privacy.tsx`
- Create: `apps/web/src/layouts/__tests__/app-shell.test.tsx`

## Tasks & Steps

### Task 4.1 — Create all 12 `_proto` route files and build `AppStateProvider` router bridge
- [x] Scaffold thin `_proto` route files (`history.index.tsx` + `history.$attemptId.tsx`) and connect `AppStateProvider` to typed `useNavigate()` / `useLocation()`.
- **Goal**: `routeTree.gen.ts` contains all 12 prototype routes without any parent-layout collision on `/app/history`, `useApp()` exposes `{ s, set, go, goResult, openPaywall, closePaywall, paywallOpen, toast, lastUnpersistedAttempt, setLastUnpersistedAttempt, pendingSubmission, setPendingSubmission }`, and `paywallOpen` automatically resets to `false` whenever `location.pathname` changes.
- **Target files and symbols**:
  - `apps/web/src/routes/_proto/{auth,onboarding,exam,scoring}.tsx`
  - `apps/web/src/routes/_proto/app/{route,dashboard,select,forecast,history.index,history.$attemptId,billing,privacy}.tsx`
  - `apps/web/src/features/app-state/routes.ts` (`screenToRoute`)
  - `apps/web/src/features/app-state/app-state-provider.tsx` (`AppStateProvider`, `useApp`)
- **Steps**:
  1. Create thin route stub files (`≤20` lines each) for all `_proto` routes, strictly using `apps/web/src/routes/_proto/app/history.index.tsx` (`createFileRoute("/_proto/app/history/")`) and `apps/web/src/routes/_proto/app/history.$attemptId.tsx` (`createFileRoute("/_proto/app/history/$attemptId")`) — NEVER create `history.tsx`.
  2. Implement `screenToRoute(screen, attemptId = "latest")` and `AppStateProvider` wrapping `useAppStateStore()`, delegating `go(screen, opts?: { replace?: boolean })` and `goResult(attemptId, opts?: { replace?: boolean })` to TanStack Router `useNavigate()` (relying on router `scrollRestoration: true` in `main.tsx`), and closing `paywallOpen` in `useEffect` on `useLocation({ select: (l) => l.pathname })`.
- **Success criteria**: Route tree generates all 12 prototype URLs and `AppStateProvider` compiles with zero `as any` casts.
- **Verify**: no verification needed yet (verified with Task 4.2 TDD test & `check-types`).

### Task 4.2 — Build `AppShell` (`nav-items`, `user-card`, `sidebar`, `bottom-nav`), `ScreenMap`, and TDD tests
- [x] Implement `AppShell` + DEV `ScreenMap`, mount in `_proto/route.tsx` and `_proto/app/route.tsx`, and verify with TDD.
- **Goal**: Desktop sidebar (`lg:flex w-64`), mobile sticky header + 6-column bottom nav (`lg:hidden`), user avatar (`bg-brand-soft text-brand`), logout to `/`, active nav highlighting (`/app/history/$attemptId` highlights `"Lịch sử"`), and DEV-only `ScreenMap` (`S01`–`S25` linking `results` to `/app/history/latest`) match `Shell.tsx` and `App.tsx` 1:1.
- **Target files and symbols**:
  - `apps/web/src/layouts/{nav-items,user-card,sidebar,bottom-nav,app-shell,screen-map}.tsx` (`.ts` for `nav-items`)
  - `apps/web/src/routes/_proto/route.tsx`, `apps/web/src/routes/_proto/app/route.tsx`
  - `apps/web/src/layouts/__tests__/app-shell.test.tsx`
- **Steps**:
  1. Write TDD test `apps/web/src/layouts/__tests__/app-shell.test.tsx` asserting `resolveActiveNav("/app/dashboard") === "dashboard"`, `resolveActiveNav("/app/history") === "history"`, `resolveActiveNav("/app/history/a6") === "history"`, `resolveActiveNav("/app/billing") === "billing"`, `screenToRoute("results", "a6")` targets `/app/history/$attemptId` with `attemptId: "a6"`, and `SCREEN_MAP` contains all 12 entries (`S01`–`S25` including `S07b`).
  2. Run `pnpm --filter web test src/layouts/__tests__/app-shell.test.tsx` and confirm non-zero exit (TDD Red).
  3. Implement `nav-items.ts`, `user-card.tsx`, `sidebar.tsx`, `bottom-nav.tsx`, `app-shell.tsx`, and `screen-map.tsx` using TanStack Router `<Link>` / `useApp()`, replacing `accent*`→`brand*` and `muted`→`subtle`.
  4. Mount `AppStateProvider` + `{import.meta.env.DEV ? <ScreenMap /> : null}` in `routes/_proto/route.tsx`, and `<AppShell><Outlet /></AppShell>` in `routes/_proto/app/route.tsx`.
- **Success criteria**: `app-shell.test.tsx` passes, `check-types` exits 0, `history.tsx` does not exist, and zero `accent`/`muted` token leaks exist in `layouts/` or `routes/_proto/`.
- **Verify**: `pnpm --filter web test && pnpm --filter web check-types` exits 0; `! test -e apps/web/src/routes/_proto/app/history.tsx` exits 0; and `! grep -rnE '(bg|text|border|ring|outline|fill|stroke|from|to|via|decoration|caret|shadow)-(accent|muted)(-soft)?(\b|/)' apps/web/src/layouts apps/web/src/routes/_proto --exclude-dir=__tests__` exits 0 (TDD Green).

## Verification
- `pnpm --filter web test` exits 0.
- `pnpm --filter web check-types` exits 0.
- `! test -e apps/web/src/routes/_proto/app/history.tsx` exits 0.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
