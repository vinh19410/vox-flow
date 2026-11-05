---
phase: 2
title: "Câu hỏi nối tiếp"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Câu hỏi nối tiếp

## Goal
Giám khảo AI hỏi câu nối tiếp theo câu trả lời thật.

## Files to Create / Modify
- Create: `packages/api/src/exam/follow-up.ts`
- Create: `packages/api/src/exam/transcribe.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `apps/server/.env.schema`

## Tasks & Steps

### Task 2.1 — Nối nhận dạng giọng nói và tạo câu hỏi.
- Goal: Nối nhận dạng giọng nói và tạo câu hỏi.
- Target files and symbols: `packages/api/src/exam/transcribe.ts`, `packages/api/src/exam/follow-up.ts`; test: `packages/api/src/exam/follow-up.test.ts`
- Steps:
  1. Dùng đúng dịch vụ và mô hình đã chốt trong `docs/oq-5-scoring-eval.md`. Giữ một hàm cụ thể cho mỗi dịch vụ, không dựng hệ thống plugin.
  2. Giới hạn thời gian gọi. Khi lỗi hoặc quá hạn, dùng câu hỏi dự phòng từ `apps/web/src/features/exam/data.ts`, chuyển sang server.
  3. Ghi chi phí từng lần gọi để đối chiếu ngân sách.
  4. Viết test với client giả lập: trả đúng câu hỏi, và dùng dự phòng khi quá hạn.
  5. Khai khóa dịch vụ đã chọn trong `packages/infra/alchemy.run.ts` và `apps/server/.env.schema`, không ghi giá trị.
- Success criteria: Lỗi AI không làm dừng bài thi.
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
