---
phase: 1
title: "Phase 1: Backend — Ngân hàng câu hỏi Mock, giới hạn theo mode & mở 4 cổng chấm điểm"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Backend — Ngân hàng câu hỏi Mock, giới hạn theo mode & mở 4 cổng chấm điểm

## Goal

Mọi lượt nộp bài thi thử (`topicId = null`) và luyện đề Forecast đều được tạo dòng `attempt_score`, đưa vào hàng đợi và chấm điểm an toàn bằng ngân hàng câu hỏi chuẩn phía server kèm giới hạn key/số câu theo từng mode, không cần thay đổi schema D1.

## Files to Create / Modify

- Create: `packages/api/src/scoring/mock-exam-bank.ts`
- Create: `packages/api/src/scoring/mock-exam-bank.test.ts`
- Modify: `packages/api/src/scoring/answer-limits.ts`
- Modify: `packages/api/src/scoring/types.ts`
- Modify: `packages/api/src/routers/attempt.ts`
- Modify: `packages/api/src/routers/scoring.ts`
- Modify: `packages/api/src/scoring/score-attempt.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/api/src/routers/scoring.test.ts`
- Modify: `packages/api/src/scoring/score-attempt.test.ts`
- Modify: `apps/server/src/index.test.ts`

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

## Tasks & Steps

### Task 1.1 — Viết unit test đỏ cho ngân hàng câu hỏi Mock và trần số câu theo mode (`TDD Red`)

- **Goal:** Có bộ test khóa hợp đồng cho `mock-exam-bank.ts` và `maxAnswersForAttempt` trước khi viết mã thực thi.
- **Target files and symbols:**
  - Create `packages/api/src/scoring/mock-exam-bank.test.ts`
  - Imports cần kiểm thử: `MOCK_EXAM_PROMPTS`, `getValidMockQuestionKeys`, `resolveCanonicalMockQuestionText` từ `./mock-exam-bank` và `maxAnswersForAttempt`, `TOPIC_LESS_CAP`, `SINGLE_QUESTION_CAP` từ `./answer-limits`.
- **Steps:**
  1. Tạo `packages/api/src/scoring/mock-exam-bank.test.ts` kiểm tra:
     - `getValidMockQuestionKeys("full")` trả đúng 8 key: `p1-1`, `p1-1-f`, `p1-2`, `p1-3`, `p2-1`, `p3-1`, `p3-1-f`, `p3-2` (theo đúng thứ tự).
     - `getValidMockQuestionKeys("part1")` trả 4 key (`p1-1`, `p1-1-f`, `p1-2`, `p1-3`); `"part2"` trả 1 key (`p2-1`); `"part3"` trả 3 key (`p3-1`, `p3-1-f`, `p3-2`); mode lạ (`"unknown"`, `"daily-practice"`) trả **tập rỗng** (fail-closed — không key nào hợp lệ).
     - `resolveCanonicalMockQuestionText("p1-1", "part1")` trả câu gốc Part 1; `"p1-1-f"` trả câu follow-up tĩnh; `"p2-1"` ở `"part2"` hoặc `"full"` trả chuỗi có cả tiêu đề cue card, 3 gạch đầu dòng `points` và câu kết `ending`; key lệch mode (`resolveCanonicalMockQuestionText("p3-1", "part1")`) hoặc key không tồn tại (`"p1-99"`) trả `null`.
     - **Golden literal** cho cả 6 mục: assert chuỗi `text` của `p1-1`, `p1-2`, `p1-3`, `p3-1`, `p3-2` và nội dung `cue.title` / 3 `cue.points` / `cue.ending` của `p2-1` cùng `followUp.text` + `followUp.trigger` của `p1-1`, `p3-1` khớp **chính xác từng ký tự** với `apps/web/src/features/exam/data.ts:16-76` (sao chép nguyên văn; sau khi Phase 2 dựng `ITEMS` từ bank, đây là chốt khóa nội dung duy nhất).
     - `maxAnswersForAttempt`:
       - `{ mode: "part2", topicId: null, questionKey: null }` với `topic = null` trả `1` (và `full` → `8`, `part1` → `4`, `part3` → `3`, mode lạ → `0` vì tập key rỗng).
       - `{ mode: "part2", topicId: "deleted-topic", questionKey: null }` với `topic = null` vẫn trả `TOPIC_LESS_CAP = 20` (bảo toàn bài forecast Part 2&3 khi dòng topic bị xóa).
       - `{ mode: "part1", topicId: "t1", questionKey: "t1-0" }` trả `SINGLE_QUESTION_CAP = 2`.
- **Success criteria:** File test mới tồn tại và fail do module `./mock-exam-bank` chưa được tạo.
- **Verify:** Chạy `pnpm --filter @vox-flow/api test src/scoring/mock-exam-bank.test.ts` thoát mã khác 0 với lỗi không tìm thấy `./mock-exam-bank` (test pass ở bước này là sai).

### Task 1.2 — Hiện thực `mock-exam-bank.ts` và cập nhật `answer-limits.ts` (`TDD Green`)

- **Goal:** `mock-exam-bank.test.ts` pass 100%, cung cấp nguồn sự thật duy nhất về câu hỏi & giới hạn cho các chế độ thi thử.
- **Target files and symbols:**
  - Create `packages/api/src/scoring/mock-exam-bank.ts` (`MOCK_EXAM_PROMPTS`, `MockExamPromptItem`, `MockExamMode`, `getValidMockQuestionKeys`, `resolveCanonicalMockQuestionText`)
  - Modify `packages/api/src/scoring/answer-limits.ts` (`maxAnswersForAttempt`, `findAnswerLimitViolation`)
- **Steps:**
  1. Tạo `packages/api/src/scoring/mock-exam-bank.ts` (thuần TypeScript, không import DB hay runtime server) chứa 6 mục đề gốc khớp chính xác nội dung câu hỏi/cue/followUp trong `apps/web/src/features/exam/data.ts:16-76`:
     - `p1-1` (part 1, kèm `followUp` trigger `"quite noisy at night"`), `p1-2` (part 1), `p1-3` (part 1), `p2-1` (part 2, kèm `cue: { title, points, ending }`), `p3-1` (part 3, kèm `followUp` trigger `"the main reason is pride"`), `p3-2` (part 3).
  2. Cài đặt `MOCK_MODE_PARTS: Record<string, readonly (1 | 2 | 3)[]>` (`full: [1, 2, 3]`, `part1: [1]`, `part2: [2]`, `part3: [3]`).
  3. Cài đặt `getValidMockQuestionKeys(mode: string): Set<string>` sinh tập key theo đúng quy tắc ghép bước của `use-exam-session.ts:50-56` (`item.id` và `${item.id}-f` nếu có `followUp`); trả **tập rỗng** nếu `mode` không nằm trong `MOCK_MODE_PARTS` (fail-closed).
  4. Cài đặt `buildMockExamStepKeys(mode: string): string[]` trả mảng step key theo đúng thứ tự `use-exam-session` (duyệt các mục thuộc part của mode, push `item.id` rồi `${item.id}-f` nếu có `followUp`) — dùng chung cho cả `use-exam-session.ts` (Phase 2) và test parity.
  5. Cài đặt `resolveCanonicalMockQuestionText(key: string, mode?: string): string | null`:
     - Nếu `mode !== undefined`: lấy `valid = getValidMockQuestionKeys(mode)`; nếu `!valid.has(key)` trả `null`.
     - Với mục có `cue`: ghép `${cue.title} You should say: ${cue.points.join(", ")}; ${cue.ending}`.
     - Với key kết thúc bằng `-f`: trả `item.followUp?.text ?? null`.
     - Với key gốc khác: trả `item.text`.
  6. Trong `packages/api/src/scoring/answer-limits.ts`, mở rộng tham số `attempt` của `maxAnswersForAttempt` và `findAnswerLimitViolation` thành `{ mode?: string; topicId?: string | null; questionKey: string | null }`:
     - Nếu `attempt.questionKey` có giá trị → trả `SINGLE_QUESTION_CAP`.
     - Nếu `attempt.topicId` có giá trị: nếu `!topic` trả `TOPIC_LESS_CAP`; ngược lại trả `Math.min(getValidQuestionKeysForTopic(topic, null).size, TOPIC_ANSWER_CAP)`.
     - Nếu `!attempt.topicId`: gọi `const validMock = attempt.mode ? getValidMockQuestionKeys(attempt.mode) : new Set<string>(); return validMock.size;` (mode lạ → tập rỗng → `0`, fail-closed).
- **Success criteria:** `mock-exam-bank.test.ts` pass toàn bộ các trường hợp mode, cue card, follow-up và deleted-topic fallback.
- **Verify:** Chạy `pnpm --filter @vox-flow/api test src/scoring/mock-exam-bank.test.ts` thoát mã `0`.

### Task 1.3 — Cập nhật test đỏ cho `scoringRouter`, `attempt.submit`, `scoreAttempt` và route upload (`TDD Red`)

- **Goal:** Khóa toàn bộ hành vi mở chấm điểm mọi mode, rescue path, `ScoringResult.mode`, chống prompt injection trên bài thi thử và chặn key/trần upload theo mode bằng các test thất bại trên code cũ.
- **Target files and symbols:**
  - Modify `packages/api/src/routers/scoring.test.ts`
  - Modify `packages/api/src/scoring/score-attempt.test.ts`
  - Modify `apps/server/src/index.test.ts`
- **Steps:**
  1. Trong `packages/api/src/routers/scoring.test.ts`:
     - Ở `status` (`dòng 97-103`): đổi kỳ vọng của `att-full` sang `scorable: true` và thêm kỳ vọng `attemptStatus: "submitted"`.
     - Ở `retry` (`dòng 149-174`): thêm kiểm chứng rescue path tạo dòng `attempt_score` (`status: "queued"`, `manualRetries: 0`, `scorable: true`) cho cả `att-full` (`topicId: null`, `status: "submitted"`), và chỉ từ chối `att-draft` (`status: "in_progress"`).
     - Ở `getResult`: kiểm tra kết quả trả về có trường `mode` khớp `attempt.mode` (cả `"part1"` có `topicId` và `"full"` có `topicId: null`).
     - Ở `attempt.submit scoring enqueue` (`dòng 516-522`): thay test `"never scores non-forecast attempts"` bằng test `"creates a queued score row and enqueues scoring for mock exam attempts across all modes"` kiểm tra cả `full`, `part1`, `part2`, `part3` với `topicId: null` đều ghi `attempt_score` và gửi message vào `queue.sent`; thêm test `"rejects a zero-answer submit with 400 before marking submitted"` (submit một attempt thi thử chưa có câu trả lời nào → `BAD_REQUEST` `"Attempt has no recorded answers"`, `attempt` vẫn `in_progress`, không dòng điểm, queue rỗng).
  2. Trong `packages/api/src/scoring/score-attempt.test.ts`:
     - Thêm `describe("mock exam scoring (topicId = null)")` kiểm tra:
       a) Chấm thành công attempt `mode: "full", topicId: null` với các câu `p1-1`, `p1-1-f`, `p2-1`, `p3-1` có `questionText` giả mạo `"HACKED"` từ client → `scoreAttempt` trả `"done"`, prompt gửi LLM chứa câu gốc chuẩn từ `mock-exam-bank` (kể cả nội dung cue card `p2-1` và follow-up `p1-1-f`), tuyệt đối không chứa `"HACKED"`.
       b) Key lạ trên attempt `topicId: null` (ví dụ `q-unknown` trên `mode: "full"`) vẫn chấm ra `"done"` với `"(question unavailable)"` và không rò text client.
       c) Attempt `mode: "full", topicId: null` có 9 câu trả lời hợp lệ về key nhưng vượt trần 8 → trả `"failed"` với `lastError` chứa `"ANSWER_COUNT_EXCEEDED"` và `client.transcribeCalls` rỗng (không dùng `part2` — trần số câu của `part2` bằng đúng tập key nên không thể vượt qua phép đếm trên server).
  3. Trong `apps/server/src/index.test.ts`:
     - Thêm `attemptMode: "full"` vào `mockState` (khởi tạo lại `"full"` trong `beforeEach`) và truyền `mode: mockState.attemptMode` vào đối tượng attempt trả về của `mockDb` (`dòng 70-76`).
     - **Một lượt thay thế cơ học toàn bộ** `"p1_q1"` trong file (`validUrl` tại `dòng 146`, các URL test key order/part/duration (`dòng 281-358`), assert `body.audioKey` / `mockPut` / `mockDelete` (`dòng 384-432`, `558-595`), `mockUpsert` `questionKey` (`dòng 398-407`, `612-619`), test prefix-listing (`dòng 704-737`) và `mockState.ansRecord.audioKey` (`dòng 41`)) → dùng key thi thử thật `"p1-1"` (và `"other-q"` tại `dòng 545` thành `"p1-2"`).
     - Thêm 2 test mới:
       a) Trả `400` (`"Invalid question key for this attempt"`) khi upload key `p3-1` vào attempt thi thử `attemptMode = "part1"` (`attemptTopicId = null`), không gọi `mockPut`; kèm thêm 1 test cho mode lạ (`attemptMode = "daily-practice"`) → cũng `400` với bất kỳ key nào (fail-closed).
       b) Trả `400` (`"Question limit reached for this attempt"`) khi phép đếm thực sự chạy đến: seed `mockState.existingAnswers` với **9 dòng legacy ngoài ngân hàng** (ví dụ `key-1` … `key-9`, mô phỏng dữ liệu cũ trước cutover cho phép tối đa 20 key tùy chọn) rồi upload key hợp lệ chưa dùng `p1-2` → allowlist pass, `9 >= 8` (`maxAnswersForAttempt(currentAttempt, null)`) → 400 `"Question limit reached"`, không gọi `mockPut` (với mock DB fixture của file này, seed rows tùy ý là khả thi).
- **Success criteria:** Cả 3 file test chạy và đều báo FAIL đúng tại các assertion mới do code server vẫn chặn `topicId === null` và chưa chặn allowlist mock.
- **Verify:**
  - `pnpm --filter @vox-flow/api test src/routers/scoring.test.ts` thoát mã khác 0.
  - `pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` thoát mã khác 0.
  - `pnpm --filter server test src/index.test.ts` thoát mã khác 0.

### Task 1.4 — Gỡ bỏ đồng bộ 4 cổng `topicId`, nối `mock-exam-bank` và allowlist upload (`TDD Green`)

- **Goal:** Toàn bộ test backend ở `packages/api` và `apps/server` chuyển sang xanh hoàn toàn.
- **Target files and symbols:**
  - Modify `packages/api/src/scoring/types.ts` (`ScoreStatusResult`, `ScoringResult`)
  - Modify `packages/api/src/routers/attempt.ts` (`attemptRouter.submit`)
  - Modify `packages/api/src/routers/scoring.ts` (`scoringRouter.status`, `scoringRouter.retry`, `scoringRouter.getResult`)
  - Modify `packages/api/src/scoring/score-attempt.ts` (`runPipeline`)
  - Modify `apps/server/src/index.ts` (`POST /api/attempts/:attemptId/answers/:questionKey/audio`)
- **Steps:**
  1. Trong `packages/api/src/scoring/types.ts`: thêm `mode?: string;` vào `ScoringResult` và `attemptStatus: "in_progress" | "submitted" | "abandoned";` vào `ScoreStatusResult`, cập nhật chú thích của `scorable`.
  2. Trong `packages/api/src/routers/attempt.ts` (`dòng 237-295`):
     - Ngay sau khi load `answers` và topic, trước `markSubmitted`: nếu `answers.length === 0` ném `TRPCError({ code: "BAD_REQUEST", message: "Attempt has no recorded answers" })` (chặn dòng điểm chết từ path `submitAnyway`).
     - Bỏ điều kiện `if (currentAttempt.topicId)` để mọi `submit` đều chạy `ctx.db.batch([markSubmitted, ctx.db.insert(attemptScore)...])` và `if (inserted.length > 0) await enqueueScoring(...)`.
  3. Trong `packages/api/src/routers/scoring.ts`:
     - Ở `status` (`dòng 65-74`): đặt `scorable: true` và trả thêm `attemptStatus: owned.status`.
     - Ở rescue path của `retry` (`dòng 91-96`): đổi điều kiện thành `if (owned.status !== "submitted")` với thông báo `"Only a submitted attempt can be scored"`.
     - Ở `retry` return (`dòng 168-173`): đặt `scorable: true` và trả thêm `attemptStatus: owned.status`.
     - Ở `getResult` (`dòng 215-223`): trả thêm `mode: owned.mode`.
  4. Trong `packages/api/src/scoring/score-attempt.ts`:
     - Xóa khối `if (!attemptRow.topicId) { throw new NonRetriableScoringError(...); }` (`dòng 242-244`).
     - Chỉ truy vấn `forecastTopic` khi `attemptRow.topicId` khác `null` (`let topicRow = null; if (attemptRow.topicId) { ... }`).
     - Khi dựng `answers` cho prompt (`dòng 366-368`): nếu `bankTopic` khác `null` thì gọi `resolveCanonicalQuestionText(bankTopic, row.questionKey)`; ngược lại nếu `!attemptRow.topicId` thì gọi `resolveCanonicalMockQuestionText(row.questionKey, attemptRow.mode)`; nếu kết quả vẫn `null` thì dùng `"(question unavailable)"`.
  5. Trong `apps/server/src/index.ts` (`dòng 172-196`):
     - Import `getValidMockQuestionKeys` từ `@vox-flow/api/scoring/mock-exam-bank` (bỏ import `TOPIC_LESS_CAP` nếu không còn dùng trực tiếp).
     - Ở nhánh `else` (`!currentAttempt.topicId`): kiểm tra `const validMockKeys = getValidMockQuestionKeys(currentAttempt.mode); if (!validMockKeys.has(questionKey)) return c.json({ error: "Invalid question key for this attempt" }, 400);` (fail-closed: mode lạ → tập rỗng → mọi key 400) rồi kiểm tra số câu `const maxCount = maxAnswersForAttempt(currentAttempt, null); if (!existingAnswer && existingAnswers.length >= maxCount) return c.json({ error: "Question limit reached for this attempt" }, 400);`.
- **Success criteria:** Toàn bộ test của `@vox-flow/api` và `server` (kể cả integration test D1 thật) đều pass.
- **Verify:**
  - `pnpm --filter @vox-flow/api test src/scoring/mock-exam-bank.test.ts` thoát mã `0`.
  - `pnpm --filter @vox-flow/api test src/routers/scoring.test.ts` thoát mã `0`.
  - `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` thoát mã `0`.
  - `pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` thoát mã `0`.
  - `pnpm --filter server test` thoát mã `0`.

## Verification

- `pnpm --filter @vox-flow/api test src/scoring/mock-exam-bank.test.ts` → exit `0`.
- `pnpm --filter @vox-flow/api test src/routers/scoring.test.ts` → exit `0`.
- `pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` → exit `0`.
- `pnpm --filter server test` → exit `0`.

### Whole-Plan Consistency Sweep (advisory recheck 2026-11-11)
- Files reread: phase-01-backend-all-modes-scoring.md Task 1.3 step 3b.
- Decision deltas checked: 1 — test trần số câu qua route phải seed ≥ 9 dòng legacy ngoài ngân hàng trong `mockState.existingAnswers` rồi upload key hợp lệ chưa dùng (`p1-2`); đủ chặt để cho phép allowlist pass trước phép đếm (không còn kỳ vọng chết "đủ 8 key + upload key hợp lệ thứ 9" vốn không tồn tại trong ngân hàng 8-key).
- Reconciled stale references: Task 1.3 step 3b cập nhật; số đếm vẫn được khóa độc lập ở Task 1.1 (unit `maxAnswersForAttempt`) và consumer (score-attempt 2c).
- Unresolved contradictions: 0.

### Post-implementation review gate (ak-code-review, 2026-11-11)
**Verdict: Approve — 0 Critical / 1 Important (documentation-only) / 5 Suggestion.**
- Important #1 (đã ghi nhận, không đổi code): bài cũ trước cutover có quá trần câu trả lời không thể submit lại (400 tại `attempt.submit` trước khi chạm worker) — cách ly đúng, không deadlock UI; ghi nhận như edge của dữ liệu legacy, không thuộc phạm vi beta. Follow-up nếu cần: nới guard đếm cho `topicId === null` legacy hoặc lời giải qua migration riêng.
- Suggestion đã chấp nhận trong ghi chép (không đổi code): (3) chặn zero-answer áp cho cả Forecast — hành vi mới trung thực hơn (tránh dòng điểm chết), một dòng note trong PR body; (1) legacy >cap là dead-row tự nhiên trong beta; (2) drift parity hiện không thể xảy ra vì `ITEMS` dựng từ bank; (5) `data.ts` demo answer rỗng chỉ là cosmetic; (6) trạng thái phase/checkbox do controller cập nhật khi ship.
