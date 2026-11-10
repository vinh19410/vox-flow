---
phase: 1
title: "Test đỏ — timeout attempt sync"
status: pending
priority: P1
effort: "45m"
dependencies: []
---

# Phase 1: Test đỏ — timeout attempt sync

## Goal

Hai test mới trong `exam-submit.test.tsx` chứng minh bug và **cả hai đều đỏ trên code chưa fix**: (1.1) sau 15s với `start` treo, nút nộp vẫn khoá; (1.2) sau mốc 15s nhưng trước khi id về, nút vẫn khoá — và khi id về sau đó thì drain + submit phải đúng. Chưa sửa code production trong phase này.

## Files to Create / Modify

- Modify: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` (thêm 2 test vào `describe("ExamScreen submit")`)

## Tests Before (TDD đỏ)

### Task 1.1 — Test timeout mở khoá nút nộp (AC1)

- Goal: sau 15s với `start` treo, nút nộp phải enabled với label khớp `/nộp & chấm/i` (fixture dùng câu ngắn nên là biến thể "Vẫn nộp & chấm").
- Target: test mới `fails the attempt sync after ~15s when attempt.start never answers` trong describe "ExamScreen submit".
- Steps:
  1. `startSpy.mockReturnValue(Promise.withResolvers<{ attemptId: string }>().promise);` (mẫu như test "keeps the recording device-only…").
  2. `renderWithApp(<ExamScreen />, { practice: PRACTICE }); await flush();`
  3. `answerStep();` rồi assert `screen.getByText(/đang đồng bộ phiên thi/i)` có `disabled: true`.
  4. `await act(async () => { await vi.advanceTimersByTimeAsync(15_000); }); await flush();`
  5. `const submitButton = screen.getByText(/nộp & chấm/i); expect(submitButton).toHaveProperty("disabled", false);` rồi click; assert `h.go` với `"scoring"`, `h.setPendingSubmission` với `true`, `h.state().scoringAttempt` `null`, `submitSpy` chưa được gọi.
- Success criteria: test chạy và FAIL ở bước 5 — cơ chế fail: nút vẫn render "Đang đồng bộ phiên thi…" (không khớp `/nộp & chấm/i`) nên `getByText` ném `TestingLibraryElementError` trước mọi assert `disabled`.
- Verify (đỏ có chủ đích): `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` exit non-zero; test trên fail với `TestingLibraryElementError: Unable to find an element with text… /nộp & chấm/i`. FAIL bằng cách khác (ví dụ assert `disabled` sai giá trị) → kiểm tra lại test, không phải bug đã chứng minh.

### Task 1.2 — Test id muộn sau timeout (AC2)

- Goal: tại mốc 15s (đã failed) nút phải unlocked **trước khi** id về (đoạn này đỏ trước fix vì chưa có timer); id về sau đó vẫn `applyAttemptId`: drain `pendingSessionRef` qua `trackAnswerUpload(id)` và submit practice tạo `scoringAttempt` với id đó.
- Target: test mới `applies a late attempt id after the sync timeout already failed`.
- Steps:
  1. `startSpy` trả `Promise.withResolvers` promise; render; `flush()`; `answerStep()` (bản ghi vào device copy qua `saveAudioSpy`).
  2. `await act(async () => { await vi.advanceTimersByTimeAsync(15_000); }); await flush();`
  3. **Assert đỏ then chốt (trước resolve):** `screen.getByText(/nộp & chấm/i)` tồn tại và `disabled: false` — trên code chưa fix bước này ném `TestingLibraryElementError` (vẫn locked).
  4. `await act(async () => { resolveStart({ attemptId: "att-late" }); await vi.advanceTimersByTimeAsync(0); }); await flush();`
  5. Assert `trackUploadSpy` được gọi 1 lần với `("att-late", <recording resolves { attemptId: "att-late", questionKey: "p1-tidiness-0" }>)` (mẫu assertion như test "uploads a session-id recording under the real attempt…").
  6. Click nút /nộp & chấm/i; assert `h.state().scoringAttempt` bằng `{ attemptId: "att-late", submitted: false }`.
- Success criteria: pre-fix test FAIL ở bước 3 (`TestingLibraryElementError`); post-fix toàn test xanh.
- Verify (đỏ có chủ đích): cùng lệnh với Task 1.1; fail đúng ở bước 3 với `TestingLibraryElementError`.

## Refactor

Không refactor trong phase này — chỉ thêm test.

## Regression gate

Chạy toàn bộ file test (không lọc theo tên test): 2 test mới + các test hiện có. Trạng thái mong đợi cuối phase này: đúng 2 test mới đỏ theo cơ chế đã nêu, toàn bộ test cũ xanh.

## Verification

- `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` — exit non-zero, **đúng 2 test mới fail** với đúng cơ chế `TestingLibraryElementError` tại bước unlock-sau-15s (1.1) và unlock-trước-resolve (1.2); không test cũ nào fail.

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
