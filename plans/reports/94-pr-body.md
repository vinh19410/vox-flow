## Tóm tắt công việc đầu-cuối

- **Nguồn:** issue #94 (phát hiện khi review #90) — bản ghi âm dừng trước khi `attempt.start` trả `attemptId` chỉ được lưu IndexedDB theo client session id và không bao giờ upload → không có trong `attempt_answer`, không được chấm, không có trong lịch sử.
- **Điều tra:** ak-debug chứng minh root cause bằng code trace (4 điểm: nhánh else của `stopRec`, effect init không upload bù, `flushAnswerUploads` chỉ quét theo id thật, `submit()` vẫn cho nộp khi `attemptId` null → dead-end scoring screen).
- **Plan:** `plans/261110-0635-94-attempt-start-race-upload/plan.md` — 3 phase TDD, qua `ak plan validate`, red-team 2 persona (10 findings: 6 accept, 4 follow-up), 2 checkpoint kongming (registry design + tri-state/drain-đồng-bộ/delete-on-true).
- **Thực hiện:** ak-fix --auto theo plan; code review local 2 reviewer fresh-context; mọi finding Critical/Important đã vá trước khi mở PR.
- **Ship:** branch `fix/94-attempt-start-race-upload` → PR tới `dev` (ship mode **beta**).

## Delegation subagent

- 4× `kongming` (advisory): go backfill + thiết kế registry; go/no-go sau plan gates (tri-state bắt buộc, drain đồng bộ, delete-on-true, cleanup memory-only); go/no-go trước ship; post-PR gate + chốt review body.
- 2× `code-reviewer` red-team trên plan (Security Adversary + Assumption Destroyer): 10 findings, 6 accept.
- 2× `code-reviewer` trên diff hoàn thành (bugs/regressions + spec-compliance): 0 Critical, 3 Important — đã vá hết (slice-c regression CI, test unmount AC8, assert thứ tự drain-trước-submit, unhandled rejection).
- Không dùng tester/delegate chạy test — chạy trực tiếp (narrow gate).

## Quyết định kỹ thuật

- **Backfill, không blocking-start** (phương án 1 của issue): chặn ghi âm chặn UX từng câu + xung đột auto-start `prepT <= 0` + kẹt offline.
- **Registry in-memory + drain đồng bộ trong `applyAttemptId`** (trước `setAttemptId`): đóng 3 race bằng cấu trúc — encode race, ticket inversion (take cũ đè take mới), submit chen giữa lúc đăng ký. Không quét IndexedDB (3 lỗ race tương tự).
- **`attemptStatus` tri-state** `pending | ready | failed`: chỉ khoá nộp khi `pending`; `failed` (offline, `attempt.start` reject) giữ nguyên fall-through cũ — không regression cho luồng offline/mock.
- **Session copy chỉ xoá khi server xác nhận** (`trackAnswerUpload === true`); unmount chỉ clear registry in-memory (data-safety — bản sao có thể là bản duy nhất).
- **`answer-uploads.ts` và `storage.ts` không đổi** — tái dùng trọn vẹn cơ chế ticket/supersede/flush hiện có.

## Lệch so với plan

- Slice-c regression: kế hoạch regression gate ban đầu chỉ chạy `features/exam` + `features/scoring`, không bắt `slice-c.test.tsx` (render ExamScreen không mock trpc) — đã vá (mock trpc theo pattern `forecast-flow` + flush microtask) và **mở rộng gate lên toàn `src/features`** trong `phase-03-regression.md`.
- Test "offline" (Test 3) xanh cả trước lẫn sau fix — giữ làm regression pin thay vì red-test như plan kỳ vọng (4/5 test đỏ đúng thiết kế, không phải 5).

## Bằng chứng hoàn thành

- `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` → **11/11 pass** (7 test mới: backfill basic, encode race, offline, getActive resume, last-write-wins 2 take, khoá/mở nộp theo tri-state, unmount memory-only).
- `pnpm --filter web test src/features` → **208/208 pass (22 files)** sau khi vá slice-c.
- `pnpm check-types` → **pass** (apps/web chạy cả `vite build`, build thành công).
- AC1–AC9 của plan: map chi tiết trong `plan.md` §Acceptance Criteria; AC1–AC5, AC8 có test mức hook; AC6/AC7 có test + bảo chứng cấu trúc; AC9 là gates trên.
- Local review: 0 Critical / 0 Important còn mở (3 Important đã vá: slice-c CI, AC8 test, AC6 assert; kèm `.catch` cho `deleteAudioBlob` trong drain).

## Checklist

- [x] Tests: full features 208/208 + check-types (lệnh trên)
- [x] Review pre-landing: 2 fresh-context reviewers, mọi Important đã vá
- [x] Plan validate + red-team + 2 kongming checkpoints
- [x] Không đổi `answer-uploads.ts`/`storage.ts`/API server
- [ ] Docs update — **skip** (ship mode beta, không đổi public contract; chỉ prop nội bộ `submitLocked`)
- [x] Journal — chạy sau khi PR mở

## Việc cần con người

- Không có bước bắt buộc. Lưu ý 2 follow-up đã ghi nhận trong issue (sẽ tạo issue riêng): nút nộp có thể khoá vô hạn nếu `attempt.start` treo (không reject) — đề xuất timeout ~15s chuyển sang `failed`; orphan session-id copy khi take bị thay thế/retry (vô hại chức năng, chỉ rác/PII trên thiết bị).
- Worktree #96 (generation order server) đang dang dở: không conflict text với PR này, nhưng nếu #96 đổi contract upload thì drain phía client cần re-verify ở bên merge sau.

Closes #94

**Ship Mode:** beta → `dev`
