# Phase 1 — Foundation

## Objective
Prepare `apps/web` to host prototype UI without touching shared packages.

## Files
- Modify: `apps/web/src/index.css`, `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/styles/prototype-theme.css`, `apps/web/src/routes/_proto.tsx` (bare layout), `apps/web/src/routes/_app-legacy.tsx` (Header layout wrapping `/login`, `_auth/*`)
- Reference clone (read-only): shallow clone source to `/tmp/vox-flow-prototype-src` (do not commit)

## Steps
1. `gh repo clone vinh19410/vox-flow-prototype /tmp/vox-flow-prototype-src -- --depth 1`.
2. Create `prototype-theme.css` with the prototype `@theme` block, renaming `--color-accent*`→`--color-brand*`, `--color-muted`→`--color-subtle`; keep `paper, paper-2, ink, ink-2, line, good*, warn*, bad*, info*`, fonts, `rise/fade/pulse-ring` animations, `.tnum`. Import after the ui globals in `index.css`.
3. Fonts: keep the Google Fonts `@import` (Be Vietnam Pro, JetBrains Mono) at the top of `prototype-theme.css`.
4. Slim `__root.tsx` to head meta + `<Outlet/>` + devtools; move ThemeProvider/Header/Toaster grid into the legacy layout so `/login` and `_auth` keep current look.
5. `_proto.tsx`: wraps children in `AppStateProvider` (added in phase 3) and sets prototype body background class; light-only.
6. Delete scaffold `routes/index.tsx` placeholder (landing replaces it in phase 5).

## Validation
`pnpm --filter web build`; `/login` still renders with Header; `bg-paper` utility resolves.

## Rollback
`git checkout apps/web/src` .
