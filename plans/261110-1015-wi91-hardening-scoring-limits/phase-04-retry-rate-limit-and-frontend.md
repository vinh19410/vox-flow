# Phase 4: Scoring Retry Rate Limit & Frontend UX

## Overview
Hardening thủ tục `scoring.retry` trong `packages/api/src/routers/scoring.ts`:
- Giới hạn tối đa 1 lần retry thủ công / bài thi (`manualRetries < 1` trong `attempt_score`).
- Giới hạn tối đa 3 lần retry thủ công / ngày / tài khoản (theo múi giờ `Asia/Ho_Chi_Minh` UTC+7) thông qua bảng `scoring_retry_log`.
- Miễn trừ (exempt) nhánh cứu hộ hệ thống (rescue path tạo row score bị thiếu) khỏi bộ đếm retry thủ công.
- Mở rộng payload `ScoreStatusResult` để trả về `manualRetries` và `canRetry`.
- Đồng bộ UI trên `apps/web`: vô hiệu hóa nút "Chấm lại" khi bài thi đã hết lượt retry hoặc tài khoản hết hạn mức ngày, hiển thị thông báo rõ ràng cho học viên.

## Target Files and Symbols
- `packages/api/src/scoring/types.ts`: Cập nhật kiểu `ScoreStatusResult` (bổ sung `manualRetries?: number; canRetry?: boolean`).
- `packages/api/src/routers/scoring.ts`: Cập nhật `scoring.status` và hardening thủ tục `scoring.retry` (atomic update & insert).
- `packages/api/src/routers/scoring.test.ts`: Bổ sung test retry per-attempt và daily rate limit.
- `apps/web/src/features/scoring/use-scoring-job.ts`: Cập nhật kiểu `ScoringView` (`kind: "failed"; manualRetries?: number; canRetry?: boolean`) và **loại bỏ auto-retry 'failed'** trong `sendSubmit` (dòng 267-268).
- `apps/web/src/features/scoring/scoring-screen.tsx`: Cập nhật `ScoringJobState` hiển thị trạng thái hết lượt retry.
- `apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx`: Bổ sung test kiểm tra UI khi retry bị vô hiệu hóa.

## Tasks & Steps

### Task 4.1 — Hardening `scoring.retry` và `ScoreStatusResult` trong `packages/api`
- **Goal**: Kiểm soát retry an toàn với SQL nguyên tử, chặn spam retry, trả về `canRetry` trong status.
- **Target files**:
  - `packages/api/src/scoring/types.ts`
  - `packages/api/src/routers/scoring.ts`
- **Steps**:
  1. Trong `packages/api/src/scoring/types.ts`:
     - Bổ sung `manualRetries?: number; canRetry?: boolean;` vào `ScoreStatusResult`.
  2. Trong `packages/api/src/routers/scoring.ts`:
     - Ở query `scoring.status`: trả về `manualRetries: scoreRow?.manualRetries ?? 0` và `canRetry: (scoreRow?.manualRetries ?? 0) < 1 && (daily count hôm nay < 3)` (dùng index `(user_id, created_at)` — query rẻ).
     - Ở mutation `scoring.retry`:
      - Kiểm tra attempt thuộc quyền sở hữu của user (`requireOwnedAttempt`).
      - **Nhánh Rescue Path (Miễn trừ hoàn toàn giới hạn manualRetries và daily log)**:
        - Nếu `!existing`: chỉ áp dụng cho bài thi forecast đã submit (`topicId !== null` và `status === 'submitted'`).
        - Insert `attempt_score` với `status = 'queued', manualRetries = 0`.
        - Gửi queue message và return status `"queued"`.
      - **Nhánh Retry Thủ Công (Manual Retry)**:
        - Thêm `now?: () => Date` vào `Context` (`packages/api/src/context.ts`), cùng shape với `score-attempt.ts:56`. Router mặc định `const now = ctx.now?.() ?? new Date()`. Test inject đồng hồ qua `createCaller({ …, now })`.
        - Tách hàm thuần `startOfVietnamDayMs(nowMs: number): number` (UTC+7, không DST) vào `packages/api/src/scoring/retry-limits.ts` (hoặc cùng file router) để unit test riêng:
          ```typescript
          export function startOfVietnamDayMs(nowMs: number): number {
            const UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
            const localDate = new Date(nowMs + UTC_OFFSET_MS);
            return Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate()) - UTC_OFFSET_MS;
          }
          ```
        - **Reserve-first atomic** qua `ctx.db.batch` với `insert(...).select(sql...)` (Drizzle `drizzle-orm@1.0.0-rc.5` không có `.where()` trên INSERT...VALUES — bắt buộc dùng dạng `INSERT … SELECT … WHERE`):
          ```typescript
          const nowMs = now().getTime();
          const startOfDayUtc = startOfVietnamDayMs(nowMs);
          const retryLogId = crypto.randomUUID();

          const batchResult = await ctx.db.batch([
            ctx.db
              .insert(scoringRetryLog)
              // Drizzle điền đúng thứ tự cột insertable trong schema: id, user_id, attempt_id, created_at
              .select(sql`
                SELECT ${retryLogId}, ${ctx.session.user.id}, ${input.attemptId}, ${nowMs}
                WHERE (SELECT COUNT(*) FROM scoring_retry_log
                       WHERE user_id = ${ctx.session.user.id}
                         AND created_at >= ${startOfDayUtc}) < 3
                  AND EXISTS (SELECT 1 FROM attempt_score
                              WHERE attempt_id = ${input.attemptId}
                                AND status = 'failed'
                                AND manual_retries < 1)
              `),
            ctx.db
              .update(attemptScore)
              .set({
                manualRetries: sql`${attemptScore.manualRetries} + 1`,
                status: "queued",
                tries: 0,
                lastError: null,
                updatedAt: new Date(nowMs),
              })
              .where(
                and(
                  eq(attemptScore.attemptId, input.attemptId),
                  eq(attemptScore.status, "failed"),
                  lt(attemptScore.manualRetries, 1),
                  sql`EXISTS (SELECT 1 FROM scoring_retry_log WHERE id = ${retryLogId})`,
                ),
              )
              .returning({ attemptId: attemptScore.attemptId }),
          ]);

          const [updatedScore] = batchResult[1] ?? [];
          ```
        - **Phân loại lỗi sau batch** (reload lại dữ liệu sau khi batch quyết định — chỉ chọn message, không mở lại race):
          - Nếu `!updatedScore`:
            - Reload `attempt_score` + đếm lại log hôm nay.
            - `score.manualRetries >= 1` → `throw new TRPCError({ code: "BAD_REQUEST", message: "RETRY_LIMIT_EXCEEDED" });`
            - `score.status === "failed" && dailyCount >= 3` → `throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "DAILY_RETRY_LIMIT_EXCEEDED" });`
            - Ngược lại → `throw new TRPCError({ code: "BAD_REQUEST", message: "Only a failed or unscored attempt can be retried" });`
        - Gửi message vào `SCORING_QUEUE`.
        - Thêm test chạy 4 retry **song song** (`Promise.allSettled`) trên 4 attempt khác nhau của cùng user: chỉ đúng 3 thành công, attempt thứ 4 ném `DAILY_RETRY_LIMIT_EXCEEDED`.
- **Success criteria**: Procedure kiểm soát retry đúng số lần và ném lỗi phù hợp khi vượt ngưỡng.
- **Verify**: `pnpm --filter @vox-flow/api test src/routers/scoring.test.ts` exits 0.

### Task 4.2 — Loại bỏ auto-retry 'failed' trong `use-scoring-job.ts`
- **Goal**: Hook `sendSubmit` (khoảng dòng 267-268) không tự động gọi `scoring.retry` cho trạng thái `failed`, tránh tiêu tốn lượt retry thủ công duy nhất của học viên mà không có ý định rõ ràng.
- **Target files**:
  - `apps/web/src/features/scoring/use-scoring-job.ts`
  - `apps/web/src/features/scoring/__tests__/use-scoring-job.test.ts` (tạo mới nếu chưa có; hiện chỉ có `scoring-screen.test.tsx`)
- **Steps**:
  1. Trong nhánh `isAlreadySubmittedError(err)` của `sendSubmit` (dòng 261-270):
     - Chỉ giữ auto-retry cho trạng thái `st.status === "not_scored"` (rescue path: score row bị thiếu, miễn trừ counter).
     - Với `st.status === "failed"`: KHÔNG tự gọi `scoring.retry`. Polling tiếp tục; người dùng bấm nút "Chấm lại" thủ công sẽ là lượt retry duy nhất được tính.
     - Tránh flash "queued": khi `st.status === "failed"`, set view `failed` trực tiếp với `manualRetries`/`canRetry` từ `st` (giống dòng 159) thay vì `setView(QUEUED)` rồi chờ poll kế.
     - Cập nhật nhận xét giải thích: auto-retry 'failed' hiện đã bị loại bỏ để tránh tiêu hao quota thủ công vô tình.
  2. Thêm test trong `apps/web/src/features/scoring/__tests__/use-scoring-job.test.ts` xác nhận hook không tự gọi retry khi status failed, và set view failed trực tiếp.

### Task 4.3 — Viết Test cho Scoring Router
- **Goal**: Kiểm thử các trường hợp retry lần 1 thành công, retry lần 2 trên cùng bài thất bại, retry lần 4 trong ngày thất bại.
- **Target files**:
  - `packages/api/src/routers/scoring.test.ts`
- **Steps**:
  1. Thêm test: Attempt thất bại retry lần đầu tiên -> thành công, status trở về queued, `manualRetries` tăng lên 1, có bản ghi trong `scoring_retry_log` với `created_at = nowMs` (từ đồng hồ inject).
  2. Thêm test: Attempt đã retry 1 lần gọi tiếp -> ném `BAD_REQUEST: RETRY_LIMIT_EXCEEDED`.
  3. Thêm test: User đã retry 3 lần trong ngày thử retry attempt thứ 4 -> ném `TOO_MANY_REQUESTS: DAILY_RETRY_LIMIT_EXCEEDED`.
  4. Thêm test: Chạy 4 retry **song song** (`Promise.allSettled`) trên 4 attempt khác nhau của cùng user -> chỉ đúng 3 thành công, attempt thứ 4 ném `DAILY_RETRY_LIMIT_EXCEEDED` (chứng minh batch nguyên tử chống race).
  5. Inject đồng hồ test qua `ctx.now` trên `Context` (`createCaller({ …, now })`) để test ranh giới ngày UTC+7 (retry lúc 23:59 vs 00:01 giờ Việt Nam); test router seed `createdAt` bằng `nowMs` từ đồng hồ inject.
  6. Thêm unit test riêng cho hàm thuần `startOfVietnamDayMs` (23:59 VN vs 00:01 VN hôm sau).
- **Success criteria**: 100% test cases trong `scoring.test.ts` pass.
- **Verify**: `pnpm --filter @vox-flow/api test src/routers/scoring.test.ts` exits 0.

### Task 4.4 — Đồng bộ UI hiển thị trên `apps/web`
- **Goal**: Cập nhật màn hình chấm điểm hiển thị thông báo hướng dẫn và vô hiệu hóa nút thử lại khi đạt ngưỡng.
- **Target files**:
  - `apps/web/src/features/scoring/use-scoring-job.ts`
  - `apps/web/src/features/scoring/scoring-screen.tsx`
  - `apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx`
- **Steps**:
  1. Trong `use-scoring-job.ts`:
     - Mở rộng kiểu view: `| { kind: "failed"; manualRetries?: number; canRetry?: boolean }`.
     - Cập nhật cả 3 call sites chuyển sang `failed` (dòng 159, 194, 200) để truyền `manualRetries: st?.manualRetries ?? 0, canRetry: st?.canRetry ?? ((st?.manualRetries ?? 0) < 1)`.
     - Bắt mã lỗi `DAILY_RETRY_LIMIT_EXCEEDED` và `RETRY_LIMIT_EXCEEDED` trong `retryScoring` VÀ trong nhánh recovery của `sendSubmit` (để `DAILY_RETRY_LIMIT_EXCEEDED` từ auto path không hiện thành "Vẫn chưa gửi được bài…"), lưu thông điệp tương ứng vào `actionError`.
  2. Trong `answer-uploads.ts` (apps/web/src/features/exam):
     - Hiển thị thông báo rõ ràng cho HTTP 400/413 thay vì thông báo mạng chung ("Kiểm tra kết nối mạng"): với 413 hiện *"Tổng dung lượng ghi âm vượt quá giới hạn 35MB."*, với 400 hiện *"Câu trả lời không hợp lệ với đề thi này."*.
  3. Trong `scoring-screen.tsx`:
     - Nếu `view.kind === "failed"`:
       - Nếu `view.canRetry === false`:
         - Hiển thị mô tả: *"Bài thi đã được thử lại tối đa 1 lần. Vui lòng tạo bài luyện tập mới."*
         - Vô hiệu hóa nút Chấm lại.
       - Nếu `actionError` có thông báo `DAILY_RETRY_LIMIT_EXCEEDED`:
         - Hiển thị thông báo: *"Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai."*
       - Nếu `actionError` có thông báo `RETRY_LIMIT_EXCEEDED`:
         - Hiển thị thông báo: *"Bài thi đã hết số lần thử lại cho phép."*
- **Verify**: `pnpm --filter web test src/features/scoring/__tests__/scoring-screen.test.tsx` và `pnpm --filter web test src/features/scoring/__tests__/use-scoring-job.test.ts` đều exits 0.

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
