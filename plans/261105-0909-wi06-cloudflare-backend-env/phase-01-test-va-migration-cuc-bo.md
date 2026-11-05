---
phase: 1
title: "Test và migration cục bộ"
status: pending
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

### Task 1.2 — Thêm vitest cho `packages/api`.
- Goal: Thêm vitest cho `packages/api`.
- Target files and symbols: `packages/api/package.json`, `packages/api/src/routers/index.test.ts`
- Steps:
  1. Thêm `vitest` và script `"test": "vitest run"`.
  2. Viết test gọi `appRouter.createCaller` với `healthCheck`, mong đợi `"OK"`, và `privateData` không có session, mong đợi lỗi `UNAUTHORIZED`.
- Success criteria: Hai test đều qua.
- Verify: `pnpm --filter @vox-flow/api test` thoát với mã 0.

### Task 1.3 — Sinh migration auth.
- Goal: Sinh migration auth.
- Target files and symbols: `packages/db/src/migrations/`
- Steps:
  1. Chạy `pnpm --filter @vox-flow/db db:generate`.
  2. Xem file `migration.sql` sinh ra có 4 bảng `user`, `session`, `account`, `verification`.
- Success criteria: Có migration đầu tiên.
- Verify: `find packages/db/src/migrations -name migration.sql | wc -l` in số lớn hơn hoặc bằng `1`.

### Task 1.4 — Tạo helper D1 dùng cho test.
- Goal: Tạo helper D1 dùng cho test.
- Target files and symbols: `packages/api/src/test/db.ts`, `packages/api/src/test/db.test.ts`
- Steps:
  1. Tạo helper dùng `miniflare` (`getD1Database`), áp tuần tự mọi `src/migrations/*/migration.sql` của `@vox-flow/db`, trả `Database`.
  2. Viết test ghi và đọc lại bảng `user`.
  3. Mọi test router sau này dùng helper này, không tự mock DB.
- Success criteria: Test chạy trên D1 cục bộ.
- Verify: `pnpm --filter @vox-flow/api test src/test/db.test.ts` thoát với mã 0.

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
