# Backend: scoring pipeline cho luyện forecast (beta)

Plan: `plans/261110-0252-scoring-pipeline-forecast/plan.md`, Phase 1. Tracking: #90.

## Kết quả
- Pipeline `scoreAttempt` (`packages/api/src/scoring/score-attempt.ts`): nhận hàng `queued`/`processing`, tăng `tries`, lấy audio từ R2, chạy whisper cho các câu chưa có transcript (dùng `transcribeAudioStrict`, không bao giờ sinh text giả), rồi chấm `SCORING_RUNS` lần song song. Mỗi lần gửi audio (`input_audio`, format suy từ mimeType) kèm transcript. Nếu API từ chối audio (4xx nhắc tới audio/format/input_audio/modality, hoặc 413) thì lần đó chạy lại chỉ với transcript và ghi `audio_used=false`.
- Output được kiểm bằng zod (`response_format: json_object`). Band được làm tròn về bậc 0.5. Câu trích không khớp nguyên văn transcript của câu được trích (so khớp không phân biệt hoa thường và chuẩn hoá khoảng trắng) bị loại bỏ.
- Mỗi run được ghi bằng `onConflictDoNothing` trên (attempt_id, run_index). Lần gọi lại chỉ chấm các run còn thiếu, và gọi trên hàng `done` là no-op.
- Cách tổng hợp nằm trong `aggregate.ts`: band của mỗi tiêu chí là trung vị các run. Band tổng là trung bình 4 trung vị, làm tròn theo IELTS (.25 lên .5, .75 lên số nguyên kế tiếp).
- Lỗi tạm thời được ném ra để queue thử lại. Khi đạt `tries = 3`, hoặc gặp lỗi không thể thử lại (không có câu trả lời, audio key sai), hàng chuyển sang `failed` với `last_error` đã che key.
- Chi phí chỉ được tính khi đặt cả `SCORING_PRICE_INPUT_PER_1M` và `SCORING_PRICE_OUTPUT_PER_1M`. Chi phí whisper không nằm trong `cost_usd`.
- `attempt.submit`: nếu lượt có topicId thì chèn `attempt_score` (queued) và chỉ enqueue khi hàng thực sự được tạo. Thiếu binding hoặc gửi lỗi thì chỉ ghi log, không làm hỏng submit.
- Router `scoring`: `status`, `retry`, `getResult` (chỉ chủ bài được gọi). `retry` cho phép từ `failed`; theo yêu cầu bổ sung của orchestrator, cũng cho phép khi chưa có hàng nếu lượt có topicId và `status=submitted`. Các trường hợp khác trả BAD_REQUEST.
- Server: handler `queue` (`apps/server/src/queue.ts`) ack khi xong, retry khi lỗi, và đánh dấu failed ở lần giao cuối. Cron giờ gọi thêm `requeueStaleScores`: hàng `queued`/`processing` không cập nhật quá 15 phút và `tries < 3` được enqueue lại; hàng đã hết lượt thử thì chuyển `failed`.
- Infra: thêm `Cloudflare.Queues.Queue("scoring-queue")`, bind vào worker server dưới tên `SCORING_QUEUE`, và tạo `Cloudflare.Queues.Consumer` (batchSize 1, maxRetries 3, retryDelay 30). Thêm env `SCORING_MODEL`/`SCORING_RUNS`/giá token kèm giá trị mặc định. Workflow deploy có thêm `SCORING_MODEL`.
- Data registry: thêm export/erase cho `attempt_score` và `score_run`.

## Kiểm chứng
- `pnpm --filter @vox-flow/api test`: 21 file, 173 test pass.
- `pnpm --filter server test`: 2 file, 22 test pass.
- `pnpm check-types` (root): 7/7 task pass.

## Chưa kiểm chứng / lưu ý
- API Queue của `@alchemy.run/cloudflare` 2.0.0-beta.85 được xác định bằng cách cho tsc dò kiểu, vì hook chặn đọc `node_modules`. Typecheck của Stack đi qua. Chưa chạy `alchemy dev` hay deploy, nên chưa biết queue local trên miniflare có hoạt động không. Đơn vị của `retryDelay` được giả định là giây, theo API Cloudflare.
- Hook privacy chặn đọc `apps/server/.env.schema` nên tôi không cập nhật file này. Kiểu env của server suy ra từ `alchemy.run.ts` (`InferEnv`) nên vẫn đúng.
- Chưa gọi thật tới `gpt-6-luna`. Prompt và việc model nhận `input_audio` với webm/mp4/ogg cần kiểm trên beta; nếu bị từ chối thì pipeline tự lùi về chỉ dùng transcript.
- Request mang audio base64 có thể nặng khi lượt có nhiều câu dài. Body chỉ được serialise một lần rồi dùng chung cho các run.
