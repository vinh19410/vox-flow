---
phase: 5
title: "Screens -> feature components"
status: pending
priority: P1
effort: "5h"
dependencies: [4]
---

# Phase 5: Port 12 Prototype Screens into Modular Feature Components

<!-- Updated: Validation Session 1 - Added per-slice file budgets (<=200 lines), TDD behavioral tests, PaywallModal wiring, and Failure Protocol -->
<!-- Updated: Red Team Session 1 - Split TDD tests per slice (slice-a/b/c.test.tsx) so tsc passes after every slice, added safe speech + timer/focus/modal guards in Exam, consent.save + replace:true in Scoring, and deterministic 'latest' vs concrete $attemptId binding in Results -->

## Goal
Port all 12 screens from `/tmp/vox-flow-prototype-src/src/screens/*.tsx` into modular feature components (`≤200` lines per file) with per-slice red-green TDD tests, preserving 100% of Vietnamese copy, layout geometry, interactions, keyboard shortcuts, and mock workflows while fixing lifecycle/route edge cases uncovered by Red-Team review.

## Files to Create / Modify
- **Slice A — Entry, Onboarding & Privacy (`landing`, `auth`, `onboarding`, `privacy`)**:
  - `apps/web/src/features/landing/components/{hero,promises-section,pricing-teaser,privacy-cta}.tsx`, `apps/web/src/features/landing/landing-screen.tsx`
  - `apps/web/src/features/onboarding/components/{onboarding-frame,goal-step,mic-check,consent-rows,consent-step}.tsx`, `apps/web/src/features/onboarding/onboarding-screen.tsx`
  - `apps/web/src/features/auth/auth-screen.tsx`
  - `apps/web/src/features/privacy/privacy-screen.tsx`
  - Modify routes: `routes/_proto/{index,auth,onboarding}.tsx`, `routes/_proto/app/privacy.tsx`
  - Test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- **Slice B — Practice Discovery (`dashboard`, `select`, `forecast`, `history`)**:
  - `apps/web/src/features/dashboard/components/{readiness-card,countdown-card,today-tasks,recent-attempt-card}.tsx`, `apps/web/src/features/dashboard/dashboard-screen.tsx`
  - `apps/web/src/features/select/components/{mode-grid,voice-picker,pre-exam-card}.tsx`, `apps/web/src/features/select/select-screen.tsx`
  - `apps/web/src/features/forecast/components/{coverage-banner,forecast-toolbar,topic-card,topic-detail-modal}.tsx`, `apps/web/src/features/forecast/forecast-screen.tsx`
  - `apps/web/src/features/history/components/{trend-chart,attempt-list}.tsx`, `apps/web/src/features/history/history-screen.tsx`
  - Modify routes: `routes/_proto/app/{dashboard,select,forecast,history.index}.tsx`
  - Test: `apps/web/src/features/__tests__/slice-b.test.tsx`
- **Slice C — Exam, Scoring, Results & Billing (`exam`, `scoring`, `results`, `billing`)**:
  - `apps/web/src/features/exam/use-exam-session.ts`, `apps/web/src/features/exam/components/{exam-header,exam-intro,question-stage,cue-card-panel,live-transcript,exam-controls,pre-submit-modal,exit-exam-modal}.tsx`, `apps/web/src/features/exam/exam-screen.tsx`
  - `apps/web/src/features/scoring/scoring-screen.tsx`
  - `apps/web/src/features/results/components/{band-hero,criteria-grid,criterion-detail,soft-paywall,review-list,report-modal}.tsx`, `apps/web/src/features/results/results-screen.tsx`
  - `apps/web/src/features/billing/components/{plan-grid,fake-qr,payment-panel,paywall-modal}.tsx`, `apps/web/src/features/billing/billing-screen.tsx`
  - Modify routes: `routes/_proto/{route,exam,scoring}.tsx`, `routes/_proto/app/{history.$attemptId,billing}.tsx`
  - Test: `apps/web/src/features/__tests__/slice-c.test.tsx`

## Tasks & Steps

### Task 5.1 — Port Slice A (`landing`, `auth`, `onboarding`, `privacy`) with TDD (`slice-a.test.tsx`)
- [x] Write `slice-a.test.tsx` (Red), implement `landing`, `auth`, `onboarding`, and `privacy` screens, and pass tests + `check-types` (Green).
- **Goal**: S01 (`/`), S02 (`/auth`), S03–S05 (`/onboarding`), and S25 (`/app/privacy`) match prototype markup, copy, and consent/wipe state transitions with every file ≤200 lines.
- **Target files and symbols**:
  - `apps/web/src/features/{landing,auth,onboarding,privacy}/**`
  - `apps/web/src/routes/_proto/{index,auth,onboarding}.tsx`, `apps/web/src/routes/_proto/app/privacy.tsx`
  - `apps/web/src/features/__tests__/slice-a.test.tsx`
- **Steps**:
  1. Write `slice-a.test.tsx` testing: `LandingScreen` renders hero (`"Biết rõ vì sao bạn được 6.5."`) and 3 paid teaser plans; `OnboardingScreen` updates `s.target` + toggles `ConsentRows` (`save` / `train`); `PrivacyScreen` confirmation modal clears `s.attempts` to `[]` and shows toast `"Đã xóa dữ liệu bài làm"`. Run `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` and confirm non-zero exit (TDD Red).
  2. Split `Landing.tsx` into `hero.tsx`, `promises-section.tsx`, `pricing-teaser.tsx`, `privacy-cta.tsx`, and `landing-screen.tsx`.
  3. Split `Onboarding.tsx` into `onboarding-frame.tsx`, `goal-step.tsx`, `mic-check.tsx`, `consent-rows.tsx`, `consent-step.tsx`, `onboarding-screen.tsx`, and `features/auth/auth-screen.tsx`.
  4. Port `Privacy.tsx` into `features/privacy/privacy-screen.tsx` importing `ConsentRows` directly. Rename `accent*`→`brand*` and `muted`→`subtle` across Slice A and wire routes.
- **Success criteria**: `slice-a.test.tsx` and `check-types` pass; all Slice A files ≤200 lines.
- **Verify**: `pnpm --filter web test src/features/__tests__/slice-a.test.tsx && pnpm --filter web check-types` exits 0 (TDD Green).

### Task 5.2 — Port Slice B (`dashboard`, `select`, `forecast`, `history`) with TDD (`slice-b.test.tsx`)
- [x] Write `slice-b.test.tsx` (Red), implement `dashboard`, `select`, `forecast`, and `history` screens, and pass tests + `check-types` (Green).
- **Goal**: S06 (`/app/dashboard`), S07 (`/app/select`), S07b (`/app/forecast`), and S19 (`/app/history`) match prototype markup, SVG chart geometry, safe speech preview cleanup, and forecast/history filters with every file ≤200 lines.
- **Target files and symbols**:
  - `apps/web/src/features/{dashboard,select,forecast,history}/**`
  - `apps/web/src/routes/_proto/app/{dashboard,select,forecast,history.index}.tsx`
  - `apps/web/src/features/__tests__/slice-b.test.tsx`
- **Steps**:
  1. Write `slice-b.test.tsx` testing: `ForecastScreen` filters topics by `kind` (`p1` vs `p23`), `filter` (`hot`, `new`, `saved`), and search query `q`, and toggles `s.saved`; `HistoryScreen` filters attempts by mode and renders empty state when `s.attempts` has no matches; `SelectScreen` sets `pendingSubmission: false` / `practice: null` when starting a regular mock test. Run `pnpm --filter web test src/features/__tests__/slice-b.test.tsx` and confirm non-zero exit (TDD Red).
  2. Split `Dashboard.tsx` into `readiness-card.tsx`, `countdown-card.tsx`, `today-tasks.tsx`, `recent-attempt-card.tsx` (calling `goResult(last.id)`), and `dashboard-screen.tsx`.
  3. Split `Select.tsx` into `mode-grid.tsx`, `voice-picker.tsx` (using `speakText`/`cancelSpeech` from `lib/speech.ts` and cleaning up speech + 3s preview timeout on unmount; preserving `voice.accent` property!), `pre-exam-card.tsx`, and `select-screen.tsx`.
  4. Split `Forecast.tsx` into `coverage-banner.tsx`, `forecast-toolbar.tsx`, `topic-card.tsx` (`group-hover:text-brand`), `topic-detail-modal.tsx`, and `forecast-screen.tsx`.
  5. Split `History.tsx` into `trend-chart.tsx` (`fill-subtle`, `bg-brand`, `bg-brand/15`), `attempt-list.tsx` (`goResult(a.id)`), and `history-screen.tsx`, and wire `history.index.tsx` + Slice B routes.
- **Success criteria**: `slice-b.test.tsx` and `check-types` pass; all Slice B files ≤200 lines.
- **Verify**: `pnpm --filter web test src/features/__tests__/slice-b.test.tsx && pnpm --filter web check-types` exits 0 (TDD Green).

### Task 5.3 — Port Slice C (`exam`, `scoring`, `results`, `billing` + `PaywallModal`) with TDD (`slice-c.test.tsx`)
- [x] Write `slice-c.test.tsx` (Red), implement `exam`, `scoring`, `results`, `billing`, mount `PaywallModal` in `_proto/route.tsx`, and pass full suite + `check-types` + line/token gates (Green).
- **Goal**: S08–S10 (`/exam`), S11 (`/scoring`), S12–S15 (`/app/history/$attemptId` + `PaywallModal`), and S22–S24 (`/app/billing`) match prototype 1:1 with hardened lifecycle, consent, and `$attemptId` behavior.
- **Target files and symbols**:
  - `apps/web/src/features/{exam,scoring,results,billing}/**`
  - `apps/web/src/routes/_proto/{route,exam,scoring}.tsx`, `apps/web/src/routes/_proto/app/{history.$attemptId,billing}.tsx`
  - `apps/web/src/features/__tests__/slice-c.test.tsx`
- **Steps**:
  1. Write `slice-c.test.tsx` testing:
     - `Exam`: builds 8 steps (including follow-ups) for `'full'` vs 1 step with 60s `prep` phase for `'p2'`, flags answers `< MIN_WORDS[part]`, sets `pendingSubmission: true` on submit to `/scoring`, and clears `s.practice` when exiting to `/app/forecast` (when `s.practice !== null`) vs `/app/select`.
     - `Scoring`: when `s.consent.save === true`, appends `newId` to `s.attempts` and navigates with `{ replace: true }`; when `s.consent.save === false`, does NOT append to `s.attempts` (stores `lastUnpersistedAttempt` instead).
     - `Results`: `attemptId === "latest"` renders prototype default `6.5` (`6.0 – 7.0`) + `SoftPaywall` when `s.plan === null`; `attemptId === "a3"` renders `a3`'s band `5.5` (`5.5 – 6.0`) and mode `Part 2`; unknown `attemptId` falls back safely without throwing; unlocking `s.plan` reveals criteria & grammar/vocab/pron segment popovers.
     - `Billing / PaywallModal`: clicking `"Đã chuyển khoản"` transitions `waiting → received → active` and sets `s.plan`.
     Run `pnpm --filter web test src/features/__tests__/slice-c.test.tsx` and confirm non-zero exit (TDD Red).
  2. Implement `useExamSession` (`use-exam-session.ts`, pausing timers while `exitOpen || review`, cancelling speech via `cancelSpeech()` on mount/unmount/startRec/mute, ignoring `BUTTON`/`A`/`INPUT`/`SELECT`/`TEXTAREA` in `window` `keydown`, preserving `muted` boolean state and `voice.accent` prop) and split `Exam.tsx` into `exam-header`, `exam-intro`, `question-stage` (`to-brand`, `border-brand/30 bg-brand/10`), `cue-card-panel`, `live-transcript`, `exam-controls`, `pre-submit-modal` (sets `pendingSubmission = true` before `go("scoring")`), `exit-exam-modal` (clears `practice: null` after computing exit target), and `exam-screen.tsx`.
  3. Implement `ScoringScreen` (`scoring-screen.tsx`): persist `newId` in `useRef<string | null>(null)`; if entered via browser Back after submission (`!pendingSubmission` on initial mount when navigated back — note: allow direct `/scoring` visit in `DEV` / ScreenMap by running animation, only skipping duplicate append via `added.current`, clearing `pendingSubmission = false` and `practice: null` when committing, respecting `s.consent.save`, and calling `goResult(newId, { replace: true })` so `/scoring` is replaced in browser history!).
  4. Split `Results.tsx` into `band-hero.tsx`, `criteria-grid.tsx`, `criterion-detail.tsx`, `soft-paywall.tsx`, `review-list.tsx` (stopping playback cleanly via `useEffect` when `pos >= dur` rather than calling `setPlaying` inside `setPos`), `report-modal.tsx`, and `results-screen.tsx` (mounted as `<ResultsScreen key={attemptId} attemptId={attemptId} />` in `history.$attemptId.tsx`, using `resolveAttemptView(s.attempts, attemptId, lastUnpersistedAttempt)`).
  5. Split `Billing.tsx` into `plan-grid.tsx`, `fake-qr.tsx`, `payment-panel.tsx`, `paywall-modal.tsx`, and `billing-screen.tsx`. Mount `<PaywallModal open={paywallOpen} onClose={closePaywall} />` in `routes/_proto/route.tsx`.
- **Success criteria**: All unit/integration tests pass, `check-types` passes, zero production files exceed 200 lines, and zero `accent`/`muted` token utilities remain.
- **Verify**: `pnpm --filter web test && pnpm --filter web check-types` exits 0; `! grep -rnE '(bg|text|border|ring|outline|fill|stroke|from|to|via|decoration|caret|shadow)-(accent|muted)(-soft)?(\b|/)' apps/web/src/{components/ds,layouts,features,routes/_proto,hooks,styles} --exclude-dir=__tests__` exits 0; and `find apps/web/src/features apps/web/src/layouts apps/web/src/components/ds -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/__tests__/*' -exec awk 'FNR>200{print FILENAME ":" FNR; exit 1}' {} +` exits 0 (TDD Green).

## Verification
- `pnpm --filter web test` exits 0.
- `pnpm --filter web check-types` exits 0.
- Zero `accent`/`muted` token class leaks in ported directories.
- Every production file in `features/`, `layouts/`, `components/ds/` is ≤200 lines (`FNR>200` check).

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
