---
phase: 2
title: "Công cụ xử lý và runbook"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Công cụ xử lý và runbook

## Goal
Người sở hữu xử lý được giao dịch lỗi.

## Files to Create / Modify
- Create: `packages/api/src/routers/admin-billing.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `apps/web/src/routes/admin/payments.tsx`
- Create: `apps/web/src/features/admin/payments-screen.tsx`
- Create: `docs/runbooks/payment-reconciliation.md`

## Tasks & Steps

### Task 2.1 — Tạo hàng đợi cho người sở hữu.
- Goal: Tạo hàng đợi cho người sở hữu.
- Target files and symbols: `packages/api/src/routers/admin-billing.ts`, `apps/web/src/features/admin/payments-screen.tsx`; test: `packages/api/src/routers/admin-billing.test.ts`
- Steps:
  1. Trong `packages/api/src/index.ts`, dùng `adminProcedure` nếu đã có; nếu chưa thì tạo: yêu cầu session, `emailVerified=true`, email thuộc `ctx.env.ADMIN_EMAILS`; danh sách rỗng thì từ chối tất cả. Nếu `Context` chưa có `env` thì mở rộng như mô tả ở #16. Nếu chưa khai, thêm `ADMIN_EMAILS` vào `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`. Viết test từ chối người dùng thường.
  2. Danh sách giao dịch cần xử lý, hành động `activate` và `markRefunded`, bắt buộc có ghi chú.
  3. Không thực hiện chuyển tiền từ app; hoàn tiền làm tay ngoài ngân hàng.
  4. `markRefunded` của gói "Theo lượt" thu hồi các lượt chưa dùng; bài đã mở vẫn giữ nguyên.
- Success criteria: Người thường không truy cập được.
- Verify: `pnpm --filter @vox-flow/api test src/routers/admin-billing.test.ts` và `pnpm check-types` đều thoát với mã 0.

### Task 2.2 — Viết runbook.
- Goal: Viết runbook.
- Target files and symbols: `docs/runbooks/payment-reconciliation.md`
- Steps:
  1. Mỗi trường hợp ở bước phân loại có một mục `## <mã>` với cách xử lý và thời hạn phản hồi học viên.
- Success criteria: Đủ 4 trường hợp lỗi.
- Verify: `grep -cE '^## (underpaid|overpaid|unknown_code|expired_order)' docs/runbooks/payment-reconciliation.md` in `4`.

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
