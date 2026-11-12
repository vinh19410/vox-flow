---
issue: 134
branch: feat/auth-account-srs-hardening
status: completed
created: 2026-11-12
---

# Plan — #134 Finalize `auth-account` SRS, Remove `_app-legacy`, and Harden Auth Guards & Rate-Limit

## Goal
Đóng toàn bộ 18 Open Questions, 7 Gaps, 4 Conflicts trong `docs/_reverse/auth-account/`, gỡ bỏ khu scaffold cũ `_app-legacy` + `desktopOrigins`, chuẩn hóa luồng điều hướng `/auth` & Google `newUserCallbackURL` & cache onboarding, và bật tường minh rate-limit in-memory theo `cf-connecting-ip` cùng kiểm tra tên hiển thị `1..50` ký tự trước mốc `WI-17`.

## Disjoint Parallel Slices

### Slice A — Backend Auth & Server Tests (`piece/134-backend`)
- **Owned files:**
  - `packages/auth/src/name-validation.ts` (new): `MAX_USER_NAME_LENGTH = 50`, `validateUserName(name: unknown)` trả `{ data: { name: trimmed } } | false | undefined` (chấp nhận `undefined` giữ nguyên; chuỗi sau `trim()` dài `1..50` trả `{ data: { name: trimmed } }`; rỗng/khoảng trắng/>50/không phải chuỗi trả `false`).
  - `packages/auth/src/image-validation.ts`: cập nhật chú thích dòng 13 phản ánh đúng hook chạy cho mọi thao tác tạo/cập nhật user (kể cả Google OAuth).
  - `packages/auth/src/index.ts`:
    - Export `MAX_USER_NAME_LENGTH`, `validateUserName`.
    - Thay `desktopOrigins: readonly string[] = []` bằng `options: CreateAuthOptions = {}` với `export type CreateAuthOptions = { enableRateLimit?: boolean }`.
    - `trustedOrigins: [cleanCorsOrigin]`.
    - `emailAndPassword: { enabled: true, autoSignIn: true, minPasswordLength: 8, maxPasswordLength: 128 }`.
    - `rateLimit: { enabled: options.enableRateLimit ?? process.env.NODE_ENV !== "test", window: 10, max: 100, storage: "memory" }` (Better Auth tự áp special rule `3 req / 10s` cho `/sign-in*`, `/sign-up*`).
    - `advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] }, defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true } }`.
    - `databaseHooks.user.{create,update}.before`: kiểm tra cả `name` (`validateUserName` → ném `APIError("BAD_REQUEST", { message: "INVALID_NAME" })`, trả về `name` đã `trim()`) và `image` (`validateUserImage` → ném `APIError("BAD_REQUEST", { message: "INVALID_IMAGE" })`), gộp `data` trả về sạch khi cả hai cùng có mặt.
  - `packages/auth/src/image-validation.test.ts`: thêm test biên đúng `32_000` ký tự được chấp nhận (`G-6`) và describe `validateUserName` (biên 1, 50, 51, chuỗi khoảng trắng, cắt khoảng trắng đầu/cuối, `undefined`, không phải chuỗi).
  - `packages/api/src/test/auth.test.ts`: thêm các test tích hợp cho:
    1. Đăng nhập với email không tồn tại trả `401` `INVALID_EMAIL_OR_PASSWORD` (`OQ-17`).
    2. Header `Set-Cookie` từ `/api/auth/sign-in/email` chứa đủ `HttpOnly`, `Secure`, `SameSite=None` (`OQ-18`).
    3. Đăng ký / `updateUser` với tên rỗng sau trim hoặc dài 51 ký tự bị từ chối `INVALID_NAME`; dài 50 ký tự thành công (`OQ-11`).
    4. Cấu hình `rateLimit.enabled` mặc định (`true` khi `enableRateLimit: true`), chặn `429` ở request thứ 4 trong 10s từ cùng `cf-connecting-ip`, và IP khác trên `cf-connecting-ip` vẫn đăng nhập được (`OQ-12`).
  - `apps/server/src/index.test.ts`: thêm test `GET /api/attempts/:attemptId/answers/:answerId/audio` trả `401` `"Unauthorized"` khi không có phiên (`G-5`).

### Slice B — Web Legacy Removal, Guards & Auth UX (`piece/134-web`)
- **Owned files:**
  - Delete: `apps/web/src/routes/_app-legacy/route.tsx`, `apps/web/src/routes/_app-legacy/login.tsx`, `apps/web/src/routes/_app-legacy/_auth/route.tsx`, `apps/web/src/routes/_app-legacy/_auth/dashboard.tsx`.
  - Delete: `apps/web/src/components/header.tsx`, `apps/web/src/components/user-menu.tsx`, `apps/web/src/components/sign-in-form.tsx`, `apps/web/src/components/sign-up-form.tsx`, `apps/web/src/components/mode-toggle.tsx`, `apps/web/src/components/theme-provider.tsx` (**giữ nguyên** `apps/web/src/components/loader.tsx` và **không sửa tay** `apps/web/src/routeTree.gen.ts`).
  - `apps/web/src/features/auth/auth-screen.tsx`:
    - Export `getSafeRedirect` để dùng chung ở `routes/_proto/auth.tsx`.
    - Truyền `newUserCallbackURL: `${origin}${signUpCallbackPath}`` trong `authClient.signIn.social`.
    - Đặt `maxLength={50}` trên `#auth-name`.
    - Map lỗi `status === 429` sang `"Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."` (cho cả email và Google khởi tạo) và `code === "INVALID_NAME" || message === "INVALID_NAME"` sang `"Tên hiển thị không hợp lệ (1–50 ký tự)."`
  - `apps/web/src/lib/auth-guard.ts`: bổ sung `redirectIfOnboarded(redirectTo = "/app/dashboard")` kiểm tra `authClient.getSession?.().catch(() => null)` → nếu có `user`, kiểm tra `onboardedUserCache` trước rồi mới gọi `trpcClient?.profile?.get?.query()` (bắt lỗi mạng cho qua, không ném lỗi ngoài `isRedirect`), nếu đã có `onboardedAt` thì ghi cache và ném `redirect({ to: redirectTo })`.
  - `apps/web/src/routes/_proto/auth.tsx`: thêm `beforeLoad` gọi `redirectIfOnboarded(getSafeRedirect(search?.redirect) ?? "/app/dashboard")` khi `!search?.error`.
  - `apps/web/src/features/onboarding/onboarding-screen.tsx`: khi `completeOnboarding` thành công, lấy `userId` từ `authClient.useSession?.()?.data?.user?.id` (hoặc `getSession`) và gọi `markUserOnboarded(userId)` trước `go("dashboard")`.
  - `apps/web/src/hooks/use-sign-out.ts`: gọi `clearOnboardedUserCache()` khi `signOut` thành công.
  - Tests: cập nhật `apps/web/src/features/select/__tests__/select-setup-route.test.tsx` (thêm `redirectIfOnboarded: vi.fn()` vào mock `auth-guard`), `apps/web/src/features/__tests__/slice-a.test.tsx` (test `newUserCallbackURL`, `maxLength=50`, lỗi `429`, `INVALID_NAME`, `markUserOnboarded`), `apps/web/src/lib/__tests__/auth-guard.test.ts`, `apps/web/src/lib/__tests__/route-guards.test.ts` (test `/_proto/auth` `validateSearch` + `beforeLoad`, `/admin/disputes` & `/admin/forecast` `beforeLoad`), `apps/web/src/hooks/__tests__/use-sign-out.test.tsx` (test `clearOnboardedUserCache` khi thành công vs thất bại, đổi đích tùy chọn `/login` sang `/terms`).

### Slice C — SRS Approval & Docs Reconciliation (`piece/134-docs`)
- **Owned files:**
  - `docs/_reverse/auth-account/**` (đóng `[x]` toàn bộ OQ/Gap/Conflict trong `reverse-gaps.md`; nâng `auth-account-reverse-spec.md` lên `status: approved`, gán Priority `P0/P1/P2`, xóa `FR-030`/`FR-031`/`BR-030`/`E-015`/`E-016`/`S-2..S-4` và `usecases/uc-dung-khu-legacy.md`, bổ sung FR/BR/E mới cho `/auth` redirect khi đã onboard, `newUserCallbackURL`, tên `1..50` ký tự, rate-limit `3 lần/10s` theo `cf-connecting-ip` kèm lưu ý giới hạn per-isolate của `memory` store trên Workers và điều kiện đi qua Cloudflare proxy; đồng bộ `reverse-sources.md`, `_evidence.md`, `srs/auth-account-reverse-flows.md`, `srs/auth-account-reverse-states.md`, `usecases/*`).
  - `docs/_reverse/reverse-plan.json`: gỡ mục `_app-legacy` khỏi `shared_infrastructure` và `auth-account.sources`.
  - `README.md`: gỡ dòng mô tả `_app-legacy` ở mục Web Prototype UI.
  - `docs/roadmap-work-items.md`: cập nhật ghi chú WI-07 dòng 22 phản ánh code đã có Google OAuth bên cạnh email/mật khẩu theo D-03.
