---
phase: 1
title: "Backend: Cấu hình Infra, lõi TTS + R2 Cache, route /api/tts & Admin Pre-warm"
status: pending
parallel: true
owns:
  - packages/infra/alchemy.run.ts
  - apps/server/.env.schema
  - packages/api/src/context.ts
  - packages/api/src/tts.ts
  - packages/api/src/tts/**
  - packages/api/src/tts.test.ts
  - packages/api/src/routers/forecast-admin.ts
  - packages/api/src/routers/forecast-admin.test.ts
  - packages/api/src/data-registry.test.ts
  - apps/server/src/context.ts
  - apps/server/src/index.ts
  - apps/server/src/index.test.ts
mustNotTouch:
  - apps/web/**
  - packages/db/src/migrations/**
---

# Phase 1 — Backend: Cấu hình Infra, lõi TTS + R2 Cache, route `/api/tts` & Admin Pre-warm

## Goal

Xây dựng trọn vẹn tầng cấu hình ElevenLabs, bộ phân giải câu hỏi chuẩn + lưu trữ tái sử dụng audio content-addressed trên R2 (`tts/v1/<voice>/<sha256>.mp3`), endpoint `GET /api/tts/...` trên Hono Worker và hook pre-warm nền không chặn trong `forecastAdmin`, kèm bộ unit/integration test đầy đủ.

## Tasks

### Task 1.1: Khai báo biến môi trường & `waitUntil` trong Context
- **Target files**: `packages/infra/alchemy.run.ts`, `apps/server/.env.schema`, `packages/api/src/context.ts`, `apps/server/src/context.ts`
- **Steps**:
  1. Bổ sung vào `packages/infra/alchemy.run.ts` (`server.env`):
     - `ELEVENLABS_API_KEY: Config.Redacted("ELEVENLABS_API_KEY").pipe(Config.withDefault(""))`
     - `ELEVENLABS_MODEL_ID: Config.String("ELEVENLABS_MODEL_ID").pipe(Config.withDefault("eleven_multilingual_v2"))`
     - `ELEVENLABS_VOICE_UK_F: Config.String("ELEVENLABS_VOICE_UK_F").pipe(Config.withDefault(""))`
     - `ELEVENLABS_VOICE_US_M: Config.String("ELEVENLABS_VOICE_US_M").pipe(Config.withDefault(""))`
     - `ELEVENLABS_VOICE_AU_F: Config.String("ELEVENLABS_VOICE_AU_F").pipe(Config.withDefault(""))`
  2. Khai báo các biến `@optional` tương ứng trong `apps/server/.env.schema`.
  3. Bổ sung các trường tương ứng vào `ApiEnv` và `waitUntil?: (promise: Promise<unknown>) => void` vào `Context` trong `packages/api/src/context.ts`.
  4. Trong `apps/server/src/context.ts`, lấy `waitUntil` từ `context.executionCtx` trong khối `try/catch` (để không ném lỗi khi chạy test Hono không truyền `ExecutionContext`).

### Task 1.2: Module `@vox-flow/api/tts` (`packages/api/src/tts.ts` & `packages/api/src/tts/*`)
- **Target files**: `packages/api/src/tts.ts`, `packages/api/src/tts/voices.ts`, `packages/api/src/tts/elevenlabs.ts`, `packages/api/src/tts/resolver.ts`, `packages/api/src/tts/cache.ts`, `packages/api/src/tts.test.ts`
- **Steps**:
  1. Định nghĩa `EXAMINER_VOICE_IDS = ["uk-f", "us-m", "au-f"] as const`, hàm `isValidExaminerVoice`, ánh xạ Voice ID mặc định + override từ `env` (`ELEVENLABS_VOICE_UK_F`, `ELEVENLABS_VOICE_US_M`, `ELEVENLABS_VOICE_AU_F`), model mặc định `"eleven_multilingual_v2"`, và câu chào nghe thử cố định cho từng giọng (`Emma`, `James`, `Olivia`).
  2. Xây dựng bộ phân giải văn bản chuẩn (`resolveCanonicalTtsText`):
     - `preview`: trả câu chào ứng với giọng.
     - `mock`: tra `MOCK_EXAM_PROMPTS` — câu chính trả `item.text` (Part 2 đọc câu chủ đề mở đầu `item.text`), câu `-f` trả `item.followUp?.text`; key lạ trả `null`.
     - `forecast`: truy vấn `forecastTopic` theo `topicId`, yêu cầu `status === "published"`; `part === 1` tra `part1QuestionKey(topic.id, i)` -> `part1Questions[i]`; `part !== 1` tra `cueCardKey(topic.id)` -> `topic.title` và `part3QuestionKey(topic.id, i)` -> `part3Questions[i]`; đề `draft`/`archived` hoặc key ngoài tập trả `null`.
     - Xuất thêm `extractTopicSpokenTexts(topic)` trả danh sách các câu tiếng Anh cần đọc của một đề để dùng cho `prewarmTopicAudio`.
  3. Xây dựng `buildTtsCacheKey({ voice, providerVoiceId, modelId, text })` dùng `crypto.subtle.digest("SHA-256", ...)` tạo khoá `tts/v1/${voice}/${hashHex}.mp3` và `etag: "${hashHex}"`.
  4. Xây dựng `synthesizeWithElevenLabs({ apiKey, voiceId, modelId, text, fetchImpl, timeoutMs })` gọi `POST https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, header `xi-api-key`, kiểm tra `res.ok` và `bytes.byteLength > 0`.
  5. Xây dựng `getOrCreateTtsAudio({ bucket, env, voice, text, fetchImpl })`:
     - Kiểm tra `bucket.get(r2Key)` -> nếu trúng cache (`size > 0`), trả ngay từ R2 (0 lần gọi ElevenLabs).
     - Nếu trượt cache, hợp nhất các request đồng thời cùng `r2Key` bằng `Map<string, Promise<Uint8Array>>`, gọi `synthesizeWithElevenLabs` (unwrap `Redacted` nếu `ELEVENLABS_API_KEY` là object/string), ghi `bucket.put(r2Key, bytes, { httpMetadata: { contentType: "audio/mpeg" } })` rồi trả kết quả. Không ghi R2 khi lỗi.
  6. Xây dựng `prewarmTopicAudio({ topic, bucket, env, concurrency = 2, fetchImpl })`: lặp qua `extractTopicSpokenTexts(topic)` × 3 giọng với giới hạn đồng thời `2`, nuốt lỗi từng mục sau khi ghi cảnh báo để các mục còn lại vẫn tiếp tục và không bao giờ reject ra ngoài khi gọi ở chế độ nền.

### Task 1.3: Endpoint `GET /api/tts/...` & Hook `forecastAdmin` + Tests
- **Target files**: `apps/server/src/index.ts`, `apps/server/src/index.test.ts`, `packages/api/src/routers/forecast-admin.ts`, `packages/api/src/routers/forecast-admin.test.ts`, `packages/api/src/data-registry.test.ts`
- **Steps**:
  1. Thêm 3 route vào `apps/server/src/index.ts`:
     - `GET /api/tts/preview/:voice`
     - `GET /api/tts/mock/:voice/:questionKey`
     - `GET /api/tts/forecast/:voice/:topicId/:questionKey`
     Kiểm tra `voice` hợp lệ (`400` nếu sai), phân giải câu gốc (`404` nếu không tồn tại hoặc đề chưa `published`), hỗ trợ `If-None-Match` trả `304` khi object đã tồn tại trên R2, gọi `getOrCreateTtsAudio` trả `200` `audio/mpeg` kèm `Cache-Control`, `ETag`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`; trả `503` (kèm `Cache-Control: no-store`) khi thiếu `AUDIO_BUCKET`, thiếu `ELEVENLABS_API_KEY` (lúc cache miss), hoặc ElevenLabs lỗi.
  2. Trong `packages/api/src/routers/forecast-admin.ts`: tại `publish` (và tại `updateDraft` khi `topic.status === "published"` và có sửa `title` hoặc `questions`), kích hoạt `prewarmTopicAudio` qua `ctx.waitUntil` (hoặc `void` có `.catch()` khi không có `waitUntil`) nếu `ctx.env?.AUDIO_BUCKET` có mặt.
  3. Viết đầy đủ unit/integration test tại `packages/api/src/tts.test.ts`, `apps/server/src/index.test.ts`, `packages/api/src/routers/forecast-admin.test.ts` (gồm cả test ElevenLabs trả `429`/`500` không làm lỗi `publish`), và bổ sung test trong `packages/api/src/data-registry.test.ts` chứng minh xoá user giữ nguyên các object `tts/v1/...`.

## Verify

```bash
pnpm --filter @vox-flow/api test
pnpm --filter server test
pnpm --filter @vox-flow/api check-types
pnpm --filter server check-types
```

## Failure Protocol

Nếu bất kỳ lệnh Verify nào thất bại: chẩn đoán nguyên nhân từ output thực tế, sửa trong phạm vi file được giao mà không xoá hay nới lỏng khẳng định test, chạy lại toàn bộ khối Verify cho đến khi exit code = 0.
