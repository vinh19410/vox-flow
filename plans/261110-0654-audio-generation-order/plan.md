---
title: "Hardening: thứ tự phiên bản phía server cho upload audio cùng câu"
status: completed
issue: 96
branch: fix/96-audio-upload-generation-order
related: [45, 46, 94]
created: 2026-11-10
mode: --tdd --advice
advice: kongming-counsel-applied
---

# Hardening: thứ tự phiên bản phía server cho upload audio cùng câu

Tracking: #96. Liên quan #45, #46 (hardening route upload), #94 (client chỉ giữ bản mới nhất).
Counsel của kongming (checkpoint sau investigation) đã được hợp nhất: generation dựa trên timestamp có chặn tăng dần, xoá đường ghi tRPC lách guard, erasure theo prefix R2.

## Outcome
Server luôn giữ bản ghi có generation cao nhất cho mỗi câu. Upload trễ của bản cũ bị từ chối `409 stale_generation`, nên bài không bao giờ bị chấm trên câu trả lời cũ. Client coi `409 stale` là "đã xử lý" — không báo lỗi giả khi nộp bài.

## Root cause (đã chứng minh bằng code, không phỏng đoán)
- `apps/server/src/index.ts` route `POST /api/attempts/:attemptId/answers/:questionKey/audio` (~dòng 60-152): sau auth/ownership/status, route chạy `bucket.put(audioKey, body)` rồi `db.insert(attemptAnswer).onConflictDoUpdate(...)` **không điều kiện** — last-write-wins, ai ghi DB sau thắng.
- `packages/db/src/schema/attempt.ts`: `attempt_answer` có `unique(attemptId, questionKey)`, **không có cột phiên bản**.
- Đường ghi thứ hai không guard: tRPC `attempt.uploadAnswer` (`packages/api/src/routers/attempt.ts:128-213`) upsert cùng bảng last-write-wins. Web không gọi (chỉ test dùng) — code chết có thể lách toàn bộ cơ chế generation.
- Client (`apps/web/src/features/exam/answer-uploads.ts`) đã huỷ fetch bản cũ (#94), nhưng fetch đã huỷ vẫn có thể đến đủ server và ghi sau; response không ai đọc → row cuối là bản cũ → chấm sai.
- `packages/api/src/data-registry.ts` `attempt.erase` xoá blob theo `audioKey` của row hiện tại — với key theo generation sẽ sót blob bản cũ khi xoá tài khoản (privacy).

## Quyết định (gồm counsel kongming)
- **Generation dựa trên thời gian, chặn tăng dần**: lúc tạo bản ghi, `generation = max(Date.now(), lastGenLocal + 1)` (chặn đồng hồ lùi trong page). Gắn vào `AudioBlobRecord` ngay khi tạo; retry/flush/reload gửi lại đúng giá trị đã lưu. Bộ đếm thuần IndexedDB bị loại vì device copy bị xoá ngay khi upload thành công → reset sau reload → 409 oan bản ghi mới (regression tệ hơn bug gốc). SQLite integer 64-bit chứa epoch ms; zod chặn `<= Number.MAX_SAFE_INTEGER`.
- Thêm cột `attempt_answer.generation` INTEGER NOT NULL DEFAULT 0. Migration sinh bằng `pnpm --filter @vox-flow/db db:generate`; không sửa tay; **không áp migration lên env thật trong session này**.
- Query param `generation` (số nguyên ≥ 0, mặc định 0) — bundle SPA cũ trong cache không gửi param vẫn hoạt động: row cũ default 0, `0 <= 0` được nhận; chỉ thua khi đã có generation mới hơn. KHÔNG trả 400 khi thiếu param.
- **Key audio chứa generation bằng dấu chấm**: `users/<uid>/attempts/<att>/<questionKey>.<gen>.<ext>` — dùng `.` vì `.` không nằm trong `QUESTION_KEY_RE` (`[a-zA-Z0-9_-]`), loại xung đột với key legacy của questionKey chứa dấu gạch (`p1` + gen `1` → `p1-1.webm` trùng key legacy của `p1-1`). Hệ quả: `SAFE_FILENAME_RE` được nới ĐÚNG MỘT LẦN thành `/^[a-zA-Z0-9_-]+(\.\d+)?\.(webm|mp4|ogg|wav|mp3)$/` (một segment số tuỳ chọn); key legacy `<qk>.<ext>` vẫn khớp. Khác key theo generation nên `bucket.put` đồng thời không giẫm chân nhau. (Red-team F5: định dạng `-<gen>` của counsel gốc có xung đột thật — đã đổi.)
- **Route chặn 2 lớp** (thứ tự là acceptance criterion): auth/ownership/status như hiện nay → pre-read row hiện tại (lấy `generation` + `audioKey` cũ): nếu `incoming < stored` → `409` ngay, không put blob (tối ưu; chốt chặn thật là upsert) → `bucket.put` key có generation → upsert có điều kiện `setWhere: sql`${attemptAnswer.generation} <= excluded.generation`` kèm `.returning()` → 0 row (thua race): `bucket.delete` key vừa put, re-read row lấy `storedGeneration`, trả `409 {"error":"stale_generation","storedGeneration":N}` → thắng: nếu `audioKey` cũ khác key mới thì best-effort xoá blob cũ.
- `generation == stored` được nhận (retry idempotent: request thứ hai không bị chặn); row phản ánh payload của lần cuối (idempotent tuyệt đối chỉ khi payload giống nhau — blob encode lại vẫn được chấp nhận ở cùng generation).
- **Upsert helper dùng chung** `upsertAnswerRecording(db, values)` export từ `packages/api` (server route import) — để chứng minh hành vi `setWhere` + `.returning()` trên **SQLite thật** qua harness `createTestDb` (Miniflare D1) trong `packages/api`, không chứng minh trên mock.
- **Xoá tRPC `attempt.uploadAnswer`** cùng các test dùng nó (`packages/api/src/routers/attempt.test.ts`) — code chết, một đường ghi không guard.
- **Erasure theo prefix**: `attempt.erase` trong `packages/api/src/data-registry.ts` chuyển sang `bucket.list({ prefix: "users/<uid>/attempts/<attemptId>/" })` rồi xoá hết, **loop pagination** (`truncated`/`cursor`, R2 tối đa 1000 object/lần). `list` là **BẮT BUỘC** trên `EraseContext.audioBucket` — không giữ fallback "đi theo row" vì fallback tái tạo đúng lỗ hổng privacy đang sửa; `eraseUserData` hiện chỉ có test caller nên việc siết type không vỡ production (red-team F4/F6). Có test cho trường hợp sót blob generation cũ và truncated.
- **Client**: `AnswerUpload`/`AudioBlobRecord` thêm `generation: number`; `uploadUrl` gửi `generation`; `postAnswerAudio` trả `{ ok, stale?, storedGeneration? }` (đọc body 409). `409 stale` → **settled**: `clearFailed`, KHÔNG retry, KHÔNG đếm vào `failedQuestionKeys`, và **KHÔNG xoá device copy** (false-stale do lệch đồng hồ cross-device/NTP không được biến thành mất dữ liệu im lặng — bản ghi giữ lại làm bằng chứng/recovery; red-team F2/F3). 4xx khác vẫn là lỗi. **Bỏ `mustResend` + `settleSuperseded`**: với guard phía server, bản cũ trả 200 không thể đè bản mới (bản mới hoặc đang bay rồi sẽ thắng bằng generation cao hơn, hoặc nằm trong `failedUploads` để flush gửi lại) — clean cutover, test thay thế chứng minh.
- **Trần server clock**: sau khi parse, `generation > Date.now() + 300_000` → `400` (giá trị độc hại không được khoá chết câu hỏi vĩnh viễn; red-team F3).
- Device copy cũ (trước deploy) thiếu `generation` → chuẩn hoá về **0** khi đọc trong flush (KHÔNG dùng `nextGeneration`/`Date.now()`: gán timestamp lúc flush sẽ đúc generation mới hơn cả bản ghi thật đã upload — hồi sinh đúng bug #96 cho cohort chuyển tiếp; red-team F1/F2). Bản ghi MỚI được gán generation ngay lúc tạo trong `use-exam-session` (qua helper `withGeneration`), không phụ thuộc đường flush.
- Scope lock: không đổi scoring pipeline, không đổi route GET audio, không thêm job dọn blob mồ côi, không đổi `getActive`.
- **Rủi ro đã ghi nhận (chấp nhận có documentation)**: (1) bundle SPA cũ trong cache gặp row gen>0 sẽ 409-loop đến `upload_error` — cửa sổ chuyển tiếp tạm thời tới khi bundle refresh; lối thoát: plain-submit đã có (`use-scoring-job.ts`), ghi rõ trong PR. (2) Criterion "reload/resume ghi lại được 200" có điều kiện đồng hồ: wall-clock phải không lùi xuyên ranh giới reload một khoảng lớn hơn khoảng cách lần upload cuối; lệch đồng hồ cross-device lớn có thể cho false-stale — thiệt hại bị chặn ở mức "giữ bản server cũ, giữ device copy, không mất dữ liệu"; phương án triệt để (serverGen qua `getActive`) ngoài scope lần này.

## Contract (đã commit, không đổi tên hay kiểu)
- `packages/db/src/schema/attempt.ts`: `attempt_answer.generation` (integer, notNull, default 0). Migration mới trong `packages/db/src/migrations/`.
- `packages/api/src/audio.ts`: `buildAudioKey(userId, attemptId, questionKey, mime, generation?)` → `<questionKey>.<gen>.<ext>` khi có generation; `SAFE_FILENAME_RE` nới thành `/^[a-zA-Z0-9_-]+(\.\d+)?\.(webm|mp4|ogg|wav|mp3)$/` (một segment số tuỳ chọn; key legacy vẫn khớp).
- `packages/api` export mới: `upsertAnswerRecording` (upsert có điều kiện + returning).
- `apps/server/src/index.ts`: query schema thêm `generation`; 409 body `{"error":"stale_generation","storedGeneration":<int>}`.
- `packages/api/src/routers/attempt.ts`: KHÔNG còn `uploadAnswer`.
- `packages/api/src/data-registry.ts`: `EraseContext.audioBucket` BẮT BUỘC có `list` + `delete` (không fallback); `attempt.erase` xoá theo prefix có pagination.
- `apps/web/src/features/exam/storage.ts`: `AudioBlobRecord.generation`.
- `apps/web/src/features/exam/use-exam-session.ts`: literal record trong `stopRec` gán generation qua helper `withGeneration` (cả nhánh có và không có `attemptId`).
- `apps/web/src/features/exam/answer-uploads.ts`: `AnswerUpload.generation`, helper `withGeneration`, `uploadUrl` gửi `generation`, `postAnswerAudio` → `Promise<{ ok: boolean; stale?: boolean; storedGeneration?: number }>`, KHÔNG còn `mustResend`/`settleSuperseded`.

## Phases
| # | Phase | Sở hữu file | Status |
|---|-------|-------------|--------|
| 1 | Server & API: schema, audio key, upsert helper (SQLite thật), route 409, composite test, xoá tRPC, erasure | `packages/db/**`, `packages/api/**`, `apps/server/**` | Done |
| 2 | Client: generation timestamp, phân loại 409, bỏ mustResend | `apps/web/**` | Done |

## Acceptance Criteria (theo checklist kongming + red-team)
- [x] Generation dựa trên thời gian, chặn tăng dần, gán NGAY LÚC TẠO record trong `use-exam-session` (helper `withGeneration`, cả hai nhánh có/không `attemptId`); nằm trong `AudioBlobRecord`; retry/flush gửi lại đúng giá trị.
- [x] Device copy legacy (trước deploy, thiếu generation) được chuẩn hoá về **0** lúc flush — không bao giờ được đóng dấu timestamp mới.
- [x] Sau reload hoặc resume (đồng hồ đơn điệu), ghi âm lại một câu đã có trên server thì được 200, không bị 409.
- [x] Thứ tự route: auth → pre-read → put (key có generation) → upsert điều kiện `stored <= excluded.generation` kèm returning → thua thì delete blob + 409 `stale_generation`.
- [x] `generation > Date.now() + 24 giờ` → `400` (trần server clock — deviation đã ghi: 5 phút quá chật cho thiết bị lệch giờ; ownership check chặn cross-user).
- [x] Gửi cùng generation hai lần: cả hai 200; row phản ánh payload lần cuối.
- [x] Không gửi param = generation 0: nhận nếu row 0, 409 `stale_generation` nếu row đã > 0.
- [x] Hai request cùng câu theo thứ tự ngược (gen cao trước, gen thấp sau): row cuối là gen cao, blob gen thấp đã bị xoá — chứng minh bằng test composite chạy route + SQLite thật (Miniflare), không chỉ mock.
- [x] Row có sẵn trước migration default 0 còn đọc được; key cũ vẫn qua `isValidAudioKey` sau khi nới regex (`(\.\d+)?`); key mới `<qk>.<gen>.<ext>` không xung đột key legacy.
- [x] Bản thắng xoá blob của generation bị thay thế; bản thua xoá blob của chính nó.
- [x] Erasure xoá theo prefix, loop pagination (`truncated`/`cursor`); `list` bắt buộc; có test chứng minh blob generation cũ bị xoá và truncated được xử lý.
- [x] tRPC `attempt.uploadAnswer` đã xoá cùng test của nó.
- [x] Client: `409 stale` = settled (clearFailed, không fail ở flush lúc submit, GIỮ device copy); `mustResend`/`settleSuperseded` đã xoá, test thay thế chứng minh hành vi mới.
- [x] Test upsert điều kiện chạy trên SQLite thật (Miniflare D1), chứng minh `returning()` về 0 row khi điều kiện sai.
- [x] Gate: `pnpm --filter @vox-flow/api test`, `pnpm --filter server test`, `pnpm --filter web test src/features/exam/__tests__/answer-uploads.test.ts`, `pnpm check-types` — tất cả pass.

## Failure Protocol
Xem `## Failure Protocol` trong từng `phase-NN-*.md`. Khi một bước Verify không đạt pass condition: DỪNG phase, không tự sửa cho qua, escalate theo protocol (kongming hoặc báo user).

## Validation Log

### Verification Results — 2026-11-10 (Fact Checker, Light tier: 2 phases)
- Claims checked: 10
- Verified: 10 | Failed: 0 | Unverified: 0
- Tier: Light
- Claims spot-checked against worktree:
  1. `attempt_answer` unique(attemptId, questionKey), không có cột generation — `packages/db/src/schema/attempt.ts` (unique `attempt_answer_attempt_question_unique`).
  2. Route upsert last-write-wins — `apps/server/src/index.ts:60-152` (onConflictDoUpdate không điều kiện).
  3. tRPC `attempt.uploadAnswer` đường ghi thứ hai không guard, web không gọi — `packages/api/src/routers/attempt.ts:128-213`; caller chỉ `attempt.test.ts` (168/189/202/213/235).
  4. `SAFE_FILENAME_RE` tại `packages/api/src/audio.ts:17` chấp nhận sẵn dạng `<qk>-<gen>.<ext>` (ký tự `-` nằm trong class) — không cần nới regex.
  5. Harness SQLite thật `createTestDb` (Miniflare D1 + migrations) tồn tại — `packages/api/src/test/db.ts`; mẫu seed `audio.test.ts:375-393`.
  6. drizzle-orm 1.0.0-rc.5 hỗ trợ `setWhere` trong `onConflictDoUpdate` — `insert.d.ts:82-85`.
  7. `EraseContext.audioBucket` tại `packages/api/src/data-registry.ts:26` chỉ có `delete` → cần widen thêm `list`; `attempt.erase` ~141-158 xoá theo row.
  8. Test web dùng `vi.stubGlobal("fetch", fetchSpy)` + helper `record()` thiếu generation → Task 2.1 bước 4 đã thêm cập nhật helper.
  9. Zod style: `part`/`order` dùng `.default(1)` SAU pipe → `generation` làm `.default(0)` sau pipe (đã sửa trong phase-01 Task 1.4 bước 2).
  10. `use-exam-session.ts:247` gọi `trackAnswerUpload`; record dựng tại ~215-235 không có generation — Task 2.1 gán trong `trackAnswerUpload`.
- Interview step: bỏ qua trong chế độ autonomous của vibe (`--ship --beta --advice`); các điểm quyết định thiết kế đã chốt qua counsel kongming (timestamp generation, xoá tRPC path, erasure prefix, client 409=settled, bỏ mustResend) và định hướng chủ sở hữu issue (#96 "Hướng sửa"). Không còn decision point mở đáng kể.

### Whole-Plan Consistency Sweep — 2026-11-10
- Quét 3 file plan sau khi hợp nhất counsel: không còn cụm "bộ đếm IndexedDB", "bump-retry", ".g<gen>", "nới regex" sót từ bản nháp đầu (đã thay bằng timestamp generation, 409=settled, `<qk>.<gen>.<ext>`, giữ nguyên regex).
- Contract/AC/phase tasks khớp nhau: 409 body `{"error":"stale_generation","storedGeneration":N}` thống nhất ở plan.md, phase-01 Task 1.3/1.4, phase-02 Task 2.2.
- Không có mâu thuẫn chưa xử lý.

## Red Team Review

### Session — 2026-11-10
**Reviewers:** Security Adversary (`RTSecurity`, 8 findings) + Assumption Destroyer (`RTAssumption`, 7 findings). Dedupe: RTAssumption-F4 ≡ RTSecurity-F6, RTAssumption-F5 ≡ RTSecurity-F7 → 13 unique.
**Findings:** 13 (1 Critical, 3 High, 9 Medium) — **chấp nhận 13/13** (1 một phần: F-clock chỉ ghi nhận điều kiện, không thêm serverGen floor).
**Severity breakdown:** 2 Critical, 3 High, 8 Medium (sau dedupe).

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Chuẩn hoá legacy copy bằng `Date.now()` lúc flush hồi sinh bug #96 (RTSec-F1 + RTAss-F2) | Critical | Accept — legacy copy gán **0**, record mới gán gen lúc tạo qua `withGeneration` | plan.md Quyết định/AC, Phase 02 Task 2.1 |
| 2 | `409 stale` + xoá device copy = mất dữ liệu im lặng khi false-stale (RTSec-F2) | High | Accept — stale KHÔNG xoá device copy, chỉ clearFailed | plan.md, Phase 02 Task 2.3 |
| 3 | `generation` không trần → giá trị độc hại khoá chết câu hỏi (RTSec-F3) | High | Accept — trần `Date.now() + 5 phút` → 400 | plan.md, Phase 01 Task 1.4 |
| 4 | Erasure bỏ qua pagination R2 (1000 object/lần) (RTSec-F4) | High | Accept — loop `truncated`/`cursor` + test | plan.md, Phase 01 Task 1.6 |
| 5 | Key `-<gen>` xung đột key legacy của questionKey chứa gạch (`p1`+gen1 ≡ `p1-1`) (RTSec-F5) | Medium | Accept — đổi sang `<qk>.<gen>.<ext>`, nới regex một segment số | plan.md, Phase 01 Task 1.2 |
| 6 | AC "equal-gen row không đổi" mâu thuẫn `set` đầy đủ (RTSec-F6 + RTAss-F4) | Medium | Accept — equal-gen nhận và row phản ánh payload lần cuối | plan.md Quyết định/AC |
| 7 | Bundle cũ + row gen>0 → 409-loop `upload_error` (RTSec-F7 + RTAss-F5) | Medium | Accept (documented risk) — ghi risk + lối thoát plain-submit vào plan/PR | plan.md Quyết định |
| 8 | Thiếu test composite route+SQLite thật cho lost-race (RTSec-F8) | Medium | Accept — thêm test integration `apps/server` với Miniflare D1 | plan.md AC, Phase 01 Task 1.5 |
| 9 | Task 2.1 sai: literal `stopRec` annotated `AnswerUpload` sẽ TS2322 + nhánh `!attemptId` bypass `trackAnswerUpload` (RTAss-F1) | Critical | Accept — `use-exam-session` PHẢI đổi: gán gen trong literal qua `withGeneration`, bỏ mệnh đề "KHÔNG đổi" | plan.md Contract, Phase 02 Task 2.1 |
| 10 | Wall-clock thiếu bảo vệ skew/rollback xuyên reload; criterion "reload 200" là có điều kiện (RTAss-F3) | High | Accept (một phần) — AC ghi điều kiện đồng hồ; false-stale không mất dữ liệu (F2); serverGen floor ngoài scope, ghi residual risk | plan.md Quyết định/AC |
| 11 | Erasure không có caller production; `list` optional giữ lỗ hổng (RTAss-F6) | Medium | Accept — `list` bắt buộc, bỏ fallback | plan.md, Phase 01 Task 1.6 |
| 12 | Kịch bản A mâu thuẫn mã spec: superseded-stale early-return không xoá copy (RTAss-F7) | Medium | Accept — chốt semantic: stale không bao giờ xoá copy; Kịch bản A assert copy GIỮ + không fail | Phase 02 Task 2.3 |

Fact-check của cả hai reviewer xác nhận các claim hiện trạng (line numbers, harness, drizzle setWhere, zod default, regex) — không có finding nào thiếu bằng chứng.

### Session 2 — post-implementation review (ImplReview + kongming) — 2026-11-10
**Findings:** 5 (0 Critical, 1 High, 4 Medium) — 1 Reject, 4 Accept.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | "Đã xoá backfill/submit-lock + 8 test" | High | **Reject — so-sánh-sai-base**: diff của branch KHÔNG đụng exam-screen/pre-submit-modal/slice-c; `pendingSessionRef`/`submitLocked` là machinery #105 trên dev (16 commit sau base). Rebase về origin/dev sẽ mang machinery về; `withGeneration` stamp ở literal, drain backfill spread `{...r, attemptId: id}` giữ nguyên generation | (rebase) |
| 2 | Winner xoá blob theo pre-read → orphan khi 2 request cùng thắng nối tiếp | Medium | Accept — winner-cleanup đổi sang `bucket.list({ prefix: "<qk>." })` sau khi thắng, xoá mọi key ≠ key thắng (pre-read chỉ còn phục vụ fast-path) | `apps/server/src/index.ts`, unit+integration tests |
| 3 | Erasure nuốt lỗi delete + thoát sớm khi `truncated` thiếu `cursor` | Medium | Accept — retry delete 1 lần, lỗi persistent → throw TRƯỚC `db.delete(attempt)`; `truncated && !cursor` → throw | `packages/api/src/data-registry.ts` + 2 test mới |
| 4 | Test composite: assertion vô nghĩa (`size >= 0`), tên test "deleting the loser blob" sai phạm vi | Medium | Accept — đổi tên + snapshot before/after; thêm test winner-cleanup tuần tự trên D1 thật | `apps/server/src/index.integration.test.ts` |
| 5 | `storedGeneration` dead field trong `UploadResult` | Medium | Accept — `staleRejection` populate từ body (validate `Number.isSafeInteger`) | `apps/web/src/features/exam/answer-uploads.ts` |

**Deviation khỏi plan (có chủ đích, có rationale):**
- Trần generation nới **5 phút → 24 giờ** (counsel kongming sau implementation): route đã chặn ownership (403 khi sai user) nên poisoning chỉ hại chính attempt đó — trần này chặn client bug, không chặn attacker; trần 5 phút khoá nộp bài vĩnh viễn với thiết bị chạy nhanh giờ. Ghi vào PR.
- Winner-cleanup dùng list-prefix thay vì pre-read audioKey (đóng orphan race — finding 2).

### Whole-Plan Consistency Sweep (sau review) — 2026-11-10
- plan.md AC "trần `now + 5 phút`" cập nhật thành 24 giờ; phase-01/02 task text khớp code (winner-cleanup list, erasure throw-before-delete, storedGeneration populated).
- Không còn mâu thuẫn chưa xử lý.



