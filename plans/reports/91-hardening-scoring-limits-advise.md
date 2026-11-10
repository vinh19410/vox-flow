# Báo Cáo Tư Vấn Kỹ Thuật (Advise Report)
## Issue #91: Hardening Giới Hạn Chi Phí Chấm Điểm & Bộ Nhớ Worker

- **Thời gian lập:** 2026-11-10
- **Trạng thái:** Đã xác nhận qua phỏng vấn với Chủ sản phẩm (Product Owner) dựa trên dữ liệu thực tế của 178 chủ đề trong DB
- **Tài liệu tham chiếu:** Issue #91, PR #90, Issue #46, Issue #18, `packages/db/scripts/seed-forecast.sql`, `packages/api/src/scoring/score-attempt.ts`, `apps/server/src/index.ts`, `apps/web/src/features/forecast/builders.ts`
- **Bản xem trước trực quan (Preview):** `plans/reports/91-hardening-scoring-limits-preview.html` | `.svg`

---

### 1. Phán quyết kỹ thuật (Verdict)

Đợt hardening này là **bắt buộc và khẩn cấp** trước khi mở rộng người dùng cho tính năng chấm điểm thật. Khảo sát dữ liệu thực tế từ 178 chủ đề trong `seed-forecast.sql` cho thấy:
* **Part 1:** Số câu dao động từ 4 đến **17 câu** (ví dụ: `The area you live in` có 7 câu; `Hometown` có 15 câu; `Studies` có 17 câu).
* **Part 2 & 3:** Gồm 1 cue card + các câu Part 3 phụ, số câu dao động từ 2 đến **14 câu** (64 đề có 7 câu, một số đề có tới 14 câu).
* **Single-question Practice:** Khi luyện 1 câu đơn lẻ, `attempt.questionKey` được thiết lập và chỉ có tối đa 1–2 câu (gồm câu hỏi chính và câu hỏi phụ follow-up `-f`).

Một trần cố định nhỏ (như 6 câu) sẽ **làm hỏng các đề thi hợp lệ** (trả về lỗi HTTP 400). Đồng thời, nếu không chuyển sang **tải transcription tuần tự**, việc tải song song 14–17 file audio từ R2 vào RAM Worker khi gọi Whisper (`Promise.allSettled`) chắc chắn sẽ gây OOM làm sập Cloudflare Worker (giới hạn cứng 128MB). Hơn nữa, việc thiếu cột `sizeBytes` trong `attempt_answer` khiến việc tính tổng dung lượng toàn bài bị thiếu chính xác khi học viên thu âm lại (upsert).

**Phương án tối ưu đã chốt:**
1. **Xác thực số câu theo từng đề thi (Topic-aware Validation):**
   * Xây dựng shared helper chuẩn trong `packages/api` để cả Web và Server cùng dùng chung logic sinh `validQuestionKeys` (`${id}-${i}`, `${id}-c`, `${id}-p3-${i}`) cùng các key follow-up (`${id}-f`).
   * **Trường hợp luyện cả đề:** Giới hạn danh sách `questionKey` hợp lệ theo đề thi (`{item.id} ∪ {item.id + "-f"}`), tối đa trần an toàn 18 câu.
   * **Trường hợp luyện 1 câu (`attempt.questionKey` có giá trị):** Thu hẹp danh sách cho phép về `{attempt.questionKey, attempt.questionKey + "-f"}` và giới hạn tối đa 2 câu.
2. **Kế toán dung lượng ghi đè (Upsert-aware Accounting) với cột `sizeBytes`:**
   * Thêm cột `sizeBytes` vào bảng `attempt_answer`.
   * Khi upload/ghi đè, tính toán `newTotal = currentTotal - oldAnswerBytes + newBytes`. Trần tổng audio toàn bài là **$\le 35\text{MB}$** (đáp ứng đầy đủ cho các đề dài nhất 14–17 câu bằng audio/mp4 hoặc webm mà vẫn chặn đứng payload độc hại).
3. **Bắt buộc tuần tự hoá bước Transcription trong Worker:**
   * Thay `Promise.allSettled` bằng vòng lặp tuần tự tải từng file từ R2 $\rightarrow$ Whisper $\rightarrow$ lưu transcript $\rightarrow$ giải phóng buffer. Đảm bảo RAM Worker luôn an toàn $< 30\text{MB}$.
4. **Kiểm soát `scoring.retry`:**
   * Tối đa **1 lần retry thủ công / bài** (`manualRetries < 1` trong `attempt_score`).
   * Tối đa **3 lần retry thủ công / ngày / tài khoản** (`Asia/Ho_Chi_Minh` qua bảng `scoring_retry_log`).

---

### 2. Những việc NÊN LÀM (What you should do)

1. **Shared Helper sinh Question Keys (`packages/api/src/scoring/forecast-keys.ts`):**
   * Định nghĩa hàm `getValidQuestionKeysForTopic(topic: ForecastTopicRow, singleQuestionKey?: string | null): Set<string>`:
     * Sinh tập hợp key cho Part 1: `${topic.id}-${i}` và `${topic.id}-${i}-f`.
     * Sinh tập hợp key cho Part 2 & 3: `${topic.id}-c`, `${topic.id}-c-f`, `${topic.id}-p3-${i}`, `${topic.id}-p3-${i}-f`.
     * Nếu `singleQuestionKey` được chỉ định: trả về `{singleQuestionKey, singleQuestionKey + "-f"}`.
   * Dùng chung hàm này giữa `apps/server` (để validate upload) và `apps/web/src/features/forecast/builders.ts` (để render các item) nhằm triệt tiêu nguy cơ drift key làm lỗi 400.

2. **Schema Migration (`@vox-flow/db`):**
   * Thêm cột `sizeBytes` (`integer("size_bytes").notNull().default(0)`) vào bảng `attempt_answer`.
   * Thêm cột `manualRetries` (`integer("manual_retries").notNull().default(0)`) vào bảng `attempt_score`.
   * Tạo bảng `scoring_retry_log` với các trường `id` (text, primary key), `userId` (text, not null), `attemptId` (text, not null), `createdAt` (integer timestamp_ms, not null), index trên `(userId, createdAt)`.
   * Đăng ký bảng mới vào `packages/api/src/data-registry.ts` để tuân thủ chính sách xóa dữ liệu người dùng (GDPR / quyền riêng tư).
   * Chạy `pnpm --filter @vox-flow/db db:generate`.

3. **Chặn sớm tại API Upload Audio (`apps/server/src/index.ts`):**
   * Tại `POST /api/attempts/:attemptId/answers/:questionKey/audio`:
     * Tải `attempt` và `forecastTopic`.
     * Gọi helper `getValidQuestionKeysForTopic(topic, currentAttempt.questionKey)`:
       - Nếu `questionKey` không nằm trong danh sách cho phép: từ chối ngay với HTTP 400 (`Bad Request: Invalid question key for this attempt`).
     * Kiểm tra số lượng câu hiện có trong `attempt_answer`: nếu là câu mới và số câu hiện tại đã đạt giới hạn cho phép (tối đa bằng số key hợp lệ, tối đa 2 cho single-question, trần an toàn 18 cho cả đề): từ chối với HTTP 400 (`Bad Request: Question limit reached`).
     * **Tính toán dung lượng Upsert-aware:**
       - Lấy `existingRow` của `(attemptId, questionKey)` từ `attempt_answer` (nếu có).
       - Truy vấn `sum(size_bytes)` của `attemptId` từ `attempt_answer`.
       - Tính `newTotalBytes = currentTotal - (existingRow?.sizeBytes ?? 0) + contentLength`.
       - Nếu `newTotalBytes > 35 * 1024 * 1024`: từ chối ngay với HTTP 413 (`Payload Too Large: Tổng dung lượng audio toàn bài không được vượt quá 35MB`).
     - Khi lưu vào D1: cập nhật cả trường `sizeBytes: contentLength`.

4. **Xác thực phòng thủ tại `attempt.submit` (`packages/api/src/routers/attempt.ts`):**
   * Trước khi cập nhật `attempt.status = 'submitted'`, kiểm tra lại:
     - Toàn bộ `questionKey` trong `attempt_answer` đều hợp lệ theo helper.
     - Số lượng câu phù hợp và tổng `size_bytes` $\le 35\text{MB}$.
     - Nếu vi phạm, quăng `TRPCError({ code: "BAD_REQUEST" })`.

5. **Tuần tự hoá tải Audio & Transcription trong Worker (`packages/api/src/scoring/score-attempt.ts`):**
   * **Đây là thay đổi bắt buộc cần triển khai:** Thay thế hoàn toàn `Promise.allSettled(needsTranscript.map(...))` bằng vòng lặp tuần tự `for (const row of needsTranscript)`.
   * Với mỗi câu: tải audio buffer từ R2 $\rightarrow$ gọi `deps.client.transcribe` $\rightarrow$ lưu transcript vào D1 $\rightarrow$ gán biến buffer thành `undefined` để giải phóng bộ nhớ ngay.
   * Bước grading tiếp theo vẫn duy trì cơ chế bảo vệ `MAX_GRADING_AUDIO_BYTES = 8MB` (nếu tổng audio $> 8\text{MB}$ thì chuyển sang transcript-only).
   * Nhờ xử lý tuần tự, RAM Worker luôn được bảo đảm $< 30\text{MB}$, loại bỏ hoàn toàn rủi ro OOM trên Cloudflare Worker (128MB limit) kể cả với các đề 14–17 câu.

6. **Kiểm soát `scoring.retry` (`packages/api/src/routers/scoring.ts`):**
   * Kiểm tra `attemptScore.manualRetries < 1`. Nếu $\ge 1$, ném `TRPCError({ code: "BAD_REQUEST", message: "RETRY_LIMIT_EXCEEDED" })`.
   * Đếm số lần retry của `ctx.session.user.id` trong bảng `scoring_retry_log` từ đầu ngày (tính theo múi giờ `Asia/Ho_Chi_Minh`): nếu $\ge 3$, ném `TRPCError({ code: "TOO_MANY_REQUESTS", message: "DAILY_RETRY_LIMIT_EXCEEDED" })`.
   * Khi hợp lệ: tăng `manualRetries = manualRetries + 1`, ghi 1 bản ghi vào `scoring_retry_log`, cập nhật `status = 'queued', tries = 0`, và đẩy vào `SCORING_QUEUE`.

7. **Cập nhật Giao diện hiển thị trạng thái chấm (`apps/web`):**
   * Khi bài thi có `status === 'failed'`:
     - Nếu `manualRetries >= 1`: vô hiệu hóa (disabled) nút "Thử lại", hiển thị thông báo: *"Bài thi đã được thử lại tối đa 1 lần. Vui lòng tạo bài luyện tập mới."*
     - Nếu nhận lỗi `DAILY_RETRY_LIMIT_EXCEEDED`: hiển thị thông báo: *"Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai."*

---

### 3. Những việc KHÔNG NÊN LÀM (What you shouldn't do)

* **Không tách rời logic sinh key giữa Web và Server:** Tuyệt đối không để Server tự hardcode regex hoặc danh sách key khác với cách `builders.ts` của frontend sinh ra. Phải dùng chung một shared helper function.
* **Không quên trường hợp Single-Question Practice:** Đừng để một attempt luyện 1 câu (`attempt.questionKey !== null`) được phép upload 14–18 câu.
* **Không đặt trần cứng cố định nhỏ (như 6 câu):** Sẽ gây lỗi với các đề chuẩn như `The area you live in` (7 câu) hay các đề Part 2 & 3 (phần lớn 7 câu).
* **Không tải song song audio từ R2:** Tránh mọi hình thức `Promise.all` khi tải file audio trong Worker. Với đề 14–17 câu, tải song song sẽ lập tức làm sập Worker do vượt quá 128MB RAM.
* **Không tính dung lượng bằng cách cộng dồn thô:** Bắt buộc phải tính theo cơ chế **upsert-aware** (trừ đi `sizeBytes` cũ của câu đó nếu học viên thu âm lại) để không phạt oan học viên khi họ ghi âm lại câu trả lời.
* **Không dùng Cloudflare KV hoặc Redis ngoài:** D1 SQLite tại Edge với index `(userId, createdAt)` hoàn toàn đủ nhanh ($< 5\text{ms}$), nhất quán cao (strongly consistent) và không tốn thêm chi phí hạ tầng hay dependency phức tạp.

---

### 4. Kế hoạch công việc (Work Checklist)

- [ ] **Shared Key Helper:** Tạo `packages/api/src/scoring/forecast-keys.ts` chứa hàm sinh danh sách `validQuestionKeys` (hỗ trợ cả Part 1, Part 2/3, câu phụ `-f` và single-question practice).
- [ ] **DB Schema:** Thêm cột `sizeBytes` vào `attempt_answer`, cột `manualRetries` vào `attempt_score`, và tạo bảng `scoring_retry_log` trong `packages/db/src/schema/attempt.ts`.
- [ ] **Migration & Registry:** Sinh migration với `pnpm --filter @vox-flow/db db:generate`, thêm vào `packages/api/src/data-registry.ts`.
- [ ] **Upload Route Guard:** Sửa `apps/server/src/index.ts` để kiểm tra `questionKey` theo shared helper, đếm số câu hợp lệ, và tính tổng dung lượng upsert-aware $\le 35\text{MB}$. Lưu `sizeBytes`.
- [ ] **Submit Procedure Guard:** Sửa `packages/api/src/routers/attempt.ts` để xác thực lại số câu hợp lệ và tổng dung lượng $\le 35\text{MB}$ trước khi submit.
- [ ] **Sequential Transcription:** Sửa `packages/api/src/scoring/score-attempt.ts` chuyển `Promise.allSettled` sang vòng lặp tuần tự tải R2 $\rightarrow$ transcribe $\rightarrow$ giải phóng buffer.
- [ ] **Retry Rate Limit:** Sửa `packages/api/src/routers/scoring.ts` áp dụng kiểm tra `manualRetries < 1` và `dailyCount < 3`.
- [ ] **Frontend Integration & UI:** Đồng bộ builder với shared helper, cập nhật màn hình chấm điểm trong `apps/web` hiển thị đúng trạng thái disable và thông báo khi hết lượt retry.
- [ ] **Automated Tests:** Bổ sung unit/integration tests cho helper, upload route, score attempt, scoring router và submit attempt.

---

### 5. Chỉ số thành công (Success Metrics)

1. `packages/api/src/scoring/forecast-keys.test.ts`: Test xác nhận 100% các key do Web builder sinh ra đều được server validator chấp nhận (bao gồm cả `-f` follow-ups và single-question).
2. `apps/server/src/index.test.ts`: Test xác nhận:
   - Upload `questionKey` lạ không thuộc đề $\rightarrow$ HTTP 400.
   - Upload câu thứ 3 trong single-question practice $\rightarrow$ HTTP 400.
   - Thu âm lại câu cũ $\rightarrow$ dung lượng cũ được thay thế chính xác (upsert-aware).
   - Upload làm tổng dung lượng $> 35\text{MB}$ $\rightarrow$ HTTP 413.
3. `packages/api/src/scoring/score-attempt.test.ts`: Test xác nhận các câu hỏi được transcribe tuần tự từng câu một và không vượt ngưỡng RAM.
4. `packages/api/src/routers/scoring.test.ts`: Test xác nhận retry lần 1 thành công; retry lần 2 trên cùng bài báo lỗi `BAD_REQUEST`; retry lần 4 trong ngày báo lỗi `TOO_MANY_REQUESTS`.
5. `pnpm check-types` và toàn bộ suite kiểm tra kiểu thoát với mã 0.

---

### 6. Handoff Brief (Dành cho `ak-plan` / `ak-cook`)

```text
Objective: Hardening pipeline chấm điểm forecast: giới hạn câu trả lời theo đúng đề thi qua shared key helper (trần an toàn ≤ 18 câu; single-question ≤ 2 câu), tổng audio ≤ 35MB (upsert-aware qua cột sizeBytes), tuần tự hoá transcription trong Cloudflare Worker, và giới hạn scoring.retry tối đa 1 lần/bài & 3 lần/ngày/tài khoản.

Done means:
- Tạo shared helper sinh validQuestionKeys dùng chung giữa server và web, hỗ trợ cả câu gốc, follow-up (-f) và single-question practice.
- Bảng attempt_answer có cột sizeBytes (integer not null default 0).
- Endpoint upload audio (POST /api/attempts/:id/answers/:key/audio) kiểm tra questionKey thuộc danh sách cho phép, số câu không vượt ngưỡng bài (tối đa 2 cho single-question, trần an toàn 18 cho cả đề), và tổng dung lượng sau khi upsert ≤ 35MB (từ chối bằng HTTP 400 hoặc 413).
- attempt.submit kiểm tra lại các câu hợp lệ và tổng dung lượng ≤ 35MB trước khi enqueue.
- scoreAttempt xử lý transcription tuần tự từng file từ R2, giải phóng buffer, giữ RAM worker < 30MB kể cả với đề 14–17 câu.
- scoring.retry kiểm tra manualRetries < 1 và dailyRetries < 3 (theo Asia/Ho_Chi_Minh), ném lỗi rõ ràng khi vượt ngưỡng.
- Schema D1 có cột manualRetries trong attempt_score và bảng scoring_retry_log được đăng ký trong data-registry.ts.
- Frontend apps/web vô hiệu hóa nút Thử lại khi đạt ngưỡng và hiển thị thông báo hướng dẫn.
- Toàn bộ test suite pass, pnpm check-types pass.

Out of scope:
- Không thay đổi prompt hoặc thuật toán chấm 3 lần của GPT-6 Luna.
- Không tích hợp trừ điểm hạn mức free quota (Issue #18) hay paywall/billing.
- Không áp dụng cho Full Mock hay Daily Practice.

Constraints:
- Shared key helper phải là nguồn chân lý duy nhất cho key format của cả Web và Server.
- Cloudflare Worker 128MB RAM limit: bắt buộc tuần tự hoá transcription, không tải song song nhiều audio file từ R2.
- Tính toán tổng dung lượng audio phải upsert-aware khi học viên ghi âm đè câu cũ.
- Múi giờ tính ngày rate limit là Asia/Ho_Chi_Minh.

Stop and ask only if:
- Phát hiện một đề forecast có cấu trúc câu hỏi đặc thù không thể trích xuất questionKey bằng parser hiện tại.
- Lệnh pnpm db:generate gây xung đột migration không thể tự giải quyết an toàn.
```
