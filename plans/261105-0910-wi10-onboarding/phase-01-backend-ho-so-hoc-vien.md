---
phase: 1
title: "Backend hồ sơ học viên"
status: completed
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
- Create: `packages/api/src/routers/profile.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `packages/api/src/routers/profile.test.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Kiểm tra PR #32 (issue #6) đã được merge vào dev: `git log --grep="Merge pull request #32" --oneline dev`.
  2. Ghi nhận #11 đã được người dùng phê duyệt tách thành phụ thuộc mềm (xác nhận ngày 2026-11-05): triển khai hồ sơ người dùng độc lập dựa trên Better Auth `user.id`.
  3. Ghi nhận #13 đã hoàn tất và merge vào dev trong PR #38.
- Success criteria: các điều kiện được xác nhận.
- Verify: `git log --grep="Merge pull request #32" --oneline dev | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.1 — Tạo bảng `user_profile`.
- Goal: Tạo bảng `user_profile` trong D1.
- Target files and symbols: `packages/db/src/schema/profile.ts`, `packages/db/src/schema/index.ts`
- Steps:
  1. Định nghĩa bảng `user_profile` với các cột:
     - `userId`: `text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" })`
     - `targetBand`: `real("target_band").notNull()`
     - `examDate`: `text("exam_date")` (nullable, định dạng `YYYY-MM-DD`)
     - `onboardedAt`: `integer("onboarded_at", { mode: "timestamp_ms" })` (nullable)
     - `createdAt`: `integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull()`
     - `updatedAt`: `integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => new Date())`
  2. Re-export `userProfile` từ `packages/db/src/schema/index.ts`.
  3. Chạy `pnpm --filter @vox-flow/db db:generate`.
- Success criteria: Migration mới chứa câu lệnh `CREATE TABLE user_profile`.
- Verify: `grep -rl --include=migration.sql 'user_profile' packages/db/src/migrations | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.2 — Tạo router `profile`.
- Goal: Tạo router `profile` (`get`, `upsert`, `completeOnboarding`).
- Target files and symbols: `packages/api/src/routers/profile.ts`, `packages/api/src/routers/index.ts`, `packages/api/src/routers/profile.test.ts`
- Steps:
  1. Dùng `protectedProcedure`, tất cả thao tác đọc/ghi đều theo `ctx.session.user.id`.
  2. `profile.get`: trả về thông tin profile của user hiện tại hoặc null nếu chưa có.
  3. `profile.upsert`: nhận `{ targetBand, examDate }` (chỉ cho phép các band [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0] theo đúng PRD §4.1 F-03, `examDate` là chuỗi `YYYY-MM-DD` hoặc null/omitted, so sánh ngày không ở quá khứ). Không cho phép truyền hay ghi đè `onboardedAt`. Thực hiện insert hoặc onConflictUpdate giữ nguyên `onboardedAt`.
  4. `profile.completeOnboarding`: kiểm tra profile của user đã tồn tại và có `targetBand`, sau đó ghi `onboardedAt = new Date()` (idempotent: nếu đã có `onboardedAt` thì giữ nguyên). Nếu chưa có profile hoặc chưa có targetBand thì ném `PRECONDITION_FAILED`.
  5. Đăng ký `profileRouter` vào `appRouter` trong `packages/api/src/routers/index.ts`.
  6. Viết test `profile.test.ts`: chưa đăng nhập bị từ chối, band không hợp lệ bị từ chối, ngày quá khứ bị từ chối, upsert rồi get lại đúng, completeOnboarding cập nhật `onboardedAt`.
- Success criteria: Test router qua 100%.
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
