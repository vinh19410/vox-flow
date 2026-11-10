# Fix #109: mock exam — background submit không chờ upload

**Linked Issues:** Closes #109 · Relates to #94
**Ship Mode:** `beta` → nhánh đích `dev`

## Tóm tắt công việc đầu-cuối

Issue #109 (phát hiện khi review PR #105) → điều tra ak-debug (root cause bằng code trace) → plan TDD 2 phase (`plans/261110-0835-109-mock-submit-flush/plan.md`, validate OK, red-team 2 persona + adjudication) → ak-fix --auto hiện thực theo plan → review local 2 reviewer fresh-context, vá hết High/Medium → verify (test + check-types) → ship PR này tới `dev`.

Bản chất fix: nhánh mock trong `ExamScreen.submit()` giờ `await flushAnswerUploads(attemptId)` **trước** `await attempt.submit`, xong mới chuyển màn — không còn upload bay/bù sau khi attempt finalize (server trả 400 cho upload sau finalize → câu trả lời rơi khỏi chấm vĩnh viễn, vì mock không có đường flush lại như forecast).

## Subagent delegation

| # | Vai trò | Nhiệm vụ | Kết quả |
|---|---------|----------|---------|
| 1 | kongming (checkpoint #1) | Xác nhận root cause + thiết kế flush-trước-submit | GO + 4 khuyến nghị thiết kế |
| 2 | code-reviewer ×2 (red-team plan) | Security Adversary + Assumption Destroyer | 11 findings, 11 accept |
| 3 | planner (counsel thay kongming checkpoint #2 — kongming hết hạn mức model) | Adjudicate 11 findings, 5 điều chỉnh thiết kế | Accept cả 5 + 3 điều kiện |
| 4 | code-reviewer ×2 (local review) | Diff pending: đúng đắn/regression + reliability/UI-logic | 0 Critical / 1 High / 4 Medium / 3 Low |

## Quyết định kỹ thuật

- **Flush-trước-submit là thứ tự đúng duy nhất**, không chỉ né 400: server đọc snapshot `attempt_answer` khi submit (`attempt.ts` comment answer-limits) — upload sau snapshot không bao giờ được chấm.
- **"Vẫn nộp" cho `storageUnreadable` đơn thuần** (mirror `submitWithoutMissing` của forecast): storageUnreadable chỉ = không đọc được IndexedDB, không có bằng chứng thiếu; hard-block khi IDB hỏng là wedge vĩnh viễn. `failedQuestionKeys > 0` thì vẫn chặn cứng.
- **Already-submitted coi là thành công** (lost-response): export `isAlreadySubmittedError`/`isBadRequestError` từ `use-scoring-job.ts` thay vì copy — diệt bản copy thứ 3 của cặp string keep-in-sync với server.
- **Hai nguyên nhân hủy tách biệt**: đóng modal giữa FLUSHING → discard run (attempt còn `in_progress`, nộp lại bình thường); giữa SUBMITTING → run sống (thành công → vẫn nav vì server đã chốt; thất bại → discard im lặng). Thoát exam ở pha nào cũng không bao giờ nav nền (`exitedRef`).
- **Khóa "Nói lại" khi busy**: bấm nói lại giữa flush chèn take mới sau snapshot `inFlight` của flush → tái lập đúng race finalize gốc.

## Lệch so với plan

- Phase-1 Verify chuyển từ "công thức số đỏ/xanh" sang "quy tắc ngoại lệ" sau red-team (A1: 2 test mới sẽ xanh-at-red vì khớp hành vi hiện tại).
- Thêm 2 test sau review local (không có trong plan ban đầu): phục hồi sau abandon-mid-flush (CR2-M1) và thoát exam giữa FLUSHING (CR1-M2/CR2-M2) — cả hai là gap test, code đã đúng.
- `submitError` khi submit thất bại giữa modal đóng được gate theo `reviewOpenRef` (CR1-H1) — cụ thể hóa điều kiện discard-im-lặng của plan, không đổi ý thiết kế.

## Bằng chứng hoàn thành

Acceptance criteria → bằng chứng (đủ trong CI/test):

| AC | Bằng chứng |
|----|-----------|
| Flush trước submit, submit trước nav | test `flushes every answer upload before submitting a mock test` (promise-gate + assert trung gian) |
| `failedQuestionKeys > 0` → chặn + Thử lại, không có "Vẫn nộp" | test `blocks submit and offers a retry when uploads still fail after retries` |
| `storageUnreadable` đơn thuần → cảnh báo + "Vẫn nộp" bypass flush | test `offers submit anyway when the device storage cannot be read` (flushSpy đúng 1 lần) |
| Already-submitted = thành công | test `treats an already-submitted rejection as success` |
| BAD_REQUEST vĩnh viễn → message riêng | test `distinguishes a permanent rejection from a network error` |
| Đóng modal giữa FLUSHING/SUBMITTING × thành công/thất bại | 3 test close-mid-* (kèm assert mở lại không hồi sinh lỗi) |
| Thoát exam → không nav nền, không flush-orphan submit | test `never navigates after exiting the exam mid-submit` + `never submits after exiting the exam mid-flush` |
| Double-click 1 submit | test `ignores a second submit click while one is already running` |
| Offline/failed-path + forecast giữ nguyên | test cũ `re-enables submit when attempt.start fails…`, `blocks submit while the attempt is syncing`… giữ xanh không sửa |
| "Nói lại" khóa khi busy; "Quay lại" luôn mở | unit test `pre-submit-modal.test.tsx` |

Lệnh + kết quả:

```
pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx src/features/exam/components/__tests__/pre-submit-modal.test.tsx
  → Test Files 2 passed, Tests 28 passed (26/26 trước khi thêm 2 test gap)
pnpm --filter web test
  → Test Files 38 passed, Tests 310 passed
pnpm check-types
  → 7/7 tasks successful (web kèm vite build), exit 0
```

UI thay đổi (modal + nhãn nút) — screenshot: Not run (không có môi trường browser trong session này; thay đổi UI giới hạn trong PreSubmitModal đã được unit test khóa + sẽ soát lại ở ak-review-pr).

## Checklist

- [x] Root cause chứng minh bằng code trace (ak-debug)
- [x] Plan validate + red-team + consistency sweep (0 contradiction)
- [x] TDD: red phase 14 đỏ đúng assertion hành vi, rồi 28/28 xanh
- [x] Full suite web 310/310; `pnpm check-types` exit 0
- [x] Review local 2 reviewer; High/Medium đã vá; 2 Low reject có lý do (FORBIDDEN unreachable trong luồng thường — thêm phân loại là scope creep; `onSubmitAnyway` optional chỉ 1 callsite luôn truyền)
- [x] Không sửa server/API, không sửa `answer-uploads.ts`, không đổi luồng forecast
- [x] Docs: skipped — beta mode, không đổi contract public/API/agent context
- [ ] Screenshot 3 viewport light/dark — chuyển sang POT comment trên issue #109 sau merge theo quy trình repo

## Human actions required

None — merge + watch CI do pipeline `ak-vibe --ship --beta` tiếp quản.
