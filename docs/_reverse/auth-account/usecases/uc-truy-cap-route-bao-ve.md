---
type: reverse-usecase
feature: auth-account
slug: truy-cap-route-bao-ve
status: approved
updated: 2026-11-12
---

# UC: Truy cập trang cần đăng nhập / cần hoàn tất onboarding

> Đã duyệt (#134). Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Hệ thống chỉ cho vào `/app/*`, `/exam`, `/scoring` khi có phiên và đã onboarding, và vào `/onboarding` khi có phiên. ✅ [apps/web/src/lib/auth-guard.ts; apps/web/src/routes/_proto/onboarding.tsx]

**b. Actor:** Khách hoặc học viên đang điều hướng; dịch vụ hồ sơ (hệ thống). ✅

**c. Tiền điều kiện:** Người dùng mở địa chỉ của route được bảo vệ (gõ URL, bấm link, tải lại). ✅

**d. Hậu điều kiện:** Vào được trang, hoặc bị chuyển tới `/auth` (kèm redirect) / `/onboarding` / `/app/dashboard`. ✅

**e. Luồng chính (học viên đã onboarding):**
1. Hệ thống hỏi phiên: có. ✅
2. Hệ thống đã ghi nhớ người dùng đã onboarding (cache hoặc `markUserOnboarded` ngay khi hoàn tất onboarding), hoặc đọc hồ sơ thấy `onboardedAt` có giá trị. ✅
3. Cho vào trang. ✅

**f. Luồng thay thế:**
- 1a. Không có phiên (hoặc hỏi phiên lỗi mạng): chuyển `/auth` kèm redirect = địa chỉ đang vào. ✅
- 1b. Mở `/auth` khi đã có phiên và đã onboard (không có `?error=`): route tự chuyển sang đích hợp lệ, mặc định `/app/dashboard` (BR-auth-account-033, #134). ✅
- 2a. Hồ sơ vắng hoặc chưa xong onboarding: chuyển `/onboarding`. ✅
- 2b. Mở `/onboarding` khi đã xong onboarding: chuyển `/app/dashboard`. ✅
- 2c. Lỗi khi đọc hồ sơ: cho qua và ghi cảnh báo console (fail-open có chủ ý, không lưu cache khi lỗi — OQ-10). ✅

**g. Ngoại lệ:** Không có thông báo lỗi hiển thị; lỗi chỉ gây chuyển hướng. Đường dẫn trong redirect sau đó được lọc bởi BR-auth-account-001 khi đăng nhập.

**h. Quy tắc & ghi chú:** BR-auth-account-021..024, BR-auth-account-028, BR-auth-account-033. Cả ba nhóm route `/app/*`, `/exam`, `/scoring` dùng chung một guard (apps/web/src/lib/__tests__/route-guards.test.ts).
