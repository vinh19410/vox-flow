---
phase: 6
title: "Verification, visual parity + cleanup"
status: pending
priority: P1
effort: "2h"
dependencies: [5]
---

# Phase 6: Full Verification, Visual Parity Audit, Docs, and Cleanup

<!-- Updated: Validation Session 1 - Added headless browser 390px/1280px parity script/report, legacy route verification, line-count gate, and Failure Protocol -->
<!-- Updated: Red Team Session 1 - Ordered check-types/build before root test or via vitest router plugin, added explicit VITE_SERVER_URL in server launch, FNR>200 check, and expanded token grep gate -->

## Goal
Verify full-monorepo build/typecheck/tests, run end-to-end interactive flow and 390px/1280px visual screenshot comparison between `/tmp/vox-flow-prototype-src` and `apps/web` across all 12 screens plus legacy `/login` → `/` transition, document the prototype UI structure in `README.md`, and remove temporary external artifacts.

## Files to Create / Modify
- Create: `plans/261104-0713-clone-prototype-ui/reports/visual-parity-report.md`
- Modify: `README.md` (document `apps/web` prototype routes, feature structure, and `brand`/`subtle` token convention)

## Tasks & Steps

### Task 6.1 — Workspace build, typecheck, test, line-budget, and boundary audit
- [x] Run root `pnpm check-types`, `pnpm test`, `pnpm build`, per-file `FNR>200` check, token-leak check, and shared-package diff check.
- **Goal**: Prove zero compile/test regressions, strict ≤200-line adherence, zero token leaks, and zero edits outside `apps/web`, root scripts/`turbo.json`/`README.md`, and `plans/`.
- **Target files and symbols**:
  - Workspace root (`package.json`, `turbo.json`, `apps/web/**`)
- **Steps**:
  1. Run `pnpm check-types && pnpm test && pnpm build` at the worktree root.
  2. Run `find apps/web/src/features apps/web/src/layouts apps/web/src/components/ds -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/__tests__/*' -exec awk 'FNR>200{print FILENAME ":" FNR; exit 1}' {} +`.
  3. Run `! grep -rnE '(bg|text|border|ring|outline|fill|stroke|from|to|via|decoration|caret|shadow)-(accent|muted)(-soft)?(\b|/)|--color-(accent|muted)' apps/web/src/{components/ds,layouts,features,routes/_proto,hooks,styles} --exclude-dir=__tests__` and `! grep -rn '/tmp/vox-flow-prototype-src' apps/web`.
  4. Run `git diff --name-only origin/dev -- packages/ apps/server/` confirming 0 lines output.
- **Success criteria**: All four checks pass mechanically with exit code 0.
- **Verify**: `pnpm check-types && pnpm test && pnpm build` exits 0; `git diff --name-only origin/dev -- packages/ apps/server/ | wc -l` outputs `0`.

### Task 6.2 — End-to-end interactive flow & 390px / 1280px visual parity comparison
- [x] Start both prototype (`vite`) and `apps/web` (`VITE_SERVER_URL=http://localhost:3000 vite`), compare 390px and 1280px screenshots across all 12 screens + walk E2E flow + check `/login` → `/` theme isolation, and write `reports/visual-parity-report.md`.
- **Goal**: Confirm visual/layout/typography parity across all 12 screens at mobile (`390x844`) and desktop (`1280x900`) viewports and verify interactive E2E flow (`/` → `/auth` → `/onboarding` → `/app/dashboard` → `/app/select` → `/exam` → `/scoring` → `/app/history/$attemptId` → paywall → payment → `/app/billing` → `/app/privacy` → `/app/history`, plus `/login` → `/` confirming `html.dark` is cleared).
- **Target files and symbols**:
  - `plans/261104-0713-clone-prototype-ui/reports/visual-parity-report.md`
- **Steps**:
  1. Install deps in `/tmp/vox-flow-prototype-src` (`pnpm --dir /tmp/vox-flow-prototype-src install`) and serve prototype on a local port alongside `apps/web` (`VITE_SERVER_URL=http://localhost:3000`).
  2. Using Chromium browser automation (pausing CSS animations for deterministic frames while keeping `Scoring` captured at initial step before redirect), open each of the 12 screens (`S01`–`S25`, using `/app/history/latest` for `S12`) at `390x844` and `1280x900` on both servers, compare computed styles/DOM/screenshots, and exercise the full interactive user journey + `/login` → `/` dark-mode isolation check.
  3. Fix any visual discrepancy found in `apps/web` and re-verify.
  4. Record measured comparison evidence in `plans/261104-0713-clone-prototype-ui/reports/visual-parity-report.md` (do not commit raw PNG dumps into git).
  5. Stop both temporary servers and remove `/tmp/vox-flow-prototype-src` ONLY after all Phase 6 checks succeed (note: keep `/tmp/vox-flow-prototype-src` until Phase 6 Task 6.2 is 100% verified!).
- **Success criteria**: All 12 screens match prototype at 390px and 1280px, E2E journey succeeds, `/login` → `/` clears `html.dark`, and temporary servers + `/tmp/vox-flow-prototype-src` are cleaned up.
- **Verify**: `test -f plans/261104-0713-clone-prototype-ui/reports/visual-parity-report.md && test ! -e /tmp/vox-flow-prototype-src` exits 0.

### Task 6.3 — Update `README.md` documentation
- [x] Add concise "Web Prototype UI (`apps/web`)" section to `README.md`.
- **Goal**: Document route map (`_proto` vs `_app-legacy`), feature directory conventions, and `brand`/`subtle` token separation from `@vox-flow/ui`.
- **Target files and symbols**:
  - `README.md`
- **Steps**:
  1. Edit `README.md` to add route map, `features/*` / `components/ds/*` architecture notes, and `pnpm test` / `pnpm check-types` / `pnpm build` commands.
- **Success criteria**: `README.md` accurately reflects shipped routes and scripts without referencing temporary paths.
- **Verify**: `grep -q "/app/history/\\$attemptId" README.md && pnpm check-types` exits 0.

## Verification
- `pnpm test && pnpm check-types && pnpm build` exits 0.
- `plans/261104-0713-clone-prototype-ui/reports/visual-parity-report.md` exists and documents 12/12 screen parity at 390px and 1280px.
- `/tmp/vox-flow-prototype-src` removed and zero background dev servers left running.

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
