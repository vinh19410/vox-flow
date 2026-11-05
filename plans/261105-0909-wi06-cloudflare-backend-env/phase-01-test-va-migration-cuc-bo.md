---
phase: 1
title: "Test và migration cục bộ"
status: completed
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Test và migration cục bộ

## Goal
Cài được dependency, chạy được test API với D1 thật cục bộ và có migration đầu tiên, chưa cần Cloudflare.

## Files to Create / Modify
- Modify: `packages/api/package.json`
- Create: `packages/api/vitest.config.ts`
- Create: `packages/api/src/routers/index.test.ts`
- Create: `packages/db/src/migrations/*`
- Modify: `pnpm-lock.yaml`
- Create: `packages/api/src/test/db.ts`
- Create: `packages/api/src/test/db.test.ts`

## Tasks & Steps

### Task 1.1 — Sửa lockfile lệch với package.json.
- Goal: Sửa lockfile lệch với package.json.
- Target files and symbols: `pnpm-lock.yaml`
- Steps:
  1. Chạy `pnpm install --no-frozen-lockfile`.
  2. Commit `pnpm-lock.yaml`.
- Success criteria: Lockfile khớp package.json.
- Verify: `pnpm install --frozen-lockfile` thoát với mã 0.

### Task 1.2a — Cài đặt vitest và miniflare cho `packages/api`.
- Goal: Thiết lập môi trường test chạy được trên `packages/api`.
- Target files and symbols: `packages/api/package.json`, `packages/api/vitest.config.ts`
- Steps:
  1. Thêm `vitest` (^5.1.0) và `miniflare` vào `devDependencies` của `packages/api`, thêm script `"test": "vitest run"`.
  2. Tạo `packages/api/vitest.config.ts` với `defineConfig`.
- Success criteria: Cài đặt xong dependency và vitest sẵn sàng chạy.
- Verify: `pnpm --filter @vox-flow/api exec vitest --version` in phiên bản vitest 5.x.

### Task 1.3 — Sinh migration auth.
- Goal: Sinh migration auth từ schema drizzle.
- Target files and symbols: `packages/db/src/migrations/`
- Steps:
  1. Chạy `pnpm --filter @vox-flow/db db:generate`.
  2. Kiểm tra file `migration.sql` sinh ra chứa đủ 4 câu lệnh `CREATE TABLE` cho `user`, `session`, `account`, `verification`.
- Success criteria: Có migration đầu tiên đầy đủ schema auth.
- Verify: `grep -c "CREATE TABLE" packages/db/src/migrations/*/migration.sql` in số lớn hơn hoặc bằng `4`.

### Task 1.4 — Tạo helper D1 dùng cho test.
- Goal: Tạo helper D1 miniflare áp migration thật để dùng cho toàn bộ backend test.
- Target files and symbols: `packages/api/src/test/db.ts`, `packages/api/src/test/db.test.ts`
- Steps:
  1. Tạo `createTestDb()` dùng `miniflare` in-memory (`d1Databases: ["DB"]`), bật `PRAGMA foreign_keys = ON;`, đọc các file `migration.sql` theo thứ tự tên thư mục, tách câu lệnh theo `--> statement-breakpoint`, thực thi nguyên tử qua `d1.batch()` và bọc qua `createDb`. Đảm bảo cung cấp hàm giải phóng `dispose()` để gọi trong `afterAll` và xử lý dọn dẹp trong khối `try/catch`.
  2. Viết `packages/api/src/test/db.test.ts` ghi và đọc lại bảng `user` qua drizzle ORM.
  3. Mọi test router sau này dùng helper này, không mock DB.
- Success criteria: Test chạy trên D1 cục bộ thành công.
- Verify: `pnpm --filter @vox-flow/api test src/test/db.test.ts` thoát với mã 0.

### Task 1.2b — Thêm test tRPC router cho `packages/api`.
- Goal: Viết test cho router tRPC sử dụng database từ D1 test helper.
- Target files and symbols: `packages/api/src/routers/index.test.ts`
- Steps:
  1. Viết test gọi `appRouter.createCaller` với `healthCheck`, mong đợi `"OK"`.
  2. Gọi `privateData` với session `null`, mong đợi lỗi `UNAUTHORIZED`.
  3. Gọi `privateData` với mock session hợp lệ, mong đợi trả về đúng thông tin user.
  4. Dọn dẹp tài nguyên miniflare qua `afterAll`.
- Success criteria: Toàn bộ router test đều qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/index.test.ts` thoát với mã 0.
### Task 1.5 — Kiểm tra tổng thể lockfile và kiểu dữ liệu.
- Goal: Đảm bảo không có lỗi type hay lệch lockfile sau khi hoàn thành Phase 1.
- Target files and symbols: `pnpm-lock.yaml`, các file TypeScript trong `packages/api`.
- Steps:
  1. Chạy `pnpm check-types`.
  2. Chạy `pnpm install --frozen-lockfile`.
- Success criteria: Toàn bộ kiểm tra vượt qua.
- Verify: `pnpm check-types && pnpm install --frozen-lockfile` thoát với mã 0.
## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

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
