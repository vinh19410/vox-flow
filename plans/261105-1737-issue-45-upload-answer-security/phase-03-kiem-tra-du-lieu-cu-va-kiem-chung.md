---
phase: 3
title: "Kiểm tra dữ liệu cũ và kiểm chứng toàn diện"
status: completed
priority: P1
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Kiểm tra dữ liệu cũ và kiểm chứng toàn diện

## Goal
Xây dựng giải pháp rà soát dữ liệu lịch sử bảng `attempt_answer` (chức năng `findSuspiciousAnswers` với kiểu dữ liệu chặt chẽ và kịch bản SQL an toàn `scripts/audit-attempt-answers.sql`) cùng kiểm chứng toàn diện toàn bộ workspace.

## Files to Create / Modify
- Create: `scripts/audit-attempt-answers.sql`
- Modify: `packages/api/src/audio.ts` (thêm `findSuspiciousAnswers`)
- Modify: `packages/api/src/audio.test.ts` (thêm test cho `findSuspiciousAnswers`)

## Tasks & Steps

### Task 3.1 — Xây dựng công cụ rà soát dữ liệu cũ
- Goal: Cung cấp giải pháp chỉ đọc (read-only) để phát hiện bất kỳ hàng nào trong `attempt_answer` có tiền tố `audioKey` không thuộc về `users/<userId>/attempts/<attemptId>/` hoặc `mimeType` nằm ngoài danh sách cho phép.
- Target files and symbols: `packages/api/src/audio.ts` (hàm `findSuspiciousAnswers`), `packages/api/src/audio.test.ts`, `scripts/audit-attempt-answers.sql`
- Steps:
  1. Trong `packages/api/src/audio.ts`:
     - Triển khai hàm `findSuspiciousAnswers(db: Database)` (import kiểu `Database` từ `@vox-flow/db`, không dùng `any`): truy vấn các bản ghi `attempt_answer` join với `attempt` lấy `id`, `attemptId`, `audioKey`, `mimeType`, và `userId` của attempt.
     - Sử dụng `classifyAnswerRow` để sàng lọc các hàng có vấn đề (sai tiền tố, sai user, sai attempt, mimeType lạ).
  2. Trong `packages/api/src/audio.test.ts`:
     - Viết test kiểm tra `findSuspiciousAnswers` với mock DB hoặc test DB nhẹ.
     - Khẳng định `findSuspiciousAnswers` trả về chính xác các hàng bất thường kèm lý do phân loại rõ ràng.
  3. Tạo file `scripts/audit-attempt-answers.sql`:
     - Viết câu truy vấn `SELECT` chỉ đọc liệt kê các hàng có `audio_key` không bắt đầu bằng `'users/' || a.user_id || '/attempts/' || a.id || '/'` hoặc `mime_type NOT IN ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg')`.
     - Kèm hướng dẫn chạy qua wrangler d1 hoặc D1 console mà không thực hiện bất kỳ lệnh DELETE tự động nào.
- Success criteria: Test cho `findSuspiciousAnswers` chạy thành công; file SQL tồn tại và có cú pháp chính xác.
- Verify: `pnpm --filter @vox-flow/api test src/audio.test.ts` thoát với mã 0.

### Task 3.2 — Kiểm chứng toàn bộ workspace và kiểm tra 5 tiêu chí của Issue 45
- Goal: Đảm bảo toàn bộ dự án sạch lỗi kiểu và đạt 100% tiêu chí chấp nhận.
- Target files and symbols: Toàn bộ workspace
- Steps:
  1. Chạy `pnpm check-types` trên toàn bộ monorepo (bao gồm `apps/web`, `apps/server`, `packages/api`, `packages/db`, `packages/auth`, `packages/infra`, `packages/ui`).
  2. Chạy test các file trọng yếu:
     - `pnpm --filter @vox-flow/api test src/audio.test.ts`
     - `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts`
     - `pnpm --filter @vox-flow/api test src/data-registry.test.ts`
  3. Kiểm tra đối chiếu với 5 tiêu chí hoàn thành trong Issue #45:
    - Test: `uploadAnswer` không cho client chọn `audioKey` ngoài tiền tố của chính attempt.
    - Test: `mimeType` ngoài allowlist bị từ chối.
    - Response audio có `nosniff` và Content-Type thuộc allowlist.
    - Dữ liệu cũ: kiểm tra hàng `attempt_answer` có `audioKey` sai tiền tố hoặc `mimeType` lạ.
    - `pnpm check-types` và test liên quan đạt.
- Success criteria: `pnpm check-types` thoát 0, tất cả test liên quan thoát 0.
- Verify: `pnpm check-types` thoát với mã 0.

## Verification
- `pnpm check-types`
- `pnpm --filter @vox-flow/api test src/audio.test.ts`
- `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts`
- `pnpm --filter @vox-flow/api test src/data-registry.test.ts`

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
