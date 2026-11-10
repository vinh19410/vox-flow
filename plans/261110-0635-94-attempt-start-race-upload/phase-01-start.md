---
title: "Phase 1: Registry pending + drain đồng bộ trong use-exam-session (TDD)"
status: done
---

# Phase 1: Registry pending + drain đồng bộ trong use-exam-session (TDD)

## Goal

Bản ghi âm dừng khi chưa có `attemptId` được track dưới `attemptId` thật **đồng bộ ngay khi id về** (trong `applyAttemptId`, trước cả `setAttemptId`) — từ cả `attempt.start` lẫn `attempt.getActive`; take mới luôn thắng take cũ; session copy chỉ bị xoá khi server xác nhận; unmount chỉ clear registry in-memory.

## Files to Create / Modify

- Modify: `apps/web/src/features/exam/use-exam-session.ts` (hook `useExamSession`, hàm `stopRec`, type `ExamSessionValue`)
- Modify: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx` (5 test mới + mock `../storage`)
- KHÔNG đổi: `apps/web/src/features/exam/answer-uploads.ts`, `apps/web/src/features/exam/storage.ts`, `apps/web/src/features/exam/exam-screen.tsx`

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

### Task 1.1 — Thêm 5 test hook

- Goal: `exam-submit.test.tsx` chứng minh routing pending → track dưới id thật (2 nguồn id), encode race, offline no-op, last-write-wins, cleanup chính xác.
- Target files: `apps/web/src/features/exam/__tests__/exam-submit.test.tsx`.
- Chú ý fake timers (kongming): `vi.useFakeTimers()` đang bật — CHỈ `advanceTimersByTimeAsync(0)` để chạy microtask; advance số lớn sẽ đẩy `recT` chạm `maxRec` và tự gọi `stopRec` sinh take ngoài ý muốn. Đừng để upload thật chạy — `trackAnswerUpload` đã mock; `../storage` phải mock (IndexedDB/fake-indexeddb dễ treo dưới fake timers).
- Steps:
  1. Thêm mock module ở đầu file (ngay sau mock `../answer-uploads` hiện có):
     ```tsx
     const saveAudioSpy = vi.fn();
     const deleteAudioSpy = vi.fn();
     vi.mock("../storage", () => ({
       saveAudioBlob: (...a: unknown[]) => saveAudioSpy(...a),
       deleteAudioBlob: (...a: unknown[]) => deleteAudioSpy(...a),
     }));
     ```
     Trong `beforeEach` thêm: `saveAudioSpy.mockReset().mockResolvedValue(undefined);` và `deleteAudioSpy.mockReset().mockResolvedValue(undefined);`
  2. Trong mock `@/hooks/use-recorder`, đổi `stop` thành controllable: `stop: (...a: unknown[]) => stopSpy(...a)` với `const stopSpy = vi.fn();` hoisted; trong `beforeEach`: `stopSpy.mockReset().mockResolvedValue({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" });`
  3. **Test 1 — "uploads a session-id recording under the real attempt once attempt.start answers"**:
     - `let resolveStart!: (v: { attemptId: string }) => void;` + `startSpy.mockReturnValue(new Promise((resolve) => (resolveStart = resolve)));`
     - Render `<ExamScreen />` với `{ practice: PRACTICE }`, `await flush()`.
     - `answerStep()` → `await flush()` (bản ghi dừng khi id chưa có).
     - Expect `trackUploadSpy` **không** được gọi; capture session id: `const sessionId = (saveAudioSpy.mock.calls[0]![0] as { attemptId: string }).attemptId;` — expect `sessionId` truthy và khác `"att-late"`.
     - `await act(async () => { resolveStart({ attemptId: "att-late" }); await vi.advanceTimersByTimeAsync(0); }); await flush();`
     - Expect `trackUploadSpy` gọi đúng 1 lần: `("att-late", <promise>)`; `await expect(recording).resolves.toMatchObject({ attemptId: "att-late", questionKey: "p1-tidiness-0", part: 1, order: 0 })`.
     - `await flush(); await flush();` (chờ track resolve `true`) → expect `deleteAudioSpy` `toHaveBeenCalledTimes(1)` và `deleteAudioSpy.mock.calls[0]![0]` **toBe(sessionId)** (assert chính xác — không dùng `expect.any(String)`).
     - `await flush()` lần nữa → `trackUploadSpy` vẫn đúng 1 lần (không đăng ký trùng).
  4. **Test 2 — "tracks a recording whose encode finishes after the attempt id arrived"** (encode race):
     - `let resolveStop!: (v: { blob: Blob; durationMs: number; mimeType: string }) => void;` → `stopSpy.mockReturnValue(new Promise((resolve) => (resolveStop = resolve)));`
     - `startSpy.mockReturnValue(new Promise((r) => (resolveStart = r)));`
     - Render, `await flush()`; click "Bắt đầu ghi" rồi "Dừng ghi" (dừng sau "Dừng ghi", KHÔNG dùng `answerStep()`).
     - `await act(async () => { resolveStart({ attemptId: "att-late" }); await vi.advanceTimersByTimeAsync(0); }); await flush();`
     - Expect `trackUploadSpy` **chưa** được gọi.
     - `await act(async () => { resolveStop({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" }); await vi.advanceTimersByTimeAsync(0); }); await flush();`
     - Expect `trackUploadSpy` gọi đúng 1 lần với `("att-late", <promise>)`; record resolve `toMatchObject({ attemptId: "att-late" })`; `saveAudioSpy` **không** được gọi.
  5. **Test 3 — "keeps the recording device-only when attempt.start never answers"** (offline):
     - `startSpy.mockReturnValue(new Promise(() => {}));`
     - Render, `await flush()`, `answerStep()`, `await flush()`.
     - Expect `trackUploadSpy` không được gọi; `saveAudioSpy` được gọi 1 lần; không crash.
  6. **Test 4 — "backfills from the resumed active attempt (attempt.getActive)"** (nhánh resume):
     - `let resolveActive!: (v: unknown) => void;` + `getActiveSpy.mockReturnValue(new Promise((resolve) => (resolveActive = resolve)));`
     - Render `{ practice: PRACTICE }`, `await flush()`, `answerStep()`, `await flush()`.
     - Expect `trackUploadSpy` không được gọi.
     - `await act(async () => { resolveActive({ attempt: { id: "att-resume", topicId: "p1-tidiness", questionKey: "p1-tidiness-0", mode: "part1" }, answers: [] }); await vi.advanceTimersByTimeAsync(0); }); await flush();`
     - Expect `trackUploadSpy` gọi đúng 1 lần với `("att-resume", <promise>)`; record resolve `toMatchObject({ attemptId: "att-resume" })`; `startSpy` không được gọi.
  7. **Test 5 — "only tracks the newest take when two takes finish before the attempt id"** (last-write-wins):
     - `startSpy` pending như Test 1. Render, `await flush()`.
     - Take 1: `stopSpy.mockReturnValueOnce(new Promise((r) => (resolveStop1 = r)))`; click "Bắt đầu ghi" + "Dừng ghi" (dừng lại).
     - `await act(async () => { resolveStop1({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" }); await vi.advanceTimersByTimeAsync(0); }); await flush();` → `saveAudioSpy` 1 lần.
     - Take 2: set `stopSpy.mockReturnValueOnce(new Promise((r) => (resolveStop2 = r)))`; click "Bắt đầu ghi" + "Dừng ghi" lần nữa.
     - `await act(async () => { resolveStop2({ blob: recordedBlob, durationMs: 5000, mimeType: "audio/webm" }); await vi.advanceTimersByTimeAsync(0); }); await flush();` → `saveAudioSpy` 2 lần; entry registry giờ là take 2.
     - `await act(async () => { resolveStart({ attemptId: "att-late" }); await vi.advanceTimersByTimeAsync(0); }); await flush();`
     - Expect `trackUploadSpy` gọi đúng **1 lần**; record resolve `toMatchObject({ attemptId: "att-late", durationMs: 5000 })` (take 2 thắng; take 1 KHÔNG được track).
- Success criteria: 5 test mới tồn tại, biên dịch được.
- Verify: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` — **exit non-zero với assertion failure ở cả 5 test mới** (đỏ là điều kiện pass của task); các test cũ vẫn xanh.

## Implementation Steps

### Task 1.2 — Cài đặt registry + drain đồng bộ + attemptStatus trong `useExamSession`

- Goal: drain chạy đồng bộ trong `applyAttemptId` (trước `setAttemptId`), đóng cửa sổ inversion/submit theo cấu trúc (kongming checkpoint #2).
- Target files: `apps/web/src/features/exam/use-exam-session.ts`.
- Steps:
  1. Thêm import `deleteAudioBlob` vào import `./storage`: `import { deleteAudioBlob, saveAudioBlob } from "./storage";`
  2. Thêm state + refs (sau `const [attemptId, setAttemptId] = useState<string | null>(null);` và `clientSessionIdRef`):
     ```ts
     const [attemptStatus, setAttemptStatus] = useState<"pending" | "ready" | "failed">("pending");
     const attemptIdRef = useRef<string | null>(null);
     const pendingSessionRef = useRef(new Map<string, Promise<AnswerUpload | null>>());
     ```
  3. Định nghĩa `applyAttemptId` trong body hook (trước effect khởi tạo):
     ```ts
     const applyAttemptId = (id: string) => {
       attemptIdRef.current = id;
       // Drain pending session recordings synchronously, before any state update
       // lets the user record again or submit, so they get their upload tickets
       // before anything newer can race them.
       const pending = [...pendingSessionRef.current];
       pendingSessionRef.current.clear();
       for (const [questionKey, recording] of pending) {
         void trackAnswerUpload(id, recording.then((r) => r && { ...r, attemptId: id })).then((ok) => {
           // Drop the session copy only once the server confirmed the recording.
           if (ok) void deleteAudioBlob(clientSessionIdRef.current, questionKey);
         });
       }
       setAttemptStatus("ready");
       setAttemptId(id);
     };
     ```
  4. Trong effect khởi tạo: thay `setAttemptId(att.id)` và `setAttemptId(res.attemptId)` bằng `applyAttemptId(...)`; đổi `.catch(() => { /* Gracefully continue in offline / mock test mode */ })` thành `.catch(() => { setAttemptStatus("failed"); })` (giữ comment cũ).
  5. Trong `stopRec`, record builder: `attemptId: attemptIdRef.current ?? clientSessionIdRef.current,`.
  6. Thay khối cuối `stopRec` (`if (attemptId) { … } else { … }`) bằng:
     ```ts
     if (attemptId) {
       // Tracked from the moment recording stops, so the scoring screen waits for
       // (and retries) this upload before submitting, even if the user submits
       // before the recorder has finished encoding.
       void trackAnswerUpload(attemptId, recorded);
       return;
     }
     // attempt.start has not answered yet: keep the recording pending. The
     // registry entry only settles once the device copy has been written, so the
     // backfill can never delete it mid-write. If the id arrives while the
     // encoder is still running, the decision below runs at resolve time against
     // the ref — and drops any pending entry so an older take can never
     // supersede the newer one.
     void recorded.then((record) => {
       if (!record) return;
       const id = attemptIdRef.current;
       if (id) {
         pendingSessionRef.current.delete(step.key);
         void trackAnswerUpload(id, record);
         return;
       }
       pendingSessionRef.current.set(
         step.key,
         saveAudioBlob(record).catch(() => {}).then(() => record),
       );
     });
     ```
  7. Thêm effect cleanup unmount (memory-only — session copy là bản duy nhất còn lại khi offline, giữ lại cho follow-up recovery):
     ```ts
     // Leaving the exam with pending recordings: only forget them in memory. The
     // session-id device copies stay — they may be the only remaining copy.
     useEffect(() => () => pendingSessionRef.current.clear(), []);
     ```
  8. Type `ExamSessionValue`: thêm `attemptStatus: "pending" | "ready" | "failed";` và thêm vào object return của hook.
- Success criteria: code biên dịch; khối `if (attemptId)` giữ nguyên comment + lời gọi đồng bộ `trackAnswerUpload(attemptId, recorded)`.
- Verify: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` — exit 0, TẤT CẢ test xanh (5 test mới + 3 test cũ, test cũ "registers each recording's upload…" phải xanh KHÔNG sửa assertion).

## Refactor (bảo vệ trong phase này)

Không refactor thêm; `git diff --stat` chỉ được chạm 2 file nêu trên.

## Tests After

5 test ở Task 1.1 chính là Tests After; không thêm test khác (cơ chế ticket/flush/fail-retry đã có test ở `answer-uploads.test.ts`).

## Regression gate

`pnpm --filter web test src/features/exam` exit 0 (chạy lại ở Phase 3).
