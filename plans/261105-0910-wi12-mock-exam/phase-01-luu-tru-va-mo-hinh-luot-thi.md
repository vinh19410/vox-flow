---
phase: 1
title: "Lưu trữ và mô hình lượt thi"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Lưu trữ và mô hình lượt thi

## Goal
Có nơi lưu audio và dữ liệu lượt thi.

## Files to Create / Modify
- Modify: `packages/infra/alchemy.run.ts`
- Create: `packages/db/src/schema/attempt.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/routers/attempt.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/api/src/context.ts`
- Modify: `apps/server/src/context.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 7 14 15; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Thêm kho R2 và bảng dữ liệu.
- Goal: Thêm kho R2 và bảng dữ liệu.
- Target files and symbols: `packages/infra/alchemy.run.ts`, `packages/db/src/schema/attempt.ts`
- Steps:
  1. Khai báo bucket R2 riêng tư và gắn vào `env` của Worker.
  2. Tạo bảng `attempt` và `attempt_answer` (`attemptId`, `questionText`, `audioKey`, `durationMs`, `mimeType`).
  3. Chạy `pnpm --filter @vox-flow/db db:generate`.
  4. Mở rộng `Context` trong `packages/api/src/context.ts` và `apps/server/src/context.ts` thành có `env: ApiEnv` (type liệt kê biến dùng); test truyền giá trị thật hoặc binding Miniflare.
  5. Thêm cột `attempt.inHistory`, chụp giá trị `save` lúc `start`.
- Success criteria: Migration có hai bảng.
- Verify: `grep -rl --include=migration.sql 'attempt_answer' packages/db/src/migrations | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.2 — Tạo API lượt thi.
- Goal: Tạo API lượt thi.
- Target files and symbols: `packages/api/src/routers/attempt.ts` (`start`, `uploadAnswer`, `submit`), `packages/api/src/data-registry.ts`; test: `packages/api/src/routers/attempt.test.ts`; test: `packages/api/src/data-registry.test.ts`
- Steps:
  1. `start` gọi `requireConsent` từ #15.
  2. Mọi truy cập audio kiểm tra chủ sở hữu.
  3. Đăng ký bảng và audio vào `data-registry.ts` để xóa được trong 24 giờ.
  4. Viết test: không đồng ý bị từ chối, không đọc được bài người khác.
  5. `attempt.start` trả `FORBIDDEN` trừ khi `LAUNCH_OPEN='true'` hoặc email thuộc `LAUNCH_ALLOWED_EMAILS`. Khai hai biến trong `packages/infra/alchemy.run.ts`. Test cả ba trường hợp.
  6. Khi đăng ký vào `data-registry.ts`, khai cả audio trên R2 và `attempt_answer`.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` và `pnpm --filter @vox-flow/api test src/data-registry.test.ts` đều thoát với mã 0.

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
