---
title: "Mock exam: chờ upload xong trước khi nộp (flush trước submit)"
description: "Nhánh mock trong exam-screen gọi flushAnswerUploads trước attempt.submit, chặn nộp khi upload thất bại và surf lỗi trong PreSubmitModal — hết mất câu trả lời sau finalize."
status: completed
priority: P1
effort: 3h
issue: 109
branch: fix/mock-exam-submit-wait-upload
tags: [bugfix, frontend]
blockedBy: []
blocks: []
created: 2026-11-10
---

# 109-mock-submit-flush

## Nguồn

- Issue: https://github.com/vinh19410/vox-flow/issues/109 (bug route, phát hiện khi review PR #105 / fix #94, red-team ElegantFrog F5).
- Route: **bugfix** qua `/ak-fix --auto`. Ship mode: **beta** (PR → `dev`).

## Root cause (đã chứng minh bằng code trace, ak-debug)

1. `apps/web/src/features/exam/exam-screen.tsx:38-44` — nhánh mock (không phải forecast): `void trpcClient.attempt.submit.mutate(...).catch(console.warn)` bắn submit fire-and-forget và `go("scoring")` ngay, **không gọi `flushAnswerUploads`**.
2. `apps/web/src/features/exam/use-exam-session.ts:274` — `void trackAnswerUpload(attemptId, recorded)`: upload chạy nền, có thể còn đang bay (timeout từng request 120s) lúc user bấm nộp.
3. Server `packages/api/src/routers/attempt.ts` — `submit` flip `status → "submitted"` (nhánh `topicId` null chỉ `markSubmitted`). Upload route `apps/server/src/index.ts:147-150` trả **400 "Cannot upload to finalized attempt"** khi `status !== "in_progress"`. Submit cũng đọc snapshot `attempt_answer` để check answer-limits — "an upload that lands after this snapshot is never transcribed either". Flush-trước-submit vì thế là thứ tự đúng duy nhất, không chỉ để né 400.
4. Mock **không có safety net sau submit**: `exam-screen.tsx:36` clear `scoringAttempt` → scoring screen `job = null` → `RecordedState` → `useScoringJob` không chạy → `ensureUploaded`/flush không bao giờ chạy lại. Bản ghi 400 nằm lại device + `failedUploads`, mất khỏi `attempt_answer` vĩnh viễn.
5. Pattern forecast đối chứng: `apps/web/src/features/scoring/use-scoring-job.ts:164-168` — `ensureUploaded` (flush, thất bại → `upload_error`, KHÔNG submit) chạy **trước** `attempt.submit`.
6. Test đang pin hành vi lỗi: `exam-submit.test.tsx` — "keeps the background submit for a mock test and clears any stale scoring attempt".

Baseline: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` — 11/11 pass trên nhánh `dev` (chưa fix).

## Thiết kế chốt (checkpoint #1 GO + checkpoint #2 sau red-team — counsel thay thế do kongming hết hạn mức)

Trong `submit()` của `ExamScreen`, nhánh mock khi `session.attemptId` truthy:

1. **Chặn double-run**: nếu `submitPhase !== "idle"` thì bỏ qua click; nút submit disabled kèm nhãn busy.
2. **`await flushAnswerUploads(attemptId)`** — nút hiện "Đang tải lên bản ghi…".
3. **`failedQuestionKeys.length > 0` → CHẶN nộp**: modal hiện lỗi + nút "Thử lại" (chạy lại flush→submit). KHÔNG có nút "Vẫn nộp" trong trường hợp này (có bằng chứng thiếu dữ liệu).
4. **`storageUnreadable` đơn thuần** (`failedQuestionKeys` rỗng — mọi upload trang này biết đều đã xong; chỉ không đọc được IndexedDB) → **cảnh báo + nút "Vẫn nộp"**: banner "Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ…"; "Vẫn nộp" gọi thẳng `attempt.submit`, KHÔNG flush lại (mirror `submitWithoutMissing` của forecast). Lý do đảo một nửa checkpoint #1: hard-block khi IDB hỏng là wedge vĩnh viễn (retry không bao giờ hết) dù server đủ dữ liệu.
5. **Flush xanh → `await attempt.submit`** — nút "Đang nộp…". Phân loại lỗi:
   - `isAlreadySubmittedError` ("Attempt is already submitted" + `data.code === "BAD_REQUEST"`) → coi là **thành công** (lost-response; **export** helper từ `use-scoring-job.ts` và tái dùng — hết bản copy thứ 3 của cặp string keep-in-sync).
   - BAD_REQUEST khác ("Attempt is abandoned", limit violation — vĩnh viễn) → message riêng KHÔNG dán nhãn lỗi mạng: "Bài thi không thể nộp lúc này…".
   - Lỗi còn lại → "Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại." Cả hai đều cho Thử lại.
6. **Thành công (submit ok hoặc already-submitted)** → `setPendingSubmission(true); go("scoring")`. **Không check hủy ở nhánh thành công**: mock không có màn kết quả riêng (RecordedState chỉ tới qua nav), nên đóng modal giữa "Đang nộp…" rồi submit thành công vẫn nav — terminal surface trung thực.
7. **Hai nguyên nhân hủy tách biệt**:
   - **Quay lại (đóng modal) trong FLUSHING** → vô hiệu run, discard cả thành công lẫn thất bại, reset idle. Attempt còn `in_progress` — an toàn, nộp lại bình thường.
   - **Quay lại trong SUBMITTING** → giữ run; thành công → nav (mục 6); thất bại → discard im lặng (attempt còn `in_progress`, recoverable), error không leak ra modal đã đóng.
   - **Thoát exam (ExitExamModal/ExamHeader) ở bất kỳ pha** → `exitedRef` chặn trọn vẹn: KHÔNG BAO GIỜ nav nền về scoring, KHÔNG set `pendingSubmission`; submit thành công sau exit bị discard (server đã chốt; `attempt.getActive` chỉ trả `in_progress` nên re-enter tạo attempt mới — đã verify attempt.ts:120).
8. **Khóa control ghi dữ liệu khi busy**: nút "Nói lại" trong modal `disabled` khi `submitPhase !== "idle"` (bấm giữa flush chèn take mới SAU snapshot `inFlight` của flush → tái lập đúng race finalize gốc). Nút "Quay lại" luôn enabled (lối thoát duy nhất — flush không có deadline/abort).
9. **Giữ nguyên**: nhánh forecast (`s.practice && attemptId` — scoring screen tự flush); path `attemptStatus === "failed"` (không attemptId → không flush, không submit, nav sync — không regression #94); `submitLocked` cho `attemptStatus === "pending"`.

Thông báo lỗi (tiếng Việt, khớp giọng codebase):
- Thiếu câu trả lời: `Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại.`
- Cảnh báo storage: `Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận.`
- Submit BAD_REQUEST (khác already-submitted): `Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi.`
- Submit lỗi khác: `Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại.`

## Advisor Scope Lock (checkpoint #1 kongming; checkpoint #2 counsel thay thế — planner — do kongming bị external blocker USAGE_PRICING_REQUIRED)

- **Locked**: flush chỉ tại submit trong nhánh mock; chặn nộp khi `failedQuestionKeys > 0`; "Vẫn nộp" chỉ cho storageUnreadable đơn thuần và bypass flush; submit await + surf lỗi; already-submitted = thành công; hai nguyên nhân hủy tách biệt; khóa "Nói lại" khi busy.
- **Non-goals (đã điều chỉnh)**: không sửa `apps/web/src/features/exam/answer-uploads.ts`; không đổi luồng forecast; không đổi server/API; không đưa mock qua scoring screen có job; không flush trong render/effect; không đổi mặc định retry của flush (2 lần × 1.5s/3s, timeout 120s; trade-off đã ghi nhận: busy không deadline, đóng modal không abort flush nền — follow-up). Ngoại lệ có chủ ý: **export** `isAlreadySubmittedError` từ `use-scoring-job.ts` (2 dòng, không đổi hành vi forecast) — qua red-team S3 + counsel.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | TDD — test đỏ cho thứ tự flush→submit và các nhánh lỗi | Pending | [phase-01-tdd-red.md](./phase-01-tdd-red.md) |
| 2 | Hiện thực submit state machine + modal busy/error | Pending | [phase-02-implement-green.md](./phase-02-implement-green.md) |

## Acceptance Criteria

- [ ] Nhánh mock (`attemptId` truthy): `flushAnswerUploads` được gọi và hoàn tất **trước** `attempt.submit`; `attempt.submit` hoàn tất **trước** khi `go("scoring")` (thứ tự được assert trong test).
- [ ] `failedQuestionKeys > 0` → không submit, không nav; modal hiện lỗi + "Thử lại" chạy lại flush→submit thành công; nút "Vẫn nộp" không render.
- [ ] `storageUnreadable` đơn thuần → cảnh báo + nút "Vẫn nộp"; "Vẫn nộp" gọi thẳng submit (flushSpy đúng 1 lần), submit → nav.
- [ ] Submit trả "Attempt is already submitted" → coi là thành công → nav.
- [ ] Submit BAD_REQUEST khác ("Attempt is abandoned") → không nav, message riêng không dán nhãn lỗi mạng.
- [ ] Submit lỗi khác → không nav, lỗi trong modal, retry được.
- [ ] Đóng modal giữa FLUSHING → discard, không nav; giữa SUBMITTING + submit thành công → vẫn nav scoring; + thất bại → discard im lặng.
- [ ] Thoát exam ở bất kỳ pha → không bao giờ nav về scoring nền, không set `pendingSubmission`.
- [ ] Nút "Nói lại" disabled khi busy; "Quay lại" luôn enabled.
- [ ] Path `attemptStatus` failed và path forecast: hành vi giữ nguyên, test cũ giữ xanh (trừ test pin bug được viết lại).
- [ ] `pnpm --filter web test` toàn bộ xanh; `pnpm check-types` exit 0.

## Red Team Review

### Session — 2026-11-10
**Reviewers:** 2 (Security Adversary + Assumption Destroyer — Light tier, Fact Checker role) qua subagent code-reviewer độc lập.
**Findings:** 11 (8 Security + 3 Assumptions) — 11 accepted (một số modified), 0 rejected. 1 Critical thủ tục (công thức Verify đỏ sai — A1), 6 High, 4 Medium.
**Severity breakdown:** 1 Critical, 6 High, 4 Medium.
**Fact-check:** 16 claims sampled — 14 VERIFIED, 2 VERIFIED-with-drift (số dòng lệch nhẹ: index.ts 147-150→154-155; exam-screen 36→38), 1 UNVERIFIED (baseline suite — đã chạy riêng: 11/11 pass), 0 FAILED.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Verify đỏ công thức sai — 2/7 test mới sẽ xanh ở red phase (A1, Critical) | Critical | Accept | Phase 1 Verify (quy tắc ngoại lệ) |
| 2 | `flushMs()` symbol ma → `flush()` (A2) | High | Accept | Phase 1 Task 1.2 |
| 3 | Thoát exam giữa chừng vẫn nav nền (A3) | High | Accept | plan mục 7c; Phase 1 test 11; Phase 2 Task 2.2.9 |
| 4 | Hard-block storageUnreadable = wedge vĩnh viễn khi IDB hỏng; forecast có escape hatch (S1) | High | Accept (modified) | plan mục 4; Phase 1 test 2; Phase 2 Task 2.2.4, 2.3.4-5 |
| 5 | Cancel-mid-submit nuốt thành công server → wedge recovery (S2) | High | Accept (modified) | plan mục 6-7; Phase 1 test 9-10; Phase 2 Task 2.2.6-8 |
| 6 | Copy isAlreadySubmittedError = bản copy thứ 3 string keep-in-sync (S3) | High | Accept | Phase 2 Task 2.1; test pin abandoned (Phase 1 test 5) |
| 7 | "Nói lại" không chịu busy → tái lập race finalize (S4) | High | Accept | plan mục 8; Phase 1 Task 1.4; Phase 2 Task 2.3.3 |
| 8 | `toBeDisabled` không có jest-dom (S5) | Medium | Accept | Phase 1 Task 1.2 (hasAttribute/`.disabled`) |
| 9 | Busy không deadline, hủy không abort flush (S6) | Medium | Accept (partial — follow-up, không sửa answer-uploads) | plan non-goals; issue follow-up |
| 10 | BAD_REQUEST vĩnh viễn bị dán nhãn lỗi mạng (S7) | Medium | Accept | plan mục 5; Phase 1 test 5; Phase 2 Task 2.2.6 |
| 11 | Lý do mock flush sai cơ chế — flush thật fail-soft thành storageUnreadable, không nổ (S8) | Medium | Accept | Phase 1 Task 1.1 |

**Checkpoint #2 (sau gates):** kongming bị external blocker (USAGE_PRICING_REQUIRED, model mặc định hết hạn mức; per-call model override bị tắt) → counsel thay thế bằng subagent `planner` fresh-context. Kết quả: chấp nhận cả 5 điều chỉnh thiết kế với 3 điều kiện bắt buộc (đã áp): (1) "Vẫn nộp" bypass flush hoàn toàn + banner trung thực về sự không chắc chắn + hard-block thắng khi có failedQuestionKeys; (2) tách hai nguyên nhân hủy (`submitRun` vs `exitedRef`) — một cờ duy nhất sẽ làm 2(b)/2(c) mâu thuẫn; (3) Verify phase 1 theo quy tắc ngoại lệ thay vì con số. Thêm: exit → discard trọn vẹn KHÔNG set `pendingSubmission` (consumer duy nhất của cờ là hand-off scoring đã hủy); `getActive` chỉ trả `in_progress` (attempt.ts:120) nên exit-mid-submit không tái hydrate attempt chốt — không cần guard thêm.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-tdd-red.md, phase-02-implement-green.md (sau khi áp findings).
- Decision deltas checked: 7 (storageUnreadable→"Vẫn nộp"; cancel 2-cờ; export helper; khóa Nói lại; message BAD_REQUEST riêng; file test mới pre-submit-modal.test.tsx; test 9/10 thêm assertion trung gian nhãn "Đang nộp…" để đảm bảo đỏ-at-red đúng quy tắc ngoại lệ).
- Reconciled stale references: "Không có override nộp-bất-chấp" (bản cũ) đã thay bằng thiết kế 2 nhánh ở mọi nơi; "hủy = vô hiệu run duy nhất" thay bằng 2-cờ; "copy shape check" thay bằng export; danh sách file phase 1 đã thêm file test modal; công thức Verify đỏ đã thay bằng quy tắc ngoại lệ.
- Unresolved contradictions: 0.
