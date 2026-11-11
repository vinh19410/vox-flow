---
phase: 2
title: "Design-system primitives + hooks + lib"
status: completed
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 2: Design-System Primitives, Hooks, and Shared Utilities

<!-- Updated: Validation Session 1 - Added TDD unit tests for formatters and primitives, token rename details, and Failure Protocol -->
<!-- Updated: Red Team Session 1 - Added safe lib/speech.ts wrapper, MediaStream/AudioContext leak fixes + tests in use-mic-level.ts, and expanded token grep gate -->

## Goal
Split prototype `src/ui.tsx` (206 lines), safe Web Speech helpers, and pure formatters from `state.tsx`/`data.ts` into single-concern, strictly typed modules under `apps/web/src/{lib,hooks,components/ds,layouts}` with unit tests, leak-free media cleanup, and renamed `brand`/`subtle` token classes.

## Files to Create / Modify
- Create: `apps/web/src/lib/cx.ts`
- Create: `apps/web/src/lib/format.ts`
- Create: `apps/web/src/lib/speech.ts`
- Create: `apps/web/src/lib/__tests__/format.test.ts`
- Create: `apps/web/src/hooks/use-mic-level.ts`
- Create: `apps/web/src/hooks/__tests__/use-mic-level.test.ts`
- Create: `apps/web/src/components/ds/button.tsx`
- Create: `apps/web/src/components/ds/card.tsx`
- Create: `apps/web/src/components/ds/badge.tsx`
- Create: `apps/web/src/components/ds/toggle.tsx`
- Create: `apps/web/src/components/ds/logo.tsx`
- Create: `apps/web/src/components/ds/band-range.tsx`
- Create: `apps/web/src/components/ds/modal.tsx`
- Create: `apps/web/src/components/ds/wave.tsx`
- Create: `apps/web/src/components/ds/__tests__/primitives.test.tsx`
- Create: `apps/web/src/layouts/page-head.tsx`

## Tasks & Steps

### Task 2.1 — Implement `lib/cx.ts`, `lib/format.ts`, and `lib/speech.ts` with TDD
- [x] Build and test `cx`, `vnd`, `fmtBand`, `mmss`, `daysUntil`, `speakText`, and `cancelSpeech`.
- **Goal**: Pure formatting helpers match prototype output across boundary inputs, and `speakText`/`cancelSpeech` safely guard `globalThis.speechSynthesis` and `globalThis.SpeechSynthesisUtterance` inside `try/catch` without throwing in `jsdom` or restricted browsers.
- **Target files and symbols**:
  - `apps/web/src/lib/cx.ts` (`cx`)
  - `apps/web/src/lib/format.ts` (`vnd`, `fmtBand`, `mmss`, `daysUntil`)
  - `apps/web/src/lib/speech.ts` (`speakText`, `cancelSpeech`)
  - `apps/web/src/lib/__tests__/format.test.ts`
- **Steps**:
  1. Write `apps/web/src/lib/__tests__/format.test.ts` testing `cx('a', false, null, undefined, 'b') === 'a b'`, `mmss(0) === '0:00'`, `mmss(-5) === '0:00'`, `mmss(125) === '2:05'`, `fmtBand(6.5) === '6.5'`, `vnd(49000)` ending with `'đ'`, `daysUntil(null) === null` plus future/past date clamping to `>= 0`, and `speakText`/`cancelSpeech` not throwing even when `globalThis.speechSynthesis` is deleted (`undefined`).
  2. Run `pnpm --filter web test src/lib/__tests__/format.test.ts` and confirm non-zero exit (TDD Red).
  3. Create `apps/web/src/lib/cx.ts`, `apps/web/src/lib/format.ts` (from prototype `ui.tsx:4,206`, `data.ts:298-299`, `state.tsx:34`), and `apps/web/src/lib/speech.ts` checking `typeof globalThis.speechSynthesis !== "undefined"` inside `try/catch`.
- **Success criteria**: All formatter and speech-guard unit tests pass.
- **Verify**: `pnpm --filter web test src/lib/__tests__/format.test.ts` exits 0 (TDD Green).

### Task 2.2 — Port and harden `hooks/use-mic-level.ts` (with TDD) and `layouts/page-head.tsx`
- [x] Harden microphone stream/AudioContext/RAF cleanup in `use-mic-level.ts`, test failure/unmount paths, and port `PageHead`.
- **Goal**: `useMicLevel(active)` stops `MediaStream` tracks and closes `AudioContext` both on unmount AND if `new AudioContext()` throws after `getUserMedia` resolves, guards `requestAnimationFrame` with `if (cancelled) return`, and resets `real` cleanly; `PageHead` renders with `text-subtle`.
- **Target files and symbols**:
  - `apps/web/src/hooks/use-mic-level.ts` (`useMicLevel`)
  - `apps/web/src/hooks/__tests__/use-mic-level.test.ts`
  - `apps/web/src/layouts/page-head.tsx` (`PageHead`)
- **Steps**:
  1. Write `apps/web/src/hooks/__tests__/use-mic-level.test.ts` testing: (a) when `getUserMedia` rejects, `real` becomes `false` (simulated fallback); (b) when `getUserMedia` resolves with a mock `MediaStream` (`track.stop = vi.fn()`) and `AudioContext` constructor throws, `track.stop` is called immediately before falling back to `real = false`; (c) unmounting while active calls `track.stop` and `ctx.close()`.
  2. Run `pnpm --filter web test src/hooks/__tests__/use-mic-level.test.ts` and confirm non-zero exit (TDD Red).
  3. Implement `apps/web/src/hooks/use-mic-level.ts` based on prototype `ui.tsx:134-185`, adding `if (cancelled) return` inside `loop()`, stopping `stream?.getTracks()` + `void ctx?.close()?.catch(() => {})` inside `.catch()` before calling `simulate()`, and catching `ctx?.close()` rejections on cleanup.
  4. Port `PageHead` from prototype `Shell.tsx:71-82` into `apps/web/src/layouts/page-head.tsx`, replacing `text-muted` with `text-subtle`.
- **Success criteria**: `use-mic-level.test.ts` passes and both modules are ≤85 lines.
- **Verify**: `pnpm --filter web test src/hooks/__tests__/use-mic-level.test.ts` exits 0 (TDD Green).

### Task 2.3 — Port 8 design-system primitives under `components/ds/` with TDD
- [x] Create `button`, `card`, `badge`, `toggle`, `logo`, `band-range`, `modal`, and `wave` primitives and verify behavior.
- **Goal**: Every prototype primitive lives in its own named-export module (no barrel `index.ts`), preserves prop types (`variant="accent"`, `tone="accent"`), and maps Tailwind classes `accent*`→`brand*` and `muted`→`subtle`.
- **Target files and symbols**:
  - `apps/web/src/components/ds/{button,card,badge,toggle,logo,band-range,modal,wave}.tsx`
  - `apps/web/src/components/ds/__tests__/primitives.test.tsx`
- **Steps**:
  1. Write `apps/web/src/components/ds/__tests__/primitives.test.tsx` testing: `Button` `variant="accent"` applies `bg-brand` (not `bg-accent`), `Badge` `tone="accent"` applies `bg-brand-soft text-brand`, `Toggle` fires `onChange(!on)` and sets `aria-checked`, `Modal` closes on `Escape` keydown and backdrop click, and `BandRange` renders integer ticks `4..9` with `text-subtle`.
  2. Run `pnpm --filter web test src/components/ds/__tests__/primitives.test.tsx` and confirm non-zero exit (TDD Red).
  3. Create all 8 primitive files under `apps/web/src/components/ds/` from prototype `ui.tsx:6-204`, replacing utility classes `bg-accent`→`bg-brand`, `bg-accent-soft`→`bg-brand-soft`, `bg-accent/35`→`bg-brand/35`, `border-accent`→`border-brand`, `text-accent`→`text-brand`, `focus-visible:outline-accent`→`focus-visible:outline-brand`, and `text-muted`→`text-subtle` (`Wave` default `color = "bg-brand"`).
- **Success criteria**: Primitive behavioral tests pass, type-check succeeds, and comprehensive token grep finds zero leaks.
- **Verify**: `pnpm --filter web test && pnpm --filter web check-types` exits 0, and `! grep -rnE '(bg|text|border|ring|outline|fill|stroke|from|to|via|decoration|caret|shadow)-(accent|muted)(-soft)?(\b|/)' apps/web/src/components/ds apps/web/src/layouts/page-head.tsx apps/web/src/hooks apps/web/src/lib --exclude-dir=__tests__` exits 0 (TDD Green).

## Verification
- `pnpm --filter web test` exits 0.
- `pnpm --filter web check-types` exits 0.

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
