# scoring-results — Evidence base (truy vết code → luồng)

> Bảng bằng chứng thô cho `scoring-results-reverse-spec.md`. Tên endpoint/hàm/bảng chỉ được phép xuất hiện ở đây (và ở cột Nguồn của spec). Không chép giá trị bí mật; chỉ tên biến môi trường.

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| tRPC query | `scoring.status` | Màn chấm (polling), màn kết quả, bước phục hồi sau khi nộp lỗi | Phiên đăng nhập (protectedProcedure) + chủ bài thi | Trạng thái chấm, bài thi, lượt thử lại, cờ canRetry | packages/api/src/routers/scoring.ts:58-76 |
| tRPC mutation | `scoring.retry` | Nút "Chấm lại" (màn chấm, màn kết quả), "Chấm điểm ngay", đường cứu sau nộp lại | Phiên + chủ bài thi | Thử lại thủ công (có hạn mức) hoặc đường cứu (không hạn mức) | packages/api/src/routers/scoring.ts:78-177 |
| tRPC query | `scoring.getResult` | Màn kết quả | Phiên + chủ bài thi | Trả kết quả đầy đủ khi `done` | packages/api/src/routers/scoring.ts:179-228 |
| tRPC mutation | `attempt.submit` (phần liên quan chấm điểm) | Màn chấm (nộp lần đầu / gửi lại) | Phiên + chủ bài thi | Đánh dấu đã nộp, tạo bản ghi chấm `queued`, xếp hàng | packages/api/src/routers/attempt.ts:229-296 |
| Queue consumer | `handleScoringQueue` (cổng `queue` của worker server) | Hàng đợi chấm (không có màn) | Nội bộ | Chạy toàn bộ quy trình chấm cho từng thông điệp | apps/server/src/queue.ts:37-78 |
| Cron | `handleScheduled` với `*/5 * * * *` | Không có màn | Nội bộ | Quét bài kẹt | apps/server/src/scheduled.ts:8, apps/server/src/scheduled.ts:14, apps/server/src/scheduled.ts:42-55 |
| Route web | `/_proto/scoring` | Chuyển từ phòng thi sau khi nộp | Cần đã hoàn tất onboarding (`requireOnboarded`) | Màn tiến trình chấm | apps/web/src/routes/_proto/scoring.tsx:5-8 |
| Route web | `/_proto/app/history/$attemptId` | Lịch sử/dashboard, chuyển sau khi chấm xong | Kế thừa layout `app` | Màn kết quả | apps/web/src/routes/_proto/app/history.$attemptId.tsx:5-12 |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| attemptId (đầu vào 3 thủ tục) | chuỗi không rỗng | `z.string().min(1)` | Lỗi xác thực đầu vào của tRPC (chuỗi lỗi do thư viện sinh, không resolve) | packages/api/src/routers/scoring.ts:17 | ✅ |
| Thông điệp hàng đợi | đối tượng có `attemptId` chuỗi không rỗng | `z.object({ attemptId: z.string().min(1) })` | Thông điệp bị bỏ, log "[scoring-queue] Dropping malformed message" | packages/api/src/scoring/queue.ts:17-23; apps/server/src/queue.ts:46-51 | ✅ |
| band từng tiêu chí (đầu ra AI) | số 0–9 | `z.number().min(0).max(9)` | "Grading model output failed validation: ..." | packages/api/src/scoring/prompt.ts:26 | ✅ |
| summary (đầu ra AI) | chuỗi ≥ 1 ký tự | `z.string().min(1)` | như trên | packages/api/src/scoring/prompt.ts:27 | ✅ |
| oneLiner (đầu ra AI) | chuỗi ≥ 1 ký tự | `z.string().min(1)` | như trên | packages/api/src/scoring/prompt.ts:48 | ✅ |
| evidence.kind | `plus` hoặc `minus` | `z.enum(["plus", "minus"])` | như trên | packages/api/src/scoring/prompt.ts:33 | ✅ |
| 4 tiêu chí | đủ FC, LR, GRA, P | `criteria: { FC, LR, GRA, P }` | như trên | packages/api/src/scoring/prompt.ts:42-47 | ✅ |
| Số lần chấm `SCORING_RUNS` | số nguyên 1–7, mặc định 3 | `DEFAULT_SCORING_RUNS = 3`, `MAX_SCORING_RUNS = 7` | "SCORING_RUNS must be an integer between 1 and 7" | packages/api/src/scoring/config.ts:2-3, packages/api/src/scoring/config.ts:62-70 | ✅ |
| Đơn giá `SCORING_PRICE_INPUT_PER_1M`, `SCORING_PRICE_OUTPUT_PER_1M` | số hữu hạn ≥ 0, trống → null | — | "{key} must be a non-negative number" | packages/api/src/scoring/config.ts:47-55 | ✅ |
| `SCORING_QUEUE_MAX_RETRIES` | số nguyên 0–100, trống → 3, sai → cảnh báo + 3 | `/^\d+$/` và `<= 100` | log "SCORING_QUEUE_MAX_RETRIES "{raw}" is not an integer between 0 and 100; falling back to 3" | packages/api/src/scoring/config.ts:16-27; packages/api/src/scoring/config.test.ts:10-43 | ✅ |
| Khóa âm thanh | hợp lệ với chủ bài và mã bài | hàm kiểm tra khóa âm thanh | `Answer {questionKey} has an invalid audio key` | packages/api/src/scoring/score-attempt.ts:252-256 | ✅ |
| Số câu trả lời | ≤ trần theo loại bài | 2 / ≤ 18 / 20 / kích thước bộ khóa mode / 0 cho mode lạ | `Attempt answers rejected: ANSWER_COUNT_EXCEEDED` | packages/api/src/scoring/answer-limits.ts:5-14, packages/api/src/scoring/answer-limits.ts:28-36 | ✅ |
| Tổng dung lượng âm thanh | ≤ 35 MiB | `MAX_TOTAL_AUDIO_BYTES = 35 * 1024 * 1024` | `Attempt answers rejected: TOTAL_AUDIO_LIMIT_EXCEEDED` | packages/api/src/scoring/forecast-keys.ts:98; packages/api/src/scoring/answer-limits.ts:50-53 | ✅ |
| Trích dẫn bằng chứng | xuất hiện nguyên văn trong phiên âm của câu được dẫn | khớp không phân biệt hoa thường, gộp khoảng trắng; bỏ dấu nháy/ba chấm ngoài | Bằng chứng bị loại âm thầm | packages/api/src/scoring/prompt.ts:62-77, packages/api/src/scoring/prompt.ts:94-97 | ✅ |
| Gợi ý cải thiện | `from` và `to` không rỗng sau cắt khoảng trắng | — | Gợi ý bị loại âm thầm | packages/api/src/scoring/prompt.ts:110-112 | ✅ |
| Mục tiêu hiển thị band | 1 chữ số thập phân | `toFixed(1)` | — | apps/web/src/features/results/results-screen.tsx:316 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-001 | Bài không tồn tại (`NOT_FOUND`) | "Attempt not found" | Về trang chủ | packages/api/src/routers/scoring.ts:24-26 · web: apps/web/src/features/results/results-screen.tsx:129-135 | ✅ |
| E-002 | Không phải chủ bài (`FORBIDDEN`) | "You are not authorized to access this attempt" | Về trang chủ | packages/api/src/routers/scoring.ts:27-29 · web: apps/web/src/features/results/results-screen.tsx:129-135 | ✅ |
| E-003 | Cứu với bài chưa nộp (`BAD_REQUEST`) | "Only a submitted attempt can be scored" | Nộp bài | packages/api/src/routers/scoring.ts:93-98 · web: không có catalog riêng (câu chung E-039) | ✅ |
| E-004 | Hết lượt thử lại của bài (`BAD_REQUEST`) | "RETRY_LIMIT_EXCEEDED" → web: "Bài thi đã hết số lần thử lại cho phép." | Tạo bài mới | packages/api/src/routers/scoring.ts:151-153 · apps/web/src/features/scoring/use-scoring-job.ts:79,85 | ✅ |
| E-005 | Hết lượt thử lại trong ngày (`TOO_MANY_REQUESTS`) | "DAILY_RETRY_LIMIT_EXCEEDED" → web: "Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai." | Quay lại ngày mai | packages/api/src/routers/scoring.ts:154-160 · apps/web/src/features/scoring/use-scoring-job.ts:77-78,84 | ✅ |
| E-006 | Thử lại sai điều kiện (`BAD_REQUEST`) | "Only a failed or unscored attempt can be retried" | Làm mới trạng thái | packages/api/src/routers/scoring.ts:161-164 · web: câu chung E-039 | ✅ |
| E-007 | Dữ liệu tiêu chí hỏng (`INTERNAL_SERVER_ERROR`) | "Score data is unavailable" | Tải lại | packages/api/src/routers/scoring.ts:200-204 | ✅ |
| E-008 | Nộp không có câu trả lời (`BAD_REQUEST`) | "Attempt has no recorded answers" | Ghi âm trước | packages/api/src/routers/attempt.ts:265-268 | ✅ |
| E-009 | Vượt trần khi nộp (`BAD_REQUEST`) | "ANSWER_COUNT_EXCEEDED" / "TOTAL_AUDIO_LIMIT_EXCEEDED" | ⚠️ chưa resolve (web không có câu riêng) | packages/api/src/routers/attempt.ts:259-262 · catalog web: không tìm thấy | 🟡 |
| E-010 | Bài đã nộp (`BAD_REQUEST`) | "Attempt is already submitted" | Tự phục hồi | packages/api/src/routers/attempt.ts:18,230-232 · apps/web/src/features/scoring/use-scoring-job.ts:70-103 | ✅ |
| E-011 | Bài đã bỏ (`BAD_REQUEST`) | "Attempt is abandoned" | Tạo bài mới | packages/api/src/routers/attempt.ts:233-235 | ✅ |
| E-012..E-031 | Lỗi pipeline lưu ở bản ghi | Xem spec mục 6.2: "Attempt not found", "Attempt has no recorded answers", `Answer {questionKey} has an invalid audio key`, `Attempt answers rejected: {violation}`, "AUDIO_BUCKET binding unavailable", `Audio not found for answer {questionKey}`, "Transcription time budget exceeded; saved progress will resume on next delivery", "Scoring unavailable: OPENAI_API_KEY is not configured", `OpenAI chat completion returned {status}: {detail}`, "OpenAI chat completion returned an empty message", "Grading model returned invalid JSON", `Grading model output failed validation: {issues}`, `Unsupported audio type for grading: "{mimeType}"`, `Expected {runs} grading runs, found {n}`, `Stored run {index} has an invalid payload`, "Scoring timed out", "SCORING_RUNS must be an integer between 1 and 7", "{key} must be a non-negative number" | Tự động / vận hành | packages/api/src/scoring/score-attempt.ts:241,250,254,280,296,299,350,452,458; packages/api/src/scoring/openai-client.ts:47,85-88,97; packages/api/src/scoring/prompt.ts:125,133,216; packages/api/src/scoring/requeue.ts:48; packages/api/src/scoring/config.ts:52,68 | ✅ |
| E-032..E-045 | Chuỗi giao diện | Xem spec mục 6.3 (nguyên văn) | Theo nút | apps/web/src/features/scoring/scoring-screen.tsx:99-262; apps/web/src/features/scoring/use-scoring-job.ts:273,288,320; apps/web/src/features/results/results-screen.tsx:105,121-220 | ✅ |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Số lần xử lý tối đa trước `failed` | Mỗi lần worker nhận việc | `MAX_SCORING_TRIES = 3` | có (packages/api/src/scoring/score-attempt.test.ts:354-380, :710) | packages/api/src/scoring/score-attempt.ts:25 | ✅ |
| Lease nhận việc | Nhận việc / quét | `SCORING_LEASE_MS = 12 * 60 * 1000` | có (packages/api/src/scoring/score-attempt.test.ts:582-600) | packages/api/src/scoring/score-attempt.ts:37 | ✅ |
| Ngân sách phiên âm | Vòng phiên âm | `TRANSCRIPTION_TIME_BUDGET_MS = 240_000` | có (packages/api/src/scoring/score-attempt.test.ts:505) | packages/api/src/scoring/score-attempt.ts:43 | ✅ |
| Ngân sách âm thanh đính kèm | Nạp âm thanh | `MAX_GRADING_AUDIO_BYTES = 8 * 1024 * 1024` | có (packages/api/src/scoring/score-attempt.test.ts:329) | packages/api/src/scoring/score-attempt.ts:50 | ✅ |
| Trễ khi xếp hàng | Nộp / thử lại | `SCORING_ENQUEUE_DELAY_SECONDS = 10` | có (packages/api/src/routers/scoring.test.ts:143, packages/api/src/routers/scoring.test.ts:544) | packages/api/src/scoring/queue.ts:15 | ✅ |
| Timeout gọi AI | Mọi lời gọi | chấm `180_000` ms, phiên âm `60_000` ms | không (test openai-client không khẳng định giá trị timeout) | packages/api/src/scoring/openai-client.ts:42 | ✅ |
| Mã HTTP không thử lại | Lỗi dịch vụ AI | {400, 401, 403, 404} | có (packages/api/src/scoring/openai-client.test.ts:110; packages/api/src/scoring/score-attempt.test.ts:381) | packages/api/src/scoring/score-attempt.ts:118 | ✅ |
| Từ chối âm thanh | Chấm có âm thanh | 413 hoặc 4xx khớp `/audio\|input_audio\|format\|modalit\|content blocks? (are\|is) expected/i` | có (packages/api/src/scoring/openai-client.test.ts:83) | packages/api/src/scoring/score-attempt.ts:99-109 | ✅ |
| Quota thử lại bài | Thử lại | `manualRetries < 1` | có (packages/api/src/routers/scoring.test.ts:278) | packages/api/src/routers/scoring.ts:73,123,152 | ✅ |
| Quota thử lại ngày | Thử lại | đếm nhật ký từ 00:00 UTC+7 `< 3` | có (packages/api/src/routers/scoring.test.ts:302,324,347) | packages/api/src/routers/scoring.ts:119, packages/api/src/scoring/retry-limits.ts:2-17 | ✅ |
| Cửa sổ kẹt của bộ quét | Cron 5 phút | `STALE_SCORE_AFTER_MS = SCORING_LEASE_MS` (12 phút) | có (packages/api/src/scoring/requeue.test.ts:36) | packages/api/src/scoring/requeue.ts:14 | ✅ |
| Lịch quét | Cron | `*/5 * * * *` (quét), `0 * * * *` (hằng giờ) | có (apps/server/src/scheduled.test.ts:28-60) | apps/server/src/scheduled.ts:8,14 | ✅ |
| Giao lại hàng đợi | Consumer | `maxRetries: 3`, `retryDelay: 30`, `batchSize: 1`, `maxConcurrency: 2` | có một phần (apps/server/src/queue.test.ts, dùng giá trị 2) | packages/infra/alchemy.run.ts:85-88 | ✅ |
| Làm tròn IELTS | Tổng hợp | ngưỡng 0.25 / 0.75 | có (packages/api/src/scoring/aggregate.test.ts:22-36) | packages/api/src/scoring/aggregate.ts:34-46 | ✅ |
| Polling web | Màn chấm | 2500 / 5000 / 10000 ms; mốc 60 s và 180 s; chậm sau 600000 ms; 3 lỗi; 4 lần not_scored | có (apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:420-470) | apps/web/src/features/scoring/use-scoring-job.ts:8-25 | ✅ |
| Chuyển trạng thái bản ghi chấm | Xem srs/scoring-results-reverse-states.md | queued → processing → done/failed/queued | có | packages/api/src/scoring/score-attempt.ts:156-229; packages/api/src/routers/scoring.ts:125-142; packages/api/src/scoring/requeue.ts:45-58 | ✅ |
| Lý do chọn các hằng số trên | — | — | — | không có trong code ngoài vài comment | 🟡 |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| attempt_score | status, overall, criteria_json, one_liner, model, tries, manual_retries, last_error, cost_usd, created_at, updated_at, scored_at | 1-1 attempt (khóa chính = attempt_id), N-1 user | packages/db/src/schema/score.ts:11-46 |
| score_run | run_index, fc, lr, gra, p, overall, payload_json, model, audio_used, input_tokens, output_tokens, cost_usd | N-1 attempt; duy nhất (attempt, run_index) | packages/db/src/schema/score.ts:48-85 |
| scoring_retry_log | user_id, attempt_id, created_at | N-1 user, N-1 attempt | packages/db/src/schema/score.ts:87-109 |
| attempt (tham chiếu) | status (`in_progress`/`submitted`/`abandoned`), mode, topic_id, user_id | chủ của attempt_score | packages/api/src/scoring/score-attempt.ts:239; packages/api/src/scoring/types.ts:37 |
| attempt_answer (tham chiếu) | question_key, question_text, part_number, order_index, audio_key, mime_type, size_bytes, duration_ms, transcript | N-1 attempt | packages/api/src/scoring/score-attempt.ts:244-248; packages/api/src/routers/scoring.ts:206-216 |
| forecast_topic (tham chiếu) | id, title, part, questions | 0-1 từ attempt | packages/api/src/scoring/score-attempt.ts:264-277 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| Web (màn chấm) | API (nộp bài) | gọi tRPC qua HTTP | F1 nộp bài | apps/web/src/features/scoring/use-scoring-job.ts:175 · packages/api/src/routers/attempt.ts:229 |
| API (nộp bài / thử lại) | Cloudflare Queue | gửi thông điệp `{ attemptId }`, trễ 10 giây | F1, F5 | packages/api/src/routers/attempt.ts:292-296 · packages/api/src/scoring/queue.ts:40-42 |
| Cloudflare Queue | Worker consumer | giao thông điệp (tối đa 4 lần giao, trễ 30 giây) | F2 | packages/infra/alchemy.run.ts:81-89 · apps/server/src/queue.ts:37 |
| Worker consumer | R2 (kho âm thanh) | đọc tệp ghi âm | F2 | apps/server/src/queue.ts:26 · packages/api/src/scoring/score-attempt.ts:294-303 |
| Worker consumer | Dịch vụ AI (phiên âm + chấm) | gọi HTTPS | F2 | packages/api/src/scoring/score-attempt.ts:353, :400, :412 · packages/api/src/scoring/openai-client.ts:3, :73-81 |
| Worker consumer | D1 (cơ sở dữ liệu) | đọc/ghi bản ghi chấm, lần chấm, phiên âm | F2 | packages/api/src/scoring/score-attempt.ts:160-180, :357, :416-433, :479-493 |
| Cron 5 phút | D1 + Queue | đọc bản ghi kẹt, gửi lại, ghi `queued`/`failed` | F3 | apps/server/src/scheduled.ts:25-29 · packages/api/src/scoring/requeue.ts:25-61 |
| Web (polling) | API (trạng thái) | gọi tRPC giãn dần | F4 | apps/web/src/features/scoring/use-scoring-job.ts:212 · packages/api/src/routers/scoring.ts:58 |
| Web (màn kết quả) | API (trạng thái + kết quả) | gọi song song | F6 | apps/web/src/features/results/use-scored-result.ts:42-45 · packages/api/src/routers/scoring.ts:58,179 |
| Màn kết quả | Màn chấm | `set(scoringAttempt)` rồi chuyển route | F5 | apps/web/src/features/results/results-screen.tsx:93-96 · apps/web/src/features/scoring/scoring-screen.tsx:29 |
| Màn chấm | Màn kết quả | chuyển route (thay thế lịch sử) khi `done` | F4 → F6 | apps/web/src/features/scoring/scoring-screen.tsx:46-49 · apps/web/src/routes/_proto/app/history.$attemptId.tsx:11 |
| Màn kết quả | Hộp thoại thanh toán (billing) | gọi mở hộp thoại | UC-08 | apps/web/src/features/results/components/soft-paywall.tsx:17 |
| Màn kết quả | Feature khiếu nại điểm | gọi tRPC `dispute.get` (ngoài scope) | — | apps/web/src/features/results/results-screen.tsx:75-90 |
| Privacy (xuất/xóa) | D1 (bảng điểm) | đọc/xóa theo người dùng | ngoài scope | packages/api/src/data-registry.ts:124-157, :236-243 (xóa cả ba bảng; xuất bản ghi điểm một phần cột và nhật ký thử lại; lần chấm xuất rỗng) |

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Lý do chọn 3 lần chấm, trung vị, mô hình mặc định, 1 lần thử lại/bài, 3 lần/ngày, mốc 10 phút — *(code câm; OQ-1, OQ-2, OQ-9)*
* Giá trị `VITE_FEATURE_SCORING` ở production — *(grep `VITE_FEATURE_SCORING` toàn repo trừ node_modules; dotenv web bị chặn · loại: code-câm)*
* Nhánh "not_scorable" của web — *(máy chủ luôn trả true tại packages/api/src/routers/scoring.ts:67,172 · loại: dead-code-nghi, OQ-6)*
* Dữ liệu prototype trong màn kết quả (band 6.5, khoảng 6.0–7.0, ba lần chấm giả, phát lại giả lập, đánh dấu lỗi) — *(apps/web/src/features/results/results-screen.tsx:253-257; apps/web/src/features/results/review-data.ts:1-7 · loại: dead-code-nghi / dữ liệu giả, OQ-5)*
* Soft paywall không chạm tới với kết quả thật — *(results-screen.tsx:258-259 · loại: dead-code-nghi cho đường thật, OQ-4)*
* Ba bước tiến trình không gắn trạng thái — *(grep `SCORING_STEPS` apps/web/src: chỉ scoring-screen.tsx · loại: code-câm, OQ-8)*
* "Luyện lại câu yếu nhất" không có logic — *(grep `weakest|yếu nhất` apps/web/src · loại: dead-code-nghi, OQ-16)*
* Không có màn quản trị/giám sát bài chấm lỗi, không có thông báo khi xong — *(negative-search ở reverse-gaps.md · loại: code-câm, OQ-11, OQ-12)*
* Không có `it.skip`/`it.todo` trong test của feature — *(grep `it.skip|it.todo|describe.skip|xit(` trên các thư mục feature)*
