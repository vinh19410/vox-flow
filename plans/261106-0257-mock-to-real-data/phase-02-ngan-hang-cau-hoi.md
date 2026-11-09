---
phase: 2
title: "G1: Ngân hàng câu hỏi và chế độ thi"
status: pending
priority: P1
effort: 2d
dependencies: [1]
---

# Phase 2: G1 — Ngân hàng câu hỏi và chế độ thi

## Goal
Câu hỏi thi do server cấp theo `questionKey`, enum chế độ thi dùng chung giữa web và server, và web không còn đọc `ITEMS` hay đáp án mẫu.

## Bối cảnh đã kiểm
- Server nhận `mode: "full" | "part1" | "part2" | "part3"` (`packages/api/src/routers/attempt.ts:14`); web `MODES` dùng `"p1" | "p2" | "p3"` và `use-exam-session.ts` ép kiểu `s.mode` sang enum server, nên chế độ Part sẽ lỗi zod.
- `uploadAnswer` nhận `questionText` từ client (`attempt.ts:94`).
- Câu hỏi nối tiếp (`getFollowUp`) do AI sinh ra, không nằm trong ngân hàng; web đặt khóa `<id>-f`.
- Transcript chạy chữ hiện phát lại `step.answer` (đáp án mẫu) theo `WPS = 2.6`. Chưa có ASR (WI03 đang hold), nên không thể thay bằng transcript thật.
- Đường luyện forecast (`s.practice.items`, tạo ở `forecast/builders.ts`) cũng dùng `ExamItem.answer`; việc chuyển nó sang server thuộc WI20.

## Files to Create / Modify
- Create: `packages/api/src/exam/modes.ts`, `packages/api/src/exam/question-bank.ts`, `packages/api/src/exam/question-bank.test.ts`
- Modify: `packages/api/src/routers/attempt.ts`, `packages/api/src/routers/attempt.test.ts`
- Modify: `apps/web/src/features/exam/data.ts`, `types.ts`, `use-exam-session.ts`, `exam-screen.tsx`
- Modify: `apps/web/src/features/exam/components/live-transcript.tsx`, `pre-submit-modal.tsx`
- Modify: `apps/web/src/features/select/components/mode-grid.tsx` (nếu dùng `Mode` cũ), `apps/web/src/features/app-state/types.ts`
- Create: `apps/web/src/features/exam/modes.test.ts`
- Modify: `plans/261105-0910-wi12-mock-exam/plan.md` (ghi chú bàn giao)

## Tasks & Steps

### Task 2.1 — Enum chế độ dùng chung
- Goal: một nguồn duy nhất cho các chế độ thi.
- Target files and symbols: `packages/api/src/exam/modes.ts` (export `ExamModeSchema = z.enum(["full","part1","part2","part3"])`, type `ExamMode`), `attempt.ts` (`start` input).
- Steps:
  1. Tạo `modes.ts` với `ExamModeSchema` và `ExamMode`.
  2. Trong `attempt.ts`, thay `z.enum([...])` ở `start` bằng `ExamModeSchema.default("full")`.
- Success criteria: `start` vẫn nhận `full`, `part1`, `part2`, `part3` và từ chối giá trị khác.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` exits 0.

### Task 2.2 — Ngân hàng câu hỏi tĩnh ở server
- Goal: server là nơi duy nhất giữ văn bản câu hỏi và cue card.
- Target files and symbols: `packages/api/src/exam/question-bank.ts` (export `QUESTION_BANK`, `getQuestionsForMode(mode)`, `getQuestionByKey(key)`).
- Steps:
  1. Đọc `apps/web/src/features/exam/data.ts`; sao các mục `ITEMS` sang `question-bank.ts` với trường `key` (bằng `id` cũ, khớp `QUESTION_KEY_RE`), `part`, `text`, `cue` (không sao trường `answer` và `followUp`).
  2. `getQuestionsForMode`: `full` trả mọi part theo thứ tự part rồi thứ tự khai báo; `part1|part2|part3` trả đúng part đó.
  3. `getQuestionByKey` trả mục hoặc `undefined`.
  4. Viết `question-bank.test.ts`: mọi `key` khớp `QUESTION_KEY_RE`, `key` không trùng, mỗi part có ít nhất một câu, `getQuestionsForMode("part2")` chỉ chứa part 2.
- Success criteria: ngân hàng không chứa trường `answer`.
- Verify: `pnpm --filter @vox-flow/api test src/exam/question-bank.test.ts` exits 0; và `rg -n "answer" packages/api/src/exam/question-bank.ts` in ra 0 dòng.

### Task 2.3 — `start` và `getActive` trả danh sách câu hỏi
- Goal: web nhận câu hỏi từ API.
- Target files and symbols: `attempt.ts` (`start` return, `getActive` return).
- Steps:
  1. Thêm `questions: getQuestionsForMode(mode)` vào kết quả của `start`.
  2. Thêm `questions: getQuestionsForMode(active.mode as ExamMode)` vào kết quả của `getActive` (khi có lượt đang làm).
  3. Cập nhật `attempt.test.ts`: `start` với `part2` trả `questions` chỉ gồm part 2.
- Success criteria: kết quả chứa `questions` với các trường `key`, `part`, `text`, `cue?`.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` exits 0.

### Task 2.4 — `uploadAnswer` không tin `questionText` của câu trong ngân hàng
- Goal: văn bản câu hỏi lưu vào `attempt_answer` đến từ server khi câu nằm trong ngân hàng.
- Target files and symbols: `attempt.ts` (`uploadAnswer` input và phần chèn `questionText`).
- Steps:
  1. Nếu `questionKey` có trong ngân hàng: lưu `questionText` của server, bỏ qua giá trị client gửi; kiểm tra `partNumber` khớp `part` của ngân hàng, sai thì `BAD_REQUEST`.
  2. Nếu `questionKey` có dạng `<khóa-ngân-hàng>-f` (câu nối tiếp) và phần `<khóa-ngân-hàng>` có trong ngân hàng: cho phép dùng `questionText` do client gửi (đã giới hạn `max(2000)`), vì chưa có nơi lưu câu nối tiếp ở server.
  3. Mọi trường hợp khác: `BAD_REQUEST`.
  4. Thêm test: khóa lạ → `BAD_REQUEST`; khóa trong ngân hàng với `questionText` giả → bản ghi lưu văn bản của server; khóa `<khóa>-f` hợp lệ → được lưu.
- Success criteria: không còn đường nào lưu `questionText` tự do cho khóa nằm ngoài ngân hàng.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` exits 0 và có ít nhất 3 ca mới đúng như trên.

### Task 2.5 — Web: chế độ thi dùng enum chung
- Goal: `MODES` của web khớp enum server.
- Target files and symbols: `apps/web/src/features/exam/types.ts` (`Mode`), `data.ts` (`MODES`, `modeLabel`), `app-state/types.ts`, các nơi dùng `"p1" | "p2" | "p3"` (kể cả `history/data.ts`, `history/types.ts`).
- Steps:
  1. Đổi `Mode` thành `"full" | "part1" | "part2" | "part3"`, import kiểu `ExamMode` từ `@vox-flow/api` (chỉ kiểu).
  2. Đổi `id` trong `MODES` thành `part1|part2|part3`.
  3. Bỏ ép kiểu `s.mode as "full" | ...` ở `use-exam-session.ts`.
  4. Viết `modes.test.ts`: mọi `MODES[i].id` parse được bằng `ExamModeSchema`.
- Success criteria: kiểm tra kiểu qua mà không còn ép kiểu chế độ.
- Verify: `pnpm --filter web test src/features/exam/modes.test.ts` exits 0 và `pnpm check-types` exits 0.

### Task 2.6 — Web: lấy câu hỏi từ API, bỏ `ITEMS` và đáp án mẫu
- Goal: `useExamSession` dựng `steps` từ `questions` của API.
- Target files and symbols: `use-exam-session.ts` (`source`, `steps`, effect gọi `getActive`/`start`), `types.ts` (`ExamItem`), `data.ts`.
- Steps:
  1. Lưu `questions` từ `getActive`/`start` vào state; `steps` dựng từ đó. Khi chưa có danh sách (đang tải) hiện trạng thái đang tải, không rơi về `ITEMS`.
  2. Khi `start`/`getActive` lỗi, hiện thông báo lỗi và nút thử lại. Không chạy chế độ giả.
  3. Giữ nhánh `s.practice` (luyện forecast) hoạt động như cũ: đổi `ExamItem.answer` thành tùy chọn (`answer?: string`) cho đến khi WI20 chuyển nhánh này sang server; ghi chú một dòng trong code trỏ tới `plans/261105-0910-wi20-forecast-practice`.
  4. Xóa `ITEMS` khỏi `data.ts`; giữ `MODES`, `VOICES`, `PART_INFO` (cấu hình sản phẩm).
- Success criteria: không còn `ITEMS` trong `apps/web/src` ngoài test.
- Verify: `rg -n "\bITEMS\b" apps/web/src --glob '!**/*.test.*'` in ra 0 dòng; `pnpm check-types` exits 0.

### Task 2.7 — Bỏ transcript chạy chữ giả và ngưỡng theo số từ
- Goal: không hiển thị nội dung nói giả; ngưỡng "câu trả lời ngắn" dựa trên thời lượng thật.
- Target files and symbols: `use-exam-session.ts` (`WPS`, `words`, `spoken`, `ExamSessionValue`), `exam-screen.tsx` (`short`, `MIN_WORDS`), `live-transcript.tsx`, `pre-submit-modal.tsx`, `data.ts` (`MIN_WORDS`).
- Steps:
  1. Xóa `WPS`, `words`, `spoken`; `LiveTranscript` chỉ hiện trạng thái "Đang ghi âm" cùng đồng hồ và sóng âm, kèm dòng "Bản ghi chữ sẽ có khi chấm điểm".
  2. Thay `MIN_WORDS` bằng `MIN_SECS: Record<Part, number>` trong `data.ts` (đổi tên, giữ ý nghĩa "ngưỡng tối thiểu"); mặc định đề xuất 5 giây cho Part 1, 30 giây cho Part 2, 10 giây cho Part 3 — đây là giá trị khởi đầu cần PO xác nhận, ghi rõ trong code là cấu hình.
  3. `short` so sánh `answers[k]?.secs` với `MIN_SECS[p]`; `pre-submit-modal.tsx` hiện thời lượng thay cho "N từ".
  4. Bỏ trường `words: 20` tạm trong chỗ khôi phục `getActive` (`use-exam-session.ts`).
- Success criteria: không còn `WPS`, `words`, `spoken`, `MIN_WORDS` trong `apps/web/src/features/exam`.
- Verify: `rg -n "WPS|MIN_WORDS|\bspoken\b" apps/web/src/features/exam` in ra 0 dòng; `pnpm check-types` exits 0.

### Task 2.8 — Ghi chú bàn giao cho WI12
- Goal: WI12 (đã `completed`) không bị hiểu là còn nợ phần nối giao diện.
- Target files and symbols: `plans/261105-0910-wi12-mock-exam/plan.md`.
- Steps: thêm một đoạn ngắn cuối file nêu rằng phần nối giao diện còn lại (đọc câu hỏi từ API, bỏ `ITEMS`) do `plans/261106-0257-mock-to-real-data` phase 2 nhận.
- Success criteria: đoạn ghi chú có đường dẫn plan này.
- Verify: `rg -n "261106-0257-mock-to-real-data" plans/261105-0910-wi12-mock-exam/plan.md` in ra ít nhất 1 dòng.

## Verification
- `pnpm --filter @vox-flow/api test src/exam/question-bank.test.ts src/routers/attempt.test.ts` exits 0 (nếu công cụ không nhận nhiều đường dẫn, chạy từng file).
- `pnpm --filter web test src/features/exam/modes.test.ts` exits 0.
- `pnpm check-types` exits 0.
- `rg -n "\bITEMS\b|WPS|MIN_WORDS" apps/web/src --glob '!**/*.test.*'` in ra 0 dòng.

## Risk
- Câu nối tiếp (`-f`) vẫn do client gửi văn bản, vì chưa có nơi lưu ở server. Ghi nhận là nợ nhỏ; WI12/WI13 cần lưu câu nối tiếp khi làm chấm điểm.
- `getFollowUp` cần `candidateTranscript`; chưa có ASR nên web không gọi `getFollowUp`. Không hứa câu nối tiếp thật trong phase này.

## Rollback
`git revert` các commit; không có migration, không thay đổi bảng D1.

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
