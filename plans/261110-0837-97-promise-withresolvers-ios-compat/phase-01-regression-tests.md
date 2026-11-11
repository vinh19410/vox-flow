---
phase: 1
title: "Phase 1: Regression tests tương thích (red)"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Regression tests tương thích (red)

## Goal

3 test tương thích mới trong 3 test file hiện có chạy **THẤT BẠI đúng cách** trước khi sửa: chứng minh prod code hiện tại vỡ khi `Promise.withResolvers` vắng mặt.

## Files to Create / Modify

- Modify: `apps/web/src/features/exam/__tests__/storage.test.ts`
- Modify: `apps/web/src/hooks/__tests__/use-recorder.test.ts`
- Modify: `apps/web/src/features/profile/__tests__/image-compress.test.ts`
- Create: `apps/web/src/test/without-promise-with-resolvers.ts` — helper dùng chung cho 3 test (xoá builtin + trả hàm restore; pattern ở Key insight được extract vào đây, tránh cast lặp 3 file; convention import `@/test/...` như `@/test/harness`).

Không file nào khác. Không sửa prod code trong phase này.

## Key insight

Mọi test mới dùng chung pattern: xoá `Promise.withResolvers` khỏi `Promise`, chạy hành vi thật của module, **khôi phục trong `finally`** (không để global dính mutation). Vitest isolate mỗi file nên an toàn; within-file tuần tự nên không có race.

```ts
const originalWithResolvers = Promise.withResolvers;
delete (Promise as unknown as { withResolvers?: unknown }).withResolvers;
try {
  // ... assert hành vi ...
} finally {
  (Promise as unknown as { withResolvers?: unknown }).withResolvers = originalWithResolvers;
}
```

## Tests Before (red — viết trước, phải fail)

### Task 1.1 — storage.test.ts: vòng đời lưu/đọc/liệt kê/xoá khi builtin vắng mặt

- Goal: `saveAudioBlob` → `getAudioBlob` → `listPendingUploads` → `deleteAudioBlob` hoạt động **và ghi thật vào IndexedDB** không cần `Promise.withResolvers` (post-fix, lifecycle qua public API đi qua cả 4 call-site: `openDatabase`, `transactionDone`, `getAudioBlob`, `listPendingUploads`).
- Target: `apps/web/src/features/exam/__tests__/storage.test.ts` — thêm 1 `it` vào `describe` hiện có, tái dùng helper `record()` + fixture `FakeIndexedDB` như các test bên trên.
- Steps: dùng pattern xoá-builtin ở Key insight, rồi:
  1. `await saveAudioBlob(record("q1"));`
  2. **`expect(idb.rows.size).toBe(1);`** — đây là assert quyết định trạng thái red: trước fix, `openDatabase()` ném `TypeError` bị `catch` trong `saveAudioBlob` → rơi vào `memoryStore` → `idb.rows.size` vẫn là `0` (các assert sau vẫn pass nhờ memory-first của `getAudioBlob`/`listPendingUploads`). KHÔNG bỏ assert này.
  3. `expect(await getAudioBlob(ATTEMPT, "q1")).toMatchObject({ questionKey: "q1" });`
  4. `expect((await listPendingUploads(ATTEMPT)).map((r) => r.questionKey)).toEqual(["q1"]);`
  5. `await deleteAudioBlob(ATTEMPT, "q1");` → `expect(await listPendingUploads(ATTEMPT)).toEqual([]);` + `expect(idb.rows.size).toBe(0);`
- Success criteria: test mới tồn tại, biên dịch được.
- Verify: `pnpm --filter web test src/features/exam/__tests__/storage.test.ts` exit **non-zero**, failure là `TypeError: Promise.withResolvers is not a function` (hoặc tương đương) ném ra từ test mới (assert `idb.rows.size` fail ngay sau đó — cả hai là failure kỳ vọng); các test cũ trong file vẫn pass.

### Task 1.2 — use-recorder.test.ts: stop() vẫn trả bản ghi khi builtin vắng mặt

- Goal: `stop()` của `useRecorder` resolve về `RecordedAudio` mà không gọi `Promise.withResolvers`.
- Target: `apps/web/src/hooks/__tests__/use-recorder.test.ts` — thêm 1 `it`, clone pattern của test "starts and stops recording successfully…" hiện có (mock `MediaRecorder` + `navigator.mediaDevices` trong `beforeEach` đã có sẵn), chỉ thêm bước xoá builtin quanh phần start/stop.
- Steps: xoá builtin → trong `act`, gọi `result.current.start()` (trả `true`) rồi `result.current.stop()` **giống hệt test mẫu** — mock `MockMediaRecorder.stop()` trong file test tự fire `ondataavailable` + `onstop` đồng bộ (`use-recorder.test.ts:31-41`), **KHÔNG fire handler thủ công** → assert result có `blob`/`mimeType`/`durationMs` → khôi phục builtin.
- Success criteria: test mới tồn tại, biên dịch được.
- Verify: như Task 1.1 nhưng với `pnpm --filter web test src/hooks/__tests__/use-recorder.test.ts` — failure `TypeError` từ test mới, test cũ vẫn pass.

### Task 1.3 — image-compress.test.ts: nén ảnh thành công khi builtin vắng mặt

- Goal: `compressImageFile` vẫn trả data URL khi `Promise.withResolvers` vắng mặt (che call-site FileReader trong `image-compress.ts`).
- Target: `apps/web/src/features/profile/__tests__/image-compress.test.ts` — thêm 1 `it`, clone pattern của test "compresses a valid image file…" hiện có (spy `getContext`/`toDataURL`, stub `Image` như test mẫu).
- Steps: xoá builtin → chạy cùng mock như test mẫu với một `File` ảnh hợp lệ nhỏ → assert nhận data URL → khôi phục builtin.
- Success criteria: test mới tồn tại, biên dịch được.
- Verify: như Task 1.1 nhưng với `pnpm --filter web test src/features/profile/__tests__/image-compress.test.ts`.

## Refactor

Không có trong phase này (được bảo vệ bởi các test red ở trên).

## Verification (cả phase)

- `pnpm --filter web test src/features/exam/__tests__/storage.test.ts src/hooks/__tests__/use-recorder.test.ts src/features/profile/__tests__/image-compress.test.ts` → đúng **3 failure** mới (TypeError liên quan `withResolvers`), 0 failure khác. Đây là trạng thái red kỳ vọng, không phải verification failure.

## Failure Protocol

Nếu bất kỳ Verify step nào không đạt pass condition đã nêu, STOP phase này.
Không tự sửa tạm, không retry mù, không lý lẽ vòng qua failure.
Spawn subagent `kongming` để xin counsel bước tiếp theo, kèm:
- phase + task id,
- các bước đã chạy,
- lệnh đúng và output đầy đủ,
- pass condition mà nó không đạt.
Áp dụng guidance của kongming rồi chạy lại Verify step.
Nếu không spawn được `kongming` trong môi trường này, STOP và báo cùng evidence đó cho user. Không tự tiếp tục bằng suy luận.
