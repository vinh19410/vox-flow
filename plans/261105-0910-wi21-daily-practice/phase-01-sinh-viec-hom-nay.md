---
phase: 1
title: "Sinh việc hôm nay"
status: pending
priority: P2
effort: ""
dependencies: []
---

# Phase 1: Sinh việc hôm nay

## Goal
Có logic tạo việc và tính chuỗi ngày.

## Files to Create / Modify
- Create: `packages/api/src/practice/daily-plan.ts`
- Create: `packages/api/src/routers/practice.ts`
- Modify: `packages/api/src/routers/index.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 17; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Viết logic thuần.
- Goal: Viết logic thuần.
- Target files and symbols: `packages/api/src/practice/daily-plan.ts` (`buildTasks`, `computeStreak`, `paceFor`); test: `packages/api/src/practice/daily-plan.test.ts`
- Steps:
  1. `buildTasks` nhận tiêu chí yếu từ dữ liệu chấm, không dùng gợi ý cố định.
  2. `computeStreak` dùng `vnDay` của #18 nếu đã có, hoặc cùng múi giờ `Asia/Ho_Chi_Minh`.
  3. Viết test: ranh giới ngày, mất chuỗi, chưa có bài, sắp đến ngày thi, ngày thi đã qua.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/practice/daily-plan.test.ts` thoát với mã 0.

### Task 1.2 — Tạo router `practice`.
- Goal: Tạo router `practice`.
- Target files and symbols: `packages/api/src/routers/practice.ts` (`today`); test: `packages/api/src/routers/practice.test.ts`
- Steps:
  1. Đọc `user_profile`, `attempt_score` và `score_run`.
  2. Tôn trọng phân quyền của #17: không làm lộ chi tiết tiêu chí cho người chưa trả phí qua nội dung việc.
- Success criteria: Test router qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/practice.test.ts` thoát với mã 0.

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
