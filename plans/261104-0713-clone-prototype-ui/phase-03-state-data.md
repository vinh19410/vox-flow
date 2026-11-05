# Phase 3 — App state and mock data

## Objective
Separate types, initial state, provider, and per-feature mock data.

## Files (new, `apps/web/src/features/`)
- `app-state/types.ts` (`AppState`, `Ctx`; drop `Screen` union)
- `app-state/initial-state.ts` (INITIAL incl. `inThreeWeeks`)
- `app-state/app-state-provider.tsx` (holds `useState`, `set`, `toast`, `openPaywall`; exposes `useApp()`; `go` replaced by router navigate wrapper `goTo(path)`)
- `app-state/toast.tsx` (toast pill UI from `App.tsx`)
- Split `data.ts` (14.6KB): `exam/data/items.ts` (`ITEMS`, `MIN_WORDS`, `VOICES`), `select/data.ts` (`MODES`, `modeLabel`), `results/data.ts` (`RESULT`, `REVIEW`, types), `history/data.ts` (`HISTORY`, `Attempt`), `billing/data.ts` (`PLANS`)
- `forecast/data.ts` (move `forecast.ts`; split builder helpers `p1`/`p23` from the `FORECAST` array if file >200 lines)

## Steps
1. Move types with their data; avoid circular imports (`exam` types imported by `app-state/types.ts` from a shared `features/exam/types.ts`).
2. Keep values byte-identical (mock content is design reference).
3. `useApp` keeps the same shape so screen ports need minimal edits.

## Validation
`pnpm --filter web check-types`; a grep confirms no remaining import of `./data` monolith.

## Parallel ownership
Owns `features/app-state/**` and all `features/*/data*.ts|types.ts`. Does not touch `components/ds`.
