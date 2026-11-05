# Phase 2 — Primitives, hooks, lib

## Objective
Split `src/ui.tsx` (8.9KB) and shared helpers into one-concern files.

## Files (all new, under `apps/web/src/`)
- `lib/cx.ts` (`cx`), `lib/format.ts` (`vnd`, `fmtBand`, `mmss`, `daysUntil`)
- `hooks/use-mic-level.ts` (`useMicLevel`)
- `components/ds/{button,card,badge,toggle,logo,band-range,modal,wave}.tsx`
- `layouts/page-head.tsx` (from `Shell.tsx` `PageHead`)

## Steps
1. Copy each export from prototype `ui.tsx` into its own file; typed props exported; replace token classes per phase-1 rename (`accent`→`brand`, `muted`→`subtle`).
2. Each primitive named-export only, no barrel file; consumers import by path.
3. Move `vnd/fmtBand/modeLabel` from `data.ts` only if they are pure formatters (`modeLabel` stays with select data).

## Validation
`pnpm --filter web check-types`. Temporary smoke route or story not required; verified through phase 5 screens.

## Parallel ownership
Owns `components/ds/**`, `hooks/**`, `lib/cx.ts`, `lib/format.ts`, `layouts/page-head.tsx`. Does not touch state/data files.
