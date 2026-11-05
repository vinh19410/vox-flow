---
title: "Clone vox-flow-prototype UI into apps/web, restructured into components"
description: "Port the Figma-Make prototype (12 screens, ~130KB single-file screens) into the TanStack Router app as small feature-scoped components with route-based navigation, TDD coverage, and --advice handover tasks."
status: completed
priority: P2
effort: 14h
issue: 1
branch: vinh19410/feat/clone-prototype-ui
tags: [frontend, refactor, ui, tdd, advice]
blockedBy: []
blocks: []
created: 2026-11-04
---

# Clone prototype UI into `apps/web`

Tracking: #1

Source: `github.com/vinh19410/vox-flow-prototype` (private, Vite + React 19 + Tailwind v4, state-based screen switching, mock data, brand "ChấmRõ" — IELTS Speaking mock test).
Target: `apps/web` (TanStack Router file routes, Tailwind v4 via `@vox-flow/ui/globals.css`, shadcn primitives in `packages/ui`).

> **Handover Contract (`--advice` + `--tdd`):** This plan is handover-ready for downstream executor models. Every `phase-0N-*.md` file decomposes work into explicit tasks with `Goal`, `Target files and symbols`, `Steps`, `Success criteria`, mechanical `Verify` pass conditions (including red-green TDD checks), and an embedded `## Failure Protocol` that halts and escalates to `kongming` on any verification failure.

## Outcome
Every prototype screen (S01–S25 including forecast) renders in `apps/web` with identical look, Vietnamese copy, and interactive mock behavior as real TanStack Router file routes composed from focused feature components (each ≤200 lines). No backend/auth/tRPC wiring is added to prototype routes, and shared workspace packages remain untouched.

## Non-goals
- Wiring tRPC / Better-Auth / DB to prototype flows (mock state stays client-side).
- Modifying `packages/ui`, `packages/api`, `packages/db`, `packages/auth`, `packages/config`, `packages/infra`, or `apps/server`.
- Removing or restyling legacy `/login` and `/_auth/dashboard` (URL `/dashboard`).
- Redesigning UI, adding dark mode to prototype routes, or porting `.figma/` scripts/plugins.

## Key findings (scouted & verified)
| Finding | Consequence |
|---|---|
| Prototype uses a single `useState<Screen>` switcher (`go(screen)`), no router | Convert to TanStack Router file routes under pathless `_proto`; Phase 3 owns router-free state/data and Phase 4 wires typed router navigation after all 12 route files exist |
| Biggest monoliths: `Exam.tsx` (388 lines), `Results.tsx` (392 lines), `data.ts` (300 lines), `Onboarding.tsx` (274 lines), `Forecast.tsx` (269 lines), `Billing.tsx` (266 lines), `ui.tsx` (206 lines), `Landing.tsx` (202 lines), plus wide-line `forecast.ts` (567 chars/line) | Split into `<200`-line feature components, hooks, and multi-file data modules (`forecast/topics-{p1,p23}.ts`, `results/{data,review-data}.ts`) |
| Prototype tokens `--color-accent*` and `--color-muted` collide with `@vox-flow/ui/src/styles/globals.css:98,100` | Rename prototype tokens to `--color-brand` (`#ff5b24`), `--color-brand-soft` (`#ffe4d8`), `--color-subtle` (`#747887`), codemod utility classes (preserving `voice.accent`, `muted` state, `variant="accent"`, `tone="accent"`), and enforce comprehensive grep gate |
| `globals.css:79` uses `@theme inline` (`--font-sans: "Inter Variable"`), `__root.tsx:43-54` mounts `ThemeProvider defaultTheme="dark"` (mutating `<html class="dark">`), and `Landing.tsx:59` uses `-z-10` glow | Move `ThemeProvider` + `Header` + `Toaster` into `routes/_app-legacy/route.tsx`; isolate `_proto/route.tsx` with `isolate` on `.proto-root`, `@layer base` scoped `--font-proto`/`--font-proto-mono`/`--border`, and `useLayoutEffect` clearing `html.dark` |
| `trpc.ts:27` calls `ENV.VITE_SERVER_URL.replace(...)` at top level while `.env` is gitignored/absent in worktree | Fallback `(ENV.VITE_SERVER_URL ?? "http://localhost:3000")` in `trpc.ts` and `auth-client.ts`, and guard `authClient.getSession()` in `_app-legacy/_auth/route.tsx` |
| `Exam.tsx:83,106,176` calls bare `speechSynthesis?.cancel()` and `useMicLevel` can leak `MediaStream` if `AudioContext` throws | Wrap `globalThis.speechSynthesis` in `lib/speech.ts`, configure `src/test/setup.ts` in `vitest.config.ts` (`react()`, `tanstackRouter()`), and harden `useMicLevel` cleanup |

## Confirmed Decisions (Locked via Issue #1 Validation & Red-Team)
1. **Beta Target Branch**: `origin/dev` created from `main` (`5265b81`); PR and `--ship` merge target `origin/dev`.
2. **URLs**: `/` (landing), `/auth`, `/onboarding`, `/exam`, `/scoring`; in-app shell routes under `/app/{dashboard,select,forecast,history,history/$attemptId,billing,privacy}` using `history.index.tsx` + `history.$attemptId.tsx` (never `history.tsx`). Legacy `/login` and `/_auth/dashboard` (URL `/dashboard`) preserved under `_app-legacy`.
3. **Results `$attemptId` Contract**: `attemptId === 'latest'` renders default `RESULT` (`6.5`, `[6.0, 7.0]`) + current `s.mode`/`s.practice`/today metadata for 1:1 prototype S12 visual parity; concrete `$attemptId` (`a1`..`a6`, `new*`) binds header `mode`/`topic`/`date` and `band`/`range` from the matched `Attempt` (or transient `lastUnpersistedAttempt` when `s.consent.save === false`), keyed via `<ResultsScreen key={attemptId} />`, falling back safely to `RESULT` if unknown.
4. **Test Strategy**: `vitest` (`jsdom` + `@testing-library/react` + `react()` + `tanstackRouter()` + `src/test/setup.ts`) in `apps/web` with per-slice TDD tests, `pnpm check-types`, `pnpm build`, per-file `FNR>200` line-budget check, and 390px/1280px headless browser visual parity against prototype.
5. **Screen Map Dev Panel**: Floating "Màn hình" jump menu (`layouts/screen-map.tsx`) rendered only when `import.meta.env.DEV` is truthy.

## Target structure
```
apps/web/
  vitest.config.ts
  src/
    index.css
    styles/prototype-theme.css
    test/setup.ts
    components/ds/            button.tsx card.tsx badge.tsx toggle.tsx modal.tsx logo.tsx band-range.tsx wave.tsx
    hooks/use-mic-level.ts
    lib/                      cx.ts format.ts speech.ts
    features/
      app-state/              types.ts initial-state.ts store.tsx toast.tsx routes.ts app-state-provider.tsx
      landing/                components/{hero,promises-section,pricing-teaser,privacy-cta}.tsx landing-screen.tsx
      auth/                   auth-screen.tsx
      onboarding/             components/{onboarding-frame,goal-step,mic-check,consent-rows,consent-step}.tsx onboarding-screen.tsx
      dashboard/              components/{readiness-card,countdown-card,today-tasks,recent-attempt-card}.tsx dashboard-screen.tsx
      select/                 components/{mode-grid,voice-picker,pre-exam-card}.tsx select-screen.tsx
      forecast/               types.ts builders.ts topics-p1.ts topics-p23.ts data.ts components/{coverage-banner,forecast-toolbar,topic-card,topic-detail-modal}.tsx forecast-screen.tsx
      exam/                   types.ts data.ts use-exam-session.ts components/{exam-header,exam-intro,question-stage,cue-card-panel,live-transcript,exam-controls,pre-submit-modal,exit-exam-modal}.tsx exam-screen.tsx
      scoring/                data.ts scoring-screen.tsx
      results/                types.ts data.ts review-data.ts components/{band-hero,criteria-grid,criterion-detail,soft-paywall,review-list,report-modal}.tsx results-screen.tsx
      history/                types.ts data.ts components/{trend-chart,attempt-list}.tsx history-screen.tsx
      billing/                data.ts plan-utils.ts components/{plan-grid,fake-qr,payment-panel,paywall-modal}.tsx billing-screen.tsx
      privacy/                privacy-screen.tsx
    layouts/                  nav-items.ts user-card.tsx sidebar.tsx bottom-nav.tsx page-head.tsx app-shell.tsx screen-map.tsx
    routes/
      __root.tsx
      _app-legacy/            route.tsx login.tsx _auth/{route.tsx,dashboard.tsx}
      _proto/                 route.tsx index.tsx auth.tsx onboarding.tsx exam.tsx scoring.tsx
      _proto/app/             route.tsx dashboard.tsx select.tsx forecast.tsx history.index.tsx history.$attemptId.tsx billing.tsx privacy.tsx
```

## Phases
| # | Phase | Depends | Status |
|---|---|---|---|
| 1 | [Foundation: test harness, tokens, fonts, layout split](phase-01-foundation.md) | – | pending |
| 2 | [Design-system primitives + hooks + lib](phase-02-primitives.md) | 1 | pending |
| 3 | [App state store + mock data split](phase-03-state-data.md) | 1 | pending |
| 4 | [Routes, router provider bridge + app shell](phase-04-routes-shell.md) | 2, 3 | pending |
| 5 | [Screens → feature components](phase-05-screens.md) | 4 | pending |
| 6 | [Verification, visual parity + cleanup](phase-06-verify.md) | 5 | pending |

Phases 2 and 3 own strictly disjoint paths (`components/ds + hooks + lib` vs `features/*/types|data|store`) and have zero router type dependency on Phase 4.

## Acceptance criteria
- [ ] `pnpm test && pnpm check-types && pnpm build` exit 0 at repo root.
- [ ] Every one of the 12 prototype screens is reachable by URL and via in-app navigation; full flow `/` → `/auth` → `/onboarding` → `/app/dashboard` → `/app/select` → `/exam` → `/scoring` → `/app/history/$attemptId` → paywall/payment → `/app/billing` → `/app/privacy` → `/app/history` works end to end.
- [ ] Legacy `/login` and `/dashboard` (`_app-legacy/_auth/dashboard`) remain functional with `Header` and `ThemeProvider`, without leaking `html.dark` onto `_proto` routes.
- [ ] Side-by-side headless browser screenshots (prototype vs `apps/web`) at `390x844` and `1280x900` across all 12 screens show visual parity, recorded in `plans/261104-0713-clone-prototype-ui/reports/visual-parity-report.md`.
- [ ] Zero production `.ts`/`.tsx` files in `apps/web/src/{features,layouts,components/ds}` exceed 200 lines (`FNR>200` check); zero unrenamed `accent` or `muted` Tailwind token utilities in ported files.
- [ ] Zero changes under `packages/ui`, `packages/api`, `packages/db`, `packages/auth`, `packages/config`, `packages/infra`, or `apps/server`.

## Risks
- Token rename misses opacity/gradient/SVG variants (`to-accent`, `fill-muted`, `group-hover:text-accent`, `bg-accent/15`): mitigated by comprehensive regex grep gate in Phases 2, 4, 5, and 6.
- `next-themes` `html.dark` mutation or `@theme inline` font bleed across `_app-legacy` ↔ `_proto`: mitigated by `@layer base` `.proto-root`, `isolate`, scoped `--font-proto`/`--font-proto-mono`, and `useLayoutEffect` clearing `html.dark` in `_proto/route.tsx`.
- Keyframe name collisions with `tw-animate-css`: mitigated by naming keyframes `proto-rise`, `proto-fade`, `proto-pulse-ring`.

## Unresolved questions
- None.

## Validation Log

### Session 1 — 2026-11-04
**Questions asked:** 3
1. **Beta target branch**: Confirmed creating `origin/dev` from `main` (`5265b81`) and targeting `origin/dev` for `--beta --ship`.
2. **URL scheme**: Confirmed default `/`, `/auth`, `/onboarding`, `/exam`, `/scoring`, and `/app/{dashboard,select,forecast,history,history/$attemptId,billing,privacy}`, preserving `/login` and `/_auth/dashboard`.
3. **Test strategy**: Confirmed adding `vitest` (`jsdom` + `@testing-library/react`) in `apps/web` alongside `pnpm check-types`, `pnpm build`, and 390px/1280px visual comparison.

### Verification Results
- **Tier:** Full (6 phases, all 4 roles: Fact Checker, Flow Tracer, Scope Auditor, Contract Verifier)
- **Claims checked:** 92 | **Verified:** 92 | **Failed:** 0 | **Unverified:** 0

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-foundation.md`, `phase-02-primitives.md`, `phase-03-state-data.md`, `phase-04-routes-shell.md`, `phase-05-screens.md`, `phase-06-verify.md`
- Decision deltas checked: 11
- Reconciled stale references: 14 (`history.tsx`→`history.index.tsx`, Phase 3/4 router split, `flows.test.tsx`→per-slice tests, `forecast/topics-*` & `results/review-data.ts`, `user-card.tsx`, `lib/speech.ts`, `test/setup.ts`, `FNR>200` awk gate)
- Unresolved contradictions: 0

## Red Team Review

### Session — 2026-11-04
**Findings:** 12 (11 accepted, 1 rejected)
**Severity breakdown:** 5 Critical, 5 High, 2 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---|---|---|---|
| 1 | Unset `VITE_SERVER_URL` crashes `trpc.ts` at bootstrap; unguarded `_auth` `getSession()` | Critical | Accept | Phase 1, Phase 6 |
| 2 | Phase 3 typed `useNavigate()` fails `tsc` before Phase 4 creates `_proto` routes | Critical | Accept | Phase 3, Phase 4 |
| 3 | Stale `history.tsx` vs `history.index.tsx` swallows `/app/history/$attemptId` | Critical | Accept | `plan.md`, Phase 4, Phase 5 |
| 4 | `vitest.config.ts` missing `react()`/`tanstackRouter()`/`setup.ts`; bare `speechSynthesis` crashes `jsdom` | Critical | Accept | Phase 1, Phase 2, Phase 5 |
| 5 | Monolithic `flows.test.tsx` in Task 5.1 breaks Task 5.2/5.3 `check-types` | Critical | Accept | Phase 5 |
| 6 | `useMicLevel` leaks `MediaStream` tracks if `AudioContext` throws & races `raf` | High | Accept | Phase 2 |
| 7 | `next-themes` leaves `html.dark`; unlayered `.proto-root`, missing `isolate`, global `--font-mono`, legacy callers | High | Accept | Phase 1 |
| 8 | `/scoring` Back-loop & `s.consent.save`, sticky `PaywallModal`, `Exam` modal/button timer & keydown races | High | Accept | Phase 3, Phase 4, Phase 5 |
| 9 | Wide-line `forecast`/`results` >200 lines, `NR` vs `FNR` awk bug, `exam ↔ select` cycle, source citations | High | Accept | `plan.md`, Phase 3, Phase 5, Phase 6 |
| 10 | Deterministic `$attemptId` (`'latest'` vs concrete ID) contract for `ResultsScreen` | High | Accept | `plan.md`, Phase 3, Phase 5 |
| 11 | `?raw` CSS test import & expanded token grep gate across all ported dirs | Medium | Accept | Phase 1, 2, 4, 5, 6 |
| 12 | Replace Google Fonts `@import` with `@fontsource/*` & hide mock payment controls in prod | Medium | Reject | Contradicts locked Issue #1 mock-parity scope |

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-foundation.md`, `phase-02-primitives.md`, `phase-03-state-data.md`, `phase-04-routes-shell.md`, `phase-05-screens.md`, `phase-06-verify.md`
- Decision deltas checked: 11
- Reconciled stale references: 14
- Unresolved contradictions: 0
