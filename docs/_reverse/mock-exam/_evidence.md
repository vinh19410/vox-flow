# mock-exam — Evidence base (truy vết code → luồng)

> Đây là nơi duy nhất chứa tên route/hàm/bảng. Cột "Nguồn" dùng đường dẫn repo đầy đủ.

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| tRPC mutation | `attempt.start` | Phòng thi (`/exam`) khi mở | Phiên đăng nhập (protectedProcedure) | Tạo lượt thi, kiểm cổng pilot | packages/api/src/routers/attempt.ts:21-113 |
| tRPC query | `attempt.getActive` | Phòng thi khi mở | Phiên đăng nhập | Lấy lượt thi "đang làm" mới nhất + các câu trả lời | packages/api/src/routers/attempt.ts:115-142 |
| tRPC mutation | `attempt.submit` | Hộp thoại kiểm tra trước khi nộp | Phiên đăng nhập + chủ lượt thi | Nộp bài, tạo dòng điểm, đẩy hàng đợi | packages/api/src/routers/attempt.ts:203-304 |
| tRPC mutation | `attempt.getFollowUp` | **Không có màn gọi** (OQ-2) | Phiên đăng nhập + chủ lượt thi | Sinh câu hỏi nối tiếp bằng AI | packages/api/src/routers/attempt.ts:144-201 |
| HTTP POST | `/api/attempts/:attemptId/answers/:questionKey/audio` | Phòng thi (tải sau khi dừng ghi, flush trước nộp) | Cookie phiên (`credentials: include`) + chủ lượt thi | Tải audio một câu | apps/server/src/index.ts:79-299; apps/web/src/features/exam/answer-uploads.ts:143-153, 187-193 |
| HTTP GET | `/api/attempts/:attemptId/answers/:answerId/audio` | Màn nghe lại (ngoài phạm vi) | Cookie phiên; chủ hoặc admin có share consent | Phát audio, hỗ trợ Range | apps/server/src/index.ts:301-394 |
| Route web | `/app/select` | Menu | requireOnboarded (nhánh cha) | Chọn bài thi | apps/web/src/routes/_proto/app/select.tsx:5-7; apps/web/src/routes/_proto/app/route.tsx:6-9 |
| Route web | `/app/select/setup` | Thẻ chế độ (mobile) | requireOnboarded | Màn thiết lập | apps/web/src/routes/_proto/app/select_.setup.tsx:5-7 |
| Route web | `/exam` | Nút "Đồng ý ghi âm & bắt đầu" | requireOnboarded | Phòng thi | apps/web/src/routes/_proto/exam.tsx:5-8 |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| start.mode | enum, mặc định | "full" \| "part1" \| "part2" \| "part3", default "full" | Lỗi kiểm tra đầu vào (BAD_REQUEST) | packages/api/src/routers/attempt.ts:25 | ✅ |
| start.topicId / questionKey | regex | `^[a-zA-Z0-9_-]+$` | "Invalid topicId format" / "Invalid questionKey format" | packages/api/src/routers/attempt.ts:26-27; packages/api/src/audio.ts:15 | ✅ |
| start refine | questionKey cần topicId | — | "questionKey requires topicId" | packages/api/src/routers/attempt.ts:29-36 | ✅ |
| getFollowUp.questionKey | max + regex | max 128 | "Invalid questionKey format" | packages/api/src/routers/attempt.ts:148 | ✅ |
| getFollowUp.part | int | 1..3 default 1 | BAD_REQUEST | packages/api/src/routers/attempt.ts:149 | ✅ |
| getFollowUp.candidateTranscript | max | 2000 ký tự | BAD_REQUEST | packages/api/src/routers/attempt.ts:150 | ✅ |
| Kết quả follow-up | questionText 5..300, triggerPhrase 1..200 | — | Rơi về câu canned | packages/api/src/exam/follow-up.ts:4-12 | ✅ |
| Văn bản follow-up trả client | bỏ thẻ phân tách, cắt 300 | `.slice(0, 300)` | — | packages/api/src/routers/attempt.ts:197-198 | ✅ |
| upload.questionKey | regex | `^[a-zA-Z0-9_-]+$` | 400 "Invalid question key" | apps/server/src/index.ts:89-91 | ✅ |
| upload Content-Length | bắt buộc, số, >0, ≤ 10×1024×1024 | 10485760 | 411/400/400/413 | apps/server/src/index.ts:94-107 | ✅ |
| upload Content-Type | thuộc 5 loại, bỏ phần sau ";" | audio/webm, audio/mp4, audio/ogg, audio/wav, audio/mpeg | 415 "Unsupported Media Type" | apps/server/src/index.ts:62-68, 110-118 | ✅ |
| upload.part | số nguyên | 1..3 default 1 | 400 "Invalid query parameters" | apps/server/src/index.ts:72 | ✅ |
| upload.order | số nguyên | 0..100 default 0 | 400 | apps/server/src/index.ts:73 | ✅ |
| upload.durationMs | số nguyên | 0..3600000 default 0 | 400 | apps/server/src/index.ts:74 | ✅ |
| upload.questionText | chuỗi | max 2000, default "" | 400 | apps/server/src/index.ts:75 | ✅ |
| upload.generation | số nguyên | 0..MAX_SAFE_INTEGER default 0; trần Date.now()+24h | 400 / 400 "Generation too far in the future" | apps/server/src/index.ts:76, 132-134 | ✅ |
| upload body | không rỗng | — | 400 "Empty payload body" | apps/server/src/index.ts:136-138 | ✅ |
| Khóa file lưu | `users/<userId>/attempts/<attemptId>/<questionKey>[.<generation>].<ext>` | — | Ném lỗi nếu questionKey sai | packages/api/src/audio.ts:71-84 | ✅ |
| Tên file hợp lệ | `^[a-zA-Z0-9_-]+(\.\d+)?\.(webm|mp4|ogg|wav|mp3)$` | — | 403 | packages/api/src/audio.ts:17, 94-108 | ✅ |
| submit.attemptId | chuỗi | — | NOT_FOUND nếu không có | packages/api/src/routers/attempt.ts:205-221 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-mock-exam-001 | Cổng pilot đóng | FORBIDDEN: "Mock exam is currently restricted to pilot candidates." | Chờ vào danh sách | throw packages/api/src/routers/attempt.ts:52-57 · test packages/api/src/routers/attempt.test.ts:19-52 | ✅ |
| E-mock-exam-002 | Chủ đề không published | BAD_REQUEST: "Unknown or unpublished forecast topic" | Chọn chủ đề khác | packages/api/src/routers/attempt.ts:71-76 | ✅ |
| E-mock-exam-003 | Khóa không thuộc chủ đề | BAD_REQUEST: "Invalid questionKey for topic" | Chọn câu khác | packages/api/src/routers/attempt.ts:79-84 | ✅ |
| E-mock-exam-004 | Input sai | "Invalid topicId format", "Invalid questionKey format", "questionKey requires topicId" | Sửa dữ liệu | packages/api/src/routers/attempt.ts:26-36 | ✅ |
| E-mock-exam-005 | Không có lượt thi | NOT_FOUND: "Attempt not found" | — | packages/api/src/routers/attempt.ts:160-165, 216-221 | ✅ |
| E-mock-exam-006 | Không phải chủ | FORBIDDEN: "You are not authorized to submit this attempt" / "You are not authorized to access this attempt" | — | packages/api/src/routers/attempt.ts:167-172, 223-228 | ✅ |
| E-mock-exam-007 | Đã nộp | BAD_REQUEST: "Attempt is already submitted" | Client coi là thành công | packages/api/src/routers/attempt.ts:18, 230-232 · apps/web/src/features/scoring/use-scoring-job.ts:94-103 | ✅ |
| E-mock-exam-008 | Trạng thái khác | BAD_REQUEST: "Attempt is abandoned" | — | packages/api/src/routers/attempt.ts:233-235 | 🟡 |
| E-mock-exam-009 | Vượt số câu | BAD_REQUEST: "ANSWER_COUNT_EXCEEDED" | — | packages/api/src/scoring/answer-limits.ts:49-51 · packages/api/src/routers/attempt.ts:259-262 | ✅ |
| E-mock-exam-010 | Vượt dung lượng | BAD_REQUEST: "TOTAL_AUDIO_LIMIT_EXCEEDED" | — | packages/api/src/scoring/answer-limits.ts:52-55 | ✅ |
| E-mock-exam-011 | Không có câu nào | BAD_REQUEST: "Attempt has no recorded answers" | — | packages/api/src/routers/attempt.ts:266-268 | ✅ |
| E-mock-exam-012 | Follow-up khi đã đóng | BAD_REQUEST: "Cannot generate a follow-up for a finalized attempt" | — | packages/api/src/routers/attempt.ts:176-181 | ✅ |
| E-mock-exam-014..031 | Route tải lên | Xem bảng Mục 6 của spec; wording nguyên văn nằm trong JSON `{"error": …}` | — | apps/server/src/index.ts:83, 90, 96, 99, 103, 106, 112, 116, 123, 133, 137, 149, 152, 155, 169, 185, 192, 200, 206, 216, 223, 235, 262 | ✅ |
| E-mock-exam-032 | Tải về | "Unauthorized", "Forbidden", "Not found", "Audio not found", "Storage unavailable" | — | apps/server/src/index.ts:305, 319, 343, 358, 362, 367; packages/api/src/audio.ts:151, 155 | ✅ |
| E-mock-exam-033 | Chưa lên đủ | "Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại." | Thử lại | apps/web/src/features/exam/exam-screen.tsx:20, 116-120 | ✅ |
| E-mock-exam-034 | Nộp lỗi BAD_REQUEST | "Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi." | Thử lại | apps/web/src/features/exam/exam-screen.tsx:21, 75; apps/web/src/features/scoring/use-scoring-job.ts:106-110 | ✅ |
| E-mock-exam-035 | Nộp lỗi khác | "Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại." | Thử lại | apps/web/src/features/exam/exam-screen.tsx:22, 75 | ✅ |
| E-mock-exam-036 | Kho thiết bị không đọc được | "Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận." | "Thử lại" / "Vẫn nộp" | apps/web/src/features/exam/components/pre-submit-modal.tsx:31-32 | ✅ |
| E-mock-exam-037 | Mic bị từ chối | ⚠️ chưa resolve (không có wording) — mã nội bộ `denied` / `unsupported` của bộ ghi nhưng không hiển thị | — | apps/web/src/hooks/use-recorder.ts:59-63, 88-95 | 🟡 |
| E-mock-exam-038 | Tải lên một câu lỗi | Console: `Answer upload for ${questionKey} returned ${status}` / `failed:` | Tự thử lại khi nộp | apps/web/src/features/exam/answer-uploads.ts:197-206 | ✅ |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Cổng pilot | start | LAUNCH_OPEN = "true" hoặc email trong LAUNCH_ALLOWED_EMAILS (tách bằng ",", trim, lowercase) | có (packages/api/src/routers/attempt.test.ts:19, 54, 99) | packages/api/src/routers/attempt.ts:43-57 | ✅ |
| Consent mặc định | start | inHistory = true, calibrationGranted = false | không (hằng) | packages/api/src/exam/consent.ts:12-17 | ✅ |
| Bộ khóa mock theo mode | upload, submit | full 8, part1 4, part2 1, part3 3, lạ 0 | có (packages/api/src/scoring/mock-exam-bank.test.ts:8-31, 101-110) | packages/api/src/scoring/mock-exam-bank.ts:73-95 | ✅ |
| Cap số câu | upload, submit | SINGLE_QUESTION_CAP 2, TOPIC_ANSWER_CAP 18, TOPIC_LESS_CAP 20 | có (packages/api/src/scoring/mock-exam-bank.test.ts:101-122; apps/server/src/index.test.ts:518-543, 565-588) | packages/api/src/scoring/answer-limits.ts:5-36 | ✅ |
| Tổng audio | upload, submit | MAX_TOTAL_AUDIO_BYTES = 35×1024×1024 | có (apps/server/src/index.test.ts:616-634; packages/api/src/routers/attempt.test.ts:613-654) | packages/api/src/scoring/forecast-keys.ts:98; apps/server/src/index.ts:210-217 | ✅ |
| File tối đa | upload | 10×1024×1024 (đo theo Content-Length) | có (apps/server/src/index.test.ts:218-230) | apps/server/src/index.ts:105-107 | ✅ |
| Generation | upload | đặt ≥ stored thì thắng; < stored: 409; trần now+24h | có (packages/api/src/answers.test.ts:50-134; apps/server/src/index.test.ts:545-563, 670-754; apps/server/src/index.integration.test.ts:105-170) | packages/api/src/answers.ts:8-36; apps/server/src/index.ts:127-134, 168-170, 253-263 | ✅ |
| Dọn blob cũ | upload thắng | xóa key cùng câu có gen nhỏ hơn thắng + key trần; giữ gen ≥ thắng | có (apps/server/src/index.test.ts:780-811) | apps/server/src/index.ts:265-291 | ✅ |
| Dung lượng thực | upload | size do R2 trả; 0/thiếu → xóa + 503 | có (apps/server/src/index.test.ts:636-668) | apps/server/src/index.ts:229-237 | ✅ |
| Nộp nguyên tử | submit | batch(update attempt, insert attempt_score ... onConflictDoNothing) | không (chỉ gián tiếp, packages/api/src/routers/attempt.test.ts:142-199) | packages/api/src/routers/attempt.ts:270-296 | ✅ |
| Độ trễ hàng đợi | submit | SCORING_ENQUEUE_DELAY_SECONDS = 10 | không | packages/api/src/scoring/queue.ts:15; packages/api/src/routers/attempt.ts:293-295 | ✅ |
| Hết thời gian ghi | phòng thi | P1 40 s, P2 120 s, P3 60 s | không | apps/web/src/features/exam/use-exam-session.ts:186, 312-314 | ✅ |
| Chuẩn bị Part 2 | phòng thi | 60 s (khởi tạo prepT=60), tự ghi khi ≤ 0 | không | apps/web/src/features/exam/use-exam-session.ts:63, 225-229, 316-318 | ✅ |
| Hiện chữ | phòng thi | 28 ms/ký tự; chuyển sau length+12 nhịp | không | apps/web/src/features/exam/use-exam-session.ts:198-206 | ✅ |
| Tốc độ đọc | phòng thi | rate 0.95; lang en-GB/en-AU/en-US | không | apps/web/src/features/exam/use-exam-session.ts:38, 194 | ✅ |
| Số từ ước lượng | dừng ghi | WPS 2.6; MIN_WORDS {1:12, 2:90, 3:22} | một phần (apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx:9-40: không hiển thị số từ) | apps/web/src/features/exam/use-exam-session.ts:16, 184-185; apps/web/src/features/exam/data.ts:63 | ✅ |
| Đồng bộ lượt thi | khởi động | ATTEMPT_SYNC_TIMEOUT_MS 15000 | có (apps/web/src/features/exam/__tests__/exam-submit.test.tsx:724-793) | apps/web/src/features/exam/use-exam-session.ts:15, 128-130 | ✅ |
| Retry flush | nộp | UPLOAD_RETRIES 2 (tổng lần gửi), UPLOAD_RETRY_DELAY_MS 1500 × (n-1), timeout 120000 | có (apps/web/src/features/exam/__tests__/answer-uploads.test.ts:133-147) | apps/web/src/features/exam/answer-uploads.ts:6-10, 316-336 | ✅ |
| Phiên bản client | ghi âm | Math.max(Date.now(), last+1) | có (apps/web/src/features/exam/__tests__/answer-uploads.test.ts:77-81) | apps/web/src/features/exam/answer-uploads.ts:63-77 | ✅ |
| Kho thiết bị | ghi âm | DB "vox_flow_exam_db" v1, store "audio_blobs", keyPath [attemptId, questionKey], index attemptId | có (apps/web/src/features/exam/__tests__/storage.test.ts:36-86) | apps/web/src/features/exam/storage.ts:17-50 | ✅ |
| Định dạng ghi âm | ghi âm | thứ tự opus-webm, webm, mp4, mặc định webm; timeslice 250 | không | apps/web/src/hooks/use-recorder.ts:28-42, 84 | ✅ |
| Ánh xạ mode client→server | khởi tạo | p1→part1, p2→part2, p3→part3 | có (apps/web/src/features/exam/__tests__/mock-keys-parity.test.ts:9-14) | apps/web/src/features/exam/use-exam-session.ts:82-101 | ✅ |
| Chuẩn hóa khi tái lập | nối lại lượt thi | khớp: !topicId && !questionKey && mode == examMode | có (apps/web/src/features/exam/__tests__/exam-submit.test.tsx:584-607) | apps/web/src/features/exam/use-exam-session.ts:143-145 | ✅ |
| Thoát | thoát | không gọi máy chủ; target = "forecast" nếu practice, "select" nếu không | có (apps/web/src/features/exam/__tests__/exam-submit.test.tsx:400-425) | apps/web/src/features/exam/exam-screen.tsx:178-184 | ✅ |
| Quyền nghe audio | tải về | owner hoặc (admin && shareConsent === true) | có (packages/api/src/auth-utils.test.ts) | packages/api/src/auth-utils.ts:23-37 | ✅ |
| Follow-up AI | getFollowUp | model "gpt-4o-mini", temperature 0.7, timeout mặc định 4000 | một phần (packages/api/src/exam/follow-up.test.ts:5-86) | packages/api/src/exam/follow-up.ts:27, 55-68 | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| attempt (Lượt thi) | id, userId, mode, status, inHistory, calibrationGranted, startedAt, submittedAt, topicId, questionKey | N-1 user (cascade); 1-N attempt_answer; 1-1 attempt_score | packages/db/src/schema/attempt.ts:5-30 |
| attempt_answer (Câu trả lời) | attemptId, questionKey, questionText, partNumber, orderIndex, generation, audioKey, durationMs, mimeType, sizeBytes, transcript, createdAt; unique (attemptId, questionKey) | N-1 attempt (cascade) | packages/db/src/schema/attempt.ts:32-60 |
| attempt_score (bàn giao) | attemptId (PK), userId, status queued/processing/done/failed, overall, ... | 1-1 attempt | packages/db/src/schema/score.ts:11-33 |
| forecast_topic (chạm forecast) | id, title, quarter, part, questions (JSON), status draft/published/archived | tham chiếu bằng topicId (không FK) | packages/db/src/schema/forecast.ts:6-20 |
| audio_blobs (IndexedDB) | attemptId, questionKey, blob, durationMs, mimeType, part, order, questionText, generation, createdAt | Phía client | apps/web/src/features/exam/storage.ts:3-15 |
| Ngân hàng đề (hằng số) | id, part, text, cue, followUp | Chia sẻ web/server | packages/api/src/scoring/mock-exam-bank.ts:26-70 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| Phòng thi (trình duyệt) | Máy chủ API (tRPC) | gọi HTTP: getActive, start, submit | Khởi tạo / nộp bài | apps/web/src/features/exam/use-exam-session.ts:132-168 · packages/api/src/routers/attempt.ts:21-142 |
| Phòng thi (trình duyệt) | Máy chủ Hono → R2 (kho audio) → D1 | gọi HTTP POST, ghi object, upsert dòng | Tải audio lên | apps/web/src/features/exam/answer-uploads.ts:187-193 · apps/server/src/index.ts:226-251 |
| Máy chủ API submit | Hàng đợi chấm điểm (Cloudflare Queue) | ghi D1 batch rồi gửi message | Nộp → chấm điểm (scoring-results) | packages/api/src/routers/attempt.ts:284-296 · packages/api/src/scoring/queue.ts:31-45 |
| Máy chủ API getFollowUp | Dịch vụ LLM ngoài (HTTP) | gọi HTTP POST | AI follow-up (không có caller) | packages/api/src/routers/attempt.ts:183-187 · packages/api/src/exam/follow-up.ts:55-68 |
| Phòng thi | Màn chấm điểm | đặt trạng thái (scoringAttempt) + chuyển trang | Nộp → xem kết quả | apps/web/src/features/exam/exam-screen.tsx:88-90 |
| Tải audio về | D1 (tranh chấp) + R2 | đọc | Nghe lại / kháng nghị | apps/server/src/index.ts:322-340, 370-373 |

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* AI follow-up router không có caller ở client — *(negative-search N-1 ở `reverse-gaps.md`; loại: dead-code-nghi)*
* Pha `examiner-thinking` không có chỗ đặt — *(N-1; dead-code-nghi)*
* Trạng thái `abandoned` không có chỗ ghi — *(N-2; dead-code-nghi)*
* Mic bị từ chối không có UI — *(N-5; code-câm)*
* Hàm chép lời "lenient" không caller — *(N-3; dead-code-nghi)*
* Không có test cho đồng hồ ghi âm, chuẩn bị Part 2, nghe thử giọng, ghi nhớ chế độ/giọng, nhánh 404/400/503 của route tải lên — *(grep tên test trong apps/web/src/features/exam/__tests__, apps/server/src/index.test.ts; loại: test-thiếu)*
* Đánh giá "ý đồ" của mọi hằng số — *(loại: code-câm; OQ-9)*
