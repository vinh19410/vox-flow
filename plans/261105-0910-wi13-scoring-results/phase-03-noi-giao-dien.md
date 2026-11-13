---
phase: 3
title: "Nối giao diện và luyện lại câu yếu"
status: pending
priority: P1
effort: "2d"
dependencies: [1, 2]
---

# Phase 3: Nối giao diện và luyện lại câu yếu

## Goal
Màn kết quả hiển thị đúng phần server cho phép, và "Luyện ngay" đưa học viên vào luyện đúng câu yếu nhất rồi so sánh band trước và sau (D-05).

## Files to Create / Modify
- Modify: `apps/web/src/features/results/results-screen.tsx`
- Modify: `apps/web/src/features/results/scored-result.ts`
- Modify: `apps/web/src/features/results/components/band-hero.tsx`
- Modify: `apps/web/src/features/results/components/soft-paywall.tsx`
- Modify: `apps/web/src/features/results/__tests__/scored-results.test.tsx`
- Modify: `packages/db/src/schema/attempt.ts` (thêm cột) và migration sinh bằng `pnpm --filter @vox-flow/db db:generate`
- Modify: `packages/api/src/routers/attempt.ts`, `packages/api/src/routers/attempt.test.ts`

## Tasks & Steps

### Task 3.1 — Giao diện theo quyền từ server
- Goal: bỏ mở khóa cứng trên giao diện.
- Target files and symbols: `results-screen.tsx` (`pro`, `range`), `scored-result.ts`, `band-hero.tsx`, `soft-paywall.tsx`
- Steps:
  1. Thay `const pro = scored ? true : !!s.plan` bằng `!scored.locked` cho kết quả đã chấm.
  2. Hiển thị `range` của server trên `band-hero` thay cho `undefined`.
  3. Khi `locked`: hiện bằng chứng của câu yếu nhất, các tiêu chí còn lại hiện `SoftPaywall`. Giao diện không tự suy ra dữ liệu bị khóa.
  4. Sửa test kết quả cho cả hai trường hợp `locked` và không `locked`.
- Success criteria: test kết quả qua.
- Verify: `pnpm --filter web test src/features/results/__tests__/scored-results.test.tsx` thoát với mã 0.

### Task 3.2 — Luyện lại đúng câu yếu nhất
- Goal: hành động North Star của D-05 chạy thật.
- Target files and symbols: `attempt.ts` (`start`), bảng `attempt` (cột `retake_of_attempt_id`), `results-screen.tsx` (nút "Luyện ngay")
- Steps:
  1. Thêm cột `retake_of_attempt_id` (nullable) vào bảng `attempt`, sinh migration bằng lệnh của repo. Không sửa tay migration.
  2. `attempt.start` nhận thêm `retakeOf: attemptId`. Server kiểm tra lượt gốc thuộc người gọi và đã chấm xong, lấy câu yếu nhất bằng `weakestQuestionKey`, lấy câu hỏi chuẩn của câu đó từ lượt gốc (forecast topic hoặc `mock-exam-bank`), rồi tạo lượt một câu có `retake_of_attempt_id`. Không nhận `questionText` hay `questionKey` từ client cho đường này.
  3. Lượt luyện lại đi qua pipeline chấm hiện có, không thêm nhánh chấm riêng.
  4. "Luyện ngay" gọi `attempt.start({ retakeOf })` thay vì về màn chọn đề. Màn kết quả của lượt luyện lại hiện band của lượt gốc cạnh band mới.
  5. Viết test router: lượt của người khác bị từ chối; lượt chưa chấm bị từ chối; câu hỏi lấy từ server.
- Success criteria: test router và test giao diện qua; cả repo qua kiểm tra kiểu.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts`, `pnpm --filter web test src/features/results/__tests__/scored-results.test.tsx` và `pnpm check-types` đều thoát với mã 0.

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
