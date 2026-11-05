---
phase: 1
title: "API tiến độ"
status: pending
priority: P2
effort: ""
dependencies: []
---

# Phase 1: API tiến độ

## Goal
Có dữ liệu lịch sử và band ước lượng.

## Files to Create / Modify
- Create: `packages/api/src/routers/progress.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `packages/api/src/progress/estimate.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 15 17; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Viết logic ước lượng.
- Goal: Viết logic ước lượng.
- Target files and symbols: `packages/api/src/progress/estimate.ts`; test: `packages/api/src/progress/estimate.test.ts`
- Steps:
  1. Viết hàm thuần tính band ước lượng và khoảng từ N bài gần nhất; dưới số bài tối thiểu thì trả `insufficient`.
  2. Chỉ ra điểm mạnh và cần cải thiện từ 4 tiêu chí, theo phân quyền của #17.
  3. Viết test gồm trường hợp một bài và dao động lớn.
- Success criteria: Test qua.
- Verify: `pnpm --filter @vox-flow/api test src/progress/estimate.test.ts` thoát với mã 0.

### Task 1.2 — Tạo router `progress`.
- Goal: Tạo router `progress`.
- Target files and symbols: `packages/api/src/routers/progress.ts` (`summary`, `history`); test: `packages/api/src/routers/progress.test.ts`
- Steps:
  1. Chỉ trả dữ liệu của người đang đăng nhập, có phân trang.
  2. Viết test không đọc được dữ liệu người khác.
  3. `history` không trả lượt `inHistory=false`.
- Success criteria: Test router qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/progress.test.ts` thoát với mã 0.

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
