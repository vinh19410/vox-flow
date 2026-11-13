---
phase: 1
title: "Phase 1: TDD Clock Injection & Deterministic Tests"
status: done
priority: P1
effort: 1h
dependencies: []
---

# Phase 1: TDD Clock Injection & Deterministic Tests

## Goal
Make `disputeAdmin.queue`, `disputeAdmin.resolve`, and `disputeAdmin.metrics` respect `Context.now` via a validated `resolveNow(ctx.now)` helper (`ctx.now?.() ?? new Date()`) and make `packages/api/src/routers/dispute-admin.test.ts` fully deterministic across any calendar date, verified via TDD Red -> Green -> Regression gates.

## Files to Create / Modify
- Modify: `packages/api/src/routers/dispute-admin.test.ts` (extract module-scope fixtures + `createCallerWithDb`, update `createCaller`, pin clocks in existing `queue`/`resolve`/`metrics` tests, tighten assertions, add top-level `describe` block with per-`it` `createTestDb()`)
- Modify: `packages/api/src/routers/dispute-admin.ts` (add `resolveNow` helper and wire it in `queue`, `resolve`, and `metrics`)

## Scope Guardrails
- Do NOT modify `packages/api/src/routers/dispute.ts` (out of scope for #139).
- Do NOT change existing SLA comparison operators in `packages/api/src/routers/dispute-admin.ts`:
  - `isNearOverdue`: `Boolean(r.warnedAt) || r.dueAt.getTime() - now.getTime() < 12 * 3600 * 1000` (and same expression in `metrics.nearOverdueCount`)
  - `isOverdue`: `r.dueAt.getTime() < now.getTime()`
  - `onTimeResolvedCount`: `resolvedTime <= dueTime`
  - `weeklyCount`: `d.createdAt.getTime() >= oneWeekAgo.getTime()` where `oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000)`
- <!-- Updated: Red-Team (Assumption Finding 1) --> Each `it(...)` in the new boundary `describe` block MUST create and dispose its own `createTestDb()` (in `try/finally` or `beforeEach`/`afterEach`), pass explicit `createdAt` on all seeded `scoreDispute` rows, and assign a distinct `attemptId` per active dispute (due to `score_dispute_active_attempt_unique`).
- Do NOT use `vi.useFakeTimers()`; use `Context.now` defined at `packages/api/src/context.ts:36`.

## Tasks & Steps

### Tests Before (Red Phase)

#### Task 1.1 — Extract `createCallerWithDb`, pin clocks in existing tests, and add isolated per-test boundary suite
- **Goal:** Establish failing TDD tests proving `disputeAdmin` currently ignores `ctx.now` and fails deterministic assertions (`weeklyCount`, `onTimeRate`, `resolvedAt`, `isOverdue`, and boundary cutoffs).
- **Target files and symbols:**
  - `packages/api/src/routers/dispute-admin.test.ts`:
    - Module-level shared constants (`adminUser`, `studentUser1`, `studentUser2`, `mockEnv`) and helper `createCallerWithDb`
    - `createCaller` inside `describe("dispute-admin router")` (lines 57-86)
    - `queue sorts disputes by dueAt ascending and marks nearOverdue` (lines 187-202)
    - `resolves a dispute with updated band and retains previous band` (lines 224-248)
    - `computes accurate operational metrics (on-time rate and weekly volume)` (lines 265-273)
    - New top-level `describe("dispute-admin clock boundary behavior", ...)` block at the bottom of `dispute-admin.test.ts`
- **Steps:**
  1. <!-- Updated: Red-Team (Assumption Finding 2) --> Move `adminUser`, `studentUser1`, `studentUser2`, and `mockEnv` to module scope (or keep shared constants accessible to both `describe` blocks), add a module-scope helper:
     ```ts
     function createCallerWithDb(
       db: TestDbContext["db"],
       u: typeof adminUser | null,
       env: { ADMIN_EMAILS?: string; SCORE_DISPUTE_ENABLED?: string } | undefined = mockEnv,
       now?: () => Date,
     )
     ```
     that passes `now` into `appRouter.createCaller({ db, env, now, session: ... })`. Update `createCaller(u, env = mockEnv, now?: () => Date)` inside `describe("dispute-admin router")` to delegate to `createCallerWithDb(testCtx.db, u, env, now)`.
  2. In `queue sorts disputes by dueAt ascending and marks nearOverdue`:
     - Call `createCaller(adminUser, mockEnv, () => baseNow)`.
     - Assert `nearOverdueItem.isNearOverdue` is `true` and `nearOverdueItem.isOverdue` is `false`.
     - Assert `const notDueYetItem = queue[index48h]!; expect(notDueYetItem.isNearOverdue).toBe(false); expect(notDueYetItem.isOverdue).toBe(false);`.
  3. In `resolves a dispute with updated band and retains previous band`:
     - Pin `const resolveNow = new Date("2026-11-06T12:00:00.000Z");` (24h after `baseNow`, before `dueAt` which is `baseNow + 48h`).
     - Call `createCaller(adminUser, mockEnv, () => resolveNow)`.
     - Assert `expect(resolveRes.dispute!.resolvedAt).toEqual(resolveNow);`.
  4. In `computes accurate operational metrics (on-time rate and weekly volume)`:
     - Pin `const metricsNow = new Date("2026-11-06T12:00:00.000Z");`.
     - Call `createCaller(adminUser, mockEnv, () => metricsNow)`.
     - Tighten `expect(metrics.onTimeRate).toBeGreaterThanOrEqual(0);` to `expect(metrics.onTimeRate).toBe(100);`.
     - Keep `expect(metrics.weeklyCount).toBeGreaterThanOrEqual(2);` and add `expect(metrics.nearOverdueCount).toBeGreaterThanOrEqual(1);`.
  5. <!-- Updated: Red-Team (Security Findings 4 & 5, Assumption Findings 1 & 2) --> Add a top-level `describe("dispute-admin clock boundary behavior", ...)` at the bottom of `dispute-admin.test.ts` where **each `it(...)` test creates its own `createTestDb()` inside `try { ... } finally { await isolated.dispose(); }`** (or `beforeEach`/`afterEach` per-test DB), seeds required `user`, distinct `attempt` rows, and `scoreDispute` rows with explicit `createdAt` relative to `T0 = new Date("2026-11-05T12:00:00.000Z")`, and covers:
     - `metrics weeklyCount boundary`: 1 dispute seeded with `createdAt: T0`; querying `metrics` with `now = new Date(T0.getTime() + 7 * 24 * 3600 * 1000)` returns `weeklyCount === 1`, while querying with `now = new Date(T0.getTime() + 7 * 24 * 3600 * 1000 + 1)` returns `weeklyCount === 0`.
     - `metrics onTimeRate boundary via disputeAdmin.resolve`: seed 2 `"open"` disputes on distinct attempts with `createdAt: T0` and `dueAt = new Date(T0.getTime() + 72 * 3600 * 1000)`. Resolve dispute 1 via `createCallerWithDb(isolated.db, adminUser, mockEnv, () => dueAt).disputeAdmin.resolve(...)` (`resolvedAt === dueAt`, on-time) and resolve dispute 2 via `createCallerWithDb(isolated.db, adminUser, mockEnv, () => new Date(dueAt.getTime() + 1)).disputeAdmin.resolve(...)` (`resolvedAt === dueAt + 1ms`, late). Query `metrics` at `() => new Date(dueAt.getTime() + 1000)` and assert `resolvedCount === 2` and `onTimeRate === 50`.
     - `queue SLA boundaries`: seed 4 `"open"` disputes on 4 distinct attempts with `warnedAt: null`, `createdAt: T0`, and `dueAt` values relative to `now = new Date("2026-11-06T12:00:00.000Z")`:
       - `now + 12h`: `isNearOverdue: false, isOverdue: false`
       - `now + 12h - 1ms`: `isNearOverdue: true, isOverdue: false`
       - `now`: `isNearOverdue: true, isOverdue: false`
       - `now - 1ms`: `isNearOverdue: true, isOverdue: true`
     - `invalid clock fail-closed`: passing `() => new Date(NaN)` to `queue`, `resolve`, or `metrics` rejects with `INTERNAL_SERVER_ERROR` rather than silently corrupting alerts/metrics.
- **Success criteria:** All new/tightened tests compile cleanly and FAIL only because `dispute-admin.ts` still uses `new Date()` without `resolveNow(ctx.now)`.
- **Verify:** `pnpm --filter @vox-flow/api test src/routers/dispute-admin.test.ts` exits non-zero (exit code 1) with assertion failures on the pinned-clock / invalid-clock tests. Passing all tests before editing `dispute-admin.ts` is a failure of the Red phase.

### Refactor (Green Phase)

#### Task 1.2 — Add `resolveNow` helper and wire `ctx.now` in `disputeAdmin.queue`, `disputeAdmin.resolve`, and `disputeAdmin.metrics`
- **Goal:** Replace direct `new Date()` clock reads in `disputeAdmin` with a validated `resolveNow(ctx.now)` helper (`ctx.now?.() ?? new Date()`).
- **Target files and symbols:**
  - `packages/api/src/routers/dispute-admin.ts`:
    - New local helper `resolveNow(nowFn?: () => Date): Date`
    - `disputeAdminRouter.queue` (line 98)
    - `disputeAdminRouter.resolve` (line 258)
    - `disputeAdminRouter.metrics` (line 292)
- **Steps:**
  1. <!-- Updated: Red-Team (Security Finding 2) --> Near the top of `packages/api/src/routers/dispute-admin.ts` (above `disputeAdminRouter`), add:
     ```ts
     function resolveNow(nowFn?: () => Date): Date {
       const current = nowFn ? nowFn() : new Date();
       if (!(current instanceof Date) || !Number.isFinite(current.getTime())) {
         throw new TRPCError({
           code: "INTERNAL_SERVER_ERROR",
           message: "Invalid clock value from Context.now",
         });
       }
       return current;
     }
     ```
  2. At `packages/api/src/routers/dispute-admin.ts:98` in `queue`, replace `const now = new Date();` with `const now = resolveNow(ctx.now);`.
  3. At `packages/api/src/routers/dispute-admin.ts:258` in `resolve`, replace `const now = new Date();` with `const now = resolveNow(ctx.now);`.
  4. At `packages/api/src/routers/dispute-admin.ts:292` in `metrics`, replace `const now = new Date();` with `const now = resolveNow(ctx.now);`.
  5. Leave `checkAdmin`, `getCase`, and all comparison operators untouched.
- **Success criteria:** `disputeAdmin.queue`, `disputeAdmin.resolve`, and `disputeAdmin.metrics` honor valid `ctx.now`, reject invalid `Date` values with `INTERNAL_SERVER_ERROR`, and default to `new Date()` when `ctx.now` is omitted.
- **Verify:** `pnpm --filter @vox-flow/api test src/routers/dispute-admin.test.ts` exits 0 with all tests in `dispute-admin.test.ts` passing.

### Tests After & Regression Gate

#### Task 1.3 — Run full `@vox-flow/api` tests and workspace typecheck
- **Goal:** Confirm no regressions across `@vox-flow/api` and type safety across the entire monorepo.
- **Target files and symbols:** N/A (verification only).
- **Steps:**
  1. Run `pnpm --filter @vox-flow/api test` from the worktree root.
  2. Run `pnpm check-types` from the worktree root.
- **Success criteria:** All `@vox-flow/api` test files pass and `pnpm check-types` exits 0 with zero errors.
- **Verify:**
  - `pnpm --filter @vox-flow/api test` exits 0 (30 test files passed, 0 failed).
  - `pnpm check-types` exits 0.

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
