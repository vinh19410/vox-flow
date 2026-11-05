---
phase: 2
title: "Nối màn đăng nhập"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Nối màn đăng nhập

## Goal
`/auth` dùng đăng nhập thật và route được bảo vệ.

## Files to Create / Modify
- Modify: `apps/web/src/features/auth/auth-screen.tsx`
- Modify: `apps/web/src/routes/_proto/app/route.tsx`
- Modify: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Modify: `apps/web/src/routes/_proto/exam.tsx`
- Modify: `apps/web/src/routes/_proto/scoring.tsx`
- Modify: `apps/web/src/routes/_proto/onboarding.tsx`

## Tasks & Steps

### Task 2.1 — Thay form giả bằng đăng nhập Google.
- Goal: Thay form giả bằng đăng nhập Google.
- Target files and symbols: `auth-screen.tsx`, `apps/web/src/lib/auth-client.ts` (`authClient`); test: `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Nút Google gọi `authClient.signIn.social({ provider: "google", callbackURL: `${window.location.origin}/app/dashboard` })`. Web và server khác origin nên phải dùng URL đầy đủ.
  2. Xóa form email và phần chuyển đăng nhập/đăng ký.
  3. Hiện thông báo tiếng Việt khi đăng nhập lỗi hoặc người dùng hủy.
  4. Sửa test `AuthScreen` trong `slice-a.test.tsx`: không còn ô email, nút Google gọi đúng hàm.
- Success criteria: Màn hình chỉ còn lựa chọn Google.
- Verify: `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` thoát với mã 0.

### Task 2.2 — Bảo vệ `/app` và các route ngoài `/app`.
- Goal: Bảo vệ `/app` và các route ngoài `/app`.
- Target files and symbols: `apps/web/src/routes/_proto/app/route.tsx`, `apps/web/src/routes/_proto/exam.tsx`, `scoring.tsx`, `onboarding.tsx`
- Steps:
  1. Trong `beforeLoad`, gọi `authClient.getSession()`; nếu không có session thì chuyển tới `/auth`. Làm theo mẫu đã có ở `_app-legacy/_auth/route.tsx`.
  2. Áp cùng `beforeLoad` cho `_proto/exam.tsx`, `_proto/scoring.tsx`, `_proto/onboarding.tsx`. Triển khai lại sau khi đặt secret.
  3. Chạy thử bằng tài khoản Google thật trên môi trường đã triển khai ở #10.
- Success criteria: Người chưa đăng nhập không vào được `/app/*`.
- Verify: `pnpm --filter web test` và `pnpm check-types` đều thoát với mã 0; `curl -s -X POST <server-url>/api/auth/sign-in/social -H 'content-type: application/json' -H 'origin: <web-url>' -d '{"provider":"google","callbackURL":"<web-url>/app/dashboard"}' | jq -r .url | grep -c '^https://accounts.google.com'` in `1`.

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
