# auth-account — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/auth/src/index.ts:1-85 | code (cấu hình xác thực phía server) | 2026-11-11 (đọc) | high | OK | Mục 1, 3 (FR-002, 013, 028), 4, 5, 8, 11 |
| S2 | packages/auth/src/image-validation.ts:1-31 | code (validator ảnh đại diện) | 2026-11-11 | high | OK | Mục 3 (FR-028), 5 (BR-009..BR-017), 6 (E-012) |
| S3 | apps/web/src/features/auth/auth-screen.tsx:1-275 | code (màn hình đăng nhập/đăng ký) | 2026-11-11 | high | OK | Mục 3, 5, 6, 10 |
| S4 | apps/web/src/routes/_proto/auth.tsx:1-24 | code (route /auth + validate query) | 2026-11-11 | high | OK | Mục 3 (FR-015), 10 |
| S5 | apps/web/src/lib/auth-guard.ts:1-70 | code (guard phiên + onboarding) | 2026-11-11 | high | OK | Mục 3 (FR-019..023), 5, 9 |
| S6 | apps/web/src/hooks/use-sign-out.ts:1-32 | code (hook đăng xuất) | 2026-11-11 | high | OK | Mục 3 (FR-016), 6 (E-009) |
| S7 | apps/web/src/lib/auth-client.ts:1-7 | code (client xác thực) | 2026-11-11 | high | OK | Mục 11 |
| S8 | apps/web/src/routes/_proto/app/route.tsx:6-9; apps/web/src/routes/_proto/exam.tsx:6-7; apps/web/src/routes/_proto/scoring.tsx:6-7; apps/web/src/routes/_proto/onboarding.tsx:7-26 | code (route được bảo vệ) | 2026-11-11 | high | OK | Mục 3 (FR-019..023) |
| S9 | apps/web/src/routes/admin/disputes.tsx:7-29; apps/web/src/routes/admin/forecast.tsx:7-29 | code (route admin) | 2026-11-11 | high | OK | Mục 3 (FR-024) |
| S10 | apps/server/src/index.ts:40-50,79-84,301-306; apps/server/src/context.ts:12-31; apps/server/src/services.ts:9-11 | code (Worker: CORS, /api/auth, getSession) | 2026-11-11 | high | OK | Mục 3 (FR-027), 4, 9, 11 |
| S11 | packages/api/src/index.ts:15-45; packages/api/src/auth-utils.ts:1-37; packages/api/src/routers/index.ts:11-20; packages/api/src/context.ts:7-32 | code (protected/admin procedure, isUserAdmin, canAccessAudio) | 2026-11-11 | high | OK | Mục 3 (FR-025, 026), 5, 6 |
| S12 | packages/db/src/schema/auth.ts:1-111 | code (schema user/session/account/verification) | 2026-11-11 | high | OK | Mục 8, ERD |
| S13 | apps/web/src/routes/_app-legacy/route.tsx:1-24; apps/web/src/routes/_app-legacy/login.tsx:1-19; apps/web/src/routes/_app-legacy/_auth/route.tsx:1-20; apps/web/src/routes/_app-legacy/_auth/dashboard.tsx:1-22; apps/web/src/components/sign-in-form.tsx:1-141; apps/web/src/components/sign-up-form.tsx:1-166; apps/web/src/components/user-menu.tsx:1-53; apps/web/src/components/header.tsx:1-32; apps/web/src/routeTree.gen.ts:44-48,310-316 | code (khu vực legacy scaffold) | 2026-11-11 | medium (nghi dead — R3) | OK | Mục 3 (FR-030, 031), 10 |
| S14 | packages/infra/alchemy.run.ts:48-58; turbo.json:42-48 | code (khai báo biến môi trường) | 2026-11-11 | high | OK | Mục 11 |
| S15 | apps/web/src/layouts/user-card.tsx:4-9,42-48; apps/web/src/layouts/bottom-nav.tsx:14-21,79; apps/web/src/features/profile/profile-screen.tsx:21-33,450; apps/web/src/components/user-menu.tsx:43-48 | code (các điểm vào đăng xuất) | 2026-11-11 | high | OK | Mục 3 (FR-017), 10 |
| S16 | apps/web/src/features/app-state/use-profile-hydration.ts:33-40; apps/web/src/routes/_proto/route.tsx:28-36; apps/web/src/features/app-state/store.tsx:7 | code (reset state khi mất phiên) | 2026-11-11 | high | OK | Mục 3 (FR-018) |
| S17 | apps/web/src/features/__tests__/slice-a.test.tsx:446-772 | test (AuthScreen) | 2026-11-11 | high | OK | FR-001..015, E-001..008 |
| S18 | apps/web/src/lib/__tests__/auth-guard.test.ts:23-238; apps/web/src/lib/__tests__/route-guards.test.ts:28-102; apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:31-186 | test (guard) | 2026-11-11 | high | OK | FR-018..023 |
| S19 | apps/web/src/hooks/__tests__/use-sign-out.test.tsx:37-90; apps/web/src/layouts/__tests__/user-card.test.tsx:139; apps/web/src/layouts/__tests__/bottom-nav.test.tsx:148 | test (đăng xuất) | 2026-11-11 | high | OK | FR-016, 017 |
| S20 | packages/api/src/test/auth.test.ts:10-285; packages/auth/src/image-validation.test.ts:5-76 | test (server auth + validator ảnh) | 2026-11-11 | high | OK | FR-002, 004, 007, 028 |
| S21 | packages/api/src/auth-utils.test.ts:4-110; packages/api/src/routers/index.test.ts:20-60; packages/api/src/routers/dispute-admin.test.ts:95-110; packages/api/src/routers/forecast-admin.test.ts:82-100,269; packages/api/src/routers/profile.test.ts:61; apps/server/src/index.test.ts:151 | test (procedure + admin + 401) | 2026-11-11 | high | OK | FR-025..027 |
| S22 | README.md:129 | doc (ghi chú khu vực legacy) | không rõ | medium | OK | FR-030, 031 (chỉ để đối chiếu ý định giữ legacy) |
| S23 | docs/roadmap-work-items.md:22 | doc (tham khảo — KHÔNG dùng làm nguồn fact) | không rõ | low | OK | Mục 0.3, Conflict C-1 |

## Ghi chú nguồn

- **Confidence mỗi nguồn:** high = code/test đọc trực tiếp · medium = code nghi dead hoặc doc ghi chú · low = doc không phải nguồn fact.
- **Encoding:** mọi file đọc được, không mojibake.
- **Không đọc:** thư viện bên thứ ba trong `node_modules` (công cụ chặn truy cập) — mặc định của thư viện xác thực (độ dài mật khẩu tối đa/tối thiểu phía server, thời hạn phiên, thuật toán băm mật khẩu) vì vậy KHÔNG xác nhận được từ repo, ghi 🟡 trong `reverse-gaps.md`.
- **Nguồn mâu thuẫn:** S23 nói "Code hiện chỉ có email + mật khẩu" trong khi S1/S3 có đăng nhập Google — xem `reverse-gaps.md` mục Conflicts.
