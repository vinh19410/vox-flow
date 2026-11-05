---
phase: 2
title: "Nối giao diện"
status: pending
priority: P2
effort: ""
dependencies: [1]
---

# Phase 2: Nối giao diện

## Goal
Modal báo lỗi gửi thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/results/components/report-modal.tsx`
- Modify: `apps/web/src/features/results/results-screen.tsx`

## Tasks & Steps

### Task 2.1 — Nối modal.
- Goal: Nối modal.
- Target files and symbols: `report-modal.tsx`, `results-screen.tsx`; test: `apps/web/src/features/results/__tests__/report-modal.test.tsx`
- Steps:
  1. Gọi `dispute.submit`, có ô đồng ý chia sẻ audio và transcript, mặc định tắt.
  2. Hiện cam kết 72 giờ và trạng thái báo lỗi trên màn kết quả.
  3. Viết test modal.
  4. Ẩn modal khi cờ tắt. Test nhánh tắt.
- Success criteria: Modal gửi được và phản ánh trạng thái.
- Verify: `pnpm --filter web test src/features/results/__tests__/report-modal.test.tsx` và `pnpm check-types` đều thoát với mã 0.

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
