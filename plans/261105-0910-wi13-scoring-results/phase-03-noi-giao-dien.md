---
phase: 3
title: "Nối giao diện"
status: pending
priority: P1
effort: ""
dependencies: [1, 2]
---

# Phase 3: Nối giao diện

## Goal
Màn chấm và kết quả dùng dữ liệu thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/scoring/scoring-screen.tsx`
- Modify: `apps/web/src/features/results/results-screen.tsx`
- Modify: `apps/web/src/features/results/components/band-hero.tsx`
- Modify: `apps/web/src/features/results/components/criteria-grid.tsx`
- Modify: `apps/web/src/features/results/components/soft-paywall.tsx`
- Modify: `apps/web/src/features/__tests__/slice-c.test.tsx`
- Delete: `apps/web/src/features/results/data.ts`
- Delete: `apps/web/src/features/scoring/data.ts`
- Create: `apps/web/src/features/landing/sample-result.ts`
- Modify: `apps/web/src/features/landing/components/hero.tsx`
- Modify: `apps/web/src/features/results/components/report-modal.tsx`
- Modify: `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`

## Tasks & Steps

### Task 3.1 — Thay mô phỏng bằng dữ liệu thật.
- Goal: Thay mô phỏng bằng dữ liệu thật.
- Target files and symbols: `scoring-screen.tsx` (đang dùng `RESULT` và `setTimeout`), `results-screen.tsx`
- Steps:
  1. Màn chấm theo dõi trạng thái thật của lượt, có màn lỗi và nút thử lại, thay các `setTimeout` giả.
  2. Màn kết quả đọc từ `results.getResult`.
  3. Chuyển dữ liệu mẫu của thẻ hero sang `apps/web/src/features/landing/sample-result.ts`, rồi xóa `results/data.ts` và `scoring/data.ts` sau khi sửa mọi nơi dùng.
  4. Sửa test `ScoringScreen` và test kết quả.
- Success criteria: Hai file dữ liệu mô phỏng đã bị xóa.
- Verify: `test ! -f apps/web/src/features/results/data.ts && test ! -f apps/web/src/features/scoring/data.ts` thoát với mã 0; `pnpm --filter web test` và `pnpm check-types` đều thoát với mã 0.

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

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
