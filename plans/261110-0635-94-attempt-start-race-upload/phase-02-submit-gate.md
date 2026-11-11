---
title: "Phase 2: attemptStatus + chặn nộp khi đang đồng bộ (TDD)"
status: completed
---

# Phase 2: attemptStatus + chặn nộp khi đang đồng bộ (TDD)

## Goal

Học viên không thể nộp khi phiên thi đang đồng bộ (`attemptStatus === "pending"`); khi `failed` (offline/mock-test) nút mở lại với nhãn thường và nộp theo fall-through cũ — không regression offline (điều kiện bắt buộc của kongming); khi `ready` nộp bình thường.

## Files to Create / Modify

- Modify: `apps/web/src/features/exam/components/pre-submit-modal.tsx` (thêm prop `submitLocked`)
- Modify: `apps/web/src/features/exam/exam-screen.tsx` (truyền `submitLocked`, guard theo `attemptStatus`)
- Modify: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` (2 test mới)

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

## Tests Before (TDD — viết trước, phải đỏ)

### Task 2.1 — Test khoá/mở nộp theo attemptStatus

- Target files: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`.
- Steps:
  1. **Test 6 — "blocks submit while the attempt is syncing"**:
     - `let resolveStart!: (v: { attemptId: string }) => void;` + `startSpy.mockReturnValue(new Promise((resolve) => (resolveStart = resolve)));`
     - Render `{ practice: PRACTICE }`, `await flush()`, `answerStep()` (1 câu → "Hoàn thành" → modal review mở).
     - Expect nút khoá: `expect(screen.getByText(/đang đồng bộ phiên thi/i)).toBeDisabled();`
     - `fireEvent.click(screen.getByText(/đang đồng bộ phiên thi/i));` → expect `h.state().scoringAttempt` `toBeNull()`.
     - `await act(async () => { resolveStart({ attemptId: "att-late" }); await vi.advanceTimersByTimeAsync(0); }); await flush();`
     - Expect nút mở: `screen.getByText(/nộp & chấm/i)` `not.toBeDisabled()`.
     - `fireEvent.click(screen.getByText(/nộp & chấm/i));` → expect `h.state().scoringAttempt` `toEqual({ attemptId: "att-late", submitted: false })` VÀ `trackUploadSpy` đã được gọi (drain đồng bộ trong `applyAttemptId` chạy trước handler submit; assert này khoá invariant — nếu sau này chuyển drain sang effect bất đồng bộ mà bỏ qua flush, assert đỏ).
  2. **Test 7 — "re-enables submit when attempt.start fails (offline/mock)"**:
     - `startSpy.mockRejectedValue(new Error("network down"));`
     - Render `{ practice: PRACTICE }`, `await flush()` (catch → `attemptStatus "failed"`), `answerStep()`.
     - Expect nút `screen.getByText(/nộp & chấm/i)` `not.toBeDisabled()` (nhãn thường, KHÔNG phải "đang đồng bộ").
     - `fireEvent.click(...)` → fall-through cũ: `h.state().scoringAttempt` `toBeNull()`; `h.go` được gọi với `"scoring"`; `h.setPendingSubmission` được gọi với `true`; `submitSpy` không được gọi.
- Success criteria: 2 test tồn tại, biên dịch được.
- Verify: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` — **exit non-zero, fail ở Test 6 và/hoặc Test 7** (đỏ là điều kiện pass của task); các test khác vẫn xanh.

## Implementation Steps

### Task 2.2 — `submitLocked` trong PreSubmitModal + guard theo attemptStatus

- Target files: `apps/web/src/features/exam/components/pre-submit-modal.tsx`, `apps/web/src/features/exam/exam-screen.tsx`.
- Steps:
  1. `pre-submit-modal.tsx`: thêm `submitLocked?: boolean` vào `PreSubmitModalProps` + destructuring default `false`.
  2. Nút accent cuối modal:
     ```tsx
     <Button variant="accent" onClick={onSubmit} disabled={submitLocked}>
       {submitLocked ? "Đang đồng bộ phiên thi…" : flaggedCount ? "Vẫn nộp & chấm" : "Nộp & chấm điểm"} <ArrowRight size={16} />
     </Button>
     ```
     (`Button` spread props; style `disabled:opacity-40` có sẵn.)
  3. `exam-screen.tsx` — trong `submit()`, guard đầu hàm:
     ```ts
     if (session.attemptStatus === "pending") return;
     ```
     KHÔNG guard theo `attemptId` — `failed` phải fall-through như cũ (kongming #1).
  4. `exam-screen.tsx`: truyền `submitLocked={session.attemptStatus === "pending"}` vào `<PreSubmitModal … />`.
- Success criteria: hai path nộp khi `ready` (practice qua `scoringAttempt`, mock qua background submit) hoạt động đúng như trước — test cũ "hands a forecast practice attempt…" và "keeps the background submit…" vẫn xanh.
- Verify: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` — exit 0, toàn bộ test xanh.

## Tests After

Test 6 + Test 7; test cũ của hai path nộp là regression proof.

## Regression gate

`pnpm --filter web test src/features/exam` exit 0 (chạy lại ở Phase 3).
