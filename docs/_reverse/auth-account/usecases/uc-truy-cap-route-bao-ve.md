---
type: reverse-usecase
feature: auth-account
slug: truy-cap-route-bao-ve
status: draft
updated: 2026-11-11
---

# UC: Truy cập trang cần đăng nhập / cần hoàn tất onboarding

> Tái lập chưa duyệt từ code. Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Hệ thống chỉ cho vào `/app/*`, `/exam`, `/scoring` khi có phiên và đã onboarding, và vào `/onboarding` khi có phiên. ✅ [apps/web/src/lib/auth-guard.ts:24-70; apps/web/src/routes/_proto/onboarding.tsx:7-26]

**b. Actor:** Khách hoặc học viên đang điều hướng; dịch vụ hồ sơ (hệ thống). ✅

**c. Tiền điều kiện:** Người dùng mở địa chỉ của route được bảo vệ (gõ URL, bấm link, tải lại). ✅

**d. Hậu điều kiện:** Vào được trang, hoặc bị chuyển tới `/auth` (kèm redirect) / `/onboarding` / `/app/dashboard`. ✅

**e. Luồng chính (học viên đã onboarding):**
1. Hệ thống hỏi phiên: có. ✅ [apps/web/src/lib/auth-guard.ts:25]
2. Hệ thống đã ghi nhớ người dùng đã onboarding, hoặc đọc hồ sơ thấy `onboardedAt` có giá trị. ✅ [apps/web/src/lib/auth-guard.ts:45-59]
3. Cho vào trang. ✅

**f. Luồng thay thế:**
- 1a. Không có phiên (hoặc hỏi phiên lỗi mạng): chuyển `/auth` kèm redirect = địa chỉ đang vào. ✅ [apps/web/src/lib/auth-guard.ts:25-31; apps/web/src/lib/__tests__/auth-guard.test.ts:24-74]
- 2a. Hồ sơ vắng hoặc chưa xong onboarding: chuyển `/onboarding`. ✅ [apps/web/src/lib/auth-guard.ts:52-56; apps/web/src/lib/__tests__/route-guards.test.ts:59-81]
- 2b. Mở `/onboarding` khi đã xong onboarding: chuyển `/app/dashboard`. ✅ [apps/web/src/routes/_proto/onboarding.tsx:14-17; apps/web/src/features/onboarding/__tests__/onboarding-route.test.ts:47]
- 2c. Lỗi khi đọc hồ sơ: cho qua và ghi cảnh báo console (fail-open). ✅ [apps/web/src/lib/auth-guard.ts:62-67] — chủ ý hay không: OQ-10 🟡.

**g. Ngoại lệ:** Không có thông báo lỗi hiển thị; lỗi chỉ gây chuyển hướng. Đường dẫn trong redirect sau đó được lọc bởi BR-auth-account-001 khi đăng nhập.

**h. Quy tắc & ghi chú:** BR-auth-account-021..024, BR-auth-account-028. Cả ba nhóm route `/app/*`, `/exam`, `/scoring` dùng chung một guard (apps/web/src/lib/__tests__/route-guards.test.ts:28-102).
