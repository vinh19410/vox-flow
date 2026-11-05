---
phase: 1
title: "Backend hồ sơ học viên"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Backend hồ sơ học viên

## Goal
Có bảng và API lưu mục tiêu của từng học viên.

## Files to Create / Modify
- Create: `packages/db/src/schema/profile.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/relations.ts`
- Create: `packages/api/src/routers/profile.ts`
- Modify: `packages/api/src/routers/index.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
  3. Đọc trạng thái #13. Đây là phụ thuộc mềm: nếu chưa xong thì ghi nhận rủi ro và tiếp tục.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 6 11; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Tạo bảng `user_profile`.
- Goal: Tạo bảng `user_profile`.
- Target files and symbols: `packages/db/src/schema/profile.ts`
- Steps:
  1. Tạo bảng với `userId` (khóa chính, tham chiếu `user.id`, xóa theo), `targetBand`, `examDate`, `onboardedAt`.
  2. Export từ `schema/index.ts` và thêm vào `relations.ts`.
  3. Chạy `pnpm --filter @vox-flow/db db:generate`.
- Success criteria: Migration có bảng mới.
- Verify: `grep -rl --include=migration.sql 'user_profile' packages/db/src/migrations | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.2 — Tạo router `profile`.
- Goal: Tạo router `profile`.
- Target files and symbols: `packages/api/src/routers/profile.ts` (`get`, `upsert`, `completeOnboarding`); test: `packages/api/src/routers/profile.test.ts`
- Steps:
  1. Dùng `protectedProcedure`, chỉ đọc và ghi theo `ctx.session.user.id`.
  2. Kiểm tra `targetBand` từ 4.0 đến 9.0 theo bước 0.5 và ngày thi không ở quá khứ.
  3. Viết test: chưa đăng nhập bị từ chối, dữ liệu sai bị từ chối, ghi rồi đọc lại đúng.
- Success criteria: Test router qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/profile.test.ts` thoát với mã 0.

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
