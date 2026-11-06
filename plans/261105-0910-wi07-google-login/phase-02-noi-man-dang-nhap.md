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
- Create: `apps/web/src/lib/auth-guard.ts`
- Create: `apps/web/src/lib/__tests__/auth-guard.test.ts`
- Modify: `apps/web/src/routes/_proto/auth.tsx`
- Modify: `apps/web/src/features/auth/auth-screen.tsx`
- Modify: `apps/web/src/routes/_proto/app/route.tsx`
- Modify: `apps/web/src/routes/_proto/exam.tsx`
- Modify: `apps/web/src/routes/_proto/scoring.tsx`
- Modify: `apps/web/src/routes/_proto/onboarding.tsx`
- Modify: `apps/web/src/layouts/user-card.tsx`
- Modify: `apps/web/src/features/__tests__/slice-a.test.tsx`
## Tasks & Steps

### Task 2.1 — Thay form giả bằng đăng nhập Google, chặn rage-click và xử lý lỗi.
- Goal: Màn hình `/auth` chuyển sang sử dụng Better Auth Google social login độc quyền, hỗ trợ callback, trạng thái loading chống rage-click, và xử lý lỗi / hủy đăng nhập.
- Target files and symbols: `apps/web/src/routes/_proto/auth.tsx`, `apps/web/src/features/auth/auth-screen.tsx`, `apps/web/src/lib/auth-client.ts`, `apps/web/src/features/__tests__/slice-a.test.tsx`
- Steps:
  1. Trong `apps/web/src/routes/_proto/auth.tsx`, cấu hình `validateSearch` nhận `{ error?: string, redirect?: string }`.
  2. Trong `apps/web/src/features/auth/auth-screen.tsx`, thêm state `isPending` để disable nút và hiển thị trạng thái đang xử lý khi bấm Google.
  3. Nút Google gọi `authClient.signIn.social({ provider: "google", callbackURL: redirectParam ?? `${window.location.origin}/app/dashboard`, errorCallbackURL: `${window.location.origin}/auth` })`.
  4. Xóa form email và phần chuyển đổi đăng nhập/đăng ký.
  5. Đọc search param `error` từ `useSearch()`; nếu có, hiển thị thông báo tiếng Việt ("Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại."). Nếu phát hiện dấu hiệu chặn cookie bên thứ ba, hiển thị hướng dẫn người dùng bật cookie.
  6. Sửa test `AuthScreen` trong `slice-a.test.tsx`: mock `authClient`, kiểm tra không còn trường email, nút Google kích hoạt đúng `authClient.signIn.social` với `provider: "google"`.
- Success criteria: Màn hình `/auth` chỉ còn lựa chọn Google, hiển thị thông báo khi có lỗi và không bị click trùng lặp.
- Verify: `pnpm --filter web test src/features/__tests__/slice-a.test.tsx` thoát với mã 0.

### Task 2.2 — Bảo vệ `/app` và các route ngoài `/app`, dọn session khi đăng xuất.
- Goal: Bảo vệ các route người dùng (`/app/*`, `/exam`, `/scoring`, `/onboarding`) bằng cơ chế `requireSession()`, chuyển hướng người chưa đăng nhập về `/auth`, và gọi `signOut` khi bấm đăng xuất.
- Target files and symbols: `apps/web/src/lib/auth-guard.ts`, `apps/web/src/lib/__tests__/auth-guard.test.ts`, `apps/web/src/routes/_proto/app/route.tsx`, `apps/web/src/routes/_proto/exam.tsx`, `scoring.tsx`, `onboarding.tsx`, `apps/web/src/layouts/user-card.tsx`
- Steps:
  1. Tạo `apps/web/src/lib/auth-guard.ts`: hàm `requireSession()` gọi `authClient.getSession().catch(() => null)`. Nếu `!session?.data`, ném `throw redirect({ to: "/auth" })`. Trả về `{ session }`.
  2. Viết test `apps/web/src/lib/__tests__/auth-guard.test.ts` kiểm thử `requireSession()` ném redirect khi chưa đăng nhập và trả session khi đã đăng nhập.
  3. Gắn `beforeLoad: () => requireSession()` cho `_proto/app/route.tsx`, `_proto/exam.tsx`, `_proto/scoring.tsx`, `_proto/onboarding.tsx`.
  4. Trong `apps/web/src/layouts/user-card.tsx`, cập nhật nút đăng xuất gọi `await authClient.signOut().catch(() => {})` trước khi chuyển về landing.
  5. Kiểm tra trên toàn bộ ứng dụng web: test và typecheck sạch.
- Success criteria: Người chưa đăng nhập không vào được các route bảo vệ và bị chuyển hướng về `/auth`, session được dọn sạch khi đăng xuất.
- Verify: `pnpm --filter web test src/lib/__tests__/auth-guard.test.ts && pnpm check-types` thoát với mã 0.
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
