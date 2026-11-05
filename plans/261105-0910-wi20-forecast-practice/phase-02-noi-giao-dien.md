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
- Modify: `apps/web/src/features/forecast/components/forecast-toolbar.tsx`
- Modify: `apps/web/src/features/forecast/builders.ts`
- Modify: `apps/web/src/features/app-state/initial-state.ts`
- Modify: `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`
- Modify: `apps/web/src/features/__tests__/slice-b.test.tsx`
- Modify: `apps/web/src/features/__tests__/slice-c.test.tsx`
- Modify: `apps/web/src/features/exam/use-exam-session.ts`
- Modify: `apps/web/src/features/exam/exam-screen.tsx`
- Delete: `apps/web/src/features/forecast/topics-p1.ts`
- Delete: `apps/web/src/features/forecast/topics-p23.ts`
- Delete: `apps/web/src/features/forecast/data.ts`

## Tasks & Steps

### Task 2.1 — Thay đề mẫu bằng API và nối phòng thi thật.
- Goal: Màn forecast dùng dữ liệu thật từ tRPC, bấm "Luyện ngay" khởi tạo phiên thi thật qua server.
- Target files and symbols: `forecast-screen.tsx`, `coverage-banner.tsx`, `topic-detail-modal.tsx`, `use-exam-session.ts`, `exam-screen.tsx`, `builders.ts`, `initial-state.ts`
- Steps:
  1. `ForecastScreen`: Đọc danh mục đề và metadata quý từ `trpc.forecast.list.useQuery()`; đọc độ phủ cá nhân từ `trpc.forecast.coverage.useQuery()`.
  2. Lưu danh sách ôn thông qua `trpc.forecast.toggleSaved.useMutation()`. Nút "Báo đã gặp đề" gọi `trpc.forecast.report.useMutation()`.
  3. Nối luồng phòng thi thật: Khi người dùng bấm "Luyện ngay" trên thẻ đề hoặc modal chi tiết, giao diện gọi `trpc.attempt.start.useMutation({ topicId })`, nhận `attemptId` thật từ server, thiết lập trạng thái phiên thi trong `useExamSession` và chuyển hướng sang `ExamScreen` (không gán dữ liệu câu hỏi giả lập vào client store).
  4. Xử lý lỗi hạn mức: Nếu gọi `attempt.start` gặp lỗi `QUOTA_EXCEEDED`, hiển thị thông báo vượt hạn mức hoặc điều hướng sang màn nâng cấp/mua thêm lượt.
  5. Xóa bỏ hoàn toàn các file dữ liệu mẫu: `topics-p1.ts`, `topics-p23.ts`, `forecast/data.ts`; dọn dẹp các hằng số mock trong `builders.ts` và `initial-state.ts`.
  6. Cập nhật kiểm thử: Cung cấp `QueryClientProvider` và mock link tRPC cho `slice-b.test.tsx` và `slice-c.test.tsx` (`ExamScreen (practice mode)`).
- Success criteria: Không còn đề mẫu, toàn bộ luồng forecast kết nối API thật.
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
