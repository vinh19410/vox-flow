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
Dashboard và lịch sử dùng dữ liệu thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/dashboard/components/readiness-card.tsx`
- Modify: `apps/web/src/features/dashboard/components/recent-attempt-card.tsx`
- Modify: `apps/web/src/features/history/history-screen.tsx`
- Modify: `apps/web/src/features/history/components/trend-chart.tsx`
- Delete: `apps/web/src/features/history/data.ts`
- Modify: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Modify: `apps/web/src/features/results/results-screen.tsx`
- Modify: `apps/web/src/features/app-state/initial-state.ts`
- Modify: `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`
- Modify: `apps/web/src/features/__tests__/slice-c.test.tsx`

## Tasks & Steps

### Task 2.1 — Thay dữ liệu mẫu.
- Goal: Thay dữ liệu mẫu.
- Target files and symbols: `readiness-card.tsx`, `recent-attempt-card.tsx`, `history-screen.tsx`, `trend-chart.tsx`; test: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Steps:
  1. Đọc từ `progress.summary` và `progress.history`.
  2. Biểu đồ hiện khoảng tin cậy, không chỉ một đường band.
  3. Thêm trạng thái rỗng và chưa đủ dữ liệu.
  4. Chuyển `resolveAttemptView` trong `results/results-screen.tsx` sang đọc `results.getResult` và bỏ dữ liệu mẫu ở `app-state/initial-state.ts` trước khi xóa `history/data.ts`.
  5. Xóa `history/data.ts` khi không còn nơi dùng và sửa test `HistoryScreen`, `DashboardScreen`.
- Success criteria: Không còn dữ liệu mẫu ở lịch sử.
- Verify: `test ! -f apps/web/src/features/history/data.ts` thoát với mã 0; `pnpm --filter web test src/features/__tests__/slice-b.test.tsx` và `pnpm check-types` đều thoát với mã 0.

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
