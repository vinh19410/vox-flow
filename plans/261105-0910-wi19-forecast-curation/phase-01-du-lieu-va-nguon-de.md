---
phase: 1
title: "Dữ liệu và nguồn đề"
status: completed
priority: P2
effort: ""
dependencies: []
---

# Phase 1: Dữ liệu và nguồn đề

## Goal
Có mô hình đề và tiếp nhận từ 3 nguồn.

## Files to Create / Modify
- Create: `packages/db/src/schema/forecast.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/api/src/context.ts`
- Modify: `packages/api/src/index.ts`
- Create: `packages/api/src/routers/forecast-admin.ts`
- Create: `packages/api/src/routers/forecast.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `packages/api/src/forecast/dedupe.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `apps/server/src/context.ts`
- Modify: `apps/server/.env.schema`
- Modify: `packages/infra/alchemy.run.ts`
## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify để xác nhận mã nguồn nền tảng (#10 backend D1 test env và #15 privacy controls/data registry) đã được merge vào nhánh làm việc.
  2. Ghi nhận phụ thuộc mềm #8: hồ sơ câu hỏi tư vấn luật sư đã chuẩn bị, chờ tư vấn thực tế không chặn việc dựng tính năng nội bộ.
- Success criteria: Các artifact mã nguồn nền tảng tồn tại đầy đủ trong workspace.
- Verify: `test -f packages/db/src/schema/auth.ts && test -f packages/api/src/test/db.ts && test -f packages/api/src/data-registry.ts` thoát với mã 0.
### Task 1.1 — Tạo bảng đề và báo cáo.
- Goal: Tạo bảng đề và báo cáo, phân loại dữ liệu cá nhân theo GDPR.
- Target files and symbols: `packages/db/src/schema/forecast.ts`, `packages/db/src/schema/index.ts`, `packages/api/src/data-registry.ts`
- Steps:
  1. Bảng `forecast_topic` có `id`, `title`, `quarter`, `status` (`draft`, `published`, `archived`), `reviewedBy` (khóa ngoại `user.id` với `onDelete: 'set null'`), `reviewedAt`, `createdAt`, `updatedAt`.
  2. Bảng `forecast_source` có `id`, `topicId`, `sourceType` (`manual`, `student`, `web`), `sourceUrl`, `rawContent`, `createdAt`.
  3. Bảng `forecast_report` có `id`, `topicId`, `userId`, `notes`, `createdAt`, khóa duy nhất theo `(userId, topicId)`.
  4. Đăng ký `forecast_report` vào `DATA_REGISTRY` (với handler `export` và `erase`), đăng ký `forecast_topic` và `forecast_source` vào `NON_PERSONAL_TABLES` trong `packages/api/src/data-registry.ts`.
  5. Chạy `pnpm --filter @vox-flow/db db:generate`.
- Success criteria: Migration có các bảng mới và test phân loại dữ liệu cá nhân qua.
- Verify: `grep -rl --include=migration.sql 'forecast_report' packages/db/src/migrations | wc -l` in số lớn hơn hoặc bằng `1` && `pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát với mã 0.
### Task 1.2 — Tạo API quản trị và luật duyệt.
- Goal: Tạo API quản trị, thủ tục báo đề cho học viên, và quy tắc phân quyền người sở hữu.
- Target files and symbols: `packages/api/src/context.ts`, `packages/api/src/index.ts`, `packages/api/src/routers/forecast-admin.ts`, `packages/api/src/routers/forecast.ts`, `packages/api/src/routers/forecast-admin.test.ts`
- Steps:
  1. Mở rộng `Context` trong `packages/api/src/context.ts` với `env?: { ADMIN_EMAILS?: string }`.
  2. Trong `packages/api/src/index.ts`, thêm `adminProcedure`: yêu cầu session hợp lệ và email người dùng thuộc tập `ADMIN_EMAILS` (phân tách dấu phẩy, chuẩn hóa chữ thường, trimmed). Nếu `ADMIN_EMAILS` rỗng hoặc không có email khớp, từ chối `FORBIDDEN` hoặc `UNAUTHORIZED`.
  3. Khai báo `ADMIN_EMAILS` trong `apps/server/.env.schema` và `packages/infra/alchemy.run.ts`, truyền từ worker `context` trong `apps/server/src/context.ts`.
  4. Router `forecastAdminRouter` cung cấp: `listDrafts` (lọc theo quarter, status), `createDraft`, `updateDraft`, `publish` (bắt buộc gán `reviewedBy = ctx.session.user.id`, `reviewedAt = new Date()`), `archive`.
  5. Router `forecastRouter` cung cấp `reportTopic` (`protectedProcedure`) cho học viên báo đã gặp đề, đảm bảo không tăng trùng nhờ ràng buộc duy nhất `(userId, topicId)`.
  6. Viết test trong `packages/api/src/routers/forecast-admin.test.ts`: người không phải admin bị từ chối; `createDraft` luôn tạo `draft`; `publish` là đường duy nhất đổi sang `published` và ghi `reviewedBy` từ session; báo trùng đề bị xử lý an toàn không tăng số lượng.
- Success criteria: Mọi test phân quyền và quản trị đều đạt.
- Verify: `pnpm --filter @vox-flow/api test src/routers/forecast-admin.test.ts` thoát với mã 0.
### Task 1.3 — AI gộp trùng thành bản nháp.
- Goal: AI gộp trùng thành bản nháp.
- Target files and symbols: `packages/api/src/forecast/dedupe.ts`; test: `packages/api/src/forecast/dedupe.test.ts`
- Steps:
  1. Nhận các nguồn thô, gộp đề trùng và tạo bản nháp với trạng thái `draft`.
  2. Nguồn web chỉ dùng làm tín hiệu chủ đề: câu hỏi phải viết lại và giữ `sourceUrl`.
  3. Viết test với client AI giả lập: kết quả luôn là `draft`.
- Success criteria: AI không thể tự đăng đề.
- Verify: `pnpm --filter @vox-flow/api test src/forecast/dedupe.test.ts` thoát với mã 0.

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
