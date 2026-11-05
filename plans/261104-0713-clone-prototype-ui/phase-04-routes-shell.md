# Phase 4 — Routes and app shell

## Objective
Replace the screen switcher with file routes and extract the sidebar/bottom-nav shell.

## Files
- Create: `layouts/app-shell.tsx`, `layouts/nav-items.ts`, `layouts/sidebar.tsx`, `layouts/bottom-nav.tsx`, `layouts/user-card.tsx`, `layouts/screen-map.tsx` (DEV only)
- Create routes: `_proto/index.tsx` (/), `_proto/auth.tsx`, `_proto/onboarding.tsx`, `_proto/exam.tsx`, `_proto/scoring.tsx`, `_proto/app/route.tsx` (shell layout), `_proto/app/{dashboard,select,forecast,history,billing,privacy}.tsx`, `_proto/app/history.$attemptId.tsx` (results)

## Steps
1. Port `Shell.tsx` into `app-shell` + `sidebar` + `bottom-nav` + `user-card`; `NAV` becomes data with `to` paths, active state via `useRouterState` / `<Link activeProps>`.
2. Prototype `go('results')` after scoring navigates to `/app/history/$attemptId` (latest attempt id); shell highlights "Lịch sử".
3. `screen-map.tsx` keeps the S01–S25 jump list, now links to routes, mounted in `_proto` layout when `import.meta.env.DEV`.
4. Route files are ≤15 lines: `createFileRoute` + render the feature screen (stubs until phase 5).
5. Regenerate `routeTree.gen.ts` via dev server / build.

## Validation
Typed `<Link to>` compile; each route renders its stub; shell hidden on landing/auth/onboarding/exam/scoring as in prototype (`inShell` list).
