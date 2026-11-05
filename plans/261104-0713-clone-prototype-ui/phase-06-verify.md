# Phase 6 — Verification and cleanup

## Steps
1. `pnpm install && pnpm check-types && pnpm build` at repo root; fix regressions, do not weaken config.
2. Walk the full flow manually (landing → auth → onboarding → dashboard → select → exam all 3 parts → scoring → results → paywall → payment → billing → privacy → history). Mic denied path falls back to simulated level.
3. Screenshot comparison prototype vs app, 390px and 1280px, all 12 screens; log diffs in `plans/261104-0713-clone-prototype-ui/reports/`.
4. Size audit: `find apps/web/src/features apps/web/src/layouts -name '*.tsx' | xargs wc -l | sort -n | tail` — nothing over ~200 lines.
5. Dead code: no leftover monolith `data.ts`/`ui.tsx`, no unused exports, no `/tmp` clone references.
6. Docs: add a short "Prototype UI" section to `README.md` (routes, folder layout, how tokens differ from shadcn tokens). Only if behavior/setup docs changed.
7. Stop any dev server started during verification; remove `/tmp/vox-flow-prototype-src`.

## Done when
All acceptance criteria in `plan.md` are verified with command output or screenshots.
