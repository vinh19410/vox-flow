# Phase 02 — Client: generation timestamp, phân loại 409, bỏ mustResend

Sở hữu file: `apps/web/**`. Phase 01 phải đã xong gate (helper `upsertAnswerRecording` và route 409 đã có).
Chạy lệnh từ root worktree. Lệnh test một file theo AGENTS.md: `pnpm --filter web test <đường-dẫn-từ-apps/web>`.
KHÔNG dùng `pnpm --filter web test -- <tên>` (vitest bỏ qua bộ lọc này).

## Task 2.1 — `generation` trong record và bộ tạo generation timestamp

- Goal: mọi bản ghi client mang `generation` = `max(Date.now(), lastGenLocal + 1)` tại lúc tạo; device copy lưu giá trị đó; retry/flush gửi lại đúng giá trị.
- Target files and symbols:
  - `apps/web/src/features/exam/storage.ts` — type `AudioBlobRecord` (thêm `generation: number`).
  - `apps/web/src/features/exam/answer-uploads.ts` — type `AnswerUpload` (`Omit<AudioBlobRecord, "createdAt">` tự mở rộng), `trackAnswerUpload`, `flushAnswerUploads`, hàm mới `nextGeneration`.
  - `apps/web/src/features/exam/use-exam-session.ts` — object record dựng trong `stopRec` (~dòng 215-235) KHÔNG thêm generation ở đây (trackAnswerUpload gán).
- Steps:
  1. `storage.ts`: thêm `generation: number;` vào `AudioBlobRecord` (kèm comment: epoch ms, chặn tăng dần).
  2. `answer-uploads.ts`:
     - Thêm `const lastGeneration = new Map<string, number>();` (key = `attemptId::questionKey`).
     - Thêm `function nextGeneration(attemptId: string, questionKey: string): number` → `const key = answerKey(...); const gen = Math.max(Date.now(), (lastGeneration.get(key) ?? 0) + 1); lastGeneration.set(key, gen); return gen;` (chặn đồng hồ lùi trong page).
     - Thêm **helper export** `withGeneration(record: Omit<AnswerUpload, "generation"> & { generation?: number }): AnswerUpload` → trả `{ ...record, generation: record.generation ?? nextGeneration(record.attemptId, record.questionKey) }` (gán một lần, idempotent với record đã có gen).
     - Đổi input `trackAnswerUpload` nhận record chưa có generation: `recording: Promise<(Omit<AnswerUpload, "generation"> & { generation?: number }) | null> | (Omit<AnswerUpload, "generation"> & { generation?: number })`. Ngay sau `const record = await recording` (và trước `claimAnswer`): `const full = record ? withGeneration(record) : null` — mọi đường sau dùng `full`. Record từ device copy (đã có generation) giữ nguyên giá trị.
     - Trong `flushAnswerUploads`, sau khi gom `toRetry`: record **từ `listPendingUploads`** (device copy) thiếu `generation` (copy legacy trước deploy) → gán `generation: 0` (KHÔNG dùng `nextGeneration`/`Date.now()` — đóng dấu timestamp lúc flush sẽ biến bản cũ thành mới nhất và hồi sinh bug #96 cho cohort chuyển tiếp; red-team F1/F2). Record trong `failedUploads`/slot luôn đã có generation từ lúc track.
  3. `apps/web/src/features/exam/use-exam-session.ts` (red-team F1 — PHẢI đổi, không được bỏ qua):
     - Callback `recorder.stop().then((audio): AnswerUpload | null => {...})` (~dòng 215-245) dựng literal thiếu `generation` → sau khi `generation` required sẽ TS2322. Sửa: trả `withGeneration({ ... })` trong literal (import từ `./answer-uploads`).
     - Nhánh `!attemptId` (~dòng 249) gọi thẳng `saveAudioBlob(record)` bypass `trackAnswerUpload` → nhờ `withGeneration` ở literal, record vẫn mang generation. Không đổi logic nhánh.
  4. `apps/web/src/features/exam/__tests__/answer-uploads.test.ts`: helper `record()` (đầu file) dựng `AnswerUpload` thiếu `generation` → thêm `generation` vào helper (một số cố định đủ để test chạy, ví dụ `generation: 1`, hoặc tham số nếu test cần khác nhau). Các test dựng record inline khác cũng sửa tương tự.
- Success criteria: compile sạch; mọi record lưu vào `saveAudioBlob` có generation.
- Verify: `pnpm --filter web test src/features/exam/__tests__/answer-uploads.test.ts` — chạy sau Task 2.2/2.3 khi test mới đã có; ở bước này chỉ cần `pnpm check-types` exit 0 (test cũ có thể còn đỏ vì type mở rộng — nếu đỏ vì lý do khác → Failure Protocol).

## Task 2.2 — `postAnswerAudio` phân loại 409 stale (TDD: đỏ trước)

- Goal: client phân biệt `409 {"error":"stale_generation"}` khỏi lỗi thường; `uploadUrl` gửi `generation`.
- Target files and symbols:
  - `apps/web/src/features/exam/answer-uploads.ts` — `uploadUrl`, `postAnswerAudio`.
- Steps:
  1. VIẾT TEST TRƯỚC trong `apps/web/src/features/exam/__tests__/answer-uploads.test.ts` (file có sẵn mock fetch — đọc pattern đầu file):
     - `uploadUrl` chứa `generation=<giá trị>` trong query.
     - `postAnswerAudio` với response `409` body `{"error":"stale_generation","storedGeneration":200}` → kết quả `{ ok: false, stale: true, storedGeneration: 200 }` (kết quả mới — xem bước 2).
     - `postAnswerAudio` với `409` body khác (không phải stale_generation) → `{ ok: false, stale: false }`.
     - `200` → `{ ok: true, stale: false }`.
     - Confirm ĐỎ.
  2. Sửa `uploadUrl`: thêm `generation: record.generation.toString()` vào `URLSearchParams`.
  3. Sửa `postAnswerAudio`: đổi kiểu trả thành `Promise<{ ok: boolean; stale?: boolean; storedGeneration?: number }>`; nhánh `!res.ok`: đọc `await res.json().catch(() => null)` — nếu `res.status === 409` và `body?.error === "stale_generation"` → trả `{ ok: false, stale: true, storedGeneration: body.storedGeneration }`; còn lại `{ ok: false }` (giữ `console.warn` như cũ). Nhánh `res.ok` → `{ ok: true }`.
- Success criteria: test phân loại pass; các test cũ gọi `postAnswerAudio` qua đường upload vẫn đúng ngữ nghĩa ok/false.
- Verify: `pnpm --filter web test src/features/exam/__tests__/answer-uploads.test.ts` exit 0 (nếu test cũ còn đỏ vì hành vi supersede — sang Task 2.3 rồi đánh giá lại; đỏ vì lý do khác → Failure Protocol).

## Task 2.3 — 409 stale = settled; bỏ `mustResend`/`settleSuperseded` (TDD: đỏ trước)

- Goal: bản cũ bị server từ chối không gây lỗi giả ở submit; bản thắng upload bình thường; code vá phía client #94 (`mustResend`) được xoá sạch vì server đã bảo đảm thứ tự.
- Target files and symbols:
  - `apps/web/src/features/exam/answer-uploads.ts` — `settleNewest`, `settleSuperseded`, `AnswerSlot` (bỏ `mustResend`), `claimAnswer`, `flushAnswerUploads`.
- Steps:
  1. VIẾT TEST TRƯỚC trong `answer-uploads.test.ts` (hai kịch bản kongming đòi làm acceptance, đã chỉnh theo red-team F2/F7 — stale KHÔNG xoá device copy):
     - Kịch bản A (stale superseded = settled, copy GIỮ): track bản ghi gen thấp trước, bản ghi gen cao sau (slot mới); bản cũ hoàn tất sau với `409 stale` → `trackAnswerUpload` của bản cũ resolve `false`; KHÔNG có mục nào vào `failedUploads` (flush sau đó trả `failedQuestionKeys` rỗng cho câu đó); **device copy của bản cũ vẫn còn** (`getAudioBlob` trả record — không xoá), row thật trên "server" (mock) không đổi. Assert ngay sau khi track resolve (không cần flush).
     - Kịch bản B (bản mới thắng ngược thứ tự): hai bản ghi cùng câu, bản gen cao upload xong trước, bản gen thấp tới sau bị `409 stale` → câu KHÔNG xuất hiện trong `failedQuestionKeys` của `flushAnswerUploads`; device copy của bản gen thấp vẫn còn (giữ, không xoá).
     - Kịch bản C (lỗi thường vẫn là lỗi): upload fail mạng (không phải 409 stale) → câu vẫn nằm trong `failedQuestionKeys` (bảo vệ hành vi cũ).
     - Kịch bản D (retry cùng generation idempotent): cùng record gửi 2 lần (lần 1 timeout, lần 2 200) → settled, không fail.
     - Kịch bản E (legacy copy gen 0 với server đã có gen cao): device copy thiếu generation (copy trước deploy) qua flush → gửi `generation=0`, nhận `409 stale` → KHÔNG tính fail, copy giữ, row không đổi.
     - Confirm ĐỎ cho A/B/E (hành vi mới chưa có), C/D có thể đã pass (regression guard).
  2. Sửa `settleNewest(slot, result)` nhận kết quả mới: `result.ok` → clearFailed + xoá device copy (như cũ); `!result.ok && result.stale` → CHỈ `clearFailed` (giữ device copy — false-stale không được xoá dữ liệu; red-team F2), KHÔNG setFailed; `!result.ok` khác → setFailed như cũ.
  3. Xoá `settleSuperseded` và mọi gọi nó; trong `trackAnswerUpload`, nhánh `!isNewest(slot)` sau post → return `{ record, ok: false }` thuần (không đụng device copy — nhất quán với semantic "stale không xoá copy"; red-team F7).
  4. Xoá trường `mustResend` khỏi `AnswerSlot` và mọi tham chiếu (`claimAnswer`, `settleNewest`, `flushAnswerUploads` — dòng `slot.mustResend = false`).
  5. Trong `flushAnswerUploads`: đổi `const ok = await postAnswerAudio(...)` sang kết quả mới; `result.stale` → `clearFailed` + GIỮ device copy + `return null` (không tính failed); `!result.ok` → `continue` như cũ; `result.ok` → như cũ.
  6. Chạy TOÀN BỘ file test: các test cũ của #94 khẳng định hành vi `mustResend` (nếu có, ví dụ "re-sends newest after an older upload succeeds") giờ SAI theo thiết kế mới — XOÁ/VIẾT LẠI test đó thành kịch bản A/B ở trên (test khẳng định implementation lỗi cũ phải bị xoá, không pin lại). KHÔNG xóa test dùm hành vi vẫn đúng.
- Success criteria: A/B/C/D/E pass; toàn file test exit 0; `grep -n "mustResend\|settleSuperseded" apps/web/src/features/exam/answer-uploads.ts` rỗng.
- Verify: `pnpm --filter web test src/features/exam/__tests__/answer-uploads.test.ts` exit 0 VÀ `grep -rn "mustResend" apps/web/src` exit 1 (rỗng).

## Task 2.4 — Gate cuối phase + wired check

- Goal: client khép kín, types khớp server contract.
- Steps:
  1. Kiểm tra `flushAnswerUploads`/`trackAnswerUpload` trả giá trị chưa đổi shape (`Promise<boolean>`, `FlushResult`).
  2. Chạy toàn bộ test web liên quan exam (không chỉ 1 file) để bắt regress ở `use-exam-session` (file test của nó nếu có).
- Verify: `pnpm --filter web test` exit 0 VÀ `pnpm check-types` exit 0.

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
