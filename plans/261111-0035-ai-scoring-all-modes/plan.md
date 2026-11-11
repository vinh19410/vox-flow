---
title: "Mở chấm điểm AI cho tất cả các chế độ thi thử và luyện đề Forecast"
description: "Gỡ bỏ rào cản topicId !== null ở 4 điểm server và nhánh nộp bài mock trên web, chia sẻ ngân hàng câu hỏi mock chuẩn kèm allowlist/trần câu hỏi theo từng mode để chấm điểm AI cho cả Full Test, Part 1, Part 2, Part 3 và Forecast."
status: completed
priority: P1
effort: 4h
branch: feat/ai-scoring-all-modes
issue: 130
tags: [feature, api, backend, frontend, advice]
blockedBy: []
blocks: []
created: 2026-11-11
---

# Mở chấm điểm AI cho tất cả các chế độ (Forecast & Thi thử)

> **Handover Contract (`--advice` + `--tdd`):** Plan này sẵn sàng bàn giao cho executor model cấp thấp hơn (Sonnet / Flash). Mọi file `phase-0N-*.md` đều phân rã thành các Task tuần tự có `Goal`, `Target files and symbols`, `Steps`, `Success criteria`, điều kiện `Verify` so sánh cơ học (kể cả kỳ vọng đỏ ở pha TDD Red), và khối `## Failure Protocol` dừng ngay khi Verify không đạt để xin ý kiến `kongming`.

## Outcome

Mọi lượt làm bài có ghi âm trên máy chủ — bao gồm cả **Thi thử (`Full Test`, `Part 1`, `Part 2`, `Part 3`)** lẫn **Luyện đề Forecast (cả chủ đề và từng câu lẻ)** — đều tự động đưa vào hàng đợi chấm điểm AI (`Whisper` + 3 lượt `gpt-6-luna` lấy trung vị), hiển thị tiến trình chấm thời gian thực và trả kết quả band tổng, 4 tiêu chí, bằng chứng nguyên văn kèm nhãn chế độ thi chính xác.

## Kiến trúc & Quyết định thiết kế (chốt qua Kongming Checkpoint #1 + Red-Team 2 lens)

1. **Gỡ bỏ đồng bộ 4 cổng `topicId !== null` phía Server (Atomic Gate Removal):**
   - `packages/api/src/routers/attempt.ts` (`attempt.submit`): bỏ nhánh `if (currentAttempt.topicId)` — mọi lượt nộp bài hợp lệ đều chạy chung một D1 batch nguyên tử (`markSubmitted` + `insert(attemptScore).values({ status: "queued" }).onConflictDoNothing()`) và gọi `enqueueScoring` (delay 10s). Trước batch, từ chối `400 BAD_REQUEST` (`"Attempt has no recorded answers"`) nếu snapshot câu trả lời rỗng (path `submitAnyway` khi chưa tải lên được câu nào), để không sinh dòng điểm chết bấm lại hoài.
   - `packages/api/src/routers/scoring.ts` (`scoring.status`, `scoring.retry`, `scoring.getResult`): giữ trường `scorable: true` trên `ScoreStatusResult` để tương thích ngược trong lúc triển khai, bổ sung `attemptStatus: owned.status`; mở rộng đường cứu hộ (`rescue path`, miễn trừ hạn ngạch retry thủ công) cho mọi `attempt` có `status === "submitted"` chưa có dòng `attempt_score` (bài cũ trước cutover có quá trần câu trả lời sẽ fail rõ ràng ở worker với `lastError` chứa `ANSWER_COUNT_EXCEEDED` — UI đã có đúng trạng thái "Chấm điểm chưa thành công" cho trường hợp này); trả thêm `mode: owned.mode` trong `ScoringResult`.
   - `packages/api/src/scoring/score-attempt.ts` (`runPipeline`): bỏ `if (!attemptRow.topicId) throw NonRetriableScoringError(...)`; chỉ truy vấn `forecastTopic` khi `attemptRow.topicId !== null`.

2. **Ngân hàng câu hỏi Thi thử chuẩn phía Server (`#93`) & Giới hạn theo Mode (`#91`):**
   - Tạo module không phụ thuộc DB/runtime `packages/api/src/scoring/mock-exam-bank.ts` chứa bộ câu hỏi gốc `MOCK_EXAM_PROMPTS` (`p1-1`, `p1-1-f`, `p1-2`, `p1-3`, `p2-1` kèm `cue`, `p3-1`, `p3-1-f`, `p3-2`), hàm `getValidMockQuestionKeys(mode)` (`full`: 8, `part1`: 4, `part2`: 1, `part3`: 3; mode lạ trả **tập rỗng** — fail-closed), `buildMockExamStepKeys(mode)` sinh đúng danh sách step key theo thứ tự `use-exam-session` và `resolveCanonicalMockQuestionText(key, mode)`. Sau khi Phase 2 dựng `ITEMS` từ `MOCK_EXAM_PROMPTS`, `mock-exam-bank.test.ts` là chốt khóa nội dung duy nhất (golden literals).
   - Giữ nguyên bất biến bảo mật `#93`: **tuyệt đối không bao giờ** đưa `attempt_answer.questionText` do client gửi vào prompt chấm điểm; key ngoài ngân hàng rơi về `"(question unavailable)"` mà không ném lỗi.
   - Siết tại cửa upload (`apps/server/src/index.ts`) và `maxAnswersForAttempt` (`packages/api/src/scoring/answer-limits.ts`): với `topicId === null`, kiểm tra `questionKey` thuộc `getValidMockQuestionKeys(currentAttempt.mode)` — mode không xác định trả tập rỗng (fail-closed, mọi key đều bị chặn 400; chỉ tồn tại trên dữ liệu cũ hơn enum `attempt.start`, xét lại được bằng migration riêng khi cần) — và áp trần số câu theo mode (`8 / 4 / 1 / 3`). `TOPIC_LESS_CAP = 20` chỉ còn là fallback cho bài forecast khi dòng `forecast_topic` bị xóa (`attempt.topicId !== null && topic === null`).

3. **Kiến trúc nộp bài trên Web (`ExamScreen` — Option A từ Kongming):**
   - Giữ nguyên toàn bộ state machine `flushThenSubmit` / `submitAnyway` trong `PreSubmitModal` từ `#109` (giữ trải nghiệm sửa/thử lại ngay trong phòng thi, chặn race đóng modal / thoát phòng thi).
   - Tại `doSubmit` (`apps/web/src/features/exam/exam-screen.tsx`), ngay sau khi `attempt.submit` thành công (hoặc `isAlreadySubmittedError`), gán `set({ scoringAttempt: { kind: "attempt", attemptId, submitted: true } })` trước `go("scoring")`. `ScoringScreen` + `useScoringJob` nhận `submitted: true` sẽ bắt đầu poll `scoring.status` ngay mà không gửi submit lần hai. Submit 0 câu trả lời (chưa tải lên được gì) bị server chặn `BAD_REQUEST` → UI hiển thị thông báo lỗi cố định (`PERMANENT_SUBMIT_MESSAGE`) trong modal thay vì điều hướng sang màn chấm.

4. **Màn hình Kết quả (`ResultsScreen`) & `RecordedState`:**
   - Bổ sung nhánh `status.scorable && status.status === "not_scored" && status.attemptStatus === "submitted"` trong `ResultsScreen` (`data-testid="results-not-scored"`) hiển thị nút `"Chấm điểm ngay"` gọi `retryScoring()` (đi qua rescue path miễn phí hạn ngạch cho các bài thi thử cũ trước cutover hoặc bài bị rớt enqueue). Bài `in_progress` / `abandoned` ở trạng thái `not_scored` vẫn rơi về card lưu trữ trung lập (không hứa nút bấm luôn lỗi).
   - Hiển thị eyebrow theo đúng loại bài: `scored.topicId` có giá trị → `"Kết quả · Luyện đề Forecast · <ngày>"`; `scored.topicId === null` → `"Kết quả · Thi thử Full Test / Part 1 / Part 2 / Part 3 · <ngày>"` qua bảng ánh xạ `apiModeLabel` riêng (tách biệt hoàn toàn khỏi kiểu `Mode` `"p1"|"p2"|"p3"` của client store).
   - Giữ nguyên `RecordedState` trên `ScoringScreen` cho trường hợp truy cập trực tiếp `/scoring` không có job (`!job`) và phòng thủ lệch phiên bản (`not_scorable`).

## Non-goals (Khóa phạm vi)

- Không thay đổi cơ chế chấm 3 lần lấy trung vị, hạn mức retry thủ công (1 lần/bài, 3 lần/ngày), cấu hình Cloudflare Queue hay Paywall (vẫn mở đầy đủ trong giai đoạn Beta như `#90`).
- **Rủi ro chi phí AI đã được chấp nhận trong giai đoạn Beta pilot** (khoanh vùng bởi gate `LAUNCH_OPEN` / `LAUNCH_ALLOWED_EMAILS`): không có quota chấm điểm theo ngày/người dùng phía server; một tài khoản pilot lặp `start → upload → submit` liên tục sẽ tăng chi phí tuyến tính (tối đa 8 lần Whisper + 3 lượt chấm mỗi bài thi thử). Việc bổ sung quota submit thuộc phạm vi `#18` (Hạn mức miễn phí) và cần chủ sản phẩm chốt; `attempt.getFollowUp` vẫn giữ nguyên theo quyết định `#93` (web không gọi, path dormant, được chặn `in_progress` và sanitize, không tính vào phạm vi này).
- Không gộp luồng submit của Forecast vào modal của Mock (giữ hành vi Forecast byte-identical).
- Không sửa schema D1 hay sinh migration mới (`attempt.mode` và `attempt_score` đã hỗ trợ sẵn mọi mode).
- Không nối API lịch sử server cho `HistoryScreen` / `DashboardScreen` (thuộc WI-18 `#22`).

## Extension Trace

Khi sau này bổ sung thêm một chế độ luyện tập mới (ví dụ `daily-practice` WI-21 `#25` có câu hỏi sinh từ lỗi cá nhân lưu ở bảng riêng):
- **Hợp đồng giữ ổn định:** `attempt.submit` luôn tạo `attempt_score` + enqueue; `useScoringJob` nhận `{ kind: "attempt", attemptId, submitted }` và `ResultsScreen` đọc `ScoringResult`.
- **Điểm mở rộng duy nhất:** bộ phân giải câu hỏi chuẩn phía server trong `score-attempt.ts` + hàm kiểm tra key/cap trong `answer-limits.ts` và `apps/server/src/index.ts`. Không tạo plugin/registry trừu tượng sớm khi mới có 2 nguồn thật (`forecast_topic` và `mock-exam-bank`). Khi thêm mode mới (ví dụ `daily-practice` WI-21), phải thêm entry tương ứng vào `MOCK_MODE_PARTS` và ngân hàng câu hỏi — nếu quên, fail-closed sẽ chặn mọi upload của mode đó (`400`) thay vì mở cửa bất hợp lệ.

## Phases

| # | Phase | Sở hữu file | Status |
|---|---|---|---|
| 1 | [Backend: Ngân hàng câu hỏi Mock, giới hạn theo mode & mở 4 cổng chấm điểm](./phase-01-backend-all-modes-scoring.md) | `packages/api/**`, `apps/server/**` | Completed |
| 2 | [Frontend: Hand-off chấm điểm cho Thi thử, đồng bộ ITEMS & giao diện Kết quả](./phase-02-frontend-all-modes-scoring.md) | `apps/web/**` | Completed |

## Acceptance Criteria

- [x] AC1: Nộp bài ở bất kỳ chế độ thi thử nào (`full`, `part1`, `part2`, `part3` với `topicId = null`) cũng như luyện đề Forecast đều ghi nguyên tử `attempt.status = "submitted"` + `attempt_score (status = "queued")` và đẩy message vào `SCORING_QUEUE`; submit với 0 câu trả lời được chặn `400` trước khi ghi trạng thái.
- [x] AC2: Worker `scoreAttempt` chấm thành công bài thi thử (`topicId = null`) bằng văn bản câu hỏi chuẩn từ `mock-exam-bank.ts` (gồm cả cue card Part 2 đầy đủ và câu hỏi nối tiếp tĩnh `-f`), không bao giờ đưa `questionText` do client gửi vào prompt chấm điểm; key lạ rơi về `"(question unavailable)"` không ném lỗi.
- [x] AC3: Route upload audio và `findAnswerLimitViolation` chặn key không thuộc mode thi thử (`400`, kể cả mode lạ — fail-closed) và áp đúng trần số câu theo mode (`full: 8`, `part1: 4`, `part2: 1`, `part3: 3`), đồng thời giữ nguyên trần `TOPIC_LESS_CAP = 20` khi bài forecast bị thiếu dòng `forecast_topic`.
- [x] AC4: `scoring.status` và `scoring.retry` trả `scorable: true` cho mọi attempt kèm `attemptStatus`; rescue path của `scoring.retry` cho phép tạo dòng `attempt_score` cho mọi bài `submitted` chưa có điểm mà không tốn lượt retry thủ công; `scoring.getResult` trả thêm `mode`.
- [x] AC5: Trên web, nộp bài thi thử thành công trong `ExamScreen` chuyển sang `/scoring` với `scoringAttempt = { kind: "attempt", attemptId, submitted: true }` để theo dõi tiến trình chấm và tự động mở màn kết quả khi `done` (giữ nguyên toàn bộ guard flush/hủy/thoát của `#109` và `local_only` của `#119`).
- [x] AC6: `ResultsScreen` hiển thị đúng nhãn chế độ thi thử (`Thi thử Full Test`, `Thi thử Part 1`, `Thi thử Part 2`, `Thi thử Part 3`) khi `scored.topicId === null`, giữ `"Luyện đề Forecast"` khi `scored.topicId !== null`, và hiển thị trạng thái `"Bài thi chưa được chấm điểm"` kèm nút `"Chấm điểm ngay"` khi gặp bài `submitted` ở trạng thái `not_scored` (bài `in_progress`/`abandoned` giữ card lưu trữ trung lập).
- [x] AC7: `mock-exam-bank.test.ts` khóa nội dung golden literal của cả 6 mục đề (text/cue/followUp); test parity xác nhận tập key của `ITEMS` sau khi dựng từ `MOCK_EXAM_PROMPTS` khớp tuyệt đối `buildMockExamStepKeys` cho cả 4 mode; toàn bộ test `packages/api`, `apps/server`, `apps/web` và `pnpm check-types` đều pass.

## Validation Log

### Verification Results — 2026-11-11 (Fact Checker, Light tier — 2 phases)
- Claims checked: 26
- Verified: 26 | Failed: 0 | Unverified: 0
- Tier: Light (Fact Checker × 2 reviewer song song — RedTeamSecurity + RedTeamAssumptions)
- Failures: không có. Neo dòng lệch nhỏ trong Phase 2 (154/208/224) đã được đổi sang neo theo tên test trước khi cook.
- Gates chạy sau implement: `pnpm --filter @vox-flow/api test` (28 file / 288 test pass), `pnpm --filter server test` (4 file / 50 test pass, gồm integration D1 thật), `pnpm --filter web test` (40 file / 334 test pass), `pnpm check-types` (7/7 task pass).

### Kongming checkpoints
1. **Sau investigation (2026-11-11, KongmingCheckpoint1):** GO cả 4 quyết định — Option A (giữ modal #109, hand-off `submitted: true`), bank vào `@vox-flow/api` + allowlist/trần theo mode, `scorable` luôn `true` + mở rescue path, `ScoringResult.mode` từ cột DB. Rủi ro lớn nhất được khóa vào plan: 4 cổng `topicId` phải gỡ đồng bộ trong một deploy.
2. **Post-PR review gate:** sẽ chạy sau khi PR mở và CI beta xanh (bắt buộc theo `--advice`).

### Post-implementation review gate (ak-code-review — 2026-11-11)
**Verdict: Approve — 0 Critical / 1 Important (documentation-only) / 5 Suggestion.** Diff 18 file; bài kiểm chứng: 84 test api + 35 test server + 49 test web + `pnpm check-types` 7/7 pass.
- Important #1 (documentation-only): bài cũ trước cutover có quá trần câu trả lời sẽ bị chặn 400 tại `attempt.submit` trước khi chạm worker — cách ly đúng, không deadlock UI; follow-up ghi nhận.
- Suggestion 3: chặn zero-answer áp cho cả Forecast — trung thực hơn (tránh dòng điểm chết), ghi một dòng trong PR body.
- Các Suggestion khác (legacy >cap, parity drift hiện không thể xảy ra, demo answer rỗng, trạng thái plan) đã ghi nhận, không đổi code.

## Red Team Review

### Session — 2026-11-11
**Reviewers:** Security Adversary + Assumption Destroyer (song song, Light tier / Fact Checker)
**Findings:** 11 sau dedupe/đối chiếu (6 accepted — trong đó 2 Critical/High đúng trọng tâm, 5 rejected với bằng chứng, kèm 1 ghi chú neo dòng).

| # | Finding | Severity | Disposition | Applied To |
