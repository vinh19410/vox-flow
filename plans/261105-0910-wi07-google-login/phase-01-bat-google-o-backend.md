---
phase: 1
title: "Bật Google ở backend"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Bật Google ở backend

## Goal
Better Auth có nhà cung cấp Google và không còn email + mật khẩu.

## Files to Create / Modify
- Modify: `packages/auth/src/index.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `apps/server/.env.schema`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
  3. Xác nhận với người sở hữu sản phẩm đã có: OAuth client trên Google Cloud Console.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 10; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Cấu hình `socialProviders.google`.
- Goal: Cấu hình `socialProviders.google`.
- Target files and symbols: `packages/auth/src/index.ts` (`AuthConfig`, `createAuth`)
- Steps:
  1. Thêm `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` vào `AuthConfig`.
  2. Thêm `socialProviders: { google: { clientId, clientSecret } }`.
  3. Xóa dòng `emailAndPassword: { enabled: true }`.
- Success criteria: Code không còn bật email + mật khẩu.
- Verify: `grep -c 'emailAndPassword' packages/auth/src/index.ts` in `0`.

### Task 1.2 — Khai báo biến môi trường.
- Goal: Khai báo biến môi trường.
- Target files and symbols: `packages/infra/alchemy.run.ts` (`env` của `server`), `apps/server/.env.schema`
- Steps:
  1. Thêm hai biến vào `env` của Worker, dùng `Config.Redacted` cho secret.
  2. Khai báo tên biến trong `.env.schema`, không kèm giá trị.
  3. Người sở hữu tạo OAuth client ở Google Cloud với callback `<server-url>/api/auth/callback/google`.
- Success criteria: Hai biến có trong cấu hình hạ tầng.
- Verify: `grep -c 'GOOGLE_CLIENT' packages/infra/alchemy.run.ts` in `2` và `pnpm check-types` thoát với mã 0.

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
