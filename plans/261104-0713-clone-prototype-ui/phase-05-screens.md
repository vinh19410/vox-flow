# Phase 5 — Screens into feature components

## Objective
Port each screen, splitting by visual section/sub-view. One screen component per feature composes small components. Port order is by dependency; features are independent after phase 4 and can be parallelised (file ownership = the feature folder).

## Split plan (source size → components)
| Feature | Source | Components |
|---|---|---|
| landing | Landing 11.5KB | `hero`, `how-it-works`, `feature-grid`, `pricing-teaser`, `footer`, `landing-screen` |
| auth + onboarding | Onboarding 13KB | `auth-form`, `onboarding-frame`, `target-band-step`, `exam-date-step`, `mic-check` (shared by dashboard/exam), `consent-rows`, `consent-step`, `onboarding-screen` |
| dashboard | 8.7KB | `readiness-card`, `countdown`, `recent-attempts`, `next-actions`, `dashboard-screen` |
| select | 6KB | `mode-card`, `voice-picker`, `select-screen` |
| forecast | 13.6KB | `filter-bar`, `topic-card`, `topic-detail-modal`, `quarter-banner`, `forecast-screen` |
| exam | **19.7KB** | `use-exam-session` (hook: phase machine + `Step`, timers, `WPS` transcript sim), `exam-intro`, `question-panel`, `prep-timer`, `recording-panel`, `live-transcript`, `submit-warning-modal`, `part-info`, `exam-screen` |
| scoring | 3.7KB | `scoring-steps`, `scoring-screen` |
| results | **18.6KB** | `band-hero`, `criterion-list`, `criterion-detail`, `evidence-quote`, `soft-paywall`, `review-list`, `review-segment` (grammar/vocab/pron marks), `report-modal`, `results-screen` |
| history | 4.9KB | `attempt-row`, `trend-chart`, `history-screen` |
| billing | 11.9KB | `plan-grid`, `payment-panel`, `fake-qr`, `paywall-modal`, `account-panel`, `billing-screen` |
| privacy | 3.7KB | `privacy-rows` (reuses `consent-rows`), `privacy-screen` |

## Rules
- Shared pieces used by ≥2 features (`mic-check`, `consent-rows`, `paywall-modal`) live in the owning feature and are imported by path; no cross-feature barrel.
- Logic that is not rendering (timers, phase machine, filters) moves into a `use-*.ts` hook next to the screen.
- Preserve all Vietnamese copy and class strings exactly, except the token rename.
- Replace every `go('x')` with router navigation; `openPaywall()` / `toast()` unchanged.
- Apply the codemod `\b(bg|text|border|ring|from|to|via|fill|stroke|outline)-(accent)(-soft)?\b → brand` and `muted → subtle` in ported files only; then grep for leftovers in template literals.

## Validation per feature
Type-check, open the route, compare screenshot with the running prototype (`pnpm dlx vite` in the clone) at 390 and 1280px.
