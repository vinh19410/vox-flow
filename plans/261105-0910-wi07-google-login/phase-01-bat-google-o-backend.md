---
phase: 1
title: "Bật Google ở backend"
status: completed
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
- Modify: `packages/infra/.env.schema`
- Modify: `turbo.json`
- Modify: `docs/runbooks/cloudflare-deploy.md`
- Create: `packages/api/src/test/auth.test.ts`
## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay cấu hình.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify để xác nhận PR #36 (nền backend D1/Miniflare) đã được merge vào `dev` và commit đã có trong `HEAD`.
  2. Ghi nhận: Quá trình phát triển cục bộ và test tự động sử dụng giá trị kiểm thử/dummy (`test-client-id`, `test-client-secret`). OAuth client thật trên Google Cloud Console sẽ được cấu hình khi deploy Cloudflare remote.
- Success criteria: điều kiện nền tảng backend đã merge được kiểm chứng bằng lệnh cơ học.
- Verify: `gh pr view 36 --json state,baseRefName -q '.state+" "+.baseRefName' | grep -Fx 'MERGED dev' && git merge-base --is-ancestor $(gh pr view 36 --json mergeCommit -q .mergeCommit.oid) HEAD` thoát với mã 0.

### Task 1.1 — Cấu hình `socialProviders.google`, chuẩn hóa CORS origin và bỏ `emailAndPassword`.
- Goal: Better Auth chỉ kích hoạt Google provider, loại bỏ hoàn toàn email + mật khẩu, và chuẩn hóa CORS_ORIGIN chống lỗi trailing slash.
- Target files and symbols: `packages/auth/src/index.ts` (`AuthConfig`, `createAuth`), `packages/api/src/test/auth.test.ts`
- Steps:
  1. Viết test `packages/api/src/test/auth.test.ts` (đặt tại `packages/api` để tái sử dụng Miniflare D1 test harness có sẵn mà không phải cài miniflare vào `@vox-flow/auth`): kiểm thử `createAuth` với Miniflare test db, xác nhận `socialProviders.google` được khởi tạo, `emailAndPassword` tắt, `trustedOrigins` được chuẩn hóa bỏ trailing slash, và `auth.api.signInSocial` sinh URL chuyển hướng tới Google (`accounts.google.com`).
  2. Trong `packages/auth/src/index.ts`, thêm `GOOGLE_CLIENT_ID: string` và `GOOGLE_CLIENT_SECRET: string` vào `AuthConfig`.
  3. Thêm `socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }` vào `createAuth`.
  4. Chuẩn hóa `const cleanCorsOrigin = env.CORS_ORIGIN.replace(/\/+$/, "");` và dùng trong `trustedOrigins`.
  5. Xóa hoàn toàn `emailAndPassword: { enabled: true }`.
- Success criteria: Code không còn bật email + mật khẩu, Better Auth có cấu hình Google provider hợp lệ.
- Verify: `! grep -E '^\s*emailAndPassword:' packages/auth/src/index.ts && pnpm --filter @vox-flow/api test src/test/auth.test.ts` thoát với mã 0.

### Task 1.2 — Khai báo biến môi trường hạ tầng và runbook.
- Goal: Khai báo đầy đủ các biến môi trường cho Worker mà không đặt default (để deploy thiếu secret sẽ báo lỗi ngay), schema infra, turbo cache và runbook triển khai.
- Target files and symbols: `packages/infra/alchemy.run.ts`, `apps/server/.env.schema`, `packages/infra/.env.schema`, `turbo.json`, `docs/runbooks/cloudflare-deploy.md`
- Steps:
  1. Thêm `GOOGLE_CLIENT_ID: Config.String("GOOGLE_CLIENT_ID")` và `GOOGLE_CLIENT_SECRET: Config.Redacted("GOOGLE_CLIENT_SECRET")` vào `server.env` trong `packages/infra/alchemy.run.ts` (không đặt `withDefault` để deploy thiếu secret sẽ báo lỗi ngay thay vì âm thầm gửi giá trị dummy lên production). Đối với môi trường dev cục bộ, cấu hình biến dummy trong `apps/server/.env`.
  2. Khai báo `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `apps/server/.env.schema`.
  3. Thêm `GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET` vào danh sách `@import(... pick=[...])` trong `packages/infra/.env.schema`.
  4. Thêm `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` vào `globalEnv` trong `turbo.json`.
  5. Cập nhật `docs/runbooks/cloudflare-deploy.md` ghi nhận hướng dẫn thiết lập Google OAuth credentials, callback URLs (`<server-url>/api/auth/callback/google` và `http://localhost:3000/api/auth/callback/google`), và lưu ý tên miền phụ cùng eTLD+1 để tránh chặn cookie bên thứ ba.
- Success criteria: Biến môi trường được khai báo đồng bộ trên toàn bộ hạ tầng và build system.
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
