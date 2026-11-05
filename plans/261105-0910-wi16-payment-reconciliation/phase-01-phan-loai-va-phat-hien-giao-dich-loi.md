---
phase: 1
title: "Phân loại và phát hiện giao dịch lỗi"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Phân loại và phát hiện giao dịch lỗi

## Goal
Giao dịch không khớp được ghi nhận và không bị lỡ.

## Files to Create / Modify
- Create: `packages/api/src/billing/reconcile.ts`
- Modify: `packages/api/src/billing/sepay-webhook.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `packages/db/src/schema/billing.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `apps/server/src/scheduled.ts`
- Modify: `apps/server/.env.schema`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 12 19; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Phân loại sự kiện thanh toán.
- Goal: Phân loại sự kiện thanh toán.
- Target files and symbols: `packages/api/src/billing/reconcile.ts` (`classify`); test: `packages/api/src/billing/reconcile.test.ts`
- Steps:
  1. Trả về một trong: `matched`, `underpaid`, `overpaid`, `unknown_code`, `expired_order`.
  2. Webhook lưu kết quả vào `payment_event`.
  3. Viết test cho đủ 5 trường hợp.
  4. Thêm `payment_event.classification` và bảng `payment_action` (`eventId`, `action`, `note`, `actorEmail`, `createdAt`) vào `packages/db/src/schema/billing.ts`, đăng ký vào `data-registry.ts`, chạy `pnpm --filter @vox-flow/db db:generate`.
- Success criteria: Test phân loại qua.
- Verify: `pnpm --filter @vox-flow/api test src/billing/reconcile.test.ts` thoát với mã 0.

### Task 1.2 — Thêm kiểm tra định kỳ.
- Goal: Thêm kiểm tra định kỳ.
- Target files and symbols: `packages/api/src/billing/reconcile.ts` (`sweepTransactions`), `apps/server/src/scheduled.ts`; test: `packages/api/src/billing/reconcile.test.ts`
- Steps:
  1. Cron gọi API giao dịch của SePay theo tài liệu hiện hành, bổ sung các giao dịch webhook bỏ lỡ. Việc xử lý phải trùng khớp an toàn với webhook.
  2. Thêm việc vào `apps/server/src/scheduled.ts` do #15 tạo, không đổi kiểu export. Khai `SEPAY_API_TOKEN` trong `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`, vì #12 chỉ khai khóa webhook.
  3. Viết test: giao dịch bị lỡ được ghi và không kích hoạt hai lần.
- Success criteria: Test bổ sung giao dịch qua.
- Verify: `pnpm --filter @vox-flow/api test src/billing/reconcile.test.ts` và `pnpm check-types` đều thoát với mã 0.

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
