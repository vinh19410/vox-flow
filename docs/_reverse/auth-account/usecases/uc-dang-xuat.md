---
type: reverse-usecase
feature: auth-account
slug: dang-xuat
status: draft
updated: 2026-11-11
---

# UC: Đăng xuất

> Tái lập chưa duyệt từ code. Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Học viên kết thúc phiên đăng nhập. ✅ [apps/web/src/hooks/use-sign-out.ts:10-31]

**b. Actor:** Học viên; máy chủ xác thực. ✅

**c. Tiền điều kiện:** Có phiên; học viên đang ở một màn hình có nút Đăng xuất: thẻ người dùng sidebar, thanh điều hướng dưới, hồ sơ, hoặc menu legacy. ✅ [apps/web/src/layouts/user-card.tsx:42-48; apps/web/src/layouts/bottom-nav.tsx:79; apps/web/src/features/profile/profile-screen.tsx:450; apps/web/src/components/user-menu.tsx:43-48]

**d. Hậu điều kiện:** Thành công: phiên bị hủy, khóa trạng thái prototype trong sessionStorage bị xóa, trình duyệt chuyển tới `/auth`, state học viên reset (giữ mode, voice). Thất bại: không thay đổi gì, ở nguyên trang. ✅ [apps/web/src/hooks/use-sign-out.ts:16-30; apps/web/src/features/app-state/use-profile-hydration.ts:33-40]

**e. Luồng chính:**
1. Học viên bấm Đăng xuất. ✅
2. Hệ thống hủy phiên. ✅ [apps/web/src/hooks/use-sign-out.ts:17]
3. Hệ thống xóa khóa trạng thái prototype (lỗi xóa bị bỏ qua). ✅ [apps/web/src/hooks/use-sign-out.ts:25-29]
4. Hệ thống điều hướng tới `/auth`. ✅ [apps/web/src/hooks/use-sign-out.ts:30; apps/web/src/hooks/__tests__/use-sign-out.test.tsx:37-48]

**f. Luồng thay thế:**
- 4a. Hook nhận đích khác (tham số) thì điều hướng tới đó. ✅ [apps/web/src/hooks/__tests__/use-sign-out.test.tsx:79-90] Không có nơi gọi sản phẩm dùng đích khác (C-3).

**g. Ngoại lệ:**
- Hủy phiên trả lỗi hoặc ném ngoại lệ mạng: toast "Đăng xuất thất bại. Vui lòng thử lại." (E-auth-account-009), ở nguyên trang. ✅ [apps/web/src/hooks/use-sign-out.ts:21-24; apps/web/src/hooks/__tests__/use-sign-out.test.tsx:50-77]

**h. Quy tắc & ghi chú:** BR-auth-account-025, BR-auth-account-026, BR-auth-account-029. Chưa có test xác nhận việc xóa sessionStorage (G-5).

