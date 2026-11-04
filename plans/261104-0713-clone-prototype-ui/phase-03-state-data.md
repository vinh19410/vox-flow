---
phase: 3
title: "App state store + mock data split"
status: pending
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 3: Router-Free App State Store and Per-Feature Mock Data Split

<!-- Updated: Validation Session 1 - Added $attemptId resolution helper, forecast builder split, TDD tests, and Failure Protocol -->
<!-- Updated: Red Team Session 1 - Decoupled Phase 3 from TanStack Router useNavigate (moved router bridge to Phase 4), split wide forecast/results data files <=200 lines, eliminated exam<->select cycle, added sessionStorage persistence + lastUnpersistedAttempt, fixed source citations and FNR>200 awk check -->

## Goal
Split prototype `data.ts` (300 lines), `forecast.ts` (157 wide lines), screen-local constants (`PART_INFO`, `MARK`, `planUntil`, `SCORING_STEPS`), and router-free `AppState` (`sessionStorage`-backed state + toast + paywall state) into acyclic modules strictly ≤200 lines per file so `pnpm --filter web check-types` passes independently of Phase 4 route generation.

## Files to Create / Modify
- Create: `apps/web/src/features/exam/types.ts` (`Mode`, `Part`, `ExamItem`)
- Create: `apps/web/src/features/exam/data.ts` (`MODES`, `modeLabel`, `VOICES`, `ITEMS`, `MIN_WORDS`, `PART_INFO`)
- Create: `apps/web/src/features/forecast/types.ts` (`ForecastKind`, `ForecastTopic`, `Follow`)
- Create: `apps/web/src/features/forecast/builders.ts` (`p1`, `p23`)
- Create: `apps/web/src/features/forecast/topics-p1.ts` (`FORECAST_P1`)
- Create: `apps/web/src/features/forecast/topics-p23.ts` (`FORECAST_P23`)
- Create: `apps/web/src/features/forecast/data.ts` (`QUARTER`, `FORECAST`)
- Create: `apps/web/src/features/results/types.ts` (`CritKey`, `Evidence`, `Criterion`, `MarkType`, `Seg`, `ReviewItem`)
- Create: `apps/web/src/features/results/data.ts` (`RESULT`)
- Create: `apps/web/src/features/results/review-data.ts` (`REVIEW`, `MARK`)
- Create: `apps/web/src/features/history/types.ts` (`Attempt`)
- Create: `apps/web/src/features/history/data.ts` (`HISTORY`, `resolveAttemptView`)
- Create: `apps/web/src/features/billing/data.ts` (`PLANS`, `Plan`)
- Create: `apps/web/src/features/billing/plan-utils.ts` (`planUntil`)
- Create: `apps/web/src/features/scoring/data.ts` (`SCORING_STEPS`)
- Create: `apps/web/src/features/app-state/types.ts` (`ProtoScreen`, `AppState`, `AppStoreValue`, `AppCtxValue`)
- Create: `apps/web/src/features/app-state/initial-state.ts` (`createInitialState`, `INITIAL_STATE`)
- Create: `apps/web/src/features/app-state/toast.tsx` (`ProtoToast`)
- Create: `apps/web/src/features/app-state/store.tsx` (`useAppStateStore`)
- Create: `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`

## Tasks & Steps

### Task 3.1 — Create acyclic feature types and mock data modules (`exam`, `forecast`, `results`, `history`, `billing`, `scoring`)
- [x] Split `data.ts`, `forecast.ts`, and screen-local constants into domain modules with byte-identical mock content and ≤200 lines per file.
- **Goal**: Every feature data/type file stays strictly ≤200 lines at standard TypeScript formatting and forms a strict DAG (`exam/{types,data}` is imported one-way by `select`, `forecast`, `history`, and `app-state`).
- **Target files and symbols**:
  - `apps/web/src/features/exam/{types,data}.ts` (from `/tmp/vox-flow-prototype-src/src/data.ts:1-90,300` and `/tmp/vox-flow-prototype-src/src/screens/Exam.tsx:18-22` for `PART_INFO`)
  - `apps/web/src/features/forecast/{types,builders,topics-p1,topics-p23,data}.ts` (from `/tmp/vox-flow-prototype-src/src/forecast.ts:1-157`, splitting Part 1 topics into `topics-p1.ts` and Part 2&3 topics into `topics-p23.ts` so every file stays <150 lines)
  - `apps/web/src/features/results/{types,data,review-data}.ts` (`RESULT` from `src/data.ts:91-204`; `REVIEW` from `src/data.ts:206-271` + `MARK` from `src/screens/Results.tsx:7-11`)
  - `apps/web/src/features/history/{types,data}.ts` (`HISTORY` from `src/data.ts:273-289`, plus `resolveAttemptView(attempts, attemptId, transientAttempt)` returning `{ isDefaultLatest: true, attempt: null }` when `attemptId === "latest"` and `{ isDefaultLatest: false, attempt }` for concrete IDs with safe fallback)
  - `apps/web/src/features/billing/{data,plan-utils}.ts` (`PLANS` from `src/data.ts:291-296`; `planUntil` from `src/screens/Billing.tsx:10-16`)
  - `apps/web/src/features/scoring/data.ts` (`SCORING_STEPS` from `STEPS` in `src/screens/Scoring.tsx:7-14`)
- **Steps**:
  1. Write TDD test `apps/web/src/features/app-state/__tests__/state-and-data.test.ts` asserting: `ITEMS` has 6 items, `MODES` has 4 modes, `VOICES` has 3 voices, `FORECAST` has 11 topics (`QUARTER.label === "Quý 2/2025"`), `RESULT.criteria` has 4 criteria (`FC`, `LR`, `GRA`, `P`), `REVIEW` has 5 segments, `HISTORY` has 6 attempts (`a1`..`a6`), `resolveAttemptView(HISTORY, "latest", null).isDefaultLatest === true`, `resolveAttemptView(HISTORY, "a3", null).attempt?.band === 5.5`, `resolveAttemptView(HISTORY, "missing", null).isDefaultLatest === true`, and `resolveAttemptView([], "missing", null)` does not throw.
  2. Run `pnpm --filter web test src/features/app-state/__tests__/state-and-data.test.ts` and confirm non-zero exit (TDD Red).
  3. Create all domain data/type files listed above with byte-identical Vietnamese strings and numbers.
- **Success criteria**: Zero file in `features/**` exceeds 200 lines; zero circular imports.
- **Verify**: no verification needed yet (verified with Task 3.2 in TDD Green).

### Task 3.2 — Implement router-free `useAppStateStore` (`sessionStorage`-backed) and `ProtoToast`
- [x] Build `features/app-state/{types,initial-state,toast,store}.tsx` with `sessionStorage` hydration, functional `set`, `lastUnpersistedAttempt`, and `pendingSubmission` flag.
- **Goal**: `useAppStateStore()` manages `s` (persisted in `sessionStorage` under `"vox-flow-proto-state"` so URL refreshes keep mock progress/plan), supports both `set(partial)` and `set((prev) => partial)`, tracks `lastUnpersistedAttempt: Attempt | null` (used when `s.consent.save === false`) and `pendingSubmission: boolean` (prevents `/scoring` Back-button phantom replays), and manages `paywallOpen` + `toastMsg` (`3200ms` auto-clear) without importing `@tanstack/react-router`.
- **Target files and symbols**:
  - `apps/web/src/features/app-state/types.ts` (`ProtoScreen`, `AppState`, `AppStoreValue`, `AppCtxValue`)
  - `apps/web/src/features/app-state/initial-state.ts` (`createInitialState`, `INITIAL_STATE`)
  - `apps/web/src/features/app-state/toast.tsx` (`ProtoToast`)
  - `apps/web/src/features/app-state/store.tsx` (`useAppStateStore`)
- **Steps**:
  1. Extend `state-and-data.test.ts` with tests verifying `useAppStateStore()` hydrates/persists state changes to `sessionStorage`, supports functional updates `set((prev) => ({ target: prev.target + 0.5 }))`, and auto-clears toast after `3200ms`.
  2. Implement `types.ts`, `initial-state.ts`, `toast.tsx`, and `store.tsx` with zero `@tanstack/react-router` imports so `pnpm --filter web check-types` succeeds before Phase 4 creates `_proto` routes.
- **Success criteria**: All unit tests in `state-and-data.test.ts` pass, `check-types` exits 0, and every production file in `features/` is ≤200 lines.
- **Verify**: `pnpm --filter web test src/features/app-state/__tests__/state-and-data.test.ts && pnpm --filter web check-types` exits 0, and `find apps/web/src/features -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/__tests__/*' -exec awk 'FNR>200{print FILENAME ":" FNR; exit 1}' {} +` exits 0 (TDD Green).

## Verification
- `pnpm --filter web test` exits 0.
- `pnpm --filter web check-types` exits 0.
- Per-file `FNR>200` line check across `apps/web/src/features` exits 0.

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
