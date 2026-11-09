---
phase: 1
title: "Pipeline chấm"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Pipeline chấm

## Goal
Bài nộp được chấm bất đồng bộ và lưu kết quả.

## Files to Create / Modify
- Create: `packages/db/src/schema/score.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/scoring/score-attempt.ts`
- Create: `packages/api/src/scoring/aggregate.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/api/src/routers/attempt.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 7 15 16; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Viết phần tính kết quả.
- Goal: Viết phần tính kết quả.
- Target files and symbols: `packages/api/src/scoring/aggregate.ts` (`medianBand`, `confidenceRange`); test: `packages/api/src/scoring/aggregate.test.ts`
- Steps:
  1. Viết test trước: trung vị của 3 lần, làm tròn theo bước 0.5, độ chênh và khoảng tin cậy.
  2. Viết hàm thuần, không gọi dịch vụ ngoài.
- Success criteria: Test tính toán qua.
- Verify: `pnpm --filter @vox-flow/api test src/scoring/aggregate.test.ts` thoát với mã 0.

### Task 1.2 — Viết phần chấm và lưu kết quả.
- Goal: Viết phần chấm và lưu kết quả.
- Target files and symbols: `packages/api/src/scoring/score-attempt.ts`, `packages/db/src/schema/score.ts`, `apps/server/src/index.ts`; test: `packages/api/src/scoring/score-attempt.test.ts`
- Steps:
  1. Tạo bảng `attempt_score` (tổng, khoảng tin cậy, trạng thái, chi phí) và `score_run` (từng lần chấm, 4 tiêu chí, bằng chứng).
  2. Chạy qua Cloudflare Queue, 3 lần chấm độc lập theo cấu hình của #7. Lưu chi phí mỗi lượt.
  3. Xử lý lại phải an toàn: gọi trùng không tạo thêm kết quả.
  4. Khi hết số lần thử, đặt trạng thái `failed`.
  5. Đăng ký bảng vào `data-registry.ts`.
  6. `attempt.submit` đặt `attempt_score.status='queued'` rồi gửi message Queue; gọi lại không gửi thêm. Thêm `queue` vào default export của `apps/server/src/index.ts`.
- Success criteria: Test chấm với client giả lập qua, gồm trường hợp lỗi và gọi trùng.
- Verify: `pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` thoát với mã 0.

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
