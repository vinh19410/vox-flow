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
Màn forecast dùng dữ liệu thật.

## Files to Create / Modify
- Modify: `apps/web/src/features/forecast/forecast-screen.tsx`
- Modify: `apps/web/src/features/forecast/components/coverage-banner.tsx`
- Modify: `apps/web/src/features/forecast/components/topic-detail-modal.tsx`
- Delete: `apps/web/src/features/forecast/topics-p1.ts`
- Delete: `apps/web/src/features/forecast/topics-p23.ts`
- Modify: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Delete: `apps/web/src/features/forecast/data.ts`
- Modify: `apps/web/src/features/forecast/components/forecast-toolbar.tsx`
- Modify: `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`

## Tasks & Steps

### Task 2.1 — Thay đề mẫu bằng API.
- Goal: Thay đề mẫu bằng API.
- Target files and symbols: `forecast-screen.tsx`, `coverage-banner.tsx`, `topic-detail-modal.tsx`
- Steps:
  1. Đọc từ `forecast.list` và `forecast.coverage`; lưu danh sách ôn qua `forecast.toggleSaved`.
  2. Thêm nút báo đã gặp đề, gọi `forecast.report`.
  3. Xóa `topics-p1.ts`, `topics-p23.ts`, `forecast/data.ts` và phần không còn dùng của `builders.ts`; sửa `forecast-toolbar.tsx` và `state-and-data.test.ts`.
  4. Sửa test `ForecastScreen` và `ExamScreen (practice mode)`.
- Success criteria: Không còn đề mẫu.
- Verify: `test ! -f apps/web/src/features/forecast/topics-p1.ts && test ! -f apps/web/src/features/forecast/topics-p23.ts && test ! -f apps/web/src/features/forecast/data.ts` thoát với mã 0; `pnpm --filter web test` và `pnpm check-types` đều thoát với mã 0.

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
