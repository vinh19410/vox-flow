# Plan: Admin App (`apps/admin`) — Issue #170

- **Status:** Completed
- **Branch:** `vinh19410/Admin-Page` → PR to `dev`
- **Issue:** [#170](https://github.com/vinh19410/vox-flow/issues/170)

## Scope & Done Means
1. `apps/admin` builds and `check-types` passes; unified Admin Shell, Better Auth login + `ADMIN_EMAILS` guard, and 4 modules: Users (profile, D-13 subscription status, `detail_credit`, `payment_order` history + manual `grantPlan` / `adjustQuota` with audit), Forecast (upgraded with search, Part filter, dynamic quarters), Payments, Disputes.
2. Old `/admin/*` routes, screens, and admin tests in `apps/web` moved to `apps/admin` and removed from `apps/web`; `routeTree.gen.ts` & `route-guards.test.ts` updated cleanly.
3. `packages/db` adds `admin_user_action` schema and local Drizzle migration via `pnpm --filter @vox-flow/db db:generate` (not applied to remote D1).
4. `packages/api` adds `adminUsers` tRPC router (`adminProcedure`) with unit/integration tests covering `list`, `detail`, D-13 `grantPlan`, and `adjustQuota`.
5. `apps/server` & `packages/auth` support multi-origin `CORS_ORIGIN` & `trustedOrigins` with tests; `packages/infra/alchemy.run.ts` defines `admin` Vite website target (dev port `3002`, domain `admin.vox.vinhtran.io.vn`).
6. Full `pnpm check-types`, targeted test suites, and `check:no-mock` pass after the final edit; isolated review clean; POT posted to #170 and PR opened to `dev`.

## Execution Phases
- **Wave 1 (Parallel):**
  - Phase 1A (`packages/db`): Add `admin_user_action` schema + run `db:generate`.
  - Phase 1B (`packages/auth`, `apps/server`, `packages/infra`): Multi-origin CORS + `trustedOrigins` + `alchemy.run.ts` `admin` target + CORS tests.
  - Phase 1C (`packages/ui`, `apps/web` DS re-exports): Move shared `ds/` primitives & `prototype-theme.css` into `@vox-flow/ui` with thin re-exports in `apps/web`.
- **Wave 2 (Sequential / Parallel after Wave 1):**
  - Phase 2A (`packages/api`): Implement `adminUsers` router (`list`, `detail`, `grantPlan`, `adjustQuota`) + tests.
  - Phase 2B (`apps/admin`, `apps/web`): Scaffold `apps/admin` (port `3002`), Admin Shell, `/login`, `/users`, `/users/$userId`, migrated & upgraded `/forecast`, `/payments`, `/disputes`, tests + `check:no-mock`; remove `/admin/*` from `apps/web` and regenerate `routeTree.gen.ts`.
- **Wave 3 (Verification & Review):**
  - Isolated `code-reviewer` subagent review → fix any findings → re-review until clean.
  - Orchestrator full verification (`pnpm check-types`, tests, builds, `check:no-mock`).
  - Commit & push via `ak-git` / git, post POT on `#170`, open PR to `dev`, update issue label to `done`.
