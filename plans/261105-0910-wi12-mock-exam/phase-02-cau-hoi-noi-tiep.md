---
phase: 2
title: "Câu hỏi nối tiếp"
status: completed
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Câu hỏi nối tiếp

## Goal
Giám khảo AI hỏi câu nối tiếp theo câu trả lời thật.

## Files to Create / Modify
- Create: `packages/api/src/exam/fallback-data.ts`
- Create: `packages/api/src/exam/transcribe.ts`
- Create: `packages/api/src/exam/follow-up.ts`
- Modify: `packages/api/src/routers/attempt.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `apps/server/.env.schema`

## Tasks & Steps

### Task 2.1 — Nối nhận dạng giọng nói và tạo câu hỏi.
- Goal: Nhận dạng giọng nói thí sinh từ file WebM/MP4 và sinh câu hỏi nối tiếp bằng LLM, có phương án dự phòng tin cậy khi AI quá hạn (>4s) hoặc gặp lỗi.
- Target files and symbols: `packages/api/src/exam/fallback-data.ts`, `packages/api/src/exam/transcribe.ts`, `packages/api/src/exam/follow-up.ts`, `packages/api/src/routers/attempt.ts`; test: `packages/api/src/exam/follow-up.test.ts`
- Steps:
  1. Tạo `packages/api/src/exam/fallback-data.ts` chứa danh sách câu hỏi dự phòng chuẩn hóa và cụm từ kích hoạt theo từng Part, đặt tại package dùng chung thay vì import ngược từ `apps/web`.
  2. Tạo `packages/api/src/exam/transcribe.ts` hỗ trợ nhận dạng âm thanh trực tiếp từ buffer/stream WebM hoặc MP4 (sử dụng API như Whisper hoặc Azure Speech endpoint hỗ trợ container nén), không yêu cầu binary transcoding ngoài Worker.
  3. Tạo `packages/api/src/exam/follow-up.ts`:
     - Đóng gói transcript của thí sinh trong thẻ cấu trúc `<candidate_transcript>` để chống prompt injection.
     - Gọi LLM sinh câu hỏi follow-up ngắn gọn (dưới 25 từ) bám sát ý tưởng thí sinh vừa nói.
     - Kiểm tra kết quả trả về bằng Zod schema `{ questionText: string, triggerPhrase: string }`.
     - Đặt timeout tối đa 4000ms. Nếu quá hạn, lỗi API hoặc transcript rỗng, tự động lấy câu hỏi dự phòng từ `fallback-data.ts`.
  4. Mở rộng router `attempt.ts` với procedure `getFollowUp` nhận `attemptId` và `questionKey`, trả về câu hỏi nối tiếp cho client.
  5. Khai báo các biến cấu hình cần thiết trong `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`.
  6. Viết test `packages/api/src/exam/follow-up.test.ts` với mock client: kiểm tra tạo câu hỏi thành công, bảo vệ chống prompt injection, và kích hoạt fallback tức thì khi có lỗi hoặc timeout.
- Success criteria: Lỗi AI hoặc quá hạn 4s tự động chuyển sang câu hỏi dự phòng mà không làm gián đoạn bài thi.
- Verify: `pnpm --filter @vox-flow/api test src/exam/follow-up.test.ts` thoát với mã 0.
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
