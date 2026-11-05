---
phase: 2
title: "Kiểm tra độ chính xác và phân quyền"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Kiểm tra độ chính xác và phân quyền

## Goal
Pipeline thật đạt ngưỡng và paywall kiểm tra ở server.

## Files to Create / Modify
- Create: `packages/api/src/routers/results.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `docs/scoring-accuracy.md`
- Create: `packages/api/src/entitlements.ts`

## Tasks & Steps

### Task 2.1 — Tạo API kết quả có phân quyền.
- Goal: Tạo API kết quả có phân quyền.
- Target files and symbols: `packages/api/src/routers/results.ts` (`getResult`, `retry`), `packages/api/src/entitlements.ts` (`getEntitlement`); test: `packages/api/src/routers/results.test.ts`
- Steps:
  1. Người dùng miễn phí chỉ nhận band tổng và khoảng tin cậy. Payload không được chứa tiêu chí và bằng chứng.
  2. Phạm vi bằng chứng miễn phí làm theo quyết định D-04 của #6.
  3. Viết test khẳng định trên chính payload trả về.
  4. Tạo `packages/api/src/entitlements.ts`, export `getEntitlement(db, userId): Promise<'free'|'paid'>`. Chưa có `subscription` thì luôn trả `free`. `getResult` chỉ quyết định qua hàm này.
  5. `results.retry` chỉ cho chủ bài, chỉ khi `failed`.
- Success criteria: Payload miễn phí không có dữ liệu trả phí.
- Verify: `pnpm --filter @vox-flow/api test src/routers/results.test.ts` thoát với mã 0.

### Task 2.2 — Đo pipeline thật trên bộ mẫu.
- Goal: Đo pipeline thật trên bộ mẫu.
- Target files and symbols: `docs/scoring-accuracy.md`, `scripts/scoring-eval/report.ts`
- Steps:
  1. Chạy pipeline thật trên 30 bài mẫu của #7.
  2. Ghi kết quả vào báo cáo, kèm dòng `Đạt ngưỡng: có` hoặc `Đạt ngưỡng: không`.
- Success criteria: Báo cáo xác nhận đạt.
- Verify: `grep -c '^Đạt ngưỡng: có' docs/scoring-accuracy.md` in `1`.

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
