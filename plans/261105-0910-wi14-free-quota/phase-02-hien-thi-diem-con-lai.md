---
phase: 2
title: "Hiển thị điểm còn lại"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Hiển thị điểm còn lại

## Goal
Học viên biết còn bao nhiêu điểm và biết khi nào được dùng lại.

## Files to Create / Modify
- Modify: `apps/web/src/features/select/select-screen.tsx`
- Modify: `apps/web/src/features/select/components/mode-grid.tsx`
- Modify: `apps/web/src/features/__tests__/slice-b.test.tsx`

## Tasks & Steps

### Task 2.1 — Hiện điểm và chặn đúng lựa chọn.
- Goal: Hiện điểm và chặn đúng lựa chọn.
- Target files and symbols: `select-screen.tsx`, `mode-grid.tsx`; test: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Steps:
  1. Hiện điểm còn lại, số điểm từng chế độ và giờ đặt lại.
  2. Làm mờ lựa chọn không đủ điểm và hiện lời mời xem gói.
  3. Hiện thông báo riêng khi chạm trần hệ thống. Không báo đây là lỗi của học viên.
  4. Thêm test trong `SelectScreen`.
- Success criteria: Giao diện đúng với từng trạng thái.
- Verify: `pnpm --filter web test src/features/__tests__/slice-b.test.tsx` và `pnpm check-types` đều thoát với mã 0.

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
