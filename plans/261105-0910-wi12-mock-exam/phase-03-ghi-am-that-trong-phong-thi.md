---
phase: 3
title: "Ghi âm thật trong phòng thi"
status: completed
priority: P1
effort: ""
dependencies: [1, 2]
---

# Phase 3: Ghi âm thật trong phòng thi

## Goal
Phòng thi ghi âm thật thay cho mô phỏng.

## Files to Create / Modify
- Create: `apps/web/src/hooks/use-recorder.ts`
- Create: `apps/web/src/hooks/__tests__/use-recorder.test.ts`
- Create: `apps/web/src/features/exam/storage.ts`
- Modify: `apps/web/src/features/exam/use-exam-session.ts`
- Modify: `apps/web/src/features/exam/exam-screen.tsx`
- Modify: `apps/web/src/features/exam/components/live-transcript.tsx`
- Modify: `apps/web/src/features/__tests__/slice-c.test.tsx`

## Tasks & Steps

### Task 3.1 — Tạo hook ghi âm và bộ đệm IndexedDB.
- Goal: Ghi âm microphone bằng MediaRecorder tương thích Chrome/Android (WebM) và Safari iOS (MP4), lưu trữ bền vững vào IndexedDB trước khi gửi mạng.
- Target files and symbols: `apps/web/src/hooks/use-recorder.ts`, `apps/web/src/features/exam/storage.ts`; test: `apps/web/src/hooks/__tests__/use-recorder.test.ts`
- Steps:
  1. Tạo `apps/web/src/features/exam/storage.ts` sử dụng IndexedDB để lưu trữ blob audio và metadata theo key dạng `attempt_${attemptId}_${questionKey}`, hỗ trợ lấy danh sách pending uploads và xóa khi upload thành công.
  2. Tạo `apps/web/src/hooks/use-recorder.ts`:
     - Dùng `MediaRecorder`, tự động phát hiện định dạng hỗ trợ qua `MediaRecorder.isTypeSupported`: ưu tiên `audio/webm;codecs=opus`, fallback sang `audio/mp4` cho Safari iOS.
     - Xử lý trạng thái quyền mic: trả về `denied` khi người dùng từ chối quyền truy cập microphone.
     - Khi dừng ghi âm, tự động lưu blob âm thanh vào IndexedDB trước khi trả blob về cho caller.
  3. Viết unit test `apps/web/src/hooks/__tests__/use-recorder.test.ts` với mock `MediaRecorder` và mock IndexedDB.
- Success criteria: Ghi âm và lưu cache IndexedDB hoạt động độc lập với kết nối mạng.
- Verify: `pnpm --filter web test src/hooks/__tests__/use-recorder.test.ts` thoát với mã 0.

### Task 3.2 — Nối vào phiên thi và giao diện phòng thi.
- Goal: Kết nối toàn bộ vòng đời lượt thi (`start`, `uploadAnswer` qua Hono stream, `getFollowUp`, `submit`) và cập nhật giao diện phòng thi tương thích audio thật.
- Target files and symbols: `apps/web/src/features/exam/use-exam-session.ts`, `apps/web/src/features/exam/exam-screen.tsx`, `apps/web/src/features/exam/components/live-transcript.tsx`; test: `apps/web/src/features/__tests__/slice-c.test.tsx`
- Steps:
  1. Cập nhật `use-exam-session.ts`:
     - Khởi tạo lượt thi qua `trpc.attempt.start.mutate()` hoặc phục hồi attempt đang dang dở qua `trpc.attempt.getActive.query()`.
     - Khi hoàn thành ghi âm câu hỏi: stream binary blob trực tiếp qua Hono endpoint `POST /api/attempts/:attemptId/answers/:questionKey/audio`. Nếu mạng ngắt kết nối, lưu trạng thái pending và retry tự động; không làm mất câu đã ghi âm.
     - Sau khi nộp câu trả lời, nếu có câu hỏi follow-up, chuyển sang trạng thái `"examiner-thinking"` và chèn động câu hỏi vào timeline `steps`.
     - Kết thúc tất cả câu hỏi: gọi `trpc.attempt.submit.mutate({ attemptId })` trước khi chuyển sang màn hình chấm điểm.
  2. Cập nhật `live-transcript.tsx`: hiển thị visualizer dạng thanh sóng âm thanh (waveform) trong khi ghi âm thay cho việc cắt từ giả lập (`step.answer.split`).
  3. Cập nhật `exam-screen.tsx`: chuyển điều kiện cảnh báo câu trả lời quá ngắn từ số lượng từ giả định (`words < MIN_WORDS`) sang thời lượng ghi âm thật (`durationMs < MIN_DURATION[part]`).
  4. Sửa và bổ sung test `slice-c.test.tsx` để bao phủ luồng thi với mock MediaRecorder và mock API attempt.
- Success criteria: Toàn bộ phiên thi chạy mượt mà với audio thật và vượt qua typecheck.
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
