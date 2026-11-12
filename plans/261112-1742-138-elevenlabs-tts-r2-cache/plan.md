---
title: "Tích hợp ElevenLabs TTS & Lưu trữ tái sử dụng Audio câu hỏi trên R2"
description: "Chuyển giọng đọc của 3 giám khảo (uk-f, us-m, au-f) sang audio tổng hợp từ ElevenLabs lưu content-addressed SHA-256 trên AUDIO_BUCKET (tts/v1/...), pre-warm nền khi Admin publish đề mới, read-through cho kho đề sẵn có và tự động fallback sang giọng trình duyệt khi lỗi."
status: in_progress
priority: P1
effort: 3h
branch: feat/138-elevenlabs-tts-cache
issue: 138
tags: [feature, tts, elevenlabs, r2, api, backend, frontend]
blockedBy: []
blocks: []
created: 2026-11-12
---

# Tích hợp ElevenLabs TTS & Lưu trữ tái sử dụng Audio trên R2 (#138)

## Outcome

Học viên khi nghe thử giọng ở màn Chọn chế độ thi (`VoicePicker`) hoặc làm bài trong phòng thi (`ExamScreen` — cả Thi thử lẫn Luyện đề Forecast) được nghe giọng người thật chuẩn Anh/Mỹ/Úc sinh từ **ElevenLabs TTS**. Mỗi cặp `(giọng, câu hỏi chuẩn)` chỉ tổng hợp qua ElevenLabs **tối đa 1 lần duy nhất** rồi lưu bền vững vào `AUDIO_BUCKET` dưới không gian khoá `tts/v1/<voice>/<sha256>.mp3` để tái sử dụng cho mọi lượt sau. Khi Admin duyệt đăng đề mới (`forecastAdmin.publish` hoặc sửa đề đang `published`), hệ thống tự động pre-warm nền cả 3 giọng mà không bao giờ chặn thao tác duyệt đề; phía client tự động lùi về `window.speechSynthesis` nếu mạng hoặc dịch vụ TTS gián đoạn.

## Kiến trúc & Quyết định thiết kế

1. **Hợp đồng URL tham chiếu chuẩn giữa Web & Server (chống đốt credit):**
   - `GET /api/tts/preview/:voice` — câu chào nghe thử của `VoicePicker` (`"Hello, my name is Emma/James/Olivia. I will be your examiner today."`).
   - `GET /api/tts/mock/:voice/:questionKey` — câu hỏi hoặc follow-up tĩnh thuộc `MOCK_EXAM_PROMPTS` (ở Part 2 chỉ đọc câu mở đầu `item.text`, khớp hành vi phòng thi IELTS và giả định A1 đã chốt).
   - `GET /api/tts/forecast/:voice/:topicId/:questionKey` — câu hỏi của đề `forecast_topic` đang ở trạng thái `status === "published"` (`part === 1` -> `part1Questions[i]`; `part !== 1` -> `cueCardKey` đọc `topic.title`, `part3QuestionKey` đọc `part3Questions[i]`). Đề `draft`/`archived` hoặc key sai bị từ chối `404`/`400`.
   - Client có thể kèm query `?v=<fingerprint>` để bust cache trình duyệt ngay khi Admin sửa nội dung câu hỏi; server luôn phân giải văn bản gốc từ DB/bank chứ không bao giờ đọc text từ query/body của client.

2. **Lưu trữ Content-Addressed trên `AUDIO_BUCKET` & In-flight Coalescing:**
   - Chuẩn hoá chuỗi: `normalizedText = text.trim().replace(/\s+/g, " ")`.
   - Băm SHA-256 hex (64 ký tự thường): `sha256("${providerVoiceId}:${modelId}:${normalizedText}")`.
   - Khoá R2: `tts/v1/${voice}/${hashHex}.mp3` — tách biệt hoàn toàn với nhánh dữ liệu cá nhân `users/${userId}/attempts/...` để `DATA_REGISTRY.erase` không bao giờ chạm tới kho audio dùng chung.
   - Luồng đọc: kiểm tra `bucket.get(r2Key)` trước -> nếu có (`size > 0`), trả ngay từ R2 (kể cả khi thiếu `ELEVENLABS_API_KEY`) kèm `ETag: "${hashHex}"`, `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`, `X-Content-Type-Options: nosniff` và hỗ trợ `If-None-Match` (`304`). Nếu miss, dùng `Map<string, Promise<Uint8Array>>` hợp nhất các request đồng thời cùng `r2Key`, gọi `POST https://api.elevenlabs.io/v1/text-to-speech/${providerVoiceId}?output_format=mp3_44100_128` (timeout 15s), kiểm tra `res.ok` và `byteLength > 0`, ghi vào R2 rồi trả về. Lỗi mạng/quota trả `503` mà không ghi rác vào R2.

3. **Ánh xạ 3 giọng giám khảo & Biến môi trường:**
   - Giữ nguyên 3 mã giọng trên UI (`uk-f`, `us-m`, `au-f`), ánh xạ mặc định sang 3 Premade Voice ID của ElevenLabs (`Xb7hH8MSUJpSbSDYk0k2` Alice · British Female, `cjVigY5qzO86Huf0OWal` Eric · American Male, `XrExE9yKIg1WjnnlVkGX` Matilda · Expressive Female) và model mặc định `eleven_multilingual_v2`, cho phép ghi đè qua `ELEVENLABS_VOICE_UK_F`, `ELEVENLABS_VOICE_US_M`, `ELEVENLABS_VOICE_AU_F`, `ELEVENLABS_MODEL_ID` cùng secret `ELEVENLABS_API_KEY`.

4. **Pre-warm nền không chặn ở `forecastAdmin`:**
   - Bổ sung `waitUntil?: (promise: Promise<unknown>) => void` vào `ApiContext` (bọc `try/catch` quanh `context.executionCtx` ở Hono để an toàn trong môi trường test không có `ExecutionContext`).
   - Khi `forecastAdmin.publish` hoàn tất (hoặc `forecastAdmin.updateDraft` cập nhật một đề đang `published`), kích hoạt `prewarmTopicAudio` chạy nền với giới hạn đồng thời `2` qua tất cả câu hỏi của đề × 3 giọng; mọi lỗi từ ElevenLabs được bắt gọn để không bao giờ làm hỏng thao tác của Admin.

5. **Trình phát Audio trên Web, Prefetch & Fallback `speechSynthesis`:**
   - Mở rộng `apps/web/src/lib/speech.ts` với `speakText(text, opts)` nhận thêm `audioUrl?: string`, bộ đệm `Blob` trong phiên (`prefetchSpeech(url)` giới hạn kích thước), bộ đếm thế hệ `speechGeneration` + `AbortController` + quản lý vòng đời `HTMLAudioElement` để `cancelSpeech()` dừng ngay cả request đang tải lẫn audio đang phát mà không rò rỉ sang câu sau hoặc sau khi unmount.
   - Khi `audioUrl` tải lỗi (`!res.ok`, lỗi mạng) hoặc `audio.play()` bị từ chối (mà phiên đọc chưa bị `cancelSpeech()` huỷ), tự động lùi sang `window.speechSynthesis`.

## Extension Trace

Khi sau này bổ sung hoặc chuyển sang nhà cung cấp TTS thứ hai (ví dụ Azure Speech đã có biến chờ trong `packages/api/src/context.ts` theo WI-03):
- **Hợp đồng giữ ổn định:** Toàn bộ `apps/web` (`/api/tts/:source/:voice/...`), route HTTP trong `apps/server`, cấu trúc khoá R2 `tts/v1/<voice>/<hash>.mp3`, D1 schema (0 migration) và điểm gọi `prewarmTopicAudio` trong `forecastAdmin`.
- **Điểm sửa duy nhất:** Hàm tổng hợp cụ thể `synthesizeWithElevenLabs` trong `packages/api/src/tts/elevenlabs.ts` và biến môi trường trong `packages/infra/alchemy.run.ts`. Không dựng `TtsProviderRegistry` trừu tượng khi hiện chỉ có 1 nhà cung cấp thật.

## Phases (Song song — Sở hữu file tách rời 100%)

| # | Phase | Sở hữu file | Phụ thuộc | Status |
|---|---|---|---|---|
| 1 | [Backend: Cấu hình Infra, lõi TTS + R2 Cache, route `/api/tts` & Admin Pre-warm](./phase-01-backend-tts-r2-cache.md) | `packages/infra/**`, `packages/api/**`, `apps/server/**` | – | Pending |
| 2 | [Frontend: Trình phát Audio, Prefetch phòng thi, Fallback trình duyệt & Tests](./phase-02-web-audio-playback.md) | `apps/web/**` | – | Pending |

## Acceptance Criteria (Done means)

- [ ] DM-1: `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_VOICE_UK_F`, `ELEVENLABS_VOICE_US_M`, `ELEVENLABS_VOICE_AU_F` được khai báo trong `packages/infra/alchemy.run.ts`, `apps/server/.env.schema` và `packages/api/src/context.ts`.
- [ ] DM-2: `GET /api/tts/...` chỉ nhận tham chiếu chuẩn (`preview`, `mock`, `published forecast`), từ chối `400`/`404` với tham chiếu sai hoặc đề `draft`; lần đầu gọi ElevenLabs đúng 1 lần và ghi `tts/v1/<voice>/<sha256>.mp3` vào `AUDIO_BUCKET`, các lần sau đọc thẳng từ R2 với 0 lượt gọi thêm tới ElevenLabs, hai câu trùng nội dung dùng chung 1 object R2.
- [ ] DM-3: `forecastAdmin.publish` (và `updateDraft` trên đề đang `published`) kích hoạt pre-warm nền 3 giọng vào `AUDIO_BUCKET` mà không chặn thao tác khi ElevenLabs lỗi `429`/`500`/timeout.
- [ ] DM-4: `VoicePicker` và `useExamSession` phát audio từ `/api/tts/...` (kèm prefetch bước câu hỏi trong phòng thi), dừng phát ngay khi gọi `cancelSpeech()`, và tự fallback sang `window.speechSynthesis` khi tải/phát audio thất bại.
- [ ] DM-5: `DATA_REGISTRY` khi xoá tài khoản người dùng chỉ xoá `users/<userId>/...` và giữ nguyên toàn bộ object dưới `tts/v1/...` trong `AUDIO_BUCKET`.
- [ ] DM-6: Toàn bộ test liên quan, `pnpm check-types` chạy xanh; PR mở vào `dev` kèm comment POT đầy đủ trên issue `#138`.
