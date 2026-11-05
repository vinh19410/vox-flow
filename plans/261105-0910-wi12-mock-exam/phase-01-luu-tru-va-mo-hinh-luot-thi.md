---
phase: 1
title: "Lưu trữ và mô hình lượt thi"
status: completed
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
- Create: `packages/api/src/exam/consent.ts`
- Modify: `packages/api/src/context.ts`
- Modify: `apps/server/src/context.ts`
- Modify: `apps/server/src/index.ts`
## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: Xác nhận môi trường local, các gói monorepo và typecheck đều đạt chuẩn trước khi thay đổi.
- Target files and symbols: Không sửa file.
- Steps:
  1. Chạy typecheck trên toàn bộ repository.
  2. Xác nhận cơ sở dữ liệu và vitest sẵn sàng.
- Success criteria: Mã nguồn và test ban đầu qua toàn bộ.
- Verify: `pnpm check-types` thoát với mã 0.

### Task 1.1 — Thêm kho R2 và bảng dữ liệu.
- Goal: Khai báo bucket R2 riêng tư và tạo schema D1 cho lượt thi và câu trả lời.
- Target files and symbols: `packages/infra/alchemy.run.ts`, `packages/db/src/schema/attempt.ts`, `packages/db/src/schema/index.ts`
- Steps:
  1. Khai báo bucket R2 riêng tư (`audio-storage`) và gắn binding `AUDIO_BUCKET` vào `env` của Worker trong `packages/infra/alchemy.run.ts`.
  2. Tạo bảng `attempt`: `id` (text, primary key), `userId` (text, not null, FK to `user.id` cascade), `mode` (text, not null), `status` (text, not null, mặc định `'in_progress'`), `inHistory` (integer boolean, not null), `calibrationGranted` (integer boolean, not null), `startedAt` (integer timestamp), `submittedAt` (integer timestamp).
  3. Tạo bảng `attempt_answer`: `id` (text, primary key), `attemptId` (text, not null, FK to `attempt.id` cascade), `questionKey` (text, not null), `partNumber` (integer, not null), `orderIndex` (integer, not null), `audioKey` (text, not null), `durationMs` (integer, not null), `mimeType` (text, not null), `createdAt` (integer timestamp), cùng ràng buộc `UNIQUE(attempt_id, question_key)`.
  4. Export từ `packages/db/src/schema/index.ts` và chạy `pnpm --filter @vox-flow/db db:generate`.
  5. Mở rộng `Context` trong `packages/api/src/context.ts` và `apps/server/src/context.ts` để truyền `env` chứa binding R2 và các biến cấu hình cần thiết.
- Success criteria: Migration D1 chứa định nghĩa hai bảng `attempt` và `attempt_answer`.
- Verify: `grep -rl --include=migration.sql 'attempt_answer' packages/db/src/migrations | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.2 — Tạo API lượt thi và Hono streaming endpoints.
- Goal: Cung cấp API khởi tạo, resume, submit lượt thi và endpoint stream audio trực tiếp vào R2.
- Target files and symbols: `packages/api/src/exam/consent.ts`, `packages/api/src/routers/attempt.ts` (`start`, `getActive`, `submit`), `apps/server/src/index.ts`; test: `packages/api/src/routers/attempt.test.ts`
- Steps:
  1. Tạo `packages/api/src/exam/consent.ts` chứa hàm `requireExamConsent(db, userId)`: kiểm tra consent trong D1 nếu có bảng `consent_event`; nếu bảng chưa có (do #15 chưa land), cho phép qua nếu thỏa mãn gate launch.
  2. Tạo router `packages/api/src/routers/attempt.ts`:
     - `start`: kiểm tra launch gate (`LAUNCH_OPEN='true'` hoặc email thuộc `LAUNCH_ALLOWED_EMAILS`), gọi `requireExamConsent`, tạo record `attempt` mới với trạng thái `in_progress`.
     - `getActive`: tìm attempt có `status = 'in_progress'` của user hiện tại cùng danh sách câu trả lời đã lưu để client khôi phục phiên khi reload.
     - `submit`: kiểm tra quyền sở hữu `attempt.userId === ctx.session.user.id`, chuyển `status = 'submitted'`, ghi nhận `submittedAt`.
  3. Thêm Hono routes vào `apps/server/src/index.ts`:
     - `POST /api/attempts/:attemptId/answers/:questionKey/audio`: yêu cầu session người dùng, kiểm tra `attempt.userId === session.user.id` và `attempt.status === 'in_progress'`, giới hạn dung lượng (`Content-Length` <= 10MB), stream trực tiếp `c.req.raw.body` vào R2 bucket qua binding `AUDIO_BUCKET`, ghi nhận hoặc cập nhật `attempt_answer` trong D1.
     - `GET /api/attempts/:attemptId/answers/:answerId/audio`: yêu cầu session người dùng, kiểm tra `attempt.userId === session.user.id`, lấy audio object từ R2 bucket và stream về client với header `Content-Type` và `Content-Disposition: inline`.
  4. Viết unit tests trong `packages/api/src/routers/attempt.test.ts` kiểm chứng: không thể đọc bài người khác, không thể upload vào attempt người khác, submit chuyển đổi trạng thái thành công.
- Success criteria: Test cho attempt router chạy thành công.
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
