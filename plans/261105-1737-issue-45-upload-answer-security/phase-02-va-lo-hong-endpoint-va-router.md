---
phase: 2
title: "Vá lỗ hổng endpoint và router"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Vá lỗ hổng endpoint và router

## Goal
Áp dụng các kiểm tra bảo mật vào `attempt.uploadAnswer` (tRPC), các endpoint xử lý audio trong `apps/server/src/index.ts` (POST upload và GET stream), và logic xóa dữ liệu `eraseUserData` trong `packages/api/src/data-registry.ts`.

## Files to Create / Modify
- Modify: `packages/api/src/routers/attempt.ts`
- Modify: `packages/api/src/routers/attempt.test.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/api/src/data-registry.test.ts`

## Tasks & Steps

### Task 2.1 — Gia cố thủ tục tRPC `attempt.uploadAnswer`
- Goal: Loại bỏ hoàn toàn khả năng client tự truyền `audioKey` và ép buộc `mimeType` phải thuộc allowlist.
- Target files and symbols: `packages/api/src/routers/attempt.ts` (hàm `uploadAnswer`), `packages/api/src/routers/attempt.test.ts`
- Steps:
  1. Trong `packages/api/src/routers/attempt.ts`:
     - Bỏ trường `audioKey` khỏi `z.object(...)` của `uploadAnswer`.
     - Cập nhật trường `questionKey`: `z.string().regex(QUESTION_KEY_RE, "Invalid questionKey format")`.
     - Cập nhật trường `mimeType`: `z.string().refine((val) => normalizeMimeType(val) !== null, { message: "Invalid or unsupported audio mimeType" }).transform((val) => normalizeMimeType(val)!)`.
     - Trong resolver, sau khi kiểm tra quyền sở hữu attempt (`currentAttempt.userId !== ctx.session.user.id`), tự sinh key:
       `const audioKey = buildAudioKey(ctx.session.user.id, input.attemptId, input.questionKey, input.mimeType);`
     - Lưu `audioKey` và `input.mimeType` này vào database bảng `attempt_answer`.
  2. Trong `packages/api/src/routers/attempt.test.ts`:
     - Cập nhật các lời gọi `uploadAnswer` hiện tại: xóa bỏ tham số `audioKey` khỏi đối tượng input.
     - Thêm ca kiểm thử: gọi `uploadAnswer` với `mimeType: "text/html"` phải bị từ chối với lỗi schema/validation. (Tối ưu: kiểm tra trực tiếp qua caller mà không tạo Miniflare DB mới để tránh vượt ngưỡng timeout 5000ms).
     - Thêm ca kiểm thử: gọi `uploadAnswer` với `questionKey: "../malicious"` phải bị từ chối.
     - Thêm ca kiểm thử: đọc hàng vừa lưu trong cơ sở dữ liệu và khẳng định `audioKey` được gán chính xác theo tiền tố của attempt và user.
- Success criteria: Test file `attempt.test.ts` chạy qua 100% bao gồm cả các ca kiểm thử bảo mật mới.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` thoát với mã 0.

### Task 2.2 — Gia cố các endpoint audio Hono trong `apps/server/src/index.ts`
- Goal: Bảo đảm endpoint POST audio và GET audio tuân thủ các quy tắc bảo mật và gắn đủ header phòng chống XSS/sniffing và hỗ trợ chuẩn HTTP streaming.
- Target files and symbols: `apps/server/src/index.ts` (route `POST /api/attempts/:attemptId/answers/:questionKey/audio` và `GET /api/attempts/:attemptId/answers/:answerId/audio`)
- Steps:
  1. Nhập các hàm helper từ `@vox-flow/api/audio`.
  2. Trong route `POST .../audio`:
     - Nếu có header `content-type` nhưng `normalizeMimeType(rawContentType)` trả về `null`: trả về `c.json({ error: "Unsupported media type" }, 415)` thay vì âm thầm ép kiểu thành webm. Nếu không có header `content-type`, mặc định là `"audio/webm"`.
     - Dùng `buildAudioKey(session.user.id, attemptId, questionKey, contentType)` để sinh `audioKey`.
  3. Trong route `GET .../audio`:
     - Sau khi truy vấn được `currentAttempt` và `ans`:
       Kiểm tra `isValidAudioKey(ans.audioKey, currentAttempt.userId, attemptId)`. Nếu không hợp lệ, trả về `c.text("Forbidden", 403)`.
     - Lấy header an toàn: `const safeHeaders = safeAudioResponseHeaders(ans.mimeType);`
     - Gắn các header an toàn lên phản hồi TRƯỚC phân nhánh xử lý range:
       `c.header("Content-Type", safeHeaders["Content-Type"]);`
       `c.header("X-Content-Type-Options", safeHeaders["X-Content-Type-Options"]);`
       `c.header("Content-Disposition", safeHeaders["Content-Disposition"]);`
       `c.header("Content-Security-Policy", safeHeaders["Content-Security-Policy"]);`
     - Phân nhánh 206 (Range request):
       `c.header("Content-Range", "bytes " + range.offset + "-" + (range.offset + range.length - 1) + "/" + object.size);`
       `c.header("Content-Length", String(range.length));` (Cần thiết cho iOS/macOS Safari phát audio ổn định).
       `return c.body(object.body, 206);`
     - Phân nhánh 200 (Toàn bộ file):
       `c.header("Content-Length", String(object.size));`
       `return c.body(object.body);`
- Success criteria: `apps/server` biên dịch không lỗi type và cấu trúc header được thiết lập nhất quán.
- Verify: `pnpm --filter server check-types` thoát với mã 0.

### Task 2.3 — Phòng thủ theo chiều sâu trong `eraseUserData` (`packages/api/src/data-registry.ts`)
- Goal: Ngăn ngừa việc xóa nhầm hoặc bị lợi dụng xóa audio của người khác khi thực thi `eraseUserData`.
- Target files and symbols: `packages/api/src/data-registry.ts`, `packages/api/src/data-registry.test.ts`
- Steps:
  1. Trong `packages/api/src/data-registry.ts`:
     - Trong phần xóa của bảng `attempt`:
       Trước khi gọi `ctx.audioBucket.delete(ans.audioKey)`, kiểm tra `isValidAudioKey(ans.audioKey, userId, att.id)`.
       Nếu không khớp hoặc `ans.audioKey` không hợp lệ, bỏ qua lệnh xóa trên bucket (tránh xóa nhầm file của người khác hoặc file hệ thống).
  2. Trong `packages/api/src/data-registry.test.ts`:
     - Bổ sung ca kiểm thử với mock `audioBucket`: kiểm tra khi một hàng `attempt_answer` chứa `audioKey` trỏ sang user khác (ví dụ `users/victim/attempts/att-1/q1.webm`), hàm xóa KHÔNG gọi `delete` đối với key đó.
- Success criteria: Test trong `data-registry.test.ts` kiểm chứng an toàn thành công.
- Verify: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát với mã 0.

## Verification
Chạy toàn bộ các test kiểm thử của package api và server:
- `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts`
- `pnpm --filter @vox-flow/api test src/data-registry.test.ts`
- `pnpm --filter server check-types`

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
