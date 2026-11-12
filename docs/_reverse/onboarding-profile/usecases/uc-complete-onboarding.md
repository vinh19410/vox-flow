---
type: reverse-usecase
feature: onboarding-profile
status: draft
slug: complete-onboarding
updated: 2026-11-11
---

# UC: Hoàn tất onboarding và vào ứng dụng

> Tái lập từ source code, **CHƯA duyệt**.

**a. Tên & mục tiêu:** Học viên đã qua kiểm tra mic xác nhận hoàn tất để được vào Dashboard. ✅ [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:17-24]

**Actor chính:** Học viên mới. ✅

**b. Điều kiện tiên quyết:** Đã lưu mục tiêu (có hồ sơ) và mic đạt. ✅ [S1: packages/api/src/routers/profile.ts:101-106] [S10: apps/web/src/features/onboarding/components/mic-check.tsx:161-164]

**c. Trigger:** Bấm "Micro ổn, tiếp tục". ✅

**d. Luồng chính:**
1. Hệ thống khóa nút, hiện "Đang hoàn tất…". ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:162-163]
2. Hệ thống ghi thời điểm onboard (lần đầu). ✅ [S1: packages/api/src/routers/profile.ts:111-118]
3. Hệ thống chuyển tới Dashboard. ✅ [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:24] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:316-321]
4. Từ nay học viên vào được /app, /exam, /scoring; vào lại /onboarding thì về Dashboard. ✅ [S14: apps/web/src/lib/auth-guard.ts:50-56] [S15: apps/web/src/routes/_proto/onboarding.tsx:14-17]

**e. Luồng thay thế:**
- A1: Gọi hoàn tất lần nữa → trả hồ sơ cũ, thời điểm onboard không đổi. ✅ [S6: packages/api/src/routers/profile.test.ts:118-127]
- A2: Hệ thống không có kênh gọi máy chủ → vẫn chuyển Dashboard mà không lưu. 🔵 (OQ-7) [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:21-24]

**f. Ngoại lệ / lỗi:**
- E-onboarding-profile-009: banner "Không thể hoàn tất onboarding. Vui lòng thử lại.", ở lại bước 2, không chuyển trang. ✅ [S22: apps/web/src/features/__tests__/slice-a.test.tsx:406-444]
- Chưa có hồ sơ (E-006) hoặc lỗi đọc lại (E-007): cùng banner trên. ✅ câu / 🔵 ánh xạ

**g. Hậu điều kiện:** Hồ sơ có thời điểm onboard bất biến. ✅ [S6: packages/api/src/routers/profile.test.ts:129-141]

**h. Quy tắc & tham chiếu:** FR-010, 011, 012, 014, 015; BR-006, 007, 011, 012; NFR-004, 005; Screen: Onboarding bước 2; Error: E-006, E-007, E-009, E-031; OQ-7, 8.
