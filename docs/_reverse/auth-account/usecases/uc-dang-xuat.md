---
type: reverse-usecase
feature: auth-account
slug: dang-xuat
status: approved
updated: 2026-11-12
---

# UC: Đăng xuất

> Đã duyệt (#134). Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Học viên kết thúc phiên đăng nhập. ✅ [apps/web/src/hooks/use-sign-out.ts]

**b. Actor:** Học viên; máy chủ xác thực. ✅

**c. Tiền điều kiện:** Có phiên; học viên đang ở một màn hình có nút Đăng xuất: thẻ người dùng sidebar, thanh điều hướng dưới, hoặc màn hình hồ sơ. ✅ [apps/web/src/layouts/user-card.tsx; apps/web/src/layouts/bottom-nav.tsx; apps/web/src/features/profile/profile-screen.tsx]

**d. Hậu điều kiện:** Thành công: phiên bị hủy, khóa trạng thái prototype trong sessionStorage bị xóa, bộ nhớ đệm trạng thái onboarding bị xóa (`clearOnboardedUserCache`, #134), trình duyệt chuyển tới `/auth`, state học viên reset (giữ mode, voice). Thất bại: không thay đổi gì, ở nguyên trang. ✅

**e. Luồng chính:**
1. Học viên bấm Đăng xuất. ✅
2. Hệ thống hủy phiên. ✅
3. Hệ thống xóa khóa trạng thái prototype (lỗi xóa bị bỏ qua). ✅
4. Hệ thống xóa bộ nhớ đệm trạng thái onboarding (`clearOnboardedUserCache`). ✅ [apps/web/src/lib/auth-guard.ts]
5. Hệ thống điều hướng tới `/auth`. ✅

**f. Luồng thay thế:**
- 5a. Hook nhận đích khác (tham số) thì điều hướng tới đó. ✅ Không có nơi gọi sản phẩm dùng đích khác.

**g. Ngoại lệ:**
- Hủy phiên trả lỗi hoặc ném ngoại lệ mạng: toast "Đăng xuất thất bại. Vui lòng thử lại." (E-auth-account-009), ở nguyên trang. ✅

**h. Quy tắc & ghi chú:** BR-auth-account-025, BR-auth-account-026, BR-auth-account-029. Xóa cache onboarding theo mã người dùng nên không lẫn người giữa các phiên.
