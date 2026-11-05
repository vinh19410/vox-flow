---
phase: 3
title: "Ghi âm thật trong phòng thi"
status: pending
priority: P1
effort: ""
dependencies: [1, 2]
---

# Phase 3: Ghi âm thật trong phòng thi

## Goal
Phòng thi ghi âm thật thay cho mô phỏng.

## Files to Create / Modify
- Create: `apps/web/src/hooks/use-recorder.ts`
- Modify: `apps/web/src/features/exam/use-exam-session.ts`
- Modify: `apps/web/src/features/exam/exam-screen.tsx`
- Modify: `apps/web/src/features/exam/components/live-transcript.tsx`
- Modify: `apps/web/src/features/__tests__/slice-c.test.tsx`

## Tasks & Steps

### Task 3.1 — Tạo hook ghi âm.
- Goal: Tạo hook ghi âm.
- Target files and symbols: `apps/web/src/hooks/use-recorder.ts`; test: `apps/web/src/hooks/__tests__/use-recorder.test.ts`
- Steps:
  1. Dùng `MediaRecorder`, chọn định dạng qua `isTypeSupported`: `audio/webm` hoặc `audio/mp4` cho Safari.
  2. Trả về trạng thái `denied` khi không có quyền, giống #14.
  3. Viết test với `MediaRecorder` giả lập cho cả hai định dạng.
- Success criteria: Test hook qua.
- Verify: `pnpm --filter web test src/hooks/__tests__/use-recorder.test.ts` thoát với mã 0.

### Task 3.2 — Nối vào phiên thi.
- Goal: Nối vào phiên thi.
- Target files and symbols: `use-exam-session.ts`, `exam-screen.tsx`, `live-transcript.tsx`; test: `apps/web/src/features/__tests__/slice-c.test.tsx`
- Steps:
  1. Mỗi câu tải audio qua `attempt.uploadAnswer`, thử lại khi lỗi mạng và giữ bản trong bộ nhớ tới khi tải xong.
  2. Giữ nguyên quy tắc đã có: cue card chuẩn bị 1 phút, cảnh báo câu quá ngắn trước khi nộp.
  3. Sửa test `ExamScreen (mock test)` trong `slice-c.test.tsx`.
- Success criteria: Phiên thi dùng audio thật.
- Verify: `pnpm --filter web test src/features/__tests__/slice-c.test.tsx` và `pnpm check-types` đều thoát với mã 0.

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
