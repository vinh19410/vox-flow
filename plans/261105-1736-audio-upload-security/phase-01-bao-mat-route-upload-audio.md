---
phase: 1
title: "Gia cố bảo mật route upload audio và kiểm thử tự động"
status: completed
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Gia cố bảo mật route upload audio và kiểm thử tự động

## Goal
Bảo vệ route `POST /api/attempts/:attemptId/answers/:questionKey/audio` khỏi việc bị qua mặt giới hạn 10MB, kiểm soát chặt chẽ Content-Type chống tấn công Cross-Site form POST, kiểm tra miền giá trị query parameters bằng Zod và kiểm thử tự động bằng unit tests.

## Files to Create / Modify
- Modify: `apps/server/package.json` (thêm script `test: "vitest run"`)
- Create: `apps/server/vitest.config.ts` (cấu hình vitest và alias `cloudflare:workers`)
- Create: `apps/server/src/test/cloudflare-workers-mock.ts` (mock cho `cloudflare:workers` khi chạy test)
- Modify: `apps/server/src/index.ts` (export `app`, thêm Zod query schema, kiểm tra Content-Length, Content-Type, đuôi file, header nosniff)
- Create: `apps/server/src/index.test.ts` (bộ unit tests cho route upload audio)

## Tasks & Steps

### Task 1.0 — Cấu hình môi trường test cho `apps/server`
- Goal: Thiết lập vitest để `apps/server` có thể chạy unit tests độc lập, mock tương thích với giao thức `cloudflare:workers`.
- Target files and symbols: `apps/server/package.json`, `apps/server/vitest.config.ts`, `apps/server/src/test/cloudflare-workers-mock.ts`
- Steps:
  1. Thêm `"test": "vitest run"` vào phần `scripts` của `apps/server/package.json`.
  2. Tạo `apps/server/src/test/cloudflare-workers-mock.ts` export `{ env: {} }`.
  3. Tạo `apps/server/vitest.config.ts` với `resolve.alias` ánh xạ module `cloudflare:workers` về mock file, cấu hình test include `src/**/*.test.ts`, và bật `passWithNoTests: true`.
- Success criteria: Lệnh `pnpm --filter server run test` nhận diện được test runner và không bị lỗi `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
- Verify: `pnpm --filter server run test` thoát mã 0.

### Task 1.1 — Thêm Zod schema kiểm tra miền giá trị query parameters
- Goal: Ngăn chặn các tham số âm, số nguyên quá lớn hoặc questionText không giới hạn độ dài.
- Target files and symbols: `apps/server/src/index.ts` (schema `audioUploadQuerySchema`)
- Steps:
  1. Khai báo Zod schema nghiêm ngặt với Zod 4 pattern (default ở cuối với giá trị số):
     - `part`: `z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(3)).default(1)`
     - `order`: `z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100)).default(0)`
     - `durationMs`: `z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(3600000)).default(0)`
     - `questionText`: `z.string().max(2000).default("")`
  2. Sử dụng `audioUploadQuerySchema.safeParse(c.req.query())`. Nếu thất bại, trả về HTTP 400 với thông tin lỗi `{ error: "Invalid query parameters", details: result.error.flatten() }`.
- Success criteria: Query parameters được xác thực chặt chẽ, từ chối mọi giá trị ngoài miền xác định với mã 400.
- Verify: `pnpm --filter server run check-types` thoát mã 0.

### Task 1.2 — Kiểm tra nghiêm ngặt Content-Length và Content-Type
- Goal: Từ chối request thiếu hoặc sai Content-Length, vượt 10MB, payload 0 byte, và Content-Type lạ.
- Target files and symbols: `apps/server/src/index.ts` (route `POST /api/attempts/:attemptId/answers/:questionKey/audio`)
- Steps:
  1. Kiểm tra header `content-length`:
     - Nếu thiếu header `content-length` -> trả về HTTP 411 `{ error: "Length Required" }`.
     - Nếu `content-length` không khớp biểu thức `^\d+$` -> trả về HTTP 400 `{ error: "Invalid Content-Length header" }`.
     - Chuyển đổi sang số nguyên `const contentLength = parseInt(contentLengthHeader, 10)`.
     - Nếu `contentLength === 0` -> trả về HTTP 400 `{ error: "Empty payload not allowed" }`.
     - Nếu `contentLength > 10 * 1024 * 1024` (10MB) -> trả về HTTP 413 `{ error: "Payload too large (max 10MB)" }`.
  2. Kiểm tra header `content-type`:
     - Lấy `const rawContentType = c.req.header("content-type");`
     - Nếu thiếu `rawContentType` -> trả về HTTP 415 `{ error: "Unsupported Media Type" }`.
     - Tách phần base mime type (bỏ params như `;codecs=opus`), chuyển chữ thường và trim: `const baseContentType = rawContentType.split(";")[0]?.trim().toLowerCase();`
     - Khai báo danh sách cho phép: `const allowedTypes = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"];`
     - Nếu `!baseContentType || !allowedTypes.includes(baseContentType)` -> trả về HTTP 415 `{ error: "Unsupported Media Type" }`. Không dùng fallback ngầm.
  3. Đặt các bước kiểm tra này ngay sau phần kiểm tra session auth và sanitize questionKey, trước khi thực hiện truy vấn D1.
- Success criteria: Không còn bất kỳ nhánh nào ngầm chuyển Content-Type thành `audio/webm` hoặc cho phép bypass 10MB.
- Verify: `pnpm --filter server run check-types` thoát mã 0.

### Task 1.3 — Ánh xạ phần mở rộng file chính xác và stream an toàn
- Goal: Lưu đúng định dạng file trong R2 và database theo mime type được gửi lên.
- Target files and symbols: `apps/server/src/index.ts` (biến `extMap`, `ext`, `audioKey`, và export `app`)
- Steps:
  1. Xây dựng bảng ánh xạ mime type duy nhất:
     ```ts
     const extMap = {
       "audio/webm": "webm",
       "audio/mp4": "mp4",
       "audio/ogg": "ogg",
       "audio/wav": "wav",
       "audio/mpeg": "mp3",
     } as const;
     type AllowedAudioType = keyof typeof extMap;
     const allowedTypes = Object.keys(extMap) as AllowedAudioType[];
     ```
     Nếu `!baseContentType || !(baseContentType in extMap)` -> trả về HTTP 415 `{ error: "Unsupported Media Type" }`.
     Lấy phần mở rộng: `const ext = extMap[baseContentType as AllowedAudioType];`
  2. Kiểm tra `c.req.raw.body`: nếu `!c.req.raw.body` -> trả về HTTP 400 `{ error: "Empty payload body" }`.
  3. Truyền `c.req.raw.body` tới `bucket.put(audioKey, c.req.raw.body, { httpMetadata: { contentType: baseContentType } })`.
  4. Thêm header `c.header("X-Content-Type-Options", "nosniff")` ở route phát audio `GET /api/attempts/:attemptId/answers/:answerId/audio` để phòng ngừa trình duyệt MIME-sniffing thực thi mã độc.
  5. Export đối tượng `app` (`export { app }`) để có thể import trong file test mà không ảnh hưởng tới `export default`.
- Success criteria: File audio lưu trong R2 có đuôi mở rộng khớp mime type (`.mp3` cho mpeg, `.wav` cho wav, v.v.), không sinh orphan DB row khi thiếu body, và endpoint get có header nosniff.
- Verify: `pnpm --filter server run check-types` thoát mã 0.

### Task 1.4 — Viết bộ kiểm thử tự động toàn diện và kiểm chứng
- Goal: Đạt 100% các tiêu chí kiểm thử nêu trong issue #46.
- Target files and symbols: `apps/server/src/index.test.ts`
- Steps:
  1. Viết test mock cho `env.server` và `services`:
     - Mock `createAuth` trả về session hợp lệ (`session.user.id = "user-test"`).
     - Mock `getDb` trả về D1 mock với attempt đang ở trạng thái `in_progress` của `user-test`.
     - Mock `AUDIO_BUCKET` với phương thức `put` theo dõi các tham số ghi.
  2. Thêm các test case kiểm tra mã lỗi:
     - Request thiếu `content-length` -> trả về 411.
     - Request có `content-length` không phải chữ số (`"abc"`, `"10MB"`) -> trả về 400.
     - Request có `content-length = "0"` -> trả về 400.
     - Request có `content-length` vượt 10MB (`"10485761"`) -> trả về 413.
     - Request thiếu `content-type` -> trả về 415.
     - Request có `content-type: text/plain` hoặc `application/x-www-form-urlencoded` -> trả về 415.
     - Request có query `part=0`, `part=4`, `part=invalid` -> trả về 400.
     - Request có query `order=-1`, `order=101` -> trả về 400.
     - Request có query `durationMs=-1`, `durationMs=1e3` -> trả về 400.
     - Request có query `questionText` dài hơn 2000 ký tự -> trả về 400.
  3. Thêm test case thành công:
     - Request hợp lệ có `content-type: audio/webm;codecs=opus`, `content-length: 1024`, các query param hợp lệ -> trả về 200, ghi vào bucket với extension `webm` và mimeType `audio/webm`.
     - Request hợp lệ có `content-type: audio/mpeg` -> ghi với extension `mp3`.
- Success criteria: Toàn bộ các test cases chạy pass 100%.
- Verify: `pnpm --filter server test src/index.test.ts` thoát mã 0 và in `passed`.

## Verification
- Chạy `pnpm --filter server test src/index.test.ts` thoát mã 0.
- Chạy `pnpm check-types` thoát mã 0.

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
