---
phase: 2
title: "Frontend: Trình phát Audio, Prefetch phòng thi, Fallback trình duyệt & Tests"
status: completed
parallel: true
owns:
  - apps/web/src/lib/tts-url.ts
  - apps/web/src/lib/speech.ts
  - apps/web/src/lib/__tests__/format.test.ts
  - apps/web/src/lib/__tests__/speech-tts.test.ts
  - apps/web/src/features/select/components/voice-picker.tsx
  - apps/web/src/features/exam/use-exam-session.ts
  - apps/web/src/features/__tests__/slice-b.test.tsx
mustNotTouch:
  - packages/**
  - apps/server/**
  - apps/web/src/routeTree.gen.ts
---

# Phase 2 — Frontend: Trình phát Audio, Prefetch phòng thi, Fallback trình duyệt & Tests

## Goal

Chuyển `VoicePicker` và `useExamSession` sang phát audio từ `/api/tts/...` với cơ chế prefetch bước câu hỏi trong phòng thi, huỷ phát tức thì (`cancelSpeech`) và tự động fallback sang `window.speechSynthesis` khi tải hoặc phát audio thất bại, đảm bảo tương thích ngược với toàn bộ test hiện có.

## Tasks

### Task 2.1: Bộ dựng URL chuẩn `tts-url.ts` & nâng cấp `speech.ts`
- **Target files**: `apps/web/src/lib/tts-url.ts`, `apps/web/src/lib/speech.ts`
- **Steps**:
  1. Tạo `apps/web/src/lib/tts-url.ts` dùng `ENV.VITE_SERVER_URL ?? "http://localhost:3000"` (chuẩn hoá bỏ dấu `/` cuối giống `apps/web/src/utils/trpc.ts`) để sinh 3 dạng URL:
     - `buildPreviewTtsUrl(voiceId: string)` -> `${base}/api/tts/preview/${encodeURIComponent(voiceId)}`
     - `buildMockTtsUrl(voiceId: string, questionKey: string, text?: string)` -> `${base}/api/tts/mock/${encodeURIComponent(voiceId)}/${encodeURIComponent(questionKey)}` (kèm `?v=<shortHash>` nếu truyền `text`)
     - `buildForecastTtsUrl(voiceId: string, topicId: string, questionKey: string, text?: string)` -> `${base}/api/tts/forecast/${encodeURIComponent(voiceId)}/${encodeURIComponent(topicId)}/${encodeURIComponent(questionKey)}?v=<shortHash>`
  2. Nâng cấp `apps/web/src/lib/speech.ts`:
     - Bổ sung `audioUrl?: string` vào `SpeakOptions`.
     - Khi không truyền `audioUrl`, giữ nguyên hành vi gọi trực tiếp `window.speechSynthesis` (đảm bảo tương thích 100% với `format.test.ts`).
     - Khi có `audioUrl`:
       - Quản lý `speechGeneration` (số nguyên tăng dần), `activeAbortController` và `activeAudio: HTMLAudioElement | null` + `activeObjectUrl: string | null`.
       - Hỗ trợ `prefetchSpeech(audioUrl: string): Promise<Blob | null>` lưu vào bộ nhớ phiên giới hạn kích thước (ví dụ tối đa 32 mục LRU đơn giản); khi request lỗi trả `null` và xoá khỏi map để lần sau thử lại được (không cache lỗi).
       - Trong `speakText(text, opts)` khi có `audioUrl`: gọi `cancelSpeech()` trước, tăng `speechGeneration`, lấy `Blob` (từ prefetch map hoặc `fetch(audioUrl, { signal })` với `res.ok && blob.size > 0`), kiểm tra `myGen === speechGeneration`, tạo `Audio` (ưu tiên `URL.createObjectURL(blob)` nếu khả dụng, dọn dẹp qua `URL.revokeObjectURL`), gắn `onended` gọi `opts.onEnd?.()`, `onerror` fallback sang `speechSynthesis` nếu `myGen === speechGeneration`, và gọi `await audio.play()`. Nếu `fetch` trả lỗi, mất mạng hoặc `audio.play()` reject trong khi `myGen === speechGeneration` (tức chưa bị `cancelSpeech()` huỷ), tự động gọi nhánh fallback `window.speechSynthesis`.
       - `cancelSpeech()` tăng `speechGeneration`, `abort()` controller đang chạy, `pause()` và xoá `src` của `activeAudio`, thu hồi `activeObjectUrl`, đồng thời gọi `globalThis.speechSynthesis?.cancel()`. Thêm `clearSpeechPrefetchCache()` phục vụ dọn dẹp giữa các test.

### Task 2.2: Tích hợp vào `VoicePicker` & `useExamSession`
- **Target files**: `apps/web/src/features/select/components/voice-picker.tsx`, `apps/web/src/features/exam/use-exam-session.ts`
- **Steps**:
  1. Trong `VoicePicker`: truyền `audioUrl: buildPreviewTtsUrl(v.id)` vào `speakText(...)`; giữ câu tiếng Anh và `lang` để dùng khi fallback, đồng thời nâng/điều chỉnh bộ hẹn giờ biểu tượng đang phát hoặc dựa trên `onEnd` + timeout an toàn.
  2. Trong `useExamSession`:
     - Tạo helper dựng `audioUrl` cho một `ExamStep`: nếu `s.practice?.topicId` tồn tại -> `buildForecastTtsUrl(voice.id, s.practice.topicId, step.key, step.text)`, ngược lại -> `buildMockTtsUrl(voice.id, step.key, step.text)`.
     - Khi `phase === "intro"` hoặc khi `idx` đổi (và `!muted`), gọi `void prefetchSpeech(...)` cho câu hiện tại (`steps[idx]`) và câu kế tiếp (`steps[idx + 1]`) để âm thanh sẵn sàng trước lúc vào `phase === "asking"`.
     - Tại effect `phase === "asking"`, truyền `audioUrl` vào `speakText(step.text, { audioUrl, lang: voiceLang(voice.id), rate: 0.95 })`.

### Task 2.3: Unit & Component Tests phía Web
- **Target files**: `apps/web/src/lib/__tests__/speech-tts.test.ts`, `apps/web/src/lib/__tests__/format.test.ts`, `apps/web/src/features/__tests__/slice-b.test.tsx`
- **Steps**:
  1. Tạo `apps/web/src/lib/__tests__/speech-tts.test.ts` kiểm chứng:
     - Dựng URL đúng cho `preview`, `mock`, `forecast` (kể cả ký tự đặc biệt và fingerprint `?v=`).
     - `speakText` với `audioUrl` tải MP3 1 lần, phát qua `Audio`, lần gọi thứ 2 cùng `audioUrl` tái sử dụng bộ đệm prefetch trong phiên mà không gọi `fetch` lần 2.
     - `cancelSpeech()` huỷ `fetch` đang bay / dừng `Audio` đang phát và **không** kích hoạt fallback `speechSynthesis` sau khi đã cancel.
     - Khi `fetch` trả `503` hoặc reject lỗi mạng, hoặc khi `audio.play()` reject, `speakText` tự động fallback sang `window.speechSynthesis.speak` và không giữ kết quả lỗi trong bộ đệm prefetch.
  2. Cập nhật test preview giọng trong `apps/web/src/features/__tests__/slice-b.test.tsx` để kiểm chứng cả hai đường: phát qua `/api/tts/preview/uk-f` khi API trả audio hợp lệ + huỷ khi unmount, và fallback sang `speechSynthesis` khi `/api/tts/preview/uk-f` lỗi.
  3. Đảm bảo toàn bộ test suite hiện có của `apps/web` (kể cả `slice-c.test.tsx`, `exam-submit.test.tsx`, `format.test.ts`) chạy xanh không rò rỉ async.

## Verify

```bash
pnpm --filter web test src/lib/__tests__/format.test.ts
pnpm --filter web test src/lib/__tests__/speech-tts.test.ts
pnpm --filter web test src/features/__tests__/slice-b.test.tsx
pnpm --filter web test src/features/__tests__/slice-c.test.tsx
pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx
pnpm --filter web check-types
```

## Failure Protocol

Nếu bất kỳ lệnh Verify nào thất bại: chẩn đoán nguyên nhân từ output thực tế, sửa trong phạm vi file `apps/web/**` mà không xoá test hay nới khẳng định, chạy lại toàn bộ các lệnh Verify cho đến khi exit code = 0.
