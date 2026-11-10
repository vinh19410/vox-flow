# Phase 01 — Server & API: schema, audio key, upsert helper, route 409, xoá tRPC, erasure

Sở hữu file: `packages/db/**`, `packages/api/**`, `apps/server/**`. Không đụng `apps/web/**` (Phase 02 sở hữu).
Chạy lệnh từ root worktree. Repo dùng `pnpm`, KHÔNG dùng `npm`/`yarn`. KHÔNG áp migration lên env thật.

## Task 1.1 — Schema: cột `attempt_answer.generation` + migration

- Goal: `attempt_answer` có cột `generation` INTEGER NOT NULL DEFAULT 0; migration mới sinh trong `packages/db/src/migrations/`.
- Target files and symbols:
  - `packages/db/src/schema/attempt.ts` (bảng `attemptAnswer`).
  - `packages/db/src/migrations/<timestamp>_*/` (sinh tự động, KHÔNG sửa tay).
- Steps:
  1. Trong `attemptAnswer`, thêm cột ngay sau `orderIndex`:
     ```ts
     /** Monotonic client-side version (epoch ms, clamped) per question; server rejects uploads older than stored. */
     generation: integer("generation").default(0).notNull(),
     ```
  2. Chạy `pnpm --filter @vox-flow/db db:generate` (KHÔNG dùng `pnpm db:generate` ở root — lỗi không có TTY).
  3. Mở file migration mới, xác nhận chỉ chứa thao tác `ALTER TABLE attempt_answer ADD` cho cột `generation` (so sánh, không sửa tay). Nếu sinh thêm thứ không liên quan → Failure Protocol.
- Success criteria: file migration mới tồn tại, chỉ chứa ADD COLUMN generation.
- Verify: `ls packages/db/src/migrations | tail -1` in ra thư mục mới hơn mọi mục khác, và `grep -ril generation packages/db/src/migrations/$(ls -t packages/db/src/migrations | head -1)/` in ra ít nhất một file. Migration chưa commit Env thật nào — chỉ nằm trong repo.

## Task 1.2 — `buildAudioKey` nhận generation, key dạng `<qk>.<gen>.<ext>` (TDD: đỏ trước)

- Goal: key audio chứa generation qua dấu chấm; `SAFE_FILENAME_RE` nới đúng một segment số; key cũ vẫn hợp lệ; không xung đột key legacy (red-team F5: `.` không nằm trong `QUESTION_KEY_RE` nên không có questionKey thật nào tạo key trùng).
- Target files and symbols:
  - `packages/api/src/audio.ts` — hàm `buildAudioKey`, hằng `SAFE_FILENAME_RE` (dòng 17).
  - `packages/api/src/audio.test.ts` — describe `QUESTION_KEY_RE and buildAudioKey` có sẵn.
- Steps:
  1. VIẾT TEST TRƯỚC trong `packages/api/src/audio.test.ts`:
     - `buildAudioKey("user-123", "att-456", "p1-1", "audio/webm", 1731212345678)` → `"users/user-123/attempts/att-456/p1-1.1731212345678.webm"`.
     - `buildAudioKey("user-123", "att-456", "p1-1", "audio/webm")` → giữ key cũ `"users/user-123/attempts/att-456/p1-1.webm"`.
     - `isValidAudioKey("users/user-123/attempts/att-456/p1-1.1731212345678.webm", "user-123", "att-456")` → `true`.
     - `isValidAudioKey("users/user-123/attempts/att-456/p1-1.webm", "user-123", "att-456")` → `true` (key cũ).
     - `isValidAudioKey("users/user-123/attempts/att-456/p1-1.webm.gaa.webm", "user-123", "att-456")` → `false` (segment không phải số bị chặn).
     - `isValidAudioKey("users/user-123/attempts/att-456/p1-1.1731212345678.99.webm", "user-123", "att-456")` → `false` (chỉ cho MỘT segment số).
     - Confirm ĐỎ: lệnh Verify ở dưới exit != 0 với assertion failure (đỏ là trạng thái mong đợi của bước này — không phải verification failure).
  2. Sửa `buildAudioKey`: thêm tham số cuối `generation?: number`; có generation → `${questionKey}.${generation}.${ext}`; không → giữ `${questionKey}.${ext}`.
  3. Sửa `SAFE_FILENAME_RE` thành `/^[a-zA-Z0-9_-]+(\.\d+)?\.(webm|mp4|ogg|wav|mp3)$/` — đúng một thay đổi này, không nới thêm.
- Success criteria: test mới + cũ của `audio.test.ts` pass; regex chỉ thêm `(\.\d+)?`.
- Verify: `pnpm --filter @vox-flow/api test src/audio.test.ts` exit 0. `git diff packages/api/src/audio.ts | grep -c "SAFE_FILENAME_RE"` in ra `>= 2` (dòng xóa + dòng thêm — regex ĐÃ đổi).

## Task 1.3 — Upsert helper `upsertAnswerRecording` + chứng minh trên SQLite thật (TDD: đỏ trước)

- Goal: helper upsert có điều kiện `stored <= excluded.generation` + `.returning()` được chứng minh hành vi trên SQLite thật (Miniflare D1) — KHÔNG chứng minh trên mock.
- Target files and symbols:
  - `packages/api/src/answers.ts` (file MỚI) — `upsertAnswerRecording(db: Database, values: { id, attemptId, questionKey, questionText, partNumber, orderIndex, audioKey, durationMs, mimeType, generation })` trả về mảng row `.returning()` (rỗng khi thua điều kiện).
  - `packages/api/src/index.ts` — re-export `upsertAnswerRecording`.
  - `packages/api/src/answers.test.ts` (file MỚI) — dùng `createTestDb` từ `./test/db` (mẫu: `audio.test.ts` dòng ~375).
- Steps:
  1. VIẾT TEST TRƯỚC trong `packages/api/src/answers.test.ts` (seed `user`, `attempt`, `attemptAnswer` bằng `testCtx.db.insert`, mẫu seed ở `audio.test.ts:375-393`; migrate tự chạy trong `createTestDb` từ thư mục migrations nên test này CẦN migration Task 1.1):
     - Case thắng: row sẵn có `generation: 100`; upsert `generation: 200` → trả mảng 1 row, row trong DB có `generation: 200` và `audioKey` mới.
     - Case thua: row sẵn có `generation: 200`; upsert `generation: 100` → trả mảng RỖNG, row trong DB giữ nguyên `generation: 200` + `audioKey` cũ. (Đây là bằng chứng `returning()` về 0 row khi điều kiện sai — assumption trung bình của kongming, bắt buộc chứng minh.)
     - Case equal: row `generation: 200`, upsert `generation: 200` → 1 row trả về, nội dung row được cập nhật (retry idempotent).
     - Case insert mới: chưa có row, upsert `generation: 1` → 1 row, `generation: 1` trong DB.
     - Confirm ĐỎ (helper chưa tồn tại → import lỗi/test fail).
  2. Viết `upsertAnswerRecording`: `db.insert(attemptAnswer).values(values).onConflictDoUpdate({ target: [attemptAnswer.attemptId, attemptAnswer.questionKey], set: { questionText, partNumber, orderIndex, audioKey, durationMs, mimeType, generation }, setWhere: sql`${attemptAnswer.generation} <= excluded.generation` }).returning()`. Import `sql` từ `drizzle-orm`, bảng từ `@vox-flow/db`. Nếu `setWhere` dạng này không biên dịch được với drizzle rc-5 trong repo → Failure Protocol (đừng đổi sang param bind tùy tiện).
- Success criteria: 4 case trên SQLite thật pass.
- Verify: `pnpm --filter @vox-flow/api test src/answers.test.ts` exit 0, output có tên 4 case.

## Task 1.4 — Route upload: query `generation`, fast-path 409, put → upsert điều kiện → dọn blob (TDD: đỏ trước)

- Goal: server từ chối bản cũ bằng `409 {"error":"stale_generation","storedGeneration":N}`; row luôn kết thúc ở generation cao nhất; blob bản thua/bị thay thế được xoá.
- Target files and symbols:
  - `apps/server/src/index.ts` — `audioUploadQuerySchema`, route `POST /api/attempts/:attemptId/answers/:questionKey/audio`.
  - `apps/server/src/index.test.ts` — mock `mockDb`, `mockInsertValues`, `mockState`, `mockPut` (thêm `mockDelete`, `mockList` khi cần).
- Steps:
  1. VIẾT TEST TRƯỚC trong `apps/server/src/index.test.ts` (mẫu mock POST audio có sẵn trong file):
     - Stale fast-path: `mockState` có sẵn row `attempt_answer` với `generation: 5` (mock select theo bảng — mock hiện tại trả attempt ở mọi select; tách mock để select `attemptAnswer` trả row answer); request `generation=4` → status `409`, body `{ error: "stale_generation", storedGeneration: 5 }`, `mockPut` KHÔNG được gọi.
     - Equal: row `generation: 5`, request `generation=5` → 200, `mockPut` 1 lần, values truyền vào helper chứa `generation: 5` (helper được mock/spy ở test này — hành vi thật của helper đã chứng minh ở Task 1.3).
     - Không param: row `generation: 0`, không gửi `generation` → query parse `generation: 0` → 200.
     - Không param nhưng row đã có gen: row `generation: 1731212345678`, không param → 409 kèm `storedGeneration` đúng.
     - Trần server clock (red-team F3): request `generation=<Date.now() + 10 phút>` (số > hiện tại + 5 phút) → `400`, `mockPut` KHÔNG được gọi, helper không chạy.
     - Thua race: helper (mock) trả `[]`; re-read row trả `generation: 7` → 409 `{ error: "stale_generation", storedGeneration: 7 }`, `mockDelete` (bucket) được gọi với đúng audioKey vừa put.
     - Thắng có blob cũ: pre-read trả row cũ `audioKey` khác key mới; helper trả 1 row → 200, `mockDelete` gọi với audioKey CŨ (best-effort; nếu pre-read không có row thì không gọi delete).
     - Confirm ĐỎ trước khi sửa route.
  2. Sửa `audioUploadQuerySchema`: thêm trường `generation` — y hệt style `part`/`order` đang có: `z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)).default(0)` (`.default(0)` SAU pipe, như `part` đang làm với `.default(1)`). Ghi test không-param ở trên làm chuẩn hành vi.
  3. Trong route, sau các check auth/status hiện có, theo đúng thứ tự:
     1. Trần server clock (red-team F3): `if (generation > Date.now() + 300_000) return c.json({ error: "Generation too far in the future" }, 400)` — chặn giá trị độc hại khoá chết câu hỏi.
     2. Pre-read: `db.select({ generation: attemptAnswer.generation, audioKey: attemptAnswer.audioKey }).from(attemptAnswer).where(and(eq(attemptAnswer.attemptId, attemptId), eq(attemptAnswer.questionKey, questionKey))).limit(1)`. Nếu có row và `generation < row.generation` → `return c.json({ error: "stale_generation", storedGeneration: row.generation }, 409)`.
     3. `const audioKey = buildAudioKey(session.user.id, attemptId, questionKey, contentType, generation)` (generation từ query).
     4. `await bucket.put(audioKey, c.req.raw.body, { httpMetadata: { contentType } })` (giữ vị trí hiện tại — sau khi đã lọc stale).
     5. `const updated = await upsertAnswerRecording(db, { id: crypto.randomUUID(), attemptId, questionKey, questionText, partNumber, orderIndex, audioKey, durationMs, mimeType: contentType, generation })` (import từ `@vox-flow/api`).
     6. `updated.length === 0` → re-read row (câu select như bước 2) → `await bucket.delete(audioKey).catch(() => {})` → `return c.json({ error: "stale_generation", storedGeneration: <generation vừa đọc> }, 409)`.
     7. Thắng: nếu pre-read có row và `row.audioKey !== audioKey` → `await bucket.delete(row.audioKey).catch(() => {})` (best-effort, không chặn 200).
     8. Response 200 giữ nguyên shape.
- Success criteria: mọi case test mới + case cũ của `index.test.ts` pass.
- Verify: `pnpm --filter server test src/index.test.ts` exit 0.

## Task 1.5 — Test composite: route thật + SQLite thật (Miniflare D1) cho hai luồng race (red-team F8)

- Goal: bịt khoảng trống giữa Task 1.3 (helper thật, không qua route) và Task 1.4 (route thật, helper mock): chứng minh tổ hợp zod → `buildAudioKey` → helper thật (`setWhere`/`returning` trên D1) → 409/delete chạy đúng, mock không thể xanh giả.
- Target files and symbols:
  - `apps/server/src/index.integration.test.ts` (file MỚI).
  - Tái sử dụng: `createTestDb` từ `packages/api/src/test/db.ts` (import theo đường dẫn package hoặc relative — dùng cách đã có precedent trong repo; miniflare là dep của `@vox-flow/api`), `app` từ `./index`.
  - Mock như `index.test.ts`: `vi.mock("./env.server", ...)` với fake R2 bucket Map-backed (put/get/delete/list ghi log), `vi.mock("./services", ...)` với `getDb: () => testDb.db`, `createAuth` trả session user thật khớp seed.
- Steps:
  1. Seed qua `testCtx.db.insert`: user, attempt (`in_progress`, user khớp session), CHƯA có answer.
  2. Test "thắng ngược thứ tự": POST câu `p1-1` với `generation=T2` (2 lần gọi `app.request`, gen T2 trước): lần 1 → 200; POST lại cùng câu gen `T1 < T2` → 409 `stale_generation` + `storedGeneration = T2`; row cuối `generation = T2`; fake bucket KHÔNG còn object của key T1 (đã bị xoá).
  3. Test "thua race khi mất điều kiện": seed row `generation = T2` trực tiếp vào DB, POST gen `T1 < T2` (bỏ qua fast-path bằng... fast-path sẽ chặn trước — nếu vậy case này trùng stale fast-path; mục tiêu thật là chứng minh `setWhere` chặn khi pre-read và upsert race: seed row GIỮA hai thao tác bằng cách pre-read trả row cũ (gen thấp) rồi helper thua — dựng được bằng cách seed row gen T2 sau khi route đã pre-read: dùng fake bucket put hook hoặc bỏ case này vì Task 1.3 đã chứng minh helper trả 0 row khi `stored > incoming` và Task 1.4 case "thua race" chứng minh nhánh 409+delete của route trên mock. Nếu không dựng được race thật trong test này, giữ 2 assertion: (a) helper thật trên D1 trả `[]` khi `stored > incoming` (đã có ở Task 1.3), (b) luồng 409 fast-path thật ở trên. GHI RÕ trong test comment điều nào được chứng minh ở task nào.
  4. Test key format end-to-end: row sau upload có `audioKey` dạng `users/<uid>/attempts/<att>/<qk>.<gen>.<ext>`; GET audio cũ (`/answers/:answerId/audio`) đọc được row đó (resolveAudioStreamResponse với fake bucket).
- Success criteria: test integration pass trên D1 thật; không mock db layer của route.
- Verify: `pnpm --filter server test src/index.integration.test.ts` exit 0.

## Task 1.6 — Xoá tRPC `attempt.uploadAnswer` (clean cutover)

- Goal: không còn đường ghi `attemptAnswer` không guard.
- Target files and symbols:
  - `packages/api/src/routers/attempt.ts` — procedure `uploadAnswer` (dòng ~128-213).
  - `packages/api/src/routers/attempt.test.ts` — các test gọi `attempt.uploadAnswer` (dòng ~168, 189, 202, 213, 235).
- Steps:
  1. Chạy `xd://lsp` references cho `uploadAnswer` để liệt kê mọi caller (kỳ vọng: chỉ test file). Web KHÔNG gọi (đã grep xác nhận).
  2. Xoá procedure `uploadAnswer` khỏi router.
  3. Xoá các test case dùng `uploadAnswer` (cả describe nếu rỗng). KHÔNG xoá test của procedure khác.
  4. Nếu import nào chỉ phục vụ `uploadAnswer` (ví dụ `buildAudioKey` trong file này) → xoá import thừa.
- Success criteria: `grep -rn "uploadAnswer" packages apps --include='*.ts*'` trả rỗng (loại trừ node_modules và plans/).
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` exit 0 VÀ `grep -rn "uploadAnswer" packages/api/src apps/web/src --include='*.ts*'` exit 1 (rỗng).

## Task 1.7 — Erasure theo prefix R2, có pagination, `list` bắt buộc (red-team F4/F6)

- Goal: xoá tài khoản xoá được cả blob generation cũ, không sót audio.
- Target files and symbols:
  - `packages/api/src/data-registry.ts` — type `EraseContext` (dòng ~26), handler `attempt.erase` (~dòng 141-158).
  - `packages/api/src/data-registry.test.ts` — test erasure (caller duy nhất của `eraseUserData` hiện là test — red-team F6).
- Steps:
  1. VIẾT TEST TRƯỚC trong `data-registry.test.ts`: fake bucket (Map-backed) ghi lại `list`/`delete`; 2 row `attempt_answer` (row hiện tại trỏ `k_200`, blob mồ côi `k_100` cùng prefix); fake `list` trả `{ objects: [k_200, k_100], truncated: true, cursor: "c1" }` lần 1 và `{ objects: [k_300], truncated: false }` lần 2 (chứng minh loop pagination — red-team F4); gọi erase → `delete` được gọi cho CẢ 3 key, `list` được gọi ĐÚNG 2 lần (cursor được truyền lại). Confirm ĐỎ.
  2. Siết `EraseContext.audioBucket`: **BẮT BUỘC** cả hai phương thức, không optional, không fallback đi theo row (fallback tái tạo đúng lỗ hổng privacy đang sửa — red-team F6):
     ```ts
     audioBucket: {
       delete: (key: string) => Promise<void>;
       list: (opts: { prefix: string; cursor?: string }) => Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }>;
     };
     ```
     (Đối chiếu với `R2Objects` của workers-types thật nơi context được dựng ở test; shape trên là bản tối giản tương thích.)
  3. Viết lại `attempt.erase`: với mỗi attempt, loop `let cursor: string | undefined`; `const page = await ctx.audioBucket.list({ prefix: \`users/${userId}/attempts/${att.id}/\`, cursor })`; xoá tuần tự từng `key` trong `page.objects` (mỗi delete `.catch(() => {})`); `if (!page.truncated) break; cursor = page.cursor;`. Sau loop các attempt → `db.delete(attempt)` như hiện tại.
  4. Cập nhật mọi caller dựng `EraseContext` (test) theo shape mới.
- Success criteria: test erasure mới + cũ pass; type không còn nhánh fallback.
- Verify: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` exit 0 VÀ `grep -n "audioBucket??" packages/api/src/data-registry.ts` exit 1 (không còn optional-chaining fallback).

## Task 1.8 — Gate cuối phase

- Goal: phase khép kín trước khi sang client.
- Verify: `pnpm --filter @vox-flow/api test` exit 0 VÀ `pnpm --filter server test` exit 0 VÀ `pnpm check-types` exit 0. Cả ba exit 0 mới sang Phase 02.

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
