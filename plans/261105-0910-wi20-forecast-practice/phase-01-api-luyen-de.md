---
phase: 1
title: "API luyện đề"
status: pending
priority: P2
effort: ""
dependencies: []
---

# Phase 1: API luyện đề

## Goal
Học viên đọc được đề và lưu tiến độ.

## Files to Create / Modify
- Create: `packages/api/src/routers/forecast.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `packages/db/src/schema/forecast.ts`
- Modify: `packages/api/src/routers/attempt.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/db/src/schema/attempt.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 16 17 18 19 23; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Tạo router `forecast`.
- Goal: Tạo router `forecast`.
- Target files and symbols: `packages/api/src/routers/forecast.ts` (`list`, `toggleSaved`, `coverage`, `report`); test: `packages/api/src/routers/forecast.test.ts`
- Steps:
  1. `list` chỉ trả đề `published`, kiểm tra quyền qua `getEntitlement`.
  2. Thêm bảng `forecast_saved`, chạy `pnpm --filter @vox-flow/db db:generate`, đăng ký vào `data-registry.ts`.
  3. `coverage` đếm từ các lượt có `topicId` thật.
  4. Viết test: không thấy đề nháp, quyền theo gói đúng.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/forecast.test.ts` thoát với mã 0.

### Task 1.2 — Cho lượt thi nhận chủ đề.
- Goal: Cho lượt thi nhận chủ đề.
- Target files and symbols: `packages/api/src/routers/attempt.ts` (`start`), `packages/db/src/schema/attempt.ts`; test: `packages/api/src/routers/attempt.test.ts`
- Steps:
  1. Thêm cột `attempt.topicId` và tham số `topicId`, kiểm tra đề đã đăng. Chạy `pnpm --filter @vox-flow/db db:generate`.
  2. Lượt luyện chỉ đi qua `attempt.start`, không gọi `reserve` trực tiếp, và đi qua pipeline chấm của #17.
- Success criteria: Test lượt luyện qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` thoát với mã 0.

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
