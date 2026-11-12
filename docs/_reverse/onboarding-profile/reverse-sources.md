# onboarding-profile — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/api/src/routers/profile.ts (1-135) | code (API) | — | high | OK | FR-004..006, FR-011, BR, Error server |
| S2 | packages/db/src/schema/profile.ts (1-21) | code (schema) | — | high | OK | Mục 8, ERD |
| S3 | packages/db/src/migrations/20261105235801_bitter_madripoor/migration.sql (1-9) | migration | 2026-11-05 (theo tên thư mục) | high | OK | Mục 8, ERD |
| S4 | packages/auth/src/image-validation.ts (1-31) | code (validator) | — | high | OK | FR-024, BR ảnh |
| S5 | packages/auth/src/index.ts (46-73) | code (auth hook) | — | high | OK | FR-024, Error INVALID_IMAGE |
| S6 | packages/api/src/routers/profile.test.ts (1-156) | test | — | high | OK | FR-004..006, FR-011, NFR-001 |
| S7 | packages/auth/src/image-validation.test.ts (1-77) | test | — | high | OK | FR-024, NFR-002 |
| S8 | apps/web/src/features/onboarding/onboarding-screen.tsx (1-58) | code (UI) | — | high | OK | FR-010, FR-012, FR-013 |
| S9 | apps/web/src/features/onboarding/components/goal-step.tsx (1-128) | code (UI) | — | high | OK | FR-001..003 |
| S10 | apps/web/src/features/onboarding/components/mic-check.tsx (1-189) | code (UI) | — | high | OK | FR-007..009 |
| S11 | apps/web/src/features/onboarding/components/onboarding-frame.tsx (1-44) | code (UI) | — | high | OK | FR-013 |
| S12 | apps/web/src/hooks/use-mic-level.ts (1-110) | code (hook) | — | high | OK | FR-007, FR-008, NFR-003 |
| S13 | apps/web/src/features/app-state/use-profile-hydration.ts (1-106) | code (hook) | — | high | OK | FR-017 |
| S14 | apps/web/src/lib/auth-guard.ts (1-70) | code (route guard) | — | high | OK | FR-015, NFR-004, NFR-005 |
| S15 | apps/web/src/routes/_proto/onboarding.tsx (1-27) | code (route) | — | high | OK | FR-014 |
| S16 | apps/web/src/routes/_proto/app/profile.tsx (1-7) | code (route) | — | high | OK | Mục 10 |
| S17 | apps/web/src/features/profile/profile-screen.tsx (1-468) | code (UI) | — | high | OK | FR-018..021 |
| S18 | apps/web/src/features/profile/components/avatar-modal.tsx (1-266) | code (UI) | — | high | OK | FR-021..023 |
| S19 | apps/web/src/features/profile/utils/image-compress.ts (1-106) | code (util) | — | high | OK | FR-022, Error nén ảnh |
| S20 | apps/web/src/features/profile/data/preset-avatars.ts (1-46) | code (data tĩnh) | — | high | OK | FR-021 |
| S21 | apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts (1-193) | test | — | high | OK | FR-014, FR-017 |
| S22 | apps/web/src/features/__tests__/slice-a.test.tsx (180-445) | test | — | high | OK | FR-001..003, FR-007..013 |
| S23 | apps/web/src/features/profile/__tests__/profile-screen.test.tsx (1-304) | test | — | high | OK | FR-018..021 |
| S24 | apps/web/src/features/profile/__tests__/avatar-modal.test.tsx (1-119) | test | — | high | OK | FR-021, FR-023 |
| S25 | apps/web/src/features/profile/__tests__/image-compress.test.ts (1-238) | test | — | high | OK | FR-022, NFR-006 |
| S26 | apps/web/src/features/profile/__tests__/preset-avatars.test.ts (1-19) | test | — | high | OK | FR-021 |
| S27 | apps/web/src/lib/__tests__/auth-guard.test.ts (24-245), apps/web/src/lib/__tests__/route-guards.test.ts (28-100) | test | — | high | OK | FR-015, NFR-004, NFR-005 |
| S28 | apps/web/src/hooks/__tests__/use-mic-level.test.ts (6-100) | test | — | high | OK | NFR-003 |
| S29 | packages/api/src/index.ts (15-22) | code (middleware) | — | high | OK | Error UNAUTHORIZED |
| S30 | apps/web/src/routes/_proto/app/route.tsx (6-9), apps/web/src/routes/_proto/scoring.tsx (7), apps/web/src/routes/_proto/exam.tsx (7) | code (route) | — | high | OK | FR-015 |
| S31 | apps/web/src/routes/_proto/route.tsx (29-35) | code (route layout) | — | high | OK | FR-017 |
| S32 | apps/web/src/features/auth/auth-screen.tsx (21, 74) | code (UI) | — | high | OK | FR-016 |
| S33 | packages/api/src/data-registry.ts (57-65) | code (privacy registry) | — | high | OK | BR-014 |
| S34 | apps/web/src/features/app-state/initial-state.ts (1-22) | code (state mặc định) | — | high | OK | BR-001 |
| S35 | docs/_product/prd.md (46, 79), docs/product-decisions.md (D-06, D-10), docs/roadmap-chamro.md (54) | md (tài liệu chính) | 2026-11 | medium | OK | Mục 0.3 |

## Ghi chú nguồn

- Mọi nguồn S1-S34 là source code/test đọc trực tiếp; không có tài liệu nghiệp vụ riêng cho feature này ngoài S35.
- Test KHÔNG được chạy (quy tắc R1). Hành vi lấy từ test được nhãn ✅ theo nội dung assertion, nhưng "vì sao" vẫn 🟡.
- Không có nguồn mâu thuẫn trực tiếp; các điểm lệch nhỏ giữa client và server xem `reverse-gaps.md` mục 3.
- Không có nguồn nào cần chuyển đổi (không docx/pdf) nên không có rủi ro encoding.
