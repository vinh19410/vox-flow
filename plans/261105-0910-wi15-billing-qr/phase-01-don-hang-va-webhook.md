---
phase: 1
title: "Đơn hàng và webhook"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Đơn hàng và webhook

## Goal
Tiền về đúng thì gói tự kích hoạt, chính xác một lần.

## Files to Create / Modify
- Create: `packages/db/src/schema/billing.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/billing/plans.ts`
- Create: `packages/api/src/billing/sepay-webhook.ts`
- Create: `packages/api/src/routers/billing.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/api/src/entitlements.ts`
- Modify: `packages/api/src/routers/results.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `apps/server/.env.schema`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
  3. Đọc trạng thái #9. Đây là phụ thuộc mềm: nếu chưa xong thì ghi nhận rủi ro và tiếp tục.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 12 14 17; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Chuyển định nghĩa gói lên server.
- Goal: Chuyển định nghĩa gói lên server.
- Target files and symbols: `packages/api/src/billing/plans.ts`, `apps/web/src/features/billing/data.ts`, `apps/web/src/features/billing/plan-utils.ts`; test: `packages/api/src/billing/plans.test.ts`
- Steps:
  1. Server là nguồn duy nhất cho giá và thời hạn. Giá trên client không được tin.
  2. Tính hạn gói "Đến ngày thi" theo ngày thi và tối đa 60 ngày. Viết test các trường hợp biên.
- Success criteria: Test tính hạn qua.
- Verify: `pnpm --filter @vox-flow/api test src/billing/plans.test.ts` thoát với mã 0.

### Task 1.2 — Tạo đơn và QR.
- Goal: Tạo đơn và QR.
- Target files and symbols: `packages/db/src/schema/billing.ts` (`payment_order`, `subscription`, `payment_event`), `packages/api/src/routers/billing.ts` (`createOrder`, `getOrder`); test: `packages/api/src/routers/billing.test.ts`
- Steps:
  1. Đọc skill `ak-payment-integration` và tài liệu SePay hiện hành trước khi làm.
  2. Mỗi đơn có mã riêng khó đoán nằm trong nội dung chuyển khoản, số tiền và hạn đơn cố định.
  3. Chạy `pnpm --filter @vox-flow/db db:generate`. Đăng ký bảng vào `data-registry.ts`.
  4. `billing.createOrder` trả `FORBIDDEN` trừ khi `LAUNCH_OPEN='true'` hoặc email thuộc `LAUNCH_ALLOWED_EMAILS`. Test cả ba trường hợp.
  5. Khai `SEPAY_BANK_ACCOUNT`, `SEPAY_BANK_CODE` trong `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`.
- Success criteria: Test tạo đơn qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/billing.test.ts` thoát với mã 0.

### Task 1.3 — Tạo webhook SePay.
- Goal: Tạo webhook SePay.
- Target files and symbols: `packages/api/src/billing/sepay-webhook.ts`, `apps/server/src/index.ts`; test: `packages/api/src/billing/sepay-webhook.test.ts`; test: `packages/api/src/routers/results.test.ts`
- Steps:
  1. Thêm route Hono `POST /webhooks/sepay`, xác thực bằng `SEPAY_WEBHOOK_API_KEY` theo tài liệu SePay.
  2. Chỉ `transferType='in'` mới được xét kích hoạt; `out` chỉ ghi `payment_event`, trả 2xx.
  3. `INSERT payment_event ... ON CONFLICT(sepayId) DO NOTHING RETURNING`. Không chèn được dòng mới thì trả 2xx và dừng. Mọi sự kiện đều được ghi để #20 đối soát, kể cả sự kiện không khớp.
  4. Kích hoạt bằng `UPDATE payment_order SET status='paid' WHERE id=? AND status='pending' AND expiresAt>?`, chỉ tạo `subscription` khi cập nhật được 1 dòng.
  5. Đổi `getEntitlement` đọc `subscription` còn hạn. Test ở `src/routers/results.test.ts`: gói còn hạn nhận đủ tiêu chí và bằng chứng; gói hết hạn hoặc đã hoàn tiền thì payload như miễn phí.
  6. Test: sai khóa; gọi trùng; `out` cùng mã và số tiền không kích hoạt; giao dịch thứ hai cùng đơn không kích hoạt lại; sai số tiền; đơn hết hạn không kích hoạt.
  7. Đối chiếu thân response thành công mà SePay yêu cầu với API Key trong tài liệu hiện hành.
- Success criteria: Các test webhook qua.
- Verify: `pnpm --filter @vox-flow/api test src/billing/sepay-webhook.test.ts` và `pnpm --filter @vox-flow/api test src/routers/results.test.ts` đều thoát với mã 0.

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
