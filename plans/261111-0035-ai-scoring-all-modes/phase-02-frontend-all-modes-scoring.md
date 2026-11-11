---
phase: 2
title: "Phase 2: Frontend — Hand-off chấm điểm cho Thi thử, đồng bộ ITEMS & giao diện Kết quả"
status: completed
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 2: Frontend — Hand-off chấm điểm cho Thi thử, đồng bộ ITEMS & giao diện Kết quả

## Goal

Nộp bài thi thử trên web chuyển tiếp mượt sang màn tiến trình chấm (`submitted: true`) trong khi giữ nguyên cơ chế flush/hủy/thoát của `#109`, đồng bộ `ITEMS` từ `@vox-flow/api/scoring/mock-exam-bank`, hiển thị đúng nhãn chế độ thi trên `ResultsScreen` và cho phép kích hoạt chấm điểm đối với các bài `submitted` chưa có điểm (`not_scored`).

## Files to Create / Modify

- Create: `apps/web/src/features/exam/__tests__/mock-keys-parity.test.ts`
- Modify: `apps/web/src/features/exam/data.ts`
- Modify: `apps/web/src/features/exam/exam-screen.tsx`
- Modify: `apps/web/src/features/scoring/scoring-screen.tsx`
- Modify: `apps/web/src/features/results/results-screen.tsx`
- Modify: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`
- Modify: `apps/web/src/features/results/__tests__/scored-results.test.tsx`

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

### Task 2.1 — Viết test parity cho `ITEMS` và cập nhật test đỏ cho `ExamScreen` & `ResultsScreen` (`TDD Red`)

- **Goal:** Khóa hành vi hand-off `submitted: true` cho thi thử, nhãn eyebrow theo mode, trạng thái `not_scored` có nút `"Chấm điểm ngay"`, và kiểm tra đối xứng key giữa web và server bằng builder dùng chung.
- **Target files and symbols:**
  - Create `apps/web/src/features/exam/__tests__/mock-keys-parity.test.ts`
  - Modify `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`
  - Modify `apps/web/src/features/results/__tests__/scored-results.test.tsx`
- **Steps:**
  1. Tạo `apps/web/src/features/exam/__tests__/mock-keys-parity.test.ts`:
     - Ánh xạ từng mode của `MODES` (`full` → `"full"`, `p1` → `"part1"`, `p2` → `"part2"`, `p3` → `"part3"`).
     - Import `buildMockExamStepKeys` từ `@vox-flow/api/scoring/mock-exam-bank` (nguồn dùng chung với server-side allowlist — không tự sao chép logic của `use-exam-session` vào test).
     - Dựng danh sách step key từ `ITEMS` theo cùng quy tắc lọc `parts` và nối `${item.id}-f` như `use-exam-session.ts:50-57`, rồi assert tập key này bằng chính xác `buildMockExamStepKeys(apiMode)` (chống drift khi `use-exam-session` hoặc ngân hàng câu hỏi thay đổi); đồng thời assert `resolveCanonicalMockQuestionText(step.key, apiMode)` luôn khác `null` cho mọi step.
  2. Trong `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` (neo theo **tên test**, không theo dòng):
     - Tại test `"flushes every answer upload before submitting a mock test"`: cập nhật kỳ vọng `expect(h.state().scoringAttempt)` từ `.toBeNull()` sang `.toEqual({ kind: "attempt", attemptId: "att-mock", submitted: true })` (chứng minh job cũ `"att-old"` bị thay thế bằng job chấm điểm thật của lượt thi thử vừa nộp).
     - Tại test `"offers submit anyway when the device storage cannot be read"`: cập nhật kỳ vọng tương tự sang `.toEqual({ kind: "attempt", attemptId: "att-mock", submitted: true })`.
     - Tại test `"treats an already-submitted rejection as success"`: bổ sung assert `expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: "att-mock", submitted: true })`.
     - Thêm test `"surfaces the permanent submit error instead of navigating when the attempt has no answers"`: `submitSpy` reject `BAD_REQUEST` `"Attempt has no recorded answers"` → `h.go` KHÔNG được gọi với `"scoring"`, hiển thị `"Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi."`.
  3. Trong `apps/web/src/features/results/__tests__/scored-results.test.tsx`:
     - Cập nhật test `"keeps the saved-attempt state for attempts that are not scored"` thành 2 kịch bản rõ ràng:
       a) `"offers Chấm điểm ngay when a submitted attempt is not_scored yet"` (`status("not_scored", true)`): render `data-testid="results-not-scored"`, bấm `"Chấm điểm ngay"` gọi `scoring.retry({ attemptId: ATTEMPT })`, gán `scoringAttempt = { kind: "attempt", attemptId: ATTEMPT, submitted: true }` và điều hướng `go("scoring")`.
       b) `"keeps the saved-attempt fallback when the server marks an attempt non-scorable"` (`status("not_scored", false)`): vẫn render `"Tính năng chấm điểm AI sắp ra mắt"` để bảo toàn khả năng tương thích ngược khi lệch phiên bản.
       c) `"keeps the neutral saved-attempt card for an in-progress attempt without a score"` (`status("not_scored", true)` nhưng helper trả thêm `attemptStatus: "in_progress"`): vẫn render card trung lập, KHÔNG hiện `results-not-scored`.
     - Thêm test kiểm tra eyebrow của kết quả đã chấm:
       a) Khi `RESULT` có `topicId: "p1-tidiness"` → hiển thị `"Kết quả · Luyện đề Forecast ·"`.
       b) Khi `RESULT` có `topicId: null, mode: "full"` → hiển thị `"Kết quả · Thi thử Full Test ·"`, và `topicId: null, mode: "part2"` → hiển thị `"Kết quả · Thi thử Part 2 ·"`.
- **Success criteria:** `mock-keys-parity.test.ts` pass ngay (do `MOCK_EXAM_PROMPTS` khớp `ITEMS`), còn `exam-submit.test.tsx` và `scored-results.test.tsx` đều FAIL đúng ở các assertion mới.
- **Verify:**
  - `pnpm --filter web test src/features/exam/__tests__/mock-keys-parity.test.ts` thoát mã `0`.
  - `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` thoát mã khác 0.
  - `pnpm --filter web test src/features/results/__tests__/scored-results.test.tsx` thoát mã khác 0.

### Task 2.2 — Dựng `ITEMS` từ `MOCK_EXAM_PROMPTS` và nối hand-off chấm điểm trong `ExamScreen` (`TDD Green`)

- **Goal:** `ITEMS` trên web lấy câu hỏi/cue/followUp trực tiếp từ `@vox-flow/api/scoring/mock-exam-bank` và `ExamScreen` bàn giao `{ kind: "attempt", attemptId, submitted: true }` cho `ScoringScreen` sau khi nộp bài thi thử.
- **Target files and symbols:**
  - Modify `apps/web/src/features/exam/data.ts` (`ITEMS`)
  - Modify `apps/web/src/features/exam/exam-screen.tsx` (`doSubmit`)
  - Modify `apps/web/src/features/scoring/scoring-screen.tsx` (cập nhật chú thích `RecordedState`)
- **Steps:**
  1. Trong `apps/web/src/features/exam/data.ts`:
     - Import `MOCK_EXAM_PROMPTS` từ `@vox-flow/api/scoring/mock-exam-bank`.
     - Giữ map `SAMPLE_ANSWERS` phía client cho trường demo `answer` (và `followUp.answer`), dựng `ITEMS: ExamItem[]` bằng cách ghép từng phần tử của `MOCK_EXAM_PROMPTS` với `SAMPLE_ANSWERS` tương ứng (bảo đảm file vẫn `< 200` dòng và không đổi bất kỳ text nào trên UI).
  2. Trong `apps/web/src/features/exam/use-exam-session.ts`:
     - Kiểm tra lại đoạn dựng step thủ công (`dòng 49-57`): với nhánh mock (`source = ITEMS`), tập key sinh ra phải trùng khớp `buildMockExamStepKeys(mode)` (được test parity khóa ở Task 2.1); không thay đổi hành vi sinh step cho forecast (`s.practice.items`). Chỉ sửa nếu test parity phát hiện drift.
  3. Trong `apps/web/src/features/exam/exam-screen.tsx`:
     - Trong `doSubmit(attemptId)` (`dòng 82-88`), ngay trước `setPendingSubmission(true); go("scoring");`, thêm:
       `set({ scoringAttempt: { kind: "attempt", attemptId, submitted: true } });`
     - Giữ nguyên việc xóa `scoringAttempt` cũ ở đầu `submit()` / `submitAnyway()` để nếu quá trình flush/submit bị hủy hoặc thất bại thì job cũ không còn tồn đọng.
  4. Trong `apps/web/src/features/scoring/scoring-screen.tsx`: cập nhật docstring của `RecordedState` phản ánh đúng vai trò hiện tại (truy cập trực tiếp `/scoring` không có job hoặc fallback lệch phiên bản `not_scorable`).
- **Success criteria:** `exam-submit.test.tsx` và `mock-keys-parity.test.ts` pass 100%.
- **Verify:**
  - `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` thoát mã `0`.
  - `pnpm --filter web test src/features/exam/__tests__/mock-keys-parity.test.ts` thoát mã `0`.

### Task 2.3 — Cập nhật `ResultsScreen` cho trạng thái `not_scored` và nhãn chế độ thi (`TDD Green`)

- **Goal:** Màn kết quả hiển thị đúng chế độ thi thử / Forecast và cho phép bấm `"Chấm điểm ngay"` đối với bài `submitted` chưa có điểm.
- **Target files and symbols:**
  - Modify `apps/web/src/features/results/results-screen.tsx` (`apiModeLabel`, `ResultsScreen`)
- **Steps:**
  1. Thêm hàm thuần `apiModeLabel(mode?: string): string` ngay trong `results-screen.tsx`:
     - `"full"` → `"Thi thử Full Test"`
     - `"part1"` → `"Thi thử Part 1"`
     - `"part2"` → `"Thi thử Part 2"`
     - `"part3"` → `"Thi thử Part 3"`
     - Mặc định → `"Thi thử"`
  2. Trong khối `if (remoteEnabled && !scored)` của `ResultsScreen` (ngay sau nhánh `status.status === "failed"` tại `dòng 182`), thêm nhánh cho `if (status.scorable && status.status === "not_scored")` trả về Card có `data-testid="results-not-scored"` với `EmptyState`:
     - `title="Bài thi chưa được chấm điểm"`
     - `description="Bài thi của bạn đã được lưu đầy đủ. Bạn có thể yêu cầu chấm điểm AI ngay bây giờ."`
     - `action={{ label: retrying ? "Đang gửi yêu cầu…" : "Chấm điểm ngay", onClick: () => void retryScoring(), disabled: retrying }}`
     - `secondaryAction={{ label: "Về trang chủ", onClick: () => go("dashboard"), variant: "outline" }}`
     - Hiển thị `{retryError && <p role="alert" ...>{retryError}</p>}` giống nhánh `failed`.
  3. Cập nhật biến `eyebrow` (`dòng 259-263`):
     - Khi `scored` khác `null`:
       `scored.topicId ? \`Kết quả · Luyện đề Forecast · ${new Date(scored.scoredAt).toLocaleDateString("vi-VN")}\` : \`Kết quả · ${apiModeLabel(scored.mode)} · ${new Date(scored.scoredAt).toLocaleDateString("vi-VN")}\``
- **Success criteria:** `scored-results.test.tsx`, toàn bộ test suite `apps/web`, và `pnpm check-types` đều pass, không file component nào trong `apps/web/src/{features,layouts,components/ds}` bị đẩy vượt ngân sách dòng nếu có thể giữ gọn (lưu ý `results-screen.tsx` đã có sẵn ~395 dòng từ trước).
- **Verify:**
  - `pnpm --filter web test src/features/results/__tests__/scored-results.test.tsx` thoát mã `0`.
  - `pnpm --filter web test` thoát mã `0`.
  - `pnpm check-types` thoát mã `0`.

## Verification

- `pnpm --filter web test` → exit `0`.
- `pnpm --filter server test` → exit `0`.
- `pnpm check-types` → exit `0`.

### Whole-Plan Consistency Sweep (sau Red-Team 2026-11-11)
- Files reread: plan.md, phase-01-backend-all-modes-scoring.md, phase-02-frontend-all-modes-scoring.md.
- Decision deltas checked: 9 (zero-answer 400; fail-closed mode lạ; golden literals; `attemptStatus`; bỏ test part2; cơ chế thay fixture; card not_scored; non-goals chi phí; parity builder dùng chung).
- Reconciled stale references: neo dòng `154/208/224` → tên test; "mode lạ trả null" → tập rỗng; "TOPIC_LESS_CAP dự phòng mode lạ" → chỉ còn deleted-forecast-topic.
- Unresolved contradictions: 0.
