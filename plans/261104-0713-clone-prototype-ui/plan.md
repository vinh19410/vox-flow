---
title: "Clone vox-flow-prototype UI into apps/web, restructured into components"
description: "Port the Figma-Make prototype (12 screens, ~130KB single-file screens) into the TanStack Router app as small feature-scoped components with route-based navigation."
status: pending
priority: P2
effort: 14h
issue: null
branch: vinh19410/feat/clone-prototype-ui
tags: [frontend, refactor, ui]
blockedBy: []
blocks: []
created: 2026-11-04
---

# Clone prototype UI into `apps/web`

Source: `github.com/vinh19410/vox-flow-prototype` (private, Vite + React 19 + Tailwind v4, state-based screen switching, mock data, brand "ChấmRõ" — IELTS Speaking mock test).
Target: `apps/web` (TanStack Router file routes, Tailwind v4 via `@vox-flow/ui/globals.css`, shadcn primitives in `packages/ui`).

## Outcome
Every prototype screen (S01–S25 incl. forecast) renders in `apps/web` with the same look and behavior, as real routes, built from small components. No screen file exceeds ~200 lines; no behavior change; still mock data (no backend/auth wiring).

## Non-goals
- Wiring tRPC / Better-Auth / DB to prototype flows (mock state stays).
- Redesigning anything; porting `.figma/`, `AGENTS.md`, `vite.config.ts` Figma plugins.
- Replacing shadcn primitives in `packages/ui` with the prototype's.

## Key findings (scouted)
| Finding | Consequence |
|---|---|
| Prototype is one `useState` screen switcher (`Screen` union + `go()`), no router | Convert to file routes; `go(screen)` becomes `navigate({to})` |
| Biggest files: Exam 19.7KB, Results 18.6KB, data.ts 14.6KB, Onboarding 13KB, Billing 11.9KB, Landing 11.5KB, Forecast 13.6KB (+forecast.ts 11.7KB data) | These are the split targets |
| `ui.tsx` bundles Button/Card/Badge/Toggle/Logo/BandRange/Modal/Wave + `useMicLevel` hook + `cx`/`mmss` | Split one-per-file |
| Prototype tokens `accent`, `muted` collide with shadcn `--color-accent` / `--color-muted` in `packages/ui/src/styles/globals.css:98,100` | Rename prototype tokens on port (`accent→brand`, `muted→subtle`) via codemod |
| Prototype `Button` name collides with `@vox-flow/ui/components/button` | Keep prototype primitives in `apps/web/src/components/ds/`, do not touch shared package |
| `routes/__root.tsx` wraps all routes in dark-theme + `Header` grid; `routes/index.tsx` is scaffold placeholder; `_auth/dashboard` exists | Prototype needs a bare layout; URL scheme below |
| Prototype deps (react 19, lucide-react, tailwind 4) already in `apps/web` | No new dependencies |

## Decisions (defaults — change before cook if you disagree)
1. **URLs**: `/` landing, `/auth`, `/onboarding`, `/exam`, `/scoring`; in-app (sidebar shell) under `/app/{dashboard,select,forecast,history,history/$attemptId,billing,privacy}`. Scaffold `/` placeholder removed; `/login` and `_auth/dashboard` kept.
2. **State**: keep the mock `AppState` as a React context provider mounted on the prototype layout (not global, not persisted).
3. **Screen map dev panel** (floating "Màn hình" jump menu) kept, rendered only in `import.meta.env.DEV`.
4. **Theme**: prototype is light-only; prototype layout does not use `next-themes` dark mode.

## Target structure
```
apps/web/src/
  components/ds/            button card badge toggle modal logo band-range wave  (+ index barrel not used; import by file)
  hooks/use-mic-level.ts
  lib/cx.ts  lib/format.ts  (vnd, fmtBand, mmss)
  features/
    app-state/              context.tsx  initial-state.ts  types.ts
    landing/  auth/  onboarding/  dashboard/  select/  forecast/
    exam/  scoring/  results/  history/  billing/  privacy/
      each: components/*.tsx, data.ts (mock), <feature>-screen.tsx (thin composition)
  layouts/                  app-shell.tsx (sidebar+bottom nav)  page-head.tsx  screen-map.tsx
  routes/                   thin files: createFileRoute + render <XScreen/>
```

## Phases
| # | Phase | Depends | Status |
|---|---|---|---|
| 1 | [Foundation: tokens, fonts, layout split](phase-01-foundation.md) | – | pending |
| 2 | [Design-system primitives + hooks + lib](phase-02-primitives.md) | 1 | pending |
| 3 | [App state + mock data split](phase-03-state-data.md) | 1 | pending |
| 4 | [Routes + app shell](phase-04-routes-shell.md) | 2,3 | pending |
| 5 | [Screens → feature components](phase-05-screens.md) | 4 | pending |
| 6 | [Verification + cleanup](phase-06-verify.md) | 5 | pending |

Phases 2 and 3 can run in parallel (disjoint files). Phase 5 can fan out per feature after phase 4.

## Acceptance criteria
- `pnpm install && pnpm check-types && pnpm build` pass at repo root.
- Each of the 12 screens reachable by URL and via the in-app navigation; full flow landing → auth → onboarding → dashboard → select → exam → scoring → results → paywall → billing works end to end.
- Side-by-side screenshots (prototype vs `apps/web`) at 390px and 1280px show no visible difference for each screen.
- No file in `features/**` or `layouts/**` over ~200 lines; no duplicated primitives.
- No change under `packages/ui`, `packages/api|db|auth`, `apps/server`.

## Risks
- Token rename codemod misses dynamic class strings (`cx(... 'text-accent')` is fine; template literals need grep).
- Tailwind `@source` in `packages/ui` globals already scans `apps/**`, so new files are covered.
- Private source repo: clone requires `gh` auth (verified working).
- Google Fonts `@import` stays external; acceptable for design parity.

## Unresolved questions
1. Is the URL scheme in Decision 1 acceptable, or should prototype take `/dashboard` etc. and replace `_auth/dashboard`?
2. Should prototype `ds/` primitives later be merged into `@vox-flow/ui` (needs token/variant reconciliation)? Out of scope here.
