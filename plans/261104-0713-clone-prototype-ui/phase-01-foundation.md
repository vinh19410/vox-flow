---
phase: 1
title: "Foundation: test harness, tokens, fonts, layout split"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Foundation — Test Harness, Tokens, Fonts, Layout Split

<!-- Updated: Validation Session 1 - Added Vitest harness, turbo test task, CSS @import ordering, and .proto-root theme/font isolation -->
<!-- Updated: Red Team Session 1 - Added VITE_SERVER_URL fallback, react()+tanstackRouter()+setup.ts in Vitest, @layer base + isolate + html.dark reset, ?raw CSS import, and legacy caller updates -->

## Goal
Configure `vitest` (`react()`, `tanstackRouter()`, `src/test/setup.ts`) in `apps/web` and `turbo.json`, harden `trpc.ts`/`auth-client.ts` against missing `.env`, define isolated prototype design tokens (`brand`, `subtle`, `paper`, `ink`) inside `@layer base`, and split TanStack Router layouts into `_app-legacy` and `_proto` with zero `html.dark` or font bleed.

## Files to Create / Modify
- Modify: `package.json` (add `"test": "turbo run test"`)
- Modify: `turbo.json` (add `"test"` task definition)
- Modify: `apps/web/package.json` (add `"test": "vitest run"` script and devDependencies `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`)
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Modify: `apps/web/src/utils/trpc.ts` (safe fallback `(ENV.VITE_SERVER_URL ?? "http://localhost:3000")`)
- Modify: `apps/web/src/lib/auth-client.ts` (safe fallback `ENV.VITE_SERVER_URL ?? "http://localhost:3000"`)
- Modify: `apps/web/src/components/sign-in-form.tsx` (`useNavigate({ from: "/login" })`)
- Modify: `apps/web/src/components/sign-up-form.tsx` (`useNavigate({ from: "/login" })`)
- Modify: `apps/web/src/components/user-menu.tsx` (signOut navigates `to: "/login"`)
- Create: `apps/web/src/styles/prototype-theme.css`
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/routes/_app-legacy/route.tsx`
- Move/Modify: `apps/web/src/routes/login.tsx` → `apps/web/src/routes/_app-legacy/login.tsx`
- Move/Modify: `apps/web/src/routes/_auth/route.tsx` → `apps/web/src/routes/_app-legacy/_auth/route.tsx` (with `try/catch` around `authClient.getSession()`)
- Move/Modify: `apps/web/src/routes/_auth/dashboard.tsx` → `apps/web/src/routes/_app-legacy/_auth/dashboard.tsx`
- Create: `apps/web/src/routes/_proto/route.tsx`
- Create: `apps/web/src/routes/_proto/index.tsx` (minimal landing placeholder until Phase 5)
- Delete: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/styles/__tests__/prototype-theme.test.ts`

## Tasks & Steps

### Task 1.1 — Configure Vitest + `src/test/setup.ts` in `apps/web` and root Turbo pipeline
- [x] Configure `vitest` with `react()`, `tanstackRouter()`, and `jsdom` browser API setup in `apps/web`, and wire root `pnpm test`.
- **Goal**: `pnpm --filter web test` and `pnpm test` execute Vitest cleanly in `jsdom`, auto-generate `routeTree.gen.ts` when needed, clean up React 19 trees after each test, and stub missing `jsdom` Web APIs.
- **Target files and symbols**:
  - `package.json` (`scripts.test`)
  - `turbo.json` (`tasks.test`)
  - `apps/web/package.json` (`scripts.test`, `devDependencies`)
  - `apps/web/vitest.config.ts` (`defineConfig`)
  - `apps/web/src/test/setup.ts`
- **Steps**:
  1. Install `vitest@^5.1.0`, `jsdom@^30.1.3`, `@testing-library/react@^16.3.3`, `@testing-library/dom@^10.4.0` in `apps/web` via `pnpm --filter web add -D vitest jsdom @testing-library/react @testing-library/dom`.
  2. Add `"test": "vitest run"` to `apps/web/package.json` `scripts`, `"test": "turbo run test"` to root `package.json` `scripts`, and `"test": { "dependsOn": ["^build"] }` to `turbo.json` `tasks`.
  3. Create `apps/web/src/test/setup.ts` importing `{ afterEach } from "vitest"` and `{ cleanup } from "@testing-library/react"`, setting `(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true`, registering `afterEach(() => cleanup())`, and defining safe no-op stubs on `window`/`globalThis` when absent for `window.scrollTo`, `window.matchMedia`, `globalThis.speechSynthesis` (`speak`, `cancel`), `globalThis.SpeechSynthesisUtterance`, and `globalThis.AudioContext`.
  4. Create `apps/web/vitest.config.ts` with `plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react()]`, `resolve: { tsconfigPaths: true }`, and `test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"], include: ["src/**/*.test.{ts,tsx}"] }`. Keep `apps/web/tsconfig.json` untouched (`"types": ["vite/client"]`).
- **Success criteria**: Vitest runs with React 19 cleanup and Web API stubs without requiring `@types/node` in `apps/web/tsconfig.json`.
- **Verify**: Write red test `apps/web/src/styles/__tests__/prototype-theme.test.ts` using `import themeCss from "../prototype-theme.css?raw"` (`vite/client` native `?raw` module) asserting `themeCss` defines `--color-brand: #ff5b24` and `--color-subtle: #747887` and does NOT define `--color-accent` or `--color-muted`. Run `pnpm --filter web test`: exits non-zero because `prototype-theme.css` does not exist yet (TDD Red).

### Task 1.2 — Create `prototype-theme.css` and wire `apps/web/src/index.css`
- [x] Author prototype tokens, `@layer base` `.proto-root` typography/surface rules, and `@import` order.
- **Goal**: Prototype color/animation tokens (`bg-paper`, `text-ink`, `bg-brand`, `bg-brand-soft`, `text-subtle`, `animate-rise`, `animate-fade`, `animate-pulse-ring`, `.tnum`) compile via Tailwind v4 without overriding Tailwind utilities or leaking fonts/colors into `_app-legacy`.
- **Target files and symbols**:
  - `apps/web/src/styles/prototype-theme.css`
  - `apps/web/src/index.css`
- **Steps**:
  1. Update `apps/web/src/index.css` so line 1 is `@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap");`, line 2 is `@import "@vox-flow/ui/globals.css";`, and line 3 is `@import "./styles/prototype-theme.css";`.
  2. Create `apps/web/src/styles/prototype-theme.css` with `@theme` defining `--font-proto: "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif;`, `--font-proto-mono: "JetBrains Mono", ui-monospace, monospace;`, `--color-paper: #f5f3ee;`, `--color-paper-2: #ece9e1;`, `--color-ink: #12141c;`, `--color-ink-2: #3b3f4d;`, `--color-subtle: #747887;`, `--color-line: #dedad0;`, `--color-brand: #ff5b24;`, `--color-brand-soft: #ffe4d8;`, `--color-good: #128a5c;`, `--color-good-soft: #dcf2e8;`, `--color-warn: #b7791f;`, `--color-warn-soft: #fbefd6;`, `--color-bad: #d23a3a;`, `--color-bad-soft: #fbe1e1;`, `--color-info: #2f5bea;`, `--color-info-soft: #e1e8fd;`, and `--animate-rise` / `--animate-fade` / `--animate-pulse-ring` backed by `@keyframes proto-rise`, `@keyframes proto-fade`, `@keyframes proto-pulse-ring`.
  3. Inside `@layer base` in `prototype-theme.css`, scope `.proto-root` (`color-scheme: light; --background: #f5f3ee; --foreground: #12141c; --border: var(--color-line); --font-mono: var(--font-proto-mono); background-color: var(--color-paper); color: var(--color-ink); font-family: var(--font-proto); -webkit-font-smoothing: antialiased;`), `.proto-root .font-mono { font-family: var(--font-proto-mono); }`, `.proto-root ::selection { background: var(--color-brand-soft); }`, `.proto-root button:not(:disabled) { cursor: pointer; }`, `.proto-root button:disabled { cursor: not-allowed; }`, and `.tnum { font-variant-numeric: tabular-nums; }`.
- **Success criteria**: Token test passes and zero `@vox-flow/ui` files are modified.
- **Verify**: `pnpm --filter web test` exits 0 and passes `prototype-theme.test.ts` (TDD Green).

### Task 1.3 — Guard `VITE_SERVER_URL`, split `__root.tsx` into `_app-legacy` and `_proto`, and update legacy callers
- [x] Harden `trpc.ts`/`auth-client.ts`/`_auth`, isolate `_app-legacy` from `_proto` (with `isolate` and `html.dark` cleanup), and update legacy auth navigation callers.
- **Goal**: `apps/web` boots cleanly even without `.env` or a running backend; `/login` and `/dashboard` preserve `ThemeProvider` + `Header` + `Toaster`; `/` renders inside `.proto-root` with `html.dark` cleared and `-z-10` children visible.
- **Target files and symbols**:
  - `apps/web/src/utils/trpc.ts` (`trpcClient`)
  - `apps/web/src/lib/auth-client.ts` (`authClient`)
  - `apps/web/src/components/{sign-in-form,sign-up-form,user-menu}.tsx`
  - `apps/web/src/routes/__root.tsx` (`RootComponent`)
  - `apps/web/src/routes/_app-legacy/{route,login}.tsx`, `apps/web/src/routes/_app-legacy/_auth/{route,dashboard}.tsx`
  - `apps/web/src/routes/_proto/{route,index}.tsx`
- **Steps**:
  1. In `apps/web/src/utils/trpc.ts:27`, change `ENV.VITE_SERVER_URL.replace(/\/$/, "")` to `(ENV.VITE_SERVER_URL ?? "http://localhost:3000").replace(/\/$/, "")`. In `apps/web/src/lib/auth-client.ts:6`, change `baseURL: ENV.VITE_SERVER_URL` to `baseURL: ENV.VITE_SERVER_URL ?? "http://localhost:3000"`.
  2. Slim `apps/web/src/routes/__root.tsx` to `<HeadContent />`, `<Outlet />`, `<TanStackRouterDevtools />`, and `<ReactQueryDevtools />`, updating meta title to `"ChấmRõ — Thi thử IELTS Speaking AI"`.
  3. Create `apps/web/src/routes/_app-legacy/route.tsx` wrapping `<Outlet />` in `<ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange storageKey="vite-ui-theme"><div className="grid grid-rows-[auto_1fr] h-svh"><Header /><Outlet /></div><Toaster richColors /></ThemeProvider>`.
  4. Move `login.tsx` and `_auth/{route,dashboard}.tsx` under `_app-legacy/` (`"/_app-legacy/login"`, `"/_app-legacy/_auth"`, `"/_app-legacy/_auth/dashboard"`), wrapping `await authClient.getSession()` inside `_app-legacy/_auth/route.tsx` in `try/catch` that redirects to `"/login"` if `getSession()` throws or returns no `session?.data`. Delete old `routes/login.tsx`, `routes/_auth/*`, and `routes/index.tsx`.
  5. Update `sign-in-form.tsx` and `sign-up-form.tsx` from `useNavigate({ from: "/" })` to `useNavigate({ from: "/login" })`, and update `user-menu.tsx` `signOut` `onSuccess` from `navigate({ to: "/" })` to `navigate({ to: "/login" })`.
  6. Create `apps/web/src/routes/_proto/route.tsx` with `useLayoutEffect` removing `"dark"` from `document.documentElement.classList` and setting `document.documentElement.style.colorScheme = "light"`, rendering `<div className="proto-root isolate min-h-screen bg-paper text-ink"><Outlet /></div>`.
  7. Create `apps/web/src/routes/_proto/index.tsx` rendering `<div data-testid="proto-landing-stub" className="bg-paper text-brand">ChấmRõ</div>` until Phase 5.
- **Success criteria**: `routeTree.gen.ts` regenerates cleanly, `check-types` and `test` pass, and `--color-brand` is emitted in built CSS.
- **Verify**: `pnpm --filter web check-types && pnpm --filter web test` exits 0, and `grep -q -- "--color-brand" apps/web/dist/assets/*.css` exits 0.

## Verification
- `pnpm --filter web test` exits 0.
- `pnpm --filter web check-types` exits 0.
- `git diff --name-only packages/ apps/server/` outputs 0 lines.

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
