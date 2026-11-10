---
phase: 2
title: "Implement timer + gates xanh"
status: pending
priority: P1
effort: "45m"
dependencies: [1]
---

# Phase 2: Implement timer + gates xanh

## Goal

Thêm timer 15s vào effect bootstrap của `useExamSession`: hết hạn mà chuỗi `getActive` → `start` chưa settle thì `attemptStatus: "failed"`; id muộn vẫn `applyAttemptId` như cũ (khi còn mounted). Hai test phase 1 chuyển xanh, probe test AC3 xanh, toàn bộ suite web không regression.

## Files to Create / Modify

- Modify: `apps/web/src/features/exam/use-exam-session.ts` — hằng số `ATTEMPT_SYNC_TIMEOUT_MS` + timer trong `useEffect` bootstrap (effect duy nhất gọi `trpcClient.attempt.getActive`, tại `:119-170`).
- Modify: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` — thêm 1 hook-probe test cho AC3.

## Key Insights

- KHÔNG abort request: id về muộn phải kịp `applyAttemptId` (đặt `ready`, drain `pendingSessionRef`). Timer chỉ đổi trạng thái UI.
- Timer phải clear ở đúng 3 chỗ: (a) `.finally` cuối chuỗi bootstrap, (b) cleanup của effect (unmount/điều hướng), (c) callback có guard `pending`-only làm vòng phòng thủ thứ hai.
- Không đổi chữ ký `ExamSessionValue`, không đổi UI component nào.
- UI không phân biệt `ready`/`failed` (chỉ `pending` khoá nút) → AC3 kiểm chứng bằng hook-probe đọc `attemptStatus` trực tiếp, không qua UI.

## Tasks & Steps

### Task 2.1 — Thêm timer vào effect bootstrap

- Goal: sau 15s chưa settle → `failed`; settle đúng lúc → không đổi trạng thái.
- Target files: `apps/web/src/features/exam/use-exam-session.ts` (function `useExamSession`, effect `useEffect(() => { let active = true; ... }, [])`).
- Steps:
  1. Ngay trên `const WPS = 2.6;` (dòng 18) thêm: `const ATTEMPT_SYNC_TIMEOUT_MS = 15_000; // hung attempt.start/getActive must not lock submit forever (#106)`.
  2. Trong effect bootstrap, trước lệnh `.query()` đầu tiên, thêm:
     ```ts
     const syncTimer = setTimeout(() => {
       if (active) setAttemptStatus((status) => (status === "pending" ? "failed" : status));
     }, ATTEMPT_SYNC_TIMEOUT_MS);
     ```
  3. Cuối chuỗi promise, sau `.catch(...)`, nối `.finally(() => clearTimeout(syncTimer));`.
  4. Trong cleanup `return () => { active = false; };` thêm `clearTimeout(syncTimer);`.
- Success criteria: code đúng 4 bước trên, không có thay đổi nào khác trong file.
- Verify: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` exit 0 — 2 test mới phase 1 PASS và toàn bộ test cũ PASS.

### Task 2.2 — Probe test cho AC3 (settle sớm giữ ready qua mốc 15s)

- Goal: chứng minh khi bootstrap settle thành công sớm, `attemptStatus` vẫn `"ready"` sau khi advance quá 15s (timer đã clear/guard chặn).
- Target: test mới `keeps attempt ready past the timeout once the bootstrap settled` trong `exam-submit.test.tsx`, dùng probe component gọi `useExamSession` trực tiếp thay vì `ExamScreen` (render `session.attemptStatus` dạng text trong `renderWithApp`).
- Steps:
  1. Trong file test, khai báo `function SessionProbe() { const s = useExamSession(); return <span data-testid="attempt-status">{s.attemptStatus}</span>; }` (import `useExamSession` từ `../use-exam-session`).
  2. `startSpy.mockResolvedValue({ attemptId: "att-fast" }); renderWithApp(<SessionProbe />); await flush();`
  3. Assert probe hiển thị `"ready"` (id đã về).
  4. `await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });`
  5. Assert probe **vẫn** `"ready"` — không flip về `failed` hay `pending`.
- Success criteria: test xanh sau fix; nếu ai xoá `.finally(clearTimeout)` **và** guard pending-only thì test đỏ.
- Verify: nằm trong lệnh test của Task 2.3.

### Task 2.3 — Gates cuối phase

- Goal: toàn bộ suite web xanh + type pass.
- Verify:
  1. `pnpm --filter web test` — exit 0 (full suite web, gồm `slice-c.test.tsx`, `forecast-flow.test.tsx` vốn cũng mount ExamScreen với fake timers).
  2. `pnpm check-types` — exit 0 (ở `apps/web` lệnh này chạy cả `vite build` — chờ hết).

## Tests After

- 2 test mới từ phase 1 xanh (1.1 timeout-unlock; 1.2 unlock-trước-resolve + drain + submit id muộn).
- Probe test AC3 xanh (Task 2.2).
- Regression: `blocks submit while the attempt is syncing` (resolve trước 15s) và `re-enables submit when attempt.start fails (offline/mock)` (reject) giữ nguyên hành vi.

## Requirements

- [ ] Timer 15s một lần duy nhất cho cả chuỗi bootstrap (không đặt timer riêng cho từng request)
- [ ] Callback guard `pending`-only
- [ ] Clear timer ở `.finally` + cleanup
- [ ] Không đổi API/UI khác

## Security Considerations

Không đụng auth/data; timer thuần client-state, không log giá trị nhạy cảm.

## Risk Assessment

- **Id muộn sau khi user đã submit (đã rời màn thi)**: bị bỏ do guard `active`; device-copy không đường flush; ScoringScreen hiển thị "đã lưu toàn bộ" trong khi server trống — biên có từ trước (nhánh reject), kế thừa theo đúng phạm vi #106; follow-up đã ghi trong plan.md (Biên phục hồi id muộn).
- **Timer bắn giữa chừng request chậm nhưng hợp lệ (≈15s)** → `failed` tạm thời, id về thì `ready` lại; chấp nhận theo đề xuất issue.
- **Unmount qua điều hướng** (submit/rời màn thi): cleanup clear timer + `active = false` — timer không bắn vào component đã chết (app không dùng StrictMode; không xét double-mount).

## Verification

- `pnpm --filter web test` — exit 0.
- `pnpm check-types` — exit 0.

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
