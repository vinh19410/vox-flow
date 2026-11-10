---
title: "Phase 3: Regression gates toàn exam/scoring + check-types"
status: done
---

# Phase 3: Regression gates toàn exam/scoring + check-types

## Goal

Chứng minh fix không phá gì: toàn bộ test `features/exam` và `features/scoring` xanh, `pnpm check-types` pass.

## Files to Create / Modify

- Không có file mới. Nếu gate nào đỏ → xử lý theo Failure Protocol, chỉ chạm các file đã sửa ở Phase 1–2 hoặc test file tương ứng.

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

## Tasks & Steps

### Task 3.1 — Full regression test features

- Goal: toàn bộ test thư mục `features` (bao gồm `__tests__`, `exam`, `scoring`, `forecast` — mọi nơi render ExamScreen) đều xanh.
- Target files: không đổi code trong task này.
- Steps:
  1. Chạy `pnpm --filter web test src/features` từ repo root.
- Success criteria: exit 0, không test nào fail.
- Verify: lệnh trên exit 0, output có `passed`, không có `failed`.

### Task 3.2 — Type check + build

- Goal: không lỗi kiểu sau thay đổi hook + modal + screen.
- Target files: không đổi code trong task này.
- Steps:
  1. Chạy `pnpm check-types` từ repo root.
- Success criteria: exit 0.
- Verify: `pnpm check-types` exit 0 (ở `apps/web` lệnh này chạy cả `vite build` — build phải thành công).

## Verification (tổng hợp)

- `pnpm --filter web test src/features/exam` → exit 0
- `pnpm --filter web test src/features/scoring` → exit 0
- `pnpm check-types` → exit 0

## Success Criteria

Cả ba lệnh trên exit 0. Khi đó AC9 của plan đạt; plan sẵn sàng cho `/ak-code-review --pending`.
