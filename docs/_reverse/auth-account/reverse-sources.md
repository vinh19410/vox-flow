# auth-account — Danh mục nguồn (provenance)

> Cập nhật #134 (2026-11-12): bổ sung nguồn name-validation + quyết định sản phẩm; S13/S22 đã xóa cùng khu legacy.

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/auth/src/index.ts | code (cấu hình xác thực phía server: emailAndPassword 8..128, Google, rateLimit, cf-connecting-ip, cookie attributes; #134) | 2026-11-12 (đọc lại) | high | OK | Mục 1, 3 (FR-002, 003, 013, 028), 4, 5, 8, 11 |
| S2 | packages/auth/src/image-validation.ts | code (validator ảnh đại diện) | 2026-11-12 | high | OK | Mục 3 (FR-028), 5 (BR-009..BR-017), 6 (E-012) |
| S3 | apps/web/src/features/auth/auth-screen.tsx | code (màn hình đăng nhập/đăng ký; tên `maxLength=50`, xử lý 429, Google newUserCallbackURL; #134) | 2026-11-12 | high | OK | Mục 3, 5, 6, 10 |
| S4 | apps/web/src/routes/_proto/auth.tsx | code (route /auth: validate query + chuyển người đã onboard; #134) | 2026-11-12 | high | OK | Mục 3 (FR-015), 10 |
| S5 | apps/web/src/lib/auth-guard.ts | code (guard phiên + onboarding, cache + markUserOnboarded/clearOnboardedUserCache) | 2026-11-12 | high | OK | Mục 3 (FR-015, 019..023), 5, 9 |
| S6 | apps/web/src/hooks/use-sign-out.ts | code (hook đăng xuất; xóa cache onboarding; #134) | 2026-11-12 | high | OK | Mục 3 (FR-016), 6 (E-009) |
| S7 | apps/web/src/lib/auth-client.ts | code (client xác thực) | 2026-11-11 | high | OK | Mục 11 |
| S8 | apps/web/src/routes/_proto/app/route.tsx; apps/web/src/routes/_proto/exam.tsx; apps/web/src/routes/_proto/scoring.tsx; apps/web/src/routes/_proto/onboarding.tsx | code (route được bảo vệ) | 2026-11-11 | high | OK | Mục 3 (FR-019..023) |
| S9 | apps/web/src/routes/admin/disputes.tsx; apps/web/src/routes/admin/forecast.tsx | code (route admin; đã có unit test từ #134) | 2026-11-12 | high | OK | Mục 3 (FR-024) |
| S10 | apps/server/src/index.ts; apps/server/src/context.ts; apps/server/src/services.ts | code (Worker: CORS, /api/auth, getSession) | 2026-11-11 | high | OK | Mục 3 (FR-027), 4, 9, 11 |
| S11 | packages/api/src/index.ts; packages/api/src/auth-utils.ts; packages/api/src/routers/index.ts; packages/api/src/context.ts | code (protected/admin procedure, isUserAdmin, canAccessAudio) | 2026-11-11 | high | OK | Mục 3 (FR-025, 026), 5, 6 |
| S12 | packages/db/src/schema/auth.ts | code (schema user/session/account/verification) | 2026-11-11 | high | OK | Mục 8, ERD |
| S13 | ~~apps/web/src/routes/_app-legacy/*; apps/web/src/components/{sign-in-form,sign-up-form,user-menu,header}.tsx~~ | **Đã xóa ở #134** (khu legacy gỡ bỏ: `/login`, `/dashboard` và 6 component) | 2026-11-12 | — | — | Không còn: FR-030/031, S-2..S-4, BR-030, E-015/016 cũ đã xóa khỏi spec |
| S14 | packages/infra/alchemy.run.ts; turbo.json | code (khai báo biến môi trường) | 2026-11-11 | high | OK | Mục 11 |
| S15 | apps/web/src/layouts/user-card.tsx; apps/web/src/layouts/bottom-nav.tsx; apps/web/src/features/profile/profile-screen.tsx | code (các điểm vào đăng xuất) | 2026-11-12 | high | OK | Mục 3 (FR-017), 10 |
| S16 | apps/web/src/features/app-state/use-profile-hydration.ts; apps/web/src/routes/_proto/route.tsx; apps/web/src/features/app-state/store.tsx | code (reset state khi mất phiên) | 2026-11-11 | high | OK | Mục 3 (FR-018) |
| S17 | apps/web/src/features/__tests__/slice-a.test.tsx | test (AuthScreen) | 2026-11-12 | high | OK | FR-001..015, E-001..008, E-015/016 |
| S18 | apps/web/src/lib/__tests__/auth-guard.test.ts; apps/web/src/lib/__tests__/route-guards.test.ts; apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts | test (guard) | 2026-11-12 | high | OK | FR-015, 018..023 |
| S19 | apps/web/src/hooks/__tests__/use-sign-out.test.tsx; apps/web/src/layouts/__tests__/user-card.test.tsx; apps/web/src/layouts/__tests__/bottom-nav.test.tsx | test (đăng xuất) | 2026-11-11 | high | OK | FR-016, 017 |
| S20 | packages/api/src/test/auth.test.ts; packages/auth/src/image-validation.test.ts | test (server auth + validator ảnh; #134 bổ sung ca email không tồn tại và Set-Cookie) | 2026-11-12 | high | OK | FR-002, 004, 007, 028; NFR-001, NFR-006 |
| S21 | packages/api/src/auth-utils.test.ts; packages/api/src/routers/index.test.ts; packages/api/src/routers/dispute-admin.test.ts; packages/api/src/routers/forecast-admin.test.ts; packages/api/src/routers/profile.test.ts; apps/server/src/index.test.ts | test (procedure + admin + 401) | 2026-11-11 | high | OK | FR-025..027 |
| S22 | ~~README.md (ghi chú khu vực legacy)~~ | **Đã xóa ở #134** (bullet legacy gỡ khỏi README) | 2026-11-12 | — | — | Không còn |
| S23 | docs/roadmap-work-items.md:22 | doc (tham khảo — KHÔNG dùng làm nguồn fact) | 2026-11-12 (đã đồng bộ ở #134) | low | OK | Mục 0.3 |
| S24 | packages/auth/src/name-validation.ts | code (validator tên hiển thị 1..50 ký tự sau `trim()` → `INVALID_NAME`; #134) | 2026-11-12 | high | OK | Mục 3 (FR-001), 5 (BR-003), 6 (E-016) |
| S25 | docs/product-decisions.md (D-03 tại dòng 7, D-04 tại dòng 8) | quyết định sản phẩm đã duyệt | 2026-11-06 (D-03 cập nhật) | high (quyết định gốc) | OK | Mục 0, 1 (Boundary), 11, 12 |
| S26 | docs/_product/prd.md (Mục 1 dòng 14, dòng 29, dòng 69, F-01/F-02/F-10/F-11) | PRD đã duyệt | 2026-11-06 | high (ý định sản phẩm) | OK | Mục 1, 2, 7, 10, 11 |

## Ghi chú nguồn

- **Confidence mỗi nguồn:** high = code/test đọc trực tiếp hoặc quyết định/PRD đã duyệt · low = doc chỉ để đối chiếu, không phải nguồn fact.
- **Encoding:** mọi file đọc được, không mojibake.
- **Thư viện:** mặc định của `better-auth@1.7.12` đã được đối chiếu ở #134 (đăng nhập trả cùng `401 INVALID_EMAIL_OR_PASSWORD` cho email không tồn tại — `sign-in.mjs`; `Set-Cookie` có `SameSite=None`, `Secure`, `HttpOnly` — `cookies/index.mjs`; phiên 7 ngày/gia hạn trượt 24 giờ; `rateLimit` in-memory) và khóa thêm bằng test tích hợp (S20).
- **Nguồn mâu thuẫn (đã giải quyết):** S23 từng ghi "Code hiện chỉ có email + mật khẩu" trong khi S1/S3 có đăng nhập Google — đã sửa S23 ở #134; chi tiết ở `reverse-gaps.md` Conflict C-1.
