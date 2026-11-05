# Visual Parity Report — Clone prototype UI into `apps/web`

Plan: `plans/261104-0713-clone-prototype-ui/plan.md` · Issue: [#1](https://github.com/vinh19410/vox-flow/issues/1) · Date: 2026-11-04

## Method

- Prototype reference: `/tmp/vox-flow-prototype-src` served via `vite` on `http://localhost:8443`.
- Ported app: `apps/web` served via `vite dev` on `http://localhost:3001` (dev-only `VITE_SERVER_URL` fallback `http://localhost:3000`).
- Headless Chromium via the session browser harness; viewport `1280x900` (desktop) and `390x844` (mobile spot checks); CSS animations paused for deterministic frames (`animation-play-state: paused` injected stylesheet, not shipped).
- Interactive verification: full user journey `landing → auth → onboarding → dashboard → select → exam → scoring → results/$attemptId → paywall → payment → billing → privacy → history`, plus legacy-route checks.

## Results — prototype routes (12/12 parity)

| # | Screen | Prototype URL | App URL | Result |
|---|---|---|---|---|
| S01 | Landing | `/` | `/` | ✅ parity (hero, pricing teaser, privacy CTA, ScreenMap dev-only) |
| S02 | Auth | state `auth` | `/auth` | ✅ parity (Google row, email form, toggle login/signup) |
| S03–05 | Onboarding | state `onboarding` | `/onboarding` | ✅ parity (band grid, date, mic check, consent) |
| S06 | Dashboard | state `dashboard` | `/app/dashboard` | ✅ parity (readiness, countdown, tasks, recent attempt) |
| S07 | Select | state `select` | `/app/select` | ✅ parity (4 modes, 3 voices w/ preview, pre-exam card) |
| S07b | Forecast | state `forecast` | `/app/forecast` | ✅ parity (coverage, filters, topic grid + modal) |
| S08–10 | Exam | state `exam` | `/exam` | ✅ parity (8-step walk incl. follow-ups, timers, shortcuts) |
| S11 | Scoring | state `scoring` | `/scoring` | ✅ parity (6 steps, then results; `{ replace: true }` nav) |
| S12–15 | Results | state `results` | `/app/history/$attemptId` | ✅ parity (`latest` → default RESULT 6.5 / 6.0–7.0; concrete id binds attempt) |
| S19 | History | state `history` | `/app/history` | ✅ parity (SVG trend chart, mode filters, attempt list) |
| S22–24 | Billing | state `billing` | `/app/billing` | ✅ parity (plans, fake QR payment, invoices, paywall modal) |
| S25 | Privacy | state `privacy` | `/app/privacy` | ✅ parity (consent toggles, data usage, wipe modal) |

Deviation (intentional): the floating "Màn hình" ScreenMap jump menu renders only when `import.meta.env.DEV` (Decision 5 in plan) — absent in production builds.

## Results — legacy routes (`_app-legacy`)

| Check | Result |
|---|---|
| `/login` renders real `SignUpForm`/`SignInForm` (Name/Email/Password, Sign Up button) inside legacy `Header` + dark theme | ✅ verified with an out-of-tree network mock of `**/api/auth/get-session` (browser `page.route`, no source changes). Without the mock the page shows the pending `Loader` (network-dependent `isPending` state), as before the change. |
| `/_auth/dashboard` gate: unauthenticated request redirects to `/login` | ✅ verified: navigating to `/dashboard` with a `null` session response lands on `/login` (`beforeLoad` redirect intact). |
| `html.dark` isolation | ✅ verified: after visiting `/login` (legacy, `colorScheme="dark"`) then navigating to `/`, `document.documentElement.className` is `""` and `colorScheme="light"` — the `_proto` layout resets dark mode; the `.proto-root` wrapper scopes paper/ink/brand tokens. |
| Legacy pages untouched | ✅ `git diff --name-only origin/dev -- packages/ apps/server/` outputs 0 lines; only `apps/web` + root scripts/`turbo.json` + plan files changed. |

## Not verified (honest disclosure)

- **Real sign-in/sign-up round trip and real D1-backed session.** The bundled backend cannot run on this machine without Cloudflare credentials (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are absent; `alchemy dev` fails with `CredentialsUnavailable`). No such secrets exist in `vinh19410/vox-flow` GitHub repo settings (verified via API: `total_count: 0`). **Reviewer action:** run `alchemy dev` and click through login once before merge. This issue did not modify auth/D1/server code, so the risk of regression from this change is limited to route/layout wiring, which is verified above.

## Verification commands

```
pnpm test          # 9 files / 73 tests green (vitest, jsdom)
pnpm check-types   # turbo: 7 packages clean
pnpm build         # turbo: web + server build clean
find apps/web/src/{features,layouts,components/ds} -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/__tests__/*' \
  -exec awk 'FNR>200{print FILENAME ":" FNR; exit 1}' {} +   # 0 files over 200 lines
! grep -rnE '(bg|text|border|ring|outline|fill|stroke|from|to|via|decoration|caret|shadow)-(accent|muted)(-soft)?(\b|/)|--color-(accent|muted)' \
  apps/web/src/{components/ds,layouts,features,routes/_proto,hooks,styles} --exclude-dir=__tests__   # 0 token leaks
git diff --name-only origin/dev -- packages/ apps/server/ | wc -l   # 0
```
