---
title: "Phase 1: TDD — test đỏ cho local_only hand-off và shape union"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: TDD — test đỏ cho local_only hand-off và shape union

## Goal
Mọi hành vi mục tiêu được khóa bằng test: (a) submit không attemptId → hand-off `local_only`, (b) ScoringScreen render state trung thực cho `local_only`, (c) schema union + legacy transform của sessionStorage, (d) seeds `useScoringJob` mang `kind: "attempt"`. Các test hành vi mới chạy ĐỎ đúng assertion khóa hành vi; mọi test khác vẫn xanh (red-team: chỉ vá shape những chỗ xanh-an-toàn ở phase này — mọi assertion `toEqual` trên state do production ghi được dời sang phase-02 để không làm đỏ thêm test cũ).

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
- Modify: `apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx`
- Modify: `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`
- Modify: `apps/web/src/features/scoring/__tests__/use-scoring-job.test.ts`
- KHÔNG sửa file production trong phase này.
- KHÔNG sửa `apps/web/src/features/results/__tests__/scored-results.test.tsx` và các assertion/seed shape cũ khác trong phase này — chúng được vá ở phase-02 sau khi production emit `kind` (red-team finding: `toEqual` phải khớp 2 chiều, vá sớm sẽ làm đỏ test cũ).

## Tasks & Steps

### Task 1.1 — exam-submit: 2 test hand-off `local_only`
- Goal: submit không attemptId (cả 2 nguyên nhân — start reject và sync timeout) đẩy `{ kind: "local_only" }` vào `scoringAttempt` trước khi nav.
- Target files: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`.
- Steps:
  1. Sửa test `re-enables submit when attempt.start fails (offline/mock)` (hiện tại dòng ~677, đang assert `h.state().scoringAttempt` là `null` ở dòng ~686): đổi tên thành `hands a local-only job to the scoring screen when attempt.start fails`; giữ setup `startSpy.mockRejectedValue(...)`; thay assertion `toBeNull()` bằng `expect(h.state().scoringAttempt).toEqual({ kind: "local_only" })`; giữ nguyên các assert còn lại (`go("scoring")`, `setPendingSubmission(true)`, `submitSpy` không gọi).
  2. Sửa test `fails the attempt sync after ~15s when attempt.start never answers` (dòng ~705, assert `scoringAttempt` null ở dòng ~721): sau phần timeout hiện có, thêm bước click nộp (như test 1) và assert `h.state().scoringAttempt` là `{ kind: "local_only" }`. Đây đúng là kịch bản issue #119: sync treo >15s → failed → nộp.
  3. KHÔNG đụng vào assertion/seed shape khác trong file này (dòng 93, 123, 187, 673, 761) — vá ở phase-02.
- Success criteria: 2 test sửa ở bước 1-2 ĐỎ vì `scoringAttempt` là `null` (hành vi cũ không set job); toàn bộ test khác của file vẫn xanh.
- Verify: gộp vào Verify phase.

### Task 1.2 — scoring-screen: test render trung thực cho `local_only`
- Goal: `local_only` render `LocalOnlyState` trung thực; `null` và `not_scorable` giữ nguyên `RecordedState`.
- Target files: `apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx`.
- Steps:
  1. Thêm test mới trong `describe("ScoringScreen (forecast practice scoring)")` (cuối file, cạnh 2 test RecordedState dòng ~471-483): `renders an honest local-only state instead of the recorded copy when the exam was submitted without an attempt`.
  2. Setup: `renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "local_only" } })`; `await advance(0);` (helper có sẵn trong file).
  3. Assert: `screen.getByText("Chưa gửi được bài thi lên máy chủ")` tồn tại; `screen.getByText(/lưu tạm trên thiết bị này/)` tồn tại (copy hedged "có thể vẫn còn lưu tạm…"); `screen.queryByText("Bài thi đã được ghi nhận!")` là `null`; `screen.queryByText(/Gửi lại/)` là `null` (không hứa action chưa build); nút `Về trang chủ` và `Luyện thêm đề khác` tồn tại.
  4. KHÔNG sửa 21 seed cũ thiếu `kind` trong file này (dòng 74, 108, 127, 153, 168, 181, 193, 200, 213, 234, 246, 262, 284, 297, 309, 348, 399, 412, 429, 459, 473) và các assertion shape — call-site chưa narrow nên chúng vẫn chạy đúng ở red; vá ở phase-02 Task 2.7.
  5. Không sửa 2 test RecordedState hiện có (`falls back to the recorded state…` dòng ~471, `keeps the unchanged recorded state…` dòng ~479) — chúng là guard cho AC-3.
- Success criteria: test mới ĐỎ ở red vì nhánh render cũ không có `local_only` (assert `getByText("Chưa gửi được bài thi lên máy chủ")` fail; kèm theo đó assert phụ như `submitSpy` không gọi cũng có thể fail vì hook cũ nhận job lạ — đỏ vì assertion hành vi là đúng ý); 2 test RecordedState cũ vẫn xanh.
- Verify: gộp vào Verify phase.

### Task 1.3 — state-and-data: schema union + legacy transform
- Goal: sessionStorage round-trip giữ `kind`; payload cũ thiếu `kind` hydrate thành `attempt`; key storage là `-v3`.
- Target files: `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`.
- Steps:
  1. Sửa test persist/rehydrate (dòng ~262-269): `set({ scoringAttempt: { kind: "attempt", attemptId: "att-forecast", submitted: true } })`; assertion remount expect `{ kind: "attempt", attemptId: "att-forecast", submitted: true }`.
  2. Thêm test mới `migrates a scoring attempt persisted before the kind field`: ghi thẳng sessionStorage raw `PROTO_STORAGE_KEY` với payload cũ `{ mode: <giá trị hợp lệ theo ModeSchema trong file>, voice: <giá trị hợp lệ>, scoringAttempt: { attemptId: "att-old", submitted: true } }` (copy cách test `hydrates initial state…` set các field khác), mount hook → `result.current.s.scoringAttempt` là `{ kind: "attempt", attemptId: "att-old", submitted: true }`.
  3. Thêm test mới `keeps a local-only scoring job across rehydration`: set `{ scoringAttempt: { kind: "local_only" } }` → unmount → remount → vẫn `{ kind: "local_only" }`.
- Success criteria: cả 3 test ĐỎ ở red phase — schema cũ strip `kind` khi hydrate (zod object mặc định strip unknown key) nên round-trip mất `kind`; không có transform cho payload cũ; `{kind:"local_only"}` parse-fail rơi về base `null`.
- Verify: gộp vào Verify phase.

### Task 1.4 — use-scoring-job: seed `kind: "attempt"`
- Goal: hook consumer seeds mang shape mới (tham số truyền thẳng vào hook — không qua production ghi — nên xanh-at-red an toàn; red-team đã xác minh).
- Target files: `apps/web/src/features/scoring/__tests__/use-scoring-job.test.ts`.
- Steps: dòng ~49, ~70, ~91: `{ attemptId: ATTEMPT, submitted: false|true }` → thêm `kind: "attempt"`.
- Success criteria: file vẫn chạy; các test này XANH cả red lẫn green (ngoại lệ biết trước, không phải verify fail).
- Verify: gộp vào Verify phase.

## Verification
- Lệnh (chạy từ root worktree):
  `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx src/features/scoring/__tests__/scoring-screen.test.tsx src/features/scoring/__tests__/use-scoring-job.test.ts src/features/app-state/__tests__/state-and-data.test.ts`
- Pass condition (QUY TẮC NGOẠI LỆ — đỏ là kết quả MONG MUỐN của red phase): exit khác 0; đúng 6 test sau ĐỎ vì assertion hành vi:
  1. `hands a local-only job to the scoring screen when attempt.start fails`
  2. `fails the attempt sync after ~15s when attempt.start never answers`
  3. `renders an honest local-only state instead of the recorded copy when the exam was submitted without an attempt`
  4. test persist/rehydrate đã sửa (round-trip mất `kind`)
  5. `migrates a scoring attempt persisted before the kind field`
  6. `keeps a local-only scoring job across rehydration`
  Toàn bộ test KHÁC trong 4 file phải XANH — đặc biệt: 2 test RecordedState (`falls back…`, `keeps the unchanged…`), các test forecast/mock-flush của exam-submit, các test use-scoring-job sau khi thêm `kind`. Không test nào đỏ vì lỗi setup/mock/symbol không tồn tại (vitest không typecheck — file phải chạy được).
