---
phase: 1
title: "API báo lỗi"
status: pending
priority: P2
effort: ""
dependencies: []
---

# Phase 1: API báo lỗi

## Goal
Có dữ liệu và luật gửi báo lỗi.

## Files to Create / Modify
- Create: `packages/db/src/schema/dispute.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/routers/dispute.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/infra/alchemy.run.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 15 17; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Tạo bảng và router.
- Goal: Tạo bảng và router.
- Target files and symbols: `packages/db/src/schema/dispute.ts` (`score_dispute`), `packages/api/src/routers/dispute.ts` (`submit`, `get`); test: `packages/api/src/routers/dispute.test.ts`
- Steps:
  1. Lưu `attemptId`, `reason`, `shareConsent`, `status`, `dueAt` bằng thời điểm gửi cộng 72 giờ.
  2. Chỉ chủ bài mới gửi được. Không có `shareConsent` thì người xử lý không xem được audio.
  3. Chạy `pnpm --filter @vox-flow/db db:generate`, đăng ký bảng vào `data-registry.ts`.
  4. Viết test: bài của người khác bị từ chối, báo trùng bị từ chối, `dueAt` đúng 72 giờ.
  5. `dispute.submit` trả `FORBIDDEN` khi `SCORE_DISPUTE_ENABLED` khác `true`; mặc định tắt. Khai biến trong `packages/infra/alchemy.run.ts`. Test nhánh tắt.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/dispute.test.ts` thoát với mã 0.

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
