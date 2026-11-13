---
phase: 1
title: "Kiểm tra nền đã có"
status: pending
priority: P1
effort: "0.5h"
dependencies: []
---

# Phase 1: Kiểm tra nền đã có

## Goal
Xác nhận phụ thuộc đã đóng và pipeline chấm đã có (từ #90, #130) vẫn xanh trước khi sửa. Phase này không viết code mới.

## Files to Create / Modify
- Không sửa file.

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 15 16; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Chốt mốc test của pipeline đã có
- Goal: có mốc xanh để phát hiện hồi quy ở Phase 2 và 3.
- Target files and symbols: `packages/api/src/scoring/aggregate.test.ts`, `packages/api/src/scoring/score-attempt.test.ts`, `packages/api/src/routers/scoring.test.ts`
- Steps:
  1. Chạy ba file test trong Verify, không sửa gì.
  2. Nếu có test đỏ, dừng lại: đó là lỗi có sẵn, không thuộc phạm vi plan này.
- Success criteria: cả ba file test qua.
- Verify: `pnpm --filter @vox-flow/api test src/scoring/aggregate.test.ts src/scoring/score-attempt.test.ts src/routers/scoring.test.ts` thoát với mã 0.

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
