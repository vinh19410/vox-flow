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
Dashboard hiện việc thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/dashboard/components/today-tasks.tsx`
- Modify: `apps/web/src/features/dashboard/components/countdown-card.tsx`
- Modify: `apps/web/src/features/__tests__/slice-b.test.tsx`

## Tasks & Steps

### Task 2.1 — Thay việc mẫu.
- Goal: Thay việc mẫu.
- Target files and symbols: `today-tasks.tsx`, `countdown-card.tsx`; test: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Steps:
  1. Đọc từ `practice.today`. Mỗi việc dẫn tới đúng chế độ luyện.
  2. Sửa test `DashboardScreen`.
- Success criteria: Dashboard dùng dữ liệu thật.
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
