---
phase: 1
title: "Hardening data-registry export & D1 bind limit"
status: pending
priority: P1
effort: 4h
dependencies: []
---

# Phase 1: Hardening data-registry export & D1 bind limit

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

Additional hard stops from the advisory handoff (`plans/reports/92-hardening-export-d1-bind-advise.md`):
- Test phát hiện subquery trả sai dữ liệu không giải thích được → STOP, hỏi kongming.
- Cần thao tác destructive (deploy, xóa dữ liệu thật, áp migration) → STOP, hỏi user.
- Thay đổi lan ra ngoài `packages/api/src/data-registry.ts` và `packages/api/src/data-registry.test.ts` → STOP, hỏi user.

Stop rule (kongming post-gate counsel 2026-11-10): CẤM nới, xóa hoặc bỏ qua assertion `params.length <= 100`, tripwire `> 100`, hoặc guard captured-count để cho test pass. Muốn nới bất kỳ assert nào trong số này phải vào Failure Protocol (STOP, hỏi kongming) trước.

## Goal

Export dữ liệu cá nhân chỉ chứa trường của học viên và mọi query trong `DATA_REGISTRY` không vượt giới hạn 100 bind parameters của D1.

## Files to Create / Modify

- Modify: `packages/api/src/data-registry.test.ts` — thêm test bind-limit + shape (task 1.1, RED), cập nhật assertion test hiện có.
- Modify: `packages/api/src/data-registry.ts` — subquery thay 4 chỗ IN-list, projection `attempt_score`, `score_run` export `[]` (task 1.2, GREEN).

Không file nào khác được sửa.

## Tasks & Steps

### Task 1.1 — Viết test RED trước (TDD)

- Goal: test mới chạy fail trên code hiện tại, chứng minh cả hai lỗi bằng assertion failure (không phải lỗi fixture hay lỗi test harness).
- Target files: `packages/api/src/data-registry.test.ts`.
- Lệnh gate (cả RED và GREEN): `pnpm --filter @vox-flow/api test src/data-registry.test.ts` (chạy từ root worktree; convention repo — `apps/web` vitest chỉ include `src/**`, không chạy được file test của `packages/api`).
- Cơ chế đo bind params (chung): **wrap ở tầng driver D1, không Proxy builder drizzle.** Tạo `recordingD1` bọc `testCtx.d1`: trong `prepare(sql)`, gọi `stmt = d1.prepare(sql)` rồi bọc method `bind(...params)` của statement để ghi `{ sql, params: params.length }` trước khi gọi bind gốc. Dựng db riêng bằng `createDb({ DB: recordingD1 })` (import từ `@vox-flow/db`; `createDb` nhận `{ DB }` — `packages/db/src/index.ts:6-7`). Điều này đo đúng số bind D1 thực nhận, không đụng vào builder (Proxy tầng builder dễ bọc sai tầng: `db.select()` trả `SQLiteSelectBuilder` không có `.where` — phải bọc thêm `.from()`, và có thể phá `is(builder, ...)` khi builder làm subquery). Lọc capture theo `sql.startsWith("select")` / `"delete"`. Proxy builder chỉ là fallback nếu wrap D1 lỗi RPC trên Miniflare.
- **Tạo `recordingD1`/`recordingDb` SAU khi seed xong** (hoặc reset mảng capture ngay trước mỗi sweep) — không bật đo trong lúc insert fixture (insert 50 rows nhân nhiều cột vượt 100 params, làm hỏng assertion).
- Steps:
  1. Thêm test `"export and erase queries stay within D1 bind parameter limit"`:
     - Fixture: chèn `user` rows cho `usr_scale_1`, `usr_scale_2` TRƯỚC (FK `attempt.userId` REFERENCES user.id, test db bật `PRAGMA foreign_keys = ON`), rồi **120 attempts** cho `usr_scale_1` (bulk insert, chunk ~50 values) + 1 `attempt_answer` cho mỗi attempt (120 answers) + 2 row `score_run` trên 2 attempt đầu. `usr_scale_2` với 1 attempt + 1 answer + 1 score_run làm control.
     - Export sweep: gọi `exportUserData(recordingDb, usr_scale_1)`; assert captured select ≥ 3 và mọi captured select có `params.length <= 100`; ở RED phải có ít nhất 1 capture với `params.length > 100` (tripwire chống capture rỗng); assert kết quả trả về đúng số row (120 answer, đúng user).
     - Erase sweep: gọi `eraseUserData({ db: recordingDb }, usr_scale_1)`; assert captured delete ≥ 2 và mọi captured delete có `params.length <= 100`; ở RED phải có ít nhất 1 capture với `params.length > 100`. Capture phải xảy ra SAU khi `.where()` được áp dụng (wrap method `.where` trên builder, capture `toSQL()` của builder đã mang WHERE — `where()` mutate builder và trả `this`, capture trước `.where` sẽ cho `params.length = 0` và pass trắng).
  2. Thêm test `"export payload only contains learner-facing result fields"`: seed chuỗi `user → attempt → attempt_score (status done, overall, criteriaJson, oneLiner) + score_run`; gọi `exportUserData` cho user đó; assert:
     - `data.attempt_score[0]` có đúng tập key `{ attemptId, status, overall, criteriaJson, oneLiner, createdAt, scoredAt }` (không `userId`, `model`, `tries`, `lastError`, `costUsd`, `updatedAt`).
     - `data.score_run` rỗng `[]` dù DB có row score_run.
  3. Cập nhật test hiện có `"exportUserData and eraseUserData correctly isolates and erases user data"`:
     - `expect(exportUser1.data.score_run).toHaveLength(2)` → `toHaveLength(0)`.
     - `afterEraseUser2.data.score_run` `toHaveLength(1)` → `toHaveLength(0)` (export luôn rỗng).
     - Đếm vật lý sau `eraseUserData(user1)`: `scoreRun` theo `att_reg_1` = 0 và `att_reg_2` = 1; `attemptAnswer` theo `att_reg_1` = 0 và `att_reg_2` = 1.
     - **Chú ý vai trò assertion này:** test db bật `PRAGMA foreign_keys = ON` và toàn bộ FK `onDelete: "cascade"` (`user` bị xóa CUỐI cùng trong `eraseUserData` → cascade quét sạch bảng con). Đếm row sau erase là KHÔNG chứng minh được handler delete đúng/sai — bằng chứng handler là các assertion capture qua `recordingD1` ở step 1. Đếm vật lý chỉ giữ làm behavior-lock (phòng khi FK enforcement thay đổi) và kiểm chứng isolate giữa 2 user.
- Success criteria: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` chạy và test mới FAIL với đúng lý do: assertion `params.length` (> 100, cụ thể 120) và assertion shape/key `attempt_score`, `score_run`. Lỗi fixture (FK violation) hoặc lỗi harness (`toSQL is not a function`) KHÔNG được tính là đỏ đạt chuẩn.
- Verify: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát non-zero, output chứa assertion failure về `params.length`/shape. Test pass ở bước này là TỔI (red phase không đạt — không chứng minh được lỗi).

### Task 1.2 — Sửa `data-registry.ts` (GREEN)

- Goal: 4 chỗ IN-list dùng subquery; export chỉ trả trường học viên.
- Target files: `packages/api/src/data-registry.ts` (các hàm `userAttemptIds`, handler `attempt_score`, `score_run`, `attempt_answer`).
- Steps:
  1. Xóa helper `userAttemptIds` (sau thay đổi không còn caller — clean cutover, giữ lại là dead code).
  2. Thay 4 chỗ `inArray(...)` bằng subquery 1 bind param:
     - `score_run.export`: `db.select().from(scoreRun).where(inArray(scoreRun.attemptId, db.select({ id: attempt.id }).from(attempt).where(eq(attempt.userId, userId))))`.
     - `score_run.erase`: tương tự trên `ctx.db.delete(scoreRun)`.
     - `attempt_answer.export`: `db.select().from(attemptAnswer).where(inArray(attemptAnswer.attemptId, db.select({ id: attempt.id }).from(attempt).where(eq(attempt.userId, userId))))`.
     - `attempt_answer.erase`: tương tự trên `ctx.db.delete(attemptAnswer)`.
     - Bỏ luôn nhánh `if (attemptIds.length === 0) return []` (subquery tự trả rỗng). Nếu drizzle 1.0.0-rc.5 từ chối type `inArray(col, subquery)`: fallback `innerJoin` cho SELECT và raw `sql` template cho DELETE — ghi rõ lựa chọn trong PR.
  3. Projection `attempt_score.export`: `db.select({ attemptId, status, overall, criteriaJson, oneLiner, createdAt, scoredAt }).from(attemptScore).where(eq(attemptScore.userId, userId))` (select object các cột schema, giữ tên trường như hiện tại).
  4. `score_run.export` — hiện handler vừa xóa IN-list ở bước 2; đổi body thành `export: async () => []` (**không giữ tham số `db, userId`** — `packages/config/tsconfig.base.json:18` bật `noUnusedParameters`, giữ chữ ký cũ sẽ fail `pnpm check-types`; TypeScript cho phép hàm ít tham số hơn gán vào interface) kèm comment kỹ thuật 2 dòng: score_run là dữ liệu vận hành chấm điểm (schema: "Never shown to the learner directly"), không thuộc export cá nhân theo quyết định #92; nếu OQ-6 kết luận phải xuất, mở lại bằng projection riêng. `score_run.erase` GIỮ nguyên semantics xóa đầy đủ (chỉ đổi subquery).
  5. Thêm convention comment 2–3 dòng ngay trên `export const DATA_REGISTRY` cho các bảng sau này: export chỉ lộ trường kết quả học viên; trường vận hành (model, cost, token, lỗi, payload thô) không bao giờ export; bảng mới trỏ tới `attempt` hoặc `user` phải query theo `userId` qua subquery, không bao giờ IN-list id.
- Success criteria: cả 4 query ≤ 100 params; shape export mới đúng; erase vẫn xóa sạch.
- Verify: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát 0 với toàn bộ test pass (bao gồm test mới ở Task 1.1).

### Task 1.3 — Gate kiểm tra kiểu

- Goal: không phá kiểu ở nơi khác.
- Target files: không sửa file; chỉ chạy lệnh.
- Steps:
  1. `pnpm check-types` ở root worktree.
  2. Nếu fail: đọc lỗi, sửa trong 2 file được phép rồi chạy lại Task 1.3 từ đầu.
- Success criteria: `pnpm check-types` thoát 0 (ở `apps/web` lệnh này chạy cả `vite build`).
- Verify: exit code 0.

## Verification

- `pnpm --filter @vox-flow/api test src/data-registry.test.ts` — exit 0, toàn bộ test pass.
- `pnpm check-types` — exit 0.
- Self-check logic (không cần lệnh): `data.score_run` luôn `[]`; erase `score_run` không còn phụ thuộc danh sách id.

## Known Limitations (không thuộc scope phase này)

- **`attempt.erase` N+1 trên Workers thật:** vòng lặp per-attempt (1 SELECT answers + R2 delete mỗi answer, `data-registry.ts:135-143`) có thể vượt trần 50 subrequests Workers Free với user >~30 attempts. "Erase sạch với >100 attempts" ở đây là bằng chứng logic-level (subquery không vỡ bind limit); trần subrequest là known-limitation cần ticket riêng TRƯỚC khi luồng erase (F-21) được nối router — hiện `privacy.ts` chưa wire `eraseUserData`.
- **`attempt_answer.erase` chạy sau `attempt.erase`** trong `eraseUserData` → subquery luôn rỗng lúc đó; việc sạch phụ thuộc FK cascade (`onDelete: "cascade"`). Không phải regression (code cũ cũng vậy), test phải đếm vật lý để khóa hành vi này.
