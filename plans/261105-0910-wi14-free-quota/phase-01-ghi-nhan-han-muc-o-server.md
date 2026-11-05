---
phase: 1
title: "Ghi nhận hạn mức ở server"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Ghi nhận hạn mức ở server

## Goal
Việc trừ điểm chính xác, kể cả khi có yêu cầu đồng thời.

## Files to Create / Modify
- Create: `packages/db/src/schema/quota.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/quota/quota.ts`
- Modify: `packages/api/src/routers/attempt.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `packages/api/src/scoring/score-attempt.ts`
- Modify: `packages/api/src/routers/results.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 17; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Viết logic hạn mức.
- Goal: Viết logic hạn mức.
- Target files and symbols: `packages/api/src/quota/quota.ts` (`vnDay`, `pointsFor`, `reserve`, `release`); test: `packages/api/src/quota/quota.test.ts`
- Steps:
  1. `vnDay` tính theo múi giờ `Asia/Ho_Chi_Minh`. Viết test tại ranh giới 23:59 và 00:00 giờ Việt Nam.
  2. `reserve` dùng một câu lệnh ghi có điều kiện của D1 để hai yêu cầu đồng thời không vượt 3 điểm.
  3. `reserve` gọi `getEntitlement` của #17 trước. Nếu `paid` thì bỏ qua cả giới hạn 3 điểm lẫn trần toàn hệ thống, ghi test cho nhánh này. Trần tính bằng tổng chi phí ước tính của các lượt miễn phí trong `vnDay`, gồm cả lượt đã giữ chỗ, so với `FREE_DAILY_BUDGET_VND` (tạm 33000, chỉnh theo #7).
  4. `release` hoàn điểm khi lượt chấm kết thúc ở trạng thái `failed`.
- Success criteria: Test ranh giới ngày, đồng thời và trần đều qua.
- Verify: `pnpm --filter @vox-flow/api test src/quota/quota.test.ts` thoát với mã 0.

### Task 1.2 — Gắn hạn mức vào lượt thi.
- Goal: Gắn hạn mức vào lượt thi.
- Target files and symbols: `packages/api/src/routers/attempt.ts` (`start`), `packages/db/src/schema/quota.ts`, `packages/api/src/data-registry.ts`, `packages/api/src/scoring/score-attempt.ts`; test: `packages/api/src/routers/attempt.test.ts`
- Steps:
  1. Gọi `reserve` trong `attempt.start`. Trả lỗi có mã `QUOTA_EXCEEDED` hoặc `GLOBAL_CAP_REACHED`.
  2. Chạy `pnpm --filter @vox-flow/db db:generate`.
  3. Đăng ký bảng vào `data-registry.ts`.
  4. Khi lượt chuyển sang `failed` thì gọi `release` đúng một lần. `results.retry` của lượt miễn phí phải `reserve` lại. Test: lỗi hoàn đúng số điểm; gọi trùng không hoàn hai lần.
- Success criteria: Hết điểm thì không bắt đầu được.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` thoát với mã 0.

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
