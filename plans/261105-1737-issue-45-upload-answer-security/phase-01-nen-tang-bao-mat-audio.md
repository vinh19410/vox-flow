---
phase: 1
title: "Nền tảng bảo mật Audio"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Nền tảng bảo mật Audio

## Goal
Xây dựng mô-đun thuần túy `packages/api/src/audio.ts` xử lý chuẩn hóa mimeType, tạo và kiểm tra tính hợp lệ của `audioKey`, chuẩn hóa header bảo mật cho phản hồi audio, và phân loại dữ liệu bất thường; kiểm chứng 100% bằng bộ unit test `packages/api/src/audio.test.ts`.

## Files to Create / Modify
- Create: `packages/api/src/audio.ts`
- Create: `packages/api/src/audio.test.ts`
- Modify: `packages/api/src/index.ts` (export helper nếu cần)

## Tasks & Steps

### Task 1.1 — Viết bộ test TDD kiểm chứng các quy tắc bảo mật audio
- Goal: Định nghĩa toàn bộ ca kiểm thử cho logic xử lý audio trước khi viết code triển khai.
- Target files and symbols: `packages/api/src/audio.test.ts`
- Steps:
  1. Tạo file test `packages/api/src/audio.test.ts`.
  2. Viết test cho `ALLOWED_AUDIO_MIME_TYPES`: bao gồm đúng `audio/webm`, `audio/mp4`, `audio/ogg`, `audio/wav`, `audio/mpeg`.
  3. Viết test cho `normalizeMimeType`:
     - Chấp nhận MIME type hợp lệ và bỏ qua tham số phụ (ví dụ `audio/webm;codecs=opus` -> `audio/webm`).
     - Chuẩn hóa chữ hoa thành chữ thường, cắt bỏ khoảng trắng thừa.
     - Trả về `null` cho MIME type nguy hiểm hoặc lạ như `text/html`, `application/javascript`, `image/svg+xml`.
  4. Viết test cho `getAudioExtension`: ánh xạ đúng từng loại sang `webm`, `mp4`, `ogg`, `wav`, `mp3`.
  5. Viết test cho `buildAudioKey`:
     - Tạo key chuẩn định dạng `users/${userId}/attempts/${attemptId}/${questionKey}.${ext}`.
     - Ném lỗi nếu `questionKey` chứa ký tự không hợp lệ hoặc cố tình traversal (ví dụ `../q1`, `part1/q1`).
  6. Viết test cho `isValidAudioKey`:
     - Trả về `true` khi key bắt đầu đúng tiền tố `users/${userId}/attempts/${attemptId}/` và tên file khớp `^[a-zA-Z0-9_-]+\.(webm|mp4|ogg|wav|mp3)$`.
     - Sử dụng prefix slicing (`key.startsWith(prefix)` và `key.slice(prefix.length)`) thay vì dynamic regex interpolation để tránh ReDoS và regex injection.
     - Trả về `false` khi `key` là null, undefined, hoặc chuỗi rỗng.
     - Trả về `false` khi sai `userId`, sai `attemptId`.
     - Trả về `false` khi cố tình tấn công extension tiền tố (ví dụ `attempts/att_123_extra/...`).
     - Trả về `false` khi có `..`, đường dẫn con lồng nhau, hoặc đuôi file không nằm trong danh sách an toàn.
  7. Viết test cho `safeAudioResponseHeaders`:
     - Trả về đối tượng header chứa `Content-Type`, `X-Content-Type-Options: nosniff`, `Content-Disposition: inline`, `Content-Security-Policy: default-src 'none'; sandbox`.
     - Fallback `Content-Type` về `audio/webm` nếu input không hợp lệ.
  8. Viết test cho `classifyAnswerRow`:
     - Phát hiện hàng có `audioKey` không hợp lệ với `userId`/`attemptId`.
     - Phát hiện hàng có `mimeType` không thuộc allowlist.
- Success criteria: Test file được tạo và chạy được bằng vitest.
- Verify: `pnpm --filter @vox-flow/api test src/audio.test.ts` thoát với mã khác 0 (do chưa có file triển khai hoặc chưa export đủ hàm).

### Task 1.2 — Triển khai `packages/api/src/audio.ts`
- Goal: Hoàn thiện các hàm bảo mật audio đáp ứng đầy đủ yêu cầu test.
- Target files and symbols: `packages/api/src/audio.ts`
- Steps:
  1. Khai báo `ALLOWED_AUDIO_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"] as const`.
  2. Khai báo `QUESTION_KEY_RE = /^[a-zA-Z0-9_-]+$/`.
  3. Triển khai `normalizeMimeType(raw: string | null | undefined): AllowedAudioMimeType | null`.
  4. Triển khai `getAudioExtension(mime: AllowedAudioMimeType): string`.
  5. Triển khai `buildAudioKey(userId: string, attemptId: string, questionKey: string, mime: AllowedAudioMimeType): string`: kiểm tra `QUESTION_KEY_RE.test(questionKey)`, nếu không ném lỗi.
  6. Triển khai `isValidAudioKey(key: string | null | undefined, userId: string, attemptId: string): boolean`:
     - Kiểm tra null/undefined/empty.
     - Kiểm tra `key.startsWith(users/${userId}/attempts/${attemptId}/)`.
     - Lấy `filename = key.slice(prefix.length)`.
     - Kiểm tra `/^[a-zA-Z0-9_-]+\.(webm|mp4|ogg|wav|mp3)$/.test(filename)`.
  7. Triển khai `safeAudioResponseHeaders(mime: string | null | undefined): Record<string, string>`.
  8. Triển khai `classifyAnswerRow(row: { audioKey: string | null | undefined; mimeType: string | null | undefined; userId: string; attemptId: string }): string[]`.
  9. Export các hàm trên trong `packages/api/src/audio.ts` và re-export tại `packages/api/src/index.ts`.
- Success criteria: Toàn bộ unit test trong `audio.test.ts` chuyển sang màu xanh.
- Verify: `pnpm --filter @vox-flow/api test src/audio.test.ts` thoát với mã 0 và in `passed`.

## Verification
Chạy lệnh test chuyên biệt cho mô-đun audio và kiểm tra không có lỗi kiểu:
- `pnpm --filter @vox-flow/api test src/audio.test.ts`
- `pnpm --filter @vox-flow/api check-types`

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
