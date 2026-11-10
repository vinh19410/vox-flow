---
title: "Phase 1: TDD — test đỏ cho nhánh mock submit"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: TDD — test đỏ cho nhánh mock submit

## Goal
Toàn bộ hành vi mục tiêu của fix được mô tả bằng test (file `exam-submit.test.tsx` + file mới `pre-submit-modal.test.tsx`); test chạy ĐỎ ở đúng assertion khóa hành vi, các test forecast/#94 hiện có vẫn xanh.

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

## Files to Create / Modify
- Modify: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`
- Create: `apps/web/src/features/exam/components/__tests__/pre-submit-modal.test.tsx` (unit test modal — không file test nào khác)

## Tasks & Steps

### Task 1.1 — Bổ sung `flushAnswerUploads` vào vi.mock factory
- Goal: test có spy điều khiển được cho `flushAnswerUploads` mà vẫn giữ mock `trackAnswerUpload` hiện có.
- Target files: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` (block `vi.mock("../answer-uploads", ...)` dòng 18-21).
- Steps:
  1. Thêm `const flushSpy = vi.fn();` cạnh các spy hiện có (dưới `trackUploadSpy`).
  2. Trong factory: `flushAnswerUploads: (...a: unknown[]) => flushSpy(...a)` (giữ `trackAnswerUpload` mock, spread original cho phần còn lại).
  3. Trong `beforeEach`: `flushSpy.mockReset().mockResolvedValue({ failedQuestionKeys: [], storageUnreadable: false });`.
- Lý do bắt buộc (đã kiểm chứng cơ chế): nếu thiếu mock này, `flushAnswerUploads` thật gọi `listPendingUploads` — mock `../storage` hiện chỉ có `saveAudioBlob`/`deleteAudioBlob` — TypeError bị try/catch bên trong flush nuốt, flush **không nổ** mà fail-soft trả `{ failedQuestionKeys: [], storageUnreadable: true }` (answer-uploads.ts:296-305) → mọi test nhánh mock lặng lẽ chạy vào nhánh flush-error với failure message không giống gì assertion. Giữ flush **mocked** trong component test (flush thật + `vi.useFakeTimers` = treo ở `wait()`).
- Success criteria: toàn bộ 11 test hiện có vẫn pass.
- Verify: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` exit 0, `Tests  11 passed (11)`.

### Task 1.2 — Viết lại test đang pin hành vi lỗi thành test thứ tự flush→submit→nav
- Goal: test mock-branch khẳng định thứ tự mới: flush hoàn tất trước submit; submit hoàn tất trước nav. (Tên cũ "keeps the background submit for a mock test and clears any stale scoring attempt" pin fire-and-forget — viết lại, không giữ.)
- Target files: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` (test "keeps the background submit for a mock test...", dòng 114).
- Steps:
  1. Đổi tên thành `flushes every answer upload before submitting a mock test`.
  2. Setup giữ nguyên: `mode: "p1"`, `scoringAttempt: { attemptId: "att-old", submitted: true }` (vẫn assert bị clear).
  3. `const { promise: flushPromise, resolve: resolveFlush } = Promise.withResolvers<{ failedQuestionKeys: string[]; storageUnreadable: boolean }>();` và `flushSpy.mockReturnValue(flushPromise.promise)`; click "Nộp & chấm điểm".
  4. Assert ngay sau click (chưa drain): `flushSpy` đã được gọi với `"att-mock"`; `submitSpy` **chưa** được gọi; `h.go` **chưa** được gọi; nút submit tìm qua `screen.getByText(/Đang tải lên bản ghi…/)` (nhãn busy) và attr `disabled` là `true` (`expect((btn as HTMLButtonElement).disabled).toBe(true)` — repo KHÔNG có jest-dom, không dùng `toBeDisabled`).
  5. `await act(async () => { resolveFlush({ failedQuestionKeys: [], storageUnreadable: false }); await flush(); });` (helper `flush()` có sẵn, dòng 42-46 — KHÔNG có `flushMs`) → assert `submitSpy` đã gọi `{ attemptId: "att-mock" }`, nav **chưa** chạy, nút giờ mang nhãn `Đang nộp…` và `disabled` true.
  6. Resolve submit (mockReturnValue promise riêng hoặc mockResolvedValue từ đầu), `await flush()` → assert `h.state().scoringAttempt` là `null`, `h.setPendingSubmission` nhận `true`, `h.go` nhận `"scoring"`, nút về enable.
- Success criteria: test này fail ở bước 4 (flush chưa được gọi — hành vi cũ không flush).
- Verify: gộp vào Verify phase.

### Task 1.3 — Thêm test nhánh lỗi/guard trong `exam-submit.test.tsx`
- Goal: khoá hành vi chặn-nộp, "Vẫn nộp", retry, already-submitted, abandoned, failed-path, double-click, 2 luồng hủy.
- Target files: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`.
- Steps — mỗi test một `it` trong `describe("ExamScreen submit")`:
  1. `blocks submit and offers a retry when uploads still fail after retries`: flush resolve `{ failedQuestionKeys: ["p1-x-0"], storageUnreadable: false }` → `submitSpy` không gọi, `h.go` không gọi; text `Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại.` hiện; nút `Vẫn nộp` **không** hiện (chỉ khi storageUnreadable đơn thuần); click `Thử lại` với flush giờ resolve ok → submit gọi, resolve → nav như Task 1.2.
  2. `offers submit anyway when the device storage cannot be read`: flush resolve `{ failedQuestionKeys: [], storageUnreadable: true }` → `submitSpy` không gọi, `h.go` không gọi; cảnh báo `Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận.` hiện; nút `Vẫn nộp` hiện; **`flushSpy` được gọi đúng 1 lần**; click `Vẫn nộp` → `flushSpy` **vẫn** 1 lần (bypass flush, submit thẳng), `submitSpy` gọi; resolve → nav.
  3. `treats an already-submitted rejection as success`: submit reject `Object.assign(new Error("Attempt is already submitted"), { data: { code: "BAD_REQUEST" } })` → `h.go` vẫn nhận `"scoring"`, `setPendingSubmission(true)`, không hiện lỗi submit. **Test này XANH ngay ở red phase** (hành vi hiện tại fire-and-forget vẫn nav).
  4. `surfaces a failed submit without navigating and retries cleanly`: submit reject `new Error("network down")` → không nav, text `Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại.` hiện; resolve lại submit ok, click `Thử lại` → nav.
  5. `distinguishes a permanent rejection from a network error`: submit reject `Object.assign(new Error("Attempt is abandoned"), { data: { code: "BAD_REQUEST" } })` → không nav, text `Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi.` hiện (KHÔNG dán nhãn lỗi mạng).
  6. `does not flush or submit when attempt.start failed (offline mock)`: `mode: "p1"`, `startSpy.mockRejectedValue(...)` (path `attemptStatus === "failed"`, `attemptId` null) → click nộp → `flushSpy` không gọi, `submitSpy` không gọi, `h.go("scoring")` vẫn gọi. **XANH ngay ở red phase.**
  7. `ignores a second submit click while one is already running`: flush trả promise treo; click nút 2 lần; resolve flush ok + submit → `submitSpy` gọi đúng 1 lần.
  8. `does not navigate in the background after closing the modal mid-flush`: flush trả promise treo; click nộp; click `Quay lại` (đóng PreSubmitModal); resolve flush ok + submit ok → `h.go` không nhận `"scoring"` (được phép nhận giá trị khác nếu test thoát — ở test này không thoát), `setPendingSubmission` không gọi.
  9. `navigates to scoring when the modal closes mid-submit but the submit succeeds`: flush resolve ok ngay, submit trả promise treo; click nộp → assert trung gian: `flushSpy` đúng 1 lần, `submitSpy` đã gọi, nút mang nhãn `Đang nộp…` (điểm đỏ-at-red: code cũ nav sync lúc click nên nhãn không bao giờ xuất hiện); click `Quay lại` đóng modal; resolve submit ok → `h.go("scoring")` **được** gọi, `setPendingSubmission(true)` (attempt đã chốt trên server — kéo về RecordedState là trung thực).
  10. `discards a failed submit silently when the modal is closed mid-submit`: như test 9 (flush ok, submit treo, click, assert trung gian nhãn `Đang nộp…`); click `Quay lại`; resolve submit reject `new Error("network down")` → `h.go` không nhận `"scoring"` (code cũ đã nav lúc click → đỏ-at-red), `queryByText(/Vẫn chưa nộp được bài/)` null (không leak lỗi vào modal đã đóng).
  11. `never navigates after exiting the exam mid-submit`: flush ok resolve nhanh, submit trả promise treo; click nộp; mởThoát (click nút Thoát trong ExamHeader, confirm trong `ExitExamModal`) → `h.go` nhận exit target (`"select"`); resolve submit ok → `h.go` **không** nhận thêm `"scoring"` và `setPendingSubmission` **không** được gọi (discard trọn vẹn).
- Lưu ý kỹ thuật: sau mỗi resolve dùng `await act(async () => { await flush(); })` để drain microtask trước khi assert; KHÔNG đợi timer thật. Không dùng matcher jest-dom (không có trong repo) — assert attr `disabled` qua property phần tử.
- Success criteria: các test 1, 2, 4, 5, 7, 8, 9, 10, 11 ĐỎ ở red phase vì exam-screen chưa flush/chưa chờ/chưa chặn (assertion fail đúng điểm khóa hành vi); test 3 và 6 XANH (khớp hành vi hiện tại) — đây là **ngoại lệ biết trước**, không phải verify fail.
- Verify: gộp vào Verify phase.

### Task 1.4 — Unit test `PreSubmitModal` (file mới)
- Goal: khoá UI contract của modal: busy phase, error slot, nút "Vẫn nộp", "Nói lại" disable khi busy, "Quay lại" luôn enable.
- Target files: `apps/web/src/features/exam/components/__tests__/pre-submit-modal.test.tsx` (mới).
- Steps:
  1. Render `PreSubmitModal` với props tối thiểu (`open`, `steps`, `answers` có 1 câu trả lời ngắn để nút `Nói lại` render, `short: () => true`, `flaggedCount: 1`, `onRetry`, `onSubmit` spy).
  2. `submitPhase="flushing"` → nút `Nói lại` có `disabled === true`; nút `Quay lại` có `disabled === false`; nút chính mang nhãn `Đang tải lên bản ghi…` + disabled.
  3. `submitPhase="submitting"` → nhãn `Đang nộp…`; `Nói lại` vẫn disabled; `Quay lại` enabled.
  4. `submitError` đặt + `allowSubmitAnyway` false → message render, nút `Thử lại` gọi `onSubmit` khi click, nút `Vẫn nộp` không render.
  5. `submitError` đặt + `allowSubmitAnyway` true → cả `Thử lại` lẫn `Vẫn nộp` render; `Vẫn nộp` gọi `onSubmitAnyway`.
- Success criteria: test 2, 4, 5 đỏ ở red phase (props chưa tồn tại); test 3 xanh-at-red (Quay lại vốn enabled) — ngoại lệ biết trước.
- Verify: gộp vào Verify phase.

## Verification
- Lệnh: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx src/features/exam/components/__tests__/pre-submit-modal.test.tsx` (chạy từ root repo).
- Pass condition phase (QUY TẮC NGOẠI LỆ, không đối chiếu con số tuyệt đối): exit khác 0; **tất cả** test mới + test viết lại phải ĐỎ vì assertion hành vi (flush/chờ/chặn/nav/label) — **TRỪ** các ngoại lệ xanh-at-red biết trước: `treats an already-submitted rejection as success` và `does not flush or submit when attempt.start failed (offline mock)` ở exam-submit (assertion "Quay lại luôn enable" nằm trong unit test modal và xanh-at-red, nhưng cả test vẫn đỏ vì assertion khác). Không test nào đỏ vì lỗi setup/mock/symbol không tồn tại. Số đếm thực tế đo được: 14 đỏ / 12 xanh (10 exam-submit cũ + already-submitted + offline).
