# Phase 2: Shared Question Keys Helper & Upload Guard

## Overview
Xây dựng helper `forecast-keys.ts` dùng chung giữa server và web để chuẩn hóa danh sách `validQuestionKeys` và parsing dữ liệu câu hỏi. Xóa bỏ tRPC `attempt.uploadAnswer` không còn sử dụng. Kiểm tra chặt chẽ `questionKey` ngay từ `attempt.start`, chặn sớm các câu hỏi sai đề và payload vượt quá 35MB tại endpoint upload `POST /api/attempts/:id/answers/:key/audio`, và xác thực phòng thủ tại `attempt.submit`.

## Target Files and Symbols
- `packages/api/src/scoring/forecast-keys.ts`: Helper thuần TypeScript không phụ thuộc drizzle runtime.
- `packages/api/src/scoring/forecast-keys.test.ts`: Test kiểm thử helper.
- `apps/web/src/features/forecast/builders.ts`: Đồng bộ format key, loại bỏ legacy p23 key drift.
- `packages/api/src/routers/attempt.ts`: Xóa `uploadAnswer`, xác thực `questionKey` tại `attempt.start`, kiểm tra dung lượng và số câu tại `attempt.submit`.
- `apps/server/src/index.ts`: Bổ sung guard topic-aware, đếm số câu, và tính dung lượng upsert-aware tại route `POST /api/attempts/:attemptId/answers/:questionKey/audio`. Lưu `R2Object.size` vào `sizeBytes`.
- `apps/server/src/index.test.ts`: Test kiểm thử upload route (400 key lạ, 400 quá số câu, 413 vượt 35MB, upsert ghi đè đúng).

## Tasks & Steps

### Task 2.1 — Xây dựng `forecast-keys.ts` và Unit Test (TDD)
- **Goal**: Cung cấp hàm `parseTopicQuestions` và `getValidQuestionKeysForTopic` chuẩn hoá mọi trường hợp Part 1, Part 2/3, câu hỏi phụ (`-f`), và single-question.
- **Target files**:
  - `packages/api/src/scoring/forecast-keys.ts`
  - `packages/api/src/scoring/forecast-keys.test.ts`
- **Steps**:
  1. Viết test `packages/api/src/scoring/forecast-keys.test.ts` (TDD Red phase):
     - Part 1: đề có 17 câu -> sinh 17 câu chính và 17 câu follow-up `-f`.
     - Part 2 & 3: sinh 1 cue card `${id}-c`, các câu Part 3 `${id}-p3-${i}`, và các câu `-f`.
     - Single-question practice: khi truyền `singleQuestionKey = "area-1"`, trả về đúng `{"area-1", "area-1-f"}`.
     - Parsing: hỗ trợ cả JSON `{ cueCards: [...], part3: [...] }` lẫn array legacy có tiền tố `[Cue] `, `[Part 3] `.
  2. Triển khai `packages/api/src/scoring/forecast-keys.ts` (Green phase):
    - Không import bất kỳ runtime dependency nào từ DB hay server.
    - Export `getValidQuestionKeysForTopic(topic: { id: string; part: number; questions: string | unknown }, singleQuestionKey?: string | null): Set<string>`.
    - Export `parseTopicQuestions(questionsRaw: string | unknown): { cueCards: string[]; part3Questions: string[]; part1Questions?: string[] }`.
    - Hỗ trợ Part 3 topics từ admin (flat array dạng `z.array(z.string())`), Part 2/3 object `{cueCards, part3}`, legacy prefix `[Cue] `, `[Part 3] `, và Part 1.
- **Success criteria**: 100% test cases trong `forecast-keys.test.ts` pass.
- **Verify**: `pnpm --filter @vox-flow/api test src/scoring/forecast-keys.test.ts` exits 0.

### Task 2.2 — Web mapper tiêu thụ shared helper & Xóa Bỏ tRPC `uploadAnswer` thừa
- **Goal**: `builders.ts` gọi trực tiếp shared helper `parseTopicQuestions` + key builders từ `@vox-flow/api/scoring/forecast-keys` (single source of truth); loại bỏ format key không đồng nhất trong `builders.ts` và endpoint tRPC `attempt.uploadAnswer` không qua R2.
- **Target files**:
  - `apps/web/src/features/forecast/builders.ts`
  - `apps/web/src/features/forecast/__tests__/keys-parity.test.ts`
  - `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`
  - `packages/api/src/routers/attempt.ts`
  - `packages/api/src/routers/attempt.test.ts`
- **Steps**:
  1. Trong `apps/web/src/features/forecast/builders.ts`:
     - `mapApiTopicToForecastTopic` gọi `parseTopicQuestions` và key builders từ `@vox-flow/api/scoring/forecast-keys` thay vì tự sinh key.
     - Fallback rule phải khớp web mapper hiện tại: flat array không prefix cho topic `part !== 1` -> chỉ có 1 cue key `${id}-c`, KHÔNG sinh `-p3-${i}` keys.
     - Loại bỏ hàm legacy `p23` và cập nhật test `apps/web/src/features/app-state/__tests__/state-and-data.test.ts` nếu các test dùng `p23` bị ảnh hưởng.
  2. Thêm parity test trong `apps/web/src/features/forecast/__tests__/keys-parity.test.ts` (KHÔNG đặt ở `packages/api` — tránh đảo chiều dependency api→web):
     - Với MỌI topic trong `packages/db/scripts/seed-forecast.sql` (và `seed-forecast-prod.sql` nếu có): gọi `mapApiTopicToForecastTopic` (từ `apps/web/src/features/forecast/builders.ts`) để sinh các step keys; step keys phải là tập con của `getValidQuestionKeysForTopic(topic)` (helper từ `@vox-flow/api`), và số step `<= maxCount`.
  3. Trong `packages/api/src/routers/attempt.ts`:
    - Xóa bỏ procedure `uploadAnswer` (dòng ~131-212) vì frontend không gọi và endpoint này không tải audio lên R2, ghi `sizeBytes = 0`.
    - Cập nhật `packages/api/src/routers/attempt.test.ts`: xóa bỏ các test gọi `callerA.attempt.uploadAnswer` (dòng 168, 189, 202, 213, 235) hoặc thay bằng mock phù hợp. Với test dùng seeding qua `uploadAnswer` (dòng 213, 235): thay bằng insert trực tiếp vào `attempt_answer` để dữ liệu test vẫn tồn tại.
    - Cập nhật `apps/web/src/features/app-state/__tests__/state-and-data.test.ts` nếu các test sử dụng `p23` bị ảnh hưởng.
    - Tại procedure `attempt.start`: nếu `input.questionKey` có giá trị và `topicId` tồn tại:
       - Truy vấn `forecastTopic`.
       - Lấy `validKeys = getValidQuestionKeysForTopic(topic, null)`.
       - Nếu `!validKeys.has(input.questionKey)`: ném `TRPCError({ code: "BAD_REQUEST", message: "Invalid questionKey for topic" })`.
- **Success criteria**: Code biên dịch không lỗi; procedure `uploadAnswer` bị loại bỏ sạch sẽ; test attempt không còn gọi `uploadAnswer`.
- **Verify**: `pnpm check-types && pnpm --filter @vox-flow/api test src/routers/attempt.test.ts && pnpm --filter web test src/features/forecast/__tests__/keys-parity.test.ts` exits 0.

### Task 2.3 — Hardening Upload Route trong `apps/server/src/index.ts`
- **Goal**: Chặn sớm tại `POST /api/attempts/:attemptId/answers/:questionKey/audio`: kiểm tra key theo đề thi, kiểm soát số câu, kế toán dung lượng ghi đè $\le 35\text{MB}$, và lưu `sizeBytes` từ kết quả `bucket.put`.
- **Target files**:
  - `apps/server/src/index.ts`
  - `apps/server/src/index.test.ts`
- **Steps**:
  1. Trong handler upload audio:
     - Sau khi kiểm tra `currentAttempt.status === 'in_progress'`:
     - Lấy danh sách câu trả lời hiện có của `attemptId`:
       `const existingAnswers = await db.select().from(attemptAnswer).where(eq(attemptAnswer.attemptId, attemptId));`
     - Xác định `existingAnswer = existingAnswers.find(a => a.questionKey === questionKey)`.
     - **Kiểm tra Topic & QuestionKey**:
       - Nếu `currentAttempt.topicId`:
         - Lấy thông tin topic từ bảng `forecastTopic`.
         - Tính `validKeys = getValidQuestionKeysForTopic(topic, currentAttempt.questionKey)`.
         - Nếu `!validKeys.has(questionKey)`: trả về `c.json({ error: "Invalid question key for this attempt" }, 400)`.
         - Giới hạn số câu tối đa: `maxCount = currentAttempt.questionKey ? 2 : Math.min(validKeys.size, 18)`.
         - Nếu `!existingAnswer && existingAnswers.length >= maxCount`: trả về `c.json({ error: "Question limit reached for this attempt" }, 400)`.
       - Nếu không có `topicId` (full mock):
         - Giới hạn số câu an toàn tối đa 20 câu.
         - Nếu `!existingAnswer && existingAnswers.length >= 20`: trả về `c.json({ error: "Question limit reached" }, 400)`.
     - **Kế toán dung lượng ghi đè (Upsert-aware byte accounting)**:
       - `const currentTotalBytes = existingAnswers.reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);`
       - `const existingBytes = existingAnswer?.sizeBytes ?? 0;`
       - `const newTotalBytes = currentTotalBytes - existingBytes + contentLength;`
       - Nếu `newTotalBytes > 35 * 1024 * 1024`: trả về `c.json({ error: "Payload too large: total audio exceeds 35MB" }, 413)`.
    - **Upload R2 & Lưu D1 (Fail-closed)**:
       - `const putResult = await bucket.put(audioKey, c.req.raw.body, { httpMetadata: { contentType } });`
       - `const actualSizeBytes = putResult?.size ?? contentLength;`
       - Nếu `actualSizeBytes <= 0`: trả về `c.json({ error: "Empty upload payload" }, 400)`.
       - Upsert `attemptAnswer` với `sizeBytes: actualSizeBytes` trong **cả hai** branch `values` và `onConflictDoUpdate.set` để re-recording cập nhật đúng dung lượng mới:
         ```typescript
         await db.insert(attemptAnswer).values({
           // ...
           sizeBytes: actualSizeBytes,
         }).onConflictDoUpdate({
           target: [attemptAnswer.attemptId, attemptAnswer.questionKey],
           set: {
             // ...existing fields...
             sizeBytes: actualSizeBytes,
           },
         });
         ```
  2. Bổ sung test trong `apps/server/src/index.test.ts`:
     - Test upload key lạ trả về HTTP 400.
     - Test upload câu thứ 3 trong single-question trả về HTTP 400.
     - Test upload ghi đè (upsert) thay thế dung lượng cũ chính xác: sau re-record, `sizeBytes` của row = dung lượng file mới (không cộng dồn).
     - Test upload làm tổng dung lượng $> 35\text{MB}$ trả về HTTP 413.
- **Success criteria**: Tất cả test cases upload trong `apps/server/src/index.test.ts` pass.
- **Verify**: `pnpm --filter server test src/index.test.ts` exits 0.

### Task 2.4 — Xác thực phòng thủ tại `attempt.submit`
- **Goal**: Kiểm tra lại tổng số câu và tổng dung lượng $\le 35\text{MB}$ trước khi chuyển attempt sang `status = 'submitted'`.
- **Target files**:
  - `packages/api/src/routers/attempt.ts`
  - `packages/api/src/routers/attempt.test.ts`
- **Steps**:
  1. Trong `attempt.submit`:
     - Truy vấn tất cả câu trả lời của attempt (`attempt_answer`).
     - Xác định ngưỡng: nếu `topicId === null` (full mock): `maxCount = 20`; nếu `topicId !== null`: lấy `validKeys` từ helper (nếu attempt có `questionKey`: `maxCount = 2`; nếu không: `maxCount = Math.min(validKeys.size, 18)`).
     - Đếm tổng số câu trả lời: nếu `answers.length > maxCount`: ném `TRPCError({ code: "BAD_REQUEST", message: "ANSWER_COUNT_EXCEEDED" })`.
     - Tính tổng `sizeBytes` của toàn bộ các câu: nếu `totalBytes > 35 * 1024 * 1024`: ném `TRPCError({ code: "BAD_REQUEST", message: "TOTAL_AUDIO_LIMIT_EXCEEDED" })`.
     - Đây là **authoritative barrier** chốt chặn cuối cùng ngăn chặn mọi hành vi gian lận concurrency vượt 35MB hoặc spam câu hỏi.
  2. Chạy test `attempt.test.ts`.
- **Verify**: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` exits 0.

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
