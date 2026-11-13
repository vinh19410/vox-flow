---
title: "Fix hardcoded clock in disputeAdmin router and dispute-admin.test.ts (#139)"
description: "Inject Context.now in disputeAdmin procedures and pin deterministic clocks in dispute-admin.test.ts with isolated per-test boundary suites."
status: completed
priority: P1
effort: 1h
issue: 139
branch: fix/139-dispute-admin-weekly-count-clock
tags: [bugfix, api]
blockedBy: []
blocks: []
created: 2026-11-13
---

# Fix hardcoded clock in disputeAdmin router and dispute-admin.test.ts (#139)

## Overview

Inject `Context.now` (via validated `resolveNow(ctx.now)` falling back to `new Date()`) into `disputeAdmin.queue`, `disputeAdmin.resolve`, and `disputeAdmin.metrics` in `packages/api/src/routers/dispute-admin.ts`, and pin deterministic clocks in `packages/api/src/routers/dispute-admin.test.ts` along with per-test isolated `createTestDb()` boundary tests so `weeklyCount`, `onTimeRate`, `isNearOverdue`, and `isOverdue` never drift with the calendar date.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Replace direct `new Date()` calls in `disputeAdmin` (`queue`, `resolve`, `metrics`) with a validated `resolveNow(ctx.now)` helper (`ctx.now?.() ?? new Date()`) while preserving existing SLA boundary operators (`< 12h`, `< now`, `<= dueAt`, `>= oneWeekAgo`). | P1 |
| 2 | Pin deterministic clocks and tighten assertions in `dispute-admin.test.ts`, plus add per-test isolated boundary tests using dedicated `createTestDb()` instances via a shared module-level `createCallerWithDb` helper. | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: TDD Clock Injection & Deterministic Tests](./phase-01-start.md) | Done |

## Success Criteria

- [x] `disputeAdmin.queue`, `disputeAdmin.resolve`, and `disputeAdmin.metrics` use `resolveNow(ctx.now)` (`ctx.now?.() ?? new Date()`, rejecting invalid `Date` values) and keep production fallback `new Date()`.
- [x] `dispute-admin.test.ts` pins clocks across `queue`, `resolve`, and `metrics` (including `expect(metrics.onTimeRate).toBe(100)` and `expect(metrics.weeklyCount).toBeGreaterThanOrEqual(2)`).
- [x] Per-test isolated boundary tests (`createTestDb()` per `it(...)`) verify 7-day `weeklyCount` cutoff (`>=` vs `<`), `onTimeRate` via `disputeAdmin.resolve` (`<= dueAt` vs `> dueAt`), `isNearOverdue` (`< 12h` with `warnedAt: null`), and `isOverdue` (`< now`) regardless of system clock.
- [x] `pnpm --filter @vox-flow/api test src/routers/dispute-admin.test.ts`, `pnpm --filter @vox-flow/api test`, and `pnpm check-types` all exit 0.

## Red Team Review

### Session — 2026-11-13
**Findings:** 7 total (5 from Security Adversary, 2 from Assumption Destroyer) — 5 accepted, 2 rejected
**Severity breakdown:** 2 High (1 accepted, 1 rejected), 5 Medium (4 accepted, 1 rejected)

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Security: `ctx.now` trust-boundary on `resolve` & `dispute.submit` split-brain | High | Reject (prod `apps/server/src/context.ts:32-40` omits `now`; `dispute.ts:81` is out of scope for #139 per Kongming; follow-up noted) | — |
| 2 | Security: Unvalidated `ctx.now()` returning `Invalid Date` (`NaN`) | Medium | Accept (add `resolveNow(ctx.now)` helper validating `d instanceof Date && Number.isFinite(d.getTime())`) | Phase 1 Task 1.2 |
| 3 | Security: Unbounded future window in `weeklyCount` (`createdAt >= oneWeekAgo`) | Medium | Reject (preserving existing SLA operators is an explicit #139 guardrail; per-test DB isolation prevents mixed epochs) | — |
| 4 | Security: `onTimeRate` boundary test must exercise `disputeAdmin.resolve` | Medium | Accept (seed `open` rows and transition via `caller.disputeAdmin.resolve` with pinned `now`) | Phase 1 Task 1.1 |
| 5 | Security: `warnedAt` short-circuit (`Boolean(r.warnedAt)`) in `queue` `< 12h` boundary | Medium | Accept (explicitly set `warnedAt: null` on `< 12h` boundary fixtures) | Phase 1 Task 1.1 |
| 6 | Assumption: Sharing one `createTestDb()` across boundary tests contaminates `metrics` | High | Accept (require dedicated `createTestDb()` per `it(...)` + explicit `createdAt` + distinct `attemptId` per active dispute) | Phase 1 Guardrails & Task 1.1 |
| 7 | Assumption: `createCaller` hardcoded `testCtx.db` & `describe` scope ambiguity | Medium | Accept (extract module-scope fixtures + `createCallerWithDb(db, u, env, now)` and place boundary `describe` at top-level) | Phase 1 Task 1.1 |

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-start.md`
- Decision deltas checked: 5 (`resolveNow` helper, per-`it` `createTestDb()`, module-level `createCallerWithDb`, `disputeAdmin.resolve` transition in `onTimeRate` boundary test, explicit `warnedAt: null`)
- Reconciled stale references: 4 (Overview, Goals, Success Criteria, Phase 1 Scope Guardrails & Tasks 1.1–1.2)
- Unresolved contradictions: 0

## Validation Log

### Verification Results
- **Tier:** Light (1 phase, Fact Checker)
- **Claims checked:** 10 (`packages/api/src/context.ts:36`, `packages/api/src/routers/dispute-admin.ts:98,136-137,258,292-293,306-309,313,318`, `packages/api/src/routers/dispute-admin.test.ts:57-86,113,187-202,224-248,265-273`, `packages/db/src/schema/dispute.ts:29-46`, `apps/server/src/context.ts:32-40`)
- **Verified:** 10 | **Failed:** 0 | **Unverified:** 0

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-start.md`
- Decision deltas checked: 5
- Reconciled stale references: 0 (already aligned after red-team pass)
- Unresolved contradictions: 0

<!-- slug: 139-dispute-admin-weekly-count-clock -->
