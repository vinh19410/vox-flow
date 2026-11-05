---
phase: 1
title: "Dữ liệu và nguồn đề"
status: pending
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
- Create: `packages/api/src/routers/forecast-admin.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `packages/api/src/forecast/dedupe.ts`
- Modify: `packages/api/src/data-registry.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
  3. Đọc trạng thái #8. Đây là phụ thuộc mềm: nếu chưa xong thì ghi nhận rủi ro và tiếp tục.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 10 11 15; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Tạo bảng đề và báo cáo.
- Goal: Tạo bảng đề và báo cáo.
- Target files and symbols: `packages/db/src/schema/forecast.ts`
- Steps:
  1. Bảng `forecast_topic` có `quarter`, `status` (`draft`, `published`, `archived`), `reviewedBy`, `reviewedAt`.
  2. Bảng `forecast_source` có loại nguồn và `sourceUrl`.
  3. Bảng `forecast_report` có `userId`, khóa duy nhất theo người và đề, và được đăng ký vào `data-registry.ts`.
  4. Chạy `pnpm --filter @vox-flow/db db:generate`.
- Success criteria: Migration có các bảng mới.
- Verify: `grep -rl --include=migration.sql 'forecast_report' packages/db/src/migrations | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.2 — Tạo API quản trị và luật duyệt.
- Goal: Tạo API quản trị và luật duyệt.
- Target files and symbols: `packages/api/src/routers/forecast-admin.ts` (`createDraft`, `publish`, `archive`); test: `packages/api/src/routers/forecast-admin.test.ts`
- Steps:
  1. Trong `packages/api/src/index.ts`, dùng `adminProcedure` nếu đã có; nếu chưa thì tạo: yêu cầu session, `emailVerified=true`, email thuộc `ctx.env.ADMIN_EMAILS`; danh sách rỗng thì từ chối tất cả. Nếu `Context` chưa có `env` thì mở rộng như mô tả ở #16. Nếu chưa khai, thêm `ADMIN_EMAILS` vào `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`.
  2. Đăng đề chỉ qua `publish`, bắt buộc ghi `reviewedBy`.
  3. Viết test: người thường bị từ chối; `createDraft` luôn tạo `draft`; `publish` là đường duy nhất đổi sang `published` và phải có `reviewedBy`; số báo đã gặp không tăng khi một người báo hai lần.
- Success criteria: Test qua.
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
