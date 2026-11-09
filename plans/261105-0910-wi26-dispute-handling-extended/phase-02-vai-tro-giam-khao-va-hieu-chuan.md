---
phase: 2
title: "Vai trò giám khảo và hiệu chuẩn"
status: pending
priority: P3
effort: ""
dependencies: [1]
---

# Phase 2: Vai trò giám khảo và hiệu chuẩn

## Goal
Thêm người xử lý được và dữ liệu đưa về hiệu chuẩn đúng đồng ý.

## Files to Create / Modify
- Modify: `packages/db/src/schema/dispute.ts`
- Modify: `packages/api/src/routers/dispute-admin.ts`
- Create: `packages/api/src/disputes/calibration-export.ts`
- Modify: `apps/web/src/features/admin/disputes-screen.tsx`

## Tasks & Steps

### Task 2.1 — Thêm vai trò và phân công.
- Goal: Thêm vai trò và phân công.
- Target files and symbols: `packages/db/src/schema/dispute.ts`, `packages/api/src/routers/dispute-admin.ts`; test: `packages/api/src/routers/dispute-admin.test.ts`
- Steps:
  1. Thêm `assignedTo`, và `examinerProcedure` chỉ thấy báo lỗi được giao, không truy cập thanh toán hay đề.
  2. Chạy `pnpm --filter @vox-flow/db db:generate`.
  3. Viết test phân quyền, và test giám khảo không thấy bài của người khác.
- Success criteria: Test phân quyền qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/dispute-admin.test.ts` thoát với mã 0.

### Task 2.2 — Xuất dữ liệu hiệu chuẩn.
- Goal: Xuất dữ liệu hiệu chuẩn.
- Target files and symbols: `packages/api/src/disputes/calibration-export.ts`; test: `packages/api/src/disputes/calibration-export.test.ts`
- Steps:
  1. Chỉ chọn báo lỗi đã xử lý và có đồng ý `calibration` mới nhất từ #15. Ẩn danh `userId`.
  2. Viết test: học viên đã rút đồng ý không xuất hiện.
- Success criteria: Test đồng ý qua.
- Verify: `pnpm --filter @vox-flow/api test src/disputes/calibration-export.test.ts` thoát với mã 0 và `pnpm check-types` thoát với mã 0.

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
