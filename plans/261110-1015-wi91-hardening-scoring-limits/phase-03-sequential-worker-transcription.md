# Phase 3: Sequential Worker Transcription with Time Budget

## Overview
Thay thế cơ chế tải audio song song từ R2 (`Promise.allSettled`) trong Cloudflare Worker Queue consumer bằng vòng lặp tuần tự từng câu một. Đảm bảo RAM Worker luôn duy trì ở mức an toàn $< 40\text{MB}$ (ngay cả với đề thi dài 14–17 câu). Đồng thời bổ sung ngân sách thời gian (time budget 5 phút) cho vòng lặp transcription để tự động ngắt và yêu cầu retry nếu gặp sự cố mạng hoặc Whisper phản hồi quá chậm, giúp lượt retry tiếp theo tiếp tục từ các câu đã hoàn thành mà không vượt timeout của Cloudflare Queue.

## Target Files and Symbols
- `packages/api/src/scoring/score-attempt.ts`: Hàm `scoreAttempt`, vòng lặp transcription tuần tự và time budget guard.
- `packages/api/src/scoring/score-attempt.test.ts`: Test kiểm thử tuần tự hoá và xử lý transcript đã lưu.

## Tasks & Steps

### Task 3.1 — Tuần tự hoá vòng lặp Transcription và Time Budget
- **Goal**: Chuyển `Promise.allSettled` sang vòng lặp `for...of` tuần tự giải phóng buffer sau mỗi câu, kiểm tra time budget 240s.
- **Target files**:
  - `packages/api/src/scoring/score-attempt.ts`
- **Steps**:
  1. Trong `scoreAttempt`:
     - Khai báo hằng số `TRANSCRIPTION_TIME_BUDGET_MS = 240_000` (4 phút — chừa margin 60s dưới lease 720s để tiền grading sau không đụng trần lease).
     - Ghi nhận `const transcriptionStart = now();` dùng injected `now()` mà `runPipeline` đã nhận (không gọi `Date.now()` trực tiếp).
     - Thay thế `Promise.allSettled(needsTranscript.map(...))` bằng:
       ```typescript
       for (const row of needsTranscript) {
         if (now() - transcriptionStart > TRANSCRIPTION_TIME_BUDGET_MS) {
           console.warn(
             `[scoring] Attempt ${attemptId} transcription time budget exceeded (${TRANSCRIPTION_TIME_BUDGET_MS}ms). Requeueing to resume.`,
           );
           throw new Error(`Transcription time budget exceeded; saved progress will resume on next delivery`);
         }

         const audioBuffer = audio.get(row.questionKey) ?? (await loadAudio(row));

         const text = await deps.client.transcribe({
           audio: audioBuffer,
           mimeType: row.mimeType,
         });

         await db
           .update(attemptAnswer)
           .set({ transcript: text })
           .where(eq(attemptAnswer.id, row.id));

         transcripts.set(row.questionKey, text);
         // Buffer được giải phóng tự nhiên khi ra khỏi scope vòng lặp; không gán
         // `audioBuffer = undefined` (vô ích vì biến scoped từng pass).
       }
       ```
     - Cập nhật comment giải thích lease math: worst-case delivery = 240s budget + 60s timeout clip đang chạy + grading 180s (run đầu) + 180s (2 run song song) = 660s, dưới lease 720s. Nếu vượt 240s, throw retriable error để queue delivery tiếp theo resume tức thì từ các câu đã hoàn thành (vì transcript từng câu đã được lưu vào D1 ngay khi xong).
     - Tuyệt đối không thêm heartbeat chạm vào `updatedAt` (vì logic lease release so sánh `updatedAt === claimedAt`).
- **Success criteria**: Code chạy tuần tự, lưu transcript ngay sau từng câu, ném lỗi khi vượt time budget.
- **Verify**: `pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` exits 0.

### Task 3.2 — Bổ sung Test Tuần tự hoá và Resume trong `score-attempt.test.ts`
- **Goal**: Kiểm thử hành vi transcribe tuần tự, giải phóng bộ nhớ, và khả năng tiếp tục (resume) các câu đã có transcript.
- **Target files**:
  - `packages/api/src/scoring/score-attempt.test.ts`
- **Steps**:
  1. Thêm test case xác nhận `deps.client.transcribe` được gọi tuần tự theo thứ tự câu hỏi.
  2. Thêm test case xác nhận các câu đã có `transcript !== null` được bỏ qua, không gọi lại `transcribe`.
  3. Thêm test case kiểm tra time budget: nếu transcription vượt quá ngưỡng cấu hình thì ném lỗi để queue xử lý retry.
- **Success criteria**: Toàn bộ test trong `score-attempt.test.ts` pass.
- **Verify**: `pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` exits 0.

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
