---
title: "Phase 2: Hiện thực submit state machine + modal busy/error"
status: completed
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 2: Hiện thực submit state machine + modal busy/error

## Goal
Nhánh mock của `ExamScreen.submit()` flush trước khi submit, chặn nộp khi thiếu câu trả lời, cho "Vẫn nộp" khi chỉ không đọc được storage, surf lỗi trong `PreSubmitModal`, chờ submit xong mới nav; hai nguyên nhân hủy (đóng modal vs thoát exam) xử lý riêng; toàn bộ suite web + check-types xanh.

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
- Modify: `apps/web/src/features/exam/exam-screen.tsx` (hàm `submit`, state, props truyền vào `PreSubmitModal`, wrapper `onClose` + `exitExam`)
- Modify: `apps/web/src/features/exam/components/pre-submit-modal.tsx` (props busy/error/allowSubmitAnyway + nút Thử lại/Vẫn nộp + disable Nói lại khi busy)
- Modify: `apps/web/src/features/scoring/use-scoring-job.ts` (CHỈ thêm `export` cho `isAlreadySubmittedError` — không đổi logic nào; phá non-goal 1-file có chủ ý, đã qua red-team S3 + counsel)
- Không sửa: `apps/web/src/features/exam/answer-uploads.ts`, mọi file server/API, hành vi luồng forecast.

## Tasks & Steps

### Task 2.1 — Export helper already-submitted
- Goal: hết bản copy thứ 3 của cặp string/API đồng bộ critical.
- Target files: `apps/web/src/features/scoring/use-scoring-job.ts` (dòng 94: `function isAlreadySubmittedError` → `export function isAlreadySubmittedError`).
- Steps:
  1. Thêm `export` vào khai báo. Không sửa body, không đổi message.
  2. `exam-screen.tsx` import `{ isAlreadySubmittedError }` từ `@/features/scoring/use-scoring-job` (và `flushAnswerUploads` từ `./answer-uploads`).
- Success criteria: `grep -n "export function isAlreadySubmittedError" apps/web/src/features/scoring/use-scoring-job.ts` có 1 match; không thay đổi nào khác trong file.
- Verify: gộp vào Task 2.4.

### Task 2.2 — State machine submit trong `ExamScreen` (hai nguyên nhân hủy tách biệt)
- Goal: `submit()` nhánh mock chạy tuần tự flush → submit → nav; hai cờ hủy riêng: `submitRun` (đóng modal giữa FLUSHING = discard) và `exitedRef` (thoát exam = discard trọn vẹn, không bao giờ nav nền).
- Target files: `apps/web/src/features/exam/exam-screen.tsx` (function `ExamScreen`).
- Steps:
  1. Thêm state: `submitPhase: "idle" | "flushing" | "submitting"`, `submitError: string | null`, `storageWarning: boolean` (true khi lỗi flush là storageUnreadable đơn thuần). Thêm ref: `submitRunRef` (số hiệu run), `exitedRef = useRef(false)`.
  2. Đầu `submit()`: giữ guard `attemptStatus === "pending"` return; giữ nguyên nhánh forecast; giữ `if (s.scoringAttempt) set({ scoringAttempt: null });`. Nếu `!session.attemptId` → `setPendingSubmission(true); go("scoring"); return;` (path offline/failed giữ nguyên — không flush, không submit, nav sync).
  3. Nhánh có `attemptId`: nếu `submitPhase !== "idle"` return (double-click guard). Định nghĩa `const run = ++submitRunRef.current;` và `const runValid = () => submitRunRef.current === run;`. Chạy hàm async (dùng `void (async () => {...})()`):
  4. **Pha flush**: `setSubmitPhase("flushing"); setSubmitError(null); setStorageWarning(false);` → `const result = await flushAnswerUploads(session.attemptId);` → nếu `!runValid()` return (đóng modal giữa flush = discard cả thành công lẫn thất bại). Nếu `result.failedQuestionKeys.length > 0` → `setSubmitPhase("idle"); setSubmitError("Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại."); return;` (hard-block — có bằng chứng thiếu; KHÔNG render nút Vẫn nộp). Nếu `result.storageUnreadable` (khi `failedQuestionKeys` rỗng) → `setSubmitPhase("idle"); setStorageWarning(true);` (cảnh báo + nút Vẫn nộp, KHÔNG auto-submit). Else → sang pha submit (bước 6).
  5. **Hành động "Vẫn nộp"** (`submitAnyway()` riêng): nếu `submitPhase !== "idle"` return; tăng run mới như bước 3; gọi thẳng bước 6 — **không gọi `flushAnswerUploads` lần nào nữa** (re-flush deterministically trả cùng kết quả).
  6. **Pha submit** (dùng chung): `setSubmitPhase("submitting");` → `try { await trpcClient.attempt.submit.mutate({ attemptId: session.attemptId }); } catch (err) { nếu `exitedRef.current` return (discard im lặng — server tự xử lý, không nav, không state); nếu `isAlreadySubmittedError(err)` → coi như thành công (rơi xuống bước thành công); else → `setSubmitPhase("idle");` + `setSubmitError` theo phân loại: `err` có `data.code === "BAD_REQUEST"` (không khớp already-submitted) → `"Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi."`; còn lại → `"Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại."`; return; }`.
  7. **Thành công** (submit ok hoặc already-submitted): nếu `exitedRef.current` → return (discard trọn vẹn: KHÔNG nav, KHÔNG `setPendingSubmission` — consumer duy nhất của cờ là hand-off scoring screen mà exit đã hủy). Else → `setSubmitPhase("idle"); setSubmitError(null); setStorageWarning(false); setPendingSubmission(true); go("scoring");`. **Không check `runValid()` ở nhánh thành công**: đóng modal trong lúc "Đang nộp…" rồi submit thành công → vẫn nav (attempt đã chốt trên server; kéo về RecordedState là terminal surface trung thực — mock không có màn kết quả riêng).
  8. `closeReview()` (wrapper `onClose` mới của `PreSubmitModal`): `session.setReview(false);` + nếu `submitPhase === "flushing"`: `submitRunRef.current += 1; setSubmitPhase("idle"); setSubmitError(null); setStorageWarning(false);`. Nếu đang `"submitting"`: giữ nguyên phase/run (completion sẽ nav hoặc lưu error — modal mở lại sẽ thấy). Nếu idle: chỉ setReview.
  9. `exitExam()` (sửa hàm hiện có): `exitedRef.current = true;` + nếu đang `"flushing"`: `submitRunRef.current += 1; setSubmitPhase("idle");` + giữ nguyên logic điều hướng cũ (`set({ practice: null }); go(target);`). KHÔNG set `pendingSubmission` ở bất kỳ path exit nào.
- Success criteria: toàn bộ logic trên có mặt; forecast/failed-path không đổi.
- Verify: gộp vào Task 2.4.

### Task 2.3 — `PreSubmitModal`: busy/error/Vẫn nộp + khóa Nói lại khi busy
- Goal: modal hiện nhãn busy theo phase, slot lỗi phân loại, hai nút retry theo ngữ cảnh; mọi control ghi answers khóa khi busy; "Quay lại" luôn là lối thoát.
- Target files: `apps/web/src/features/exam/components/pre-submit-modal.tsx`.
- Steps:
  1. Thêm props: `submitPhase?: "idle" | "flushing" | "submitting"` (default `"idle"`), `submitError?: string | null` (default `null`), `allowSubmitAnyway?: boolean` (default `false`), `onSubmitAnyway?: () => void`.
  2. Nút submit chính: `disabled={submitLocked || submitPhase !== "idle"}`; nhãn: `submitLocked` → "Đang đồng bộ phiên thi…" (giữ nguyên); `submitPhase === "flushing"` → "Đang tải lên bản ghi…"; `submitPhase === "submitting"` → "Đang nộp…"; else nhãn cũ.
  3. Nút `Nói lại` per-question (dòng 56-59): thêm `disabled={submitPhase !== "idle"}`. Nút `Quay lại`: giữ nguyên KHÔNG disable (lối thoát duy nhất khỏi busy — flush không có deadline/abort).
  4. Slot lỗi khi `submitError` truthy (render trên hàng nút, style `bg-warn-soft`/`text-warn`, icon `TriangleAlert` đã import): message + nút `Thử lại` (gọi `onSubmit`, không disabled). Khi `allowSubmitAnyway` true: thêm nút `Vẫn nộp` (gọi `onSubmitAnyway`; nút này render cả khi chỉ có `storageWarning` mà chưa có `submitError` — xem bước 5).
  5. Banner cảnh báo khi `allowSubmitAnyway` true: `Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận.` (trung thực về sự không chắc chắn — KHÔNG khẳng định "máy chủ đã đủ"). Khi `failedQuestionKeys > 0` → `allowSubmitAnyway` false → banner này không render, chỉ message lỗi thiếu.
  6. `exam-screen.tsx` truyền: `submitPhase`, `submitError`, `allowSubmitAnyway={storageWarning}`, `onSubmitAnyway={submitAnyway}`, `onClose={closeReview}`.
- Success criteria: mọi nhãn/disabled khớp test phase 1; `submitLocked` mechanics giữ nguyên.
- Verify: gộp vào Task 2.4.

### Task 2.4 — Xanh toàn bộ + regression
- Goal: toàn bộ test phase 1 xanh, suite web xanh, types sạch.
- Target files: không sửa thêm (chỉ chạy).
- Steps:
  1. Chạy 2 file test phase 1; sửa code (không sửa test) tới khi xanh.
  2. Chạy toàn bộ suite web để bắt regression forecast/#94.
  3. Chạy check-types.
- Success criteria: như Verify dưới.
- Verify (3 lệnh, chạy từ root repo):
  1. `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx src/features/exam/components/__tests__/pre-submit-modal.test.tsx` → exit 0, tất cả pass.
  2. `pnpm --filter web test` → exit 0.
  3. `pnpm check-types` → exit 0 (web chạy kèm `vite build` — đã cấu hình sẵn trong repo, vẫn tính pass khi exit 0).

## Verification
- Pass condition phase: cả 3 lệnh Verify của Task 2.4 đạt đúng kết quả nêu trên.
