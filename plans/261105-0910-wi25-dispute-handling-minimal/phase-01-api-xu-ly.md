---
phase: 1
title: "API xử lý"
status: completed
priority: P2
effort: ""
dependencies: []
---

# Phase 1: API xử lý

## Goal
Có đủ thao tác xử lý và cảnh báo.

## Files to Create / Modify
- Create: `packages/api/src/routers/dispute-admin.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `packages/api/src/disputes/overdue.ts`
- Modify: `apps/server/src/index.ts` (export scheduled handler, allow admin audio streaming when shareConsent=true)
- Modify: `packages/infra/alchemy.run.ts` (declare crons trigger and ADMIN_EMAILS binding)
- Modify: `packages/db/src/schema/dispute.ts`
- Create/Modify: `apps/server/src/scheduled.ts`
## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 28; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Tạo API hàng đợi.
- Goal: Tạo API hàng đợi.
- Target files and symbols: `packages/api/src/routers/dispute-admin.ts` (`queue`, `getCase`, `resolve`, `metrics`); test: `packages/api/src/routers/dispute-admin.test.ts`
  1. Trong `packages/api/src/index.ts`, dùng `adminProcedure` nếu đã có; nếu chưa thì tạo: yêu cầu session, email thuộc `ctx.env.ADMIN_EMAILS`; danh sách rỗng thì từ chối tất cả. Nếu `Context` chưa có `env` thì mở rộng như mô tả ở #16. Nếu chưa khai, thêm `ADMIN_EMAILS` vào `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`.
  2. Trong `apps/server/src/index.ts`, cho phép tải/phát audio ở `GET /api/attempts/:attemptId/answers/:answerId/audio` khi người dùng là chủ attempt HOẶC người dùng là admin (`ADMIN_EMAILS`) VÀ dispute của attempt đó có `shareConsent = true`.
  3. Thêm vào `score_dispute`: `previousBand`, `resolvedBand`, `replyText`, `resolvedAt`, `warnedAt`. Chạy `pnpm --filter @vox-flow/db db:generate`. Trả lời hiện qua `dispute.get`; email chỉ thêm khi #26 đã đóng.
  4. `resolve` cập nhật band và giữ band cũ để đối chiếu, gửi trả lời từ mẫu.
  5. Viết test: không đồng ý thì không có audio, người thường bị từ chối, band cũ được giữ.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/dispute-admin.test.ts` thoát với mã 0.

### Task 1.2 — Thêm cảnh báo sắp quá hạn.
- Goal: Thêm cảnh báo sắp quá hạn.
- Target files and symbols: `packages/api/src/disputes/overdue.ts`, `apps/server/src/scheduled.ts`; test: `packages/api/src/disputes/overdue.test.ts`
- Steps:
  1. Tạo hoặc cập nhật `apps/server/src/scheduled.ts`, export hàm `handleScheduled`. Trong `apps/server/src/index.ts`, export `{ fetch: app.fetch, scheduled: handleScheduled }`. Trong `packages/infra/alchemy.run.ts`, thêm `crons: ["0 * * * *"]` nếu chưa có.
  2. Cron theo giờ đánh dấu báo lỗi còn dưới 12 giờ và hiện cảnh báo trên đầu hàng đợi. Nếu #26 đã xong thì gửi thêm email. Mỗi báo lỗi chỉ cảnh báo một lần ở mỗi mức.
  3. Viết test ở ranh giới thời gian và chạy trùng.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/disputes/overdue.test.ts` thoát với mã 0.

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
