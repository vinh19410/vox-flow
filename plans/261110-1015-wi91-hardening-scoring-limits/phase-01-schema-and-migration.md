# Phase 1: DB Schema Migration & Data Registry

## Overview
Cập nhật schema D1 trong `packages/db` để lưu trữ dung lượng audio của từng câu trả lời (`sizeBytes`), số lần retry thủ công (`manualRetries`), và lịch sử retry hàng ngày (`scoring_retry_log`). Đăng ký bảng mới vào `packages/api/src/data-registry.ts` để tuân thủ chính sách bảo mật / quyền riêng tư dữ liệu người dùng.

## Target Files and Symbols
- `packages/db/src/schema/attempt.ts`: Bảng `attemptAnswer` (thêm cột `sizeBytes`).
- `packages/db/src/schema/score.ts`: Bảng `attemptScore` (thêm cột `manualRetries`), bảng mới `scoringRetryLog`.
- `packages/db/src/schema/index.ts`: Export bảng `scoringRetryLog`.
- `packages/db/src/migrations/`: File migration sinh từ Drizzle Kit.
- `packages/api/src/data-registry.ts`: Đăng ký phân loại dữ liệu cho `scoring_retry_log`.

## Tasks & Steps

### Task 1.1 — Bổ sung schema Drizzle trong `packages/db`
- **Goal**: Định nghĩa các cột mới và bảng `scoring_retry_log` với foreign key và index chính xác.
- **Target files and symbols**:
  - `packages/db/src/schema/attempt.ts`: Trong `attemptAnswer`, thêm `sizeBytes: integer("size_bytes").default(0).notNull()`.
  - `packages/db/src/schema/score.ts`:
    - Trong `attemptScore`, thêm `manualRetries: integer("manual_retries").default(0).notNull()`.
    - Định nghĩa bảng `scoringRetryLog`:
      ```typescript
      export const scoringRetryLog = sqliteTable(
        "scoring_retry_log",
        {
          id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
          userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
          attemptId: text("attempt_id")
            .notNull()
            .references(() => attempt.id, { onDelete: "cascade" }),
          createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        },
        (table) => [
          index("scoring_retry_log_userId_createdAt_idx").on(table.userId, table.createdAt),
          index("scoring_retry_log_attemptId_idx").on(table.attemptId),
        ],
      );
      export type ScoringRetryLog = typeof scoringRetryLog.$inferSelect;
      ```
  - `packages/db/src/schema/index.ts`: export `scoringRetryLog` và `ScoringRetryLog`.
- **Steps**:
  1. Thêm cột `sizeBytes` vào `attemptAnswer`.
  2. Thêm cột `manualRetries` vào `attemptScore`.
  3. Thêm bảng `scoringRetryLog` vào `packages/db/src/schema/score.ts`.
  4. Export `scoringRetryLog` từ `packages/db/src/schema/index.ts`.
- **Success criteria**: TypeScript type check passes trong `packages/db`.
- **Verify**: `pnpm --filter @vox-flow/db exec tsc --noEmit` exits 0.

### Task 1.2 — Sinh D1 Migration và kiểm tra SQL sạch
- **Goal**: Sinh file migration D1 qua lệnh theo AGENTS.md (`pnpm --filter @vox-flow/db db:generate`) và đảm bảo SQL chỉ dùng `ALTER TABLE ADD COLUMN` và `CREATE TABLE`, không dùng `__new_*` table rebuild.
- **Target files**:
  - `packages/db/src/migrations/*.sql`
- **Steps**:
  1. Chạy lệnh: `pnpm --filter @vox-flow/db db:generate`.
  2. Mở file `.sql` vừa sinh trong `packages/db/src/migrations/`.
  3. Kiểm tra nội dung: phải là `ALTER TABLE attempt_answer ADD \`size_bytes\` integer DEFAULT 0 NOT NULL;`, `ALTER TABLE attempt_score ADD \`manual_retries\` integer DEFAULT 0 NOT NULL;`, và `CREATE TABLE \`scoring_retry_log\` ...`. Tuyệt đối không có lệnh `CREATE TABLE \`__new_...`.
- **Success criteria**: File migration mới tồn tại và chỉ chứa các câu lệnh `ALTER TABLE ADD` hoặc `CREATE TABLE / INDEX`.
- **Verify**: `git status --porcelain packages/db/src/migrations` hiển thị file migration mới và `grep -E "__new_" packages/db/src/migrations/*.sql` không trả về dòng nào trong file mới.

### Task 1.3 — Đăng ký `scoring_retry_log` vào Data Registry & Chạy Test
- **Goal**: Khai báo bảng `scoring_retry_log` trong `packages/api/src/data-registry.ts` để tuân thủ quy định xóa/xuất dữ liệu người dùng.
- **Target files**:
  - `packages/api/src/data-registry.ts`
  - `packages/api/src/data-registry.test.ts`
- **Steps**:
  1. Trong `packages/api/src/data-registry.ts`, import `scoringRetryLog` từ `@vox-flow/db`.
  2. Thêm định nghĩa vào `DATA_REGISTRY` theo đúng kiểu `TablePersonalDataHandler`:
     ```typescript
     scoring_retry_log: {
       tableName: "scoring_retry_log",
       export: async (db, userId) => {
         return db.select().from(scoringRetryLog).where(eq(scoringRetryLog.userId, userId));
       },
       erase: async (ctx, userId) => {
         await ctx.db.delete(scoringRetryLog).where(eq(scoringRetryLog.userId, userId));
       },
     },
     ```
  3. Chạy test `packages/api/src/data-registry.test.ts`.
- **Success criteria**: Test registry xác nhận 100% bảng trong schema D1 đã được đăng ký và phân loại.
- **Verify**: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` exits 0.

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
