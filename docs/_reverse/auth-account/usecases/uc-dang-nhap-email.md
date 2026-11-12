---
type: reverse-usecase
feature: auth-account
slug: dang-nhap-email
status: draft
updated: 2026-11-11
---

# UC: Đăng nhập bằng email + mật khẩu

> Tái lập chưa duyệt từ code. Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Người dùng đã có tài khoản đăng nhập bằng email và mật khẩu. ✅ [apps/web/src/features/auth/auth-screen.tsx:118-143]

**b. Actor:** Khách / học viên đã có tài khoản; máy chủ xác thực. ✅

**c. Tiền điều kiện:** Ở màn hình S-1, chế độ đăng nhập (mặc định). Có thể đến từ việc bị guard chuyển về kèm tham số redirect. ✅ [apps/web/src/features/auth/auth-screen.tsx:66; apps/web/src/lib/auth-guard.ts:26-30]

**d. Hậu điều kiện:** Phiên đăng nhập được cấp; trình duyệt tải lại toàn trang tới đích hợp lệ, mặc định `/app/dashboard`. ✅ [apps/web/src/features/auth/auth-screen.tsx:20,73,136-138]

**e. Luồng chính:**
1. Người dùng nhập Email, Mật khẩu, bấm "Đăng nhập". ✅ [apps/web/src/features/auth/auth-screen.tsx:205-245]
2. Hệ thống khóa form, cắt khoảng trắng email, gửi mật khẩu nguyên bản. ✅ [apps/web/src/features/auth/auth-screen.tsx:121-127; apps/web/src/features/__tests__/slice-a.test.tsx:504-507]
3. Hệ thống xác thực, cấp phiên. ✅ [packages/api/src/test/auth.test.ts:79-86]
4. Hệ thống tải lại toàn trang tới đích. ✅ [apps/web/src/features/auth/auth-screen.tsx:138]

**f. Luồng thay thế:**
- 4a. Có redirect hợp lệ (vd `/app/history/att-123`): đích là redirect. ✅ [BR-auth-account-001]
- 4b. Redirect nhắm tới `/auth`, `/login` hoặc ngoài site: bỏ qua, đích `/app/dashboard`. ✅ [apps/web/src/features/__tests__/slice-a.test.tsx:612-626]
- 1a. Chuyển sang đăng ký bằng nút chuyển chế độ (UC dang-ky-email). ✅ [apps/web/src/features/auth/auth-screen.tsx:248-255]

**g. Ngoại lệ:**
- Sai email hoặc mật khẩu: "Sai email hoặc mật khẩu." (E-auth-account-001) ✅ [apps/web/src/features/auth/auth-screen.tsx:42; apps/web/src/features/__tests__/slice-a.test.tsx:510-526]
- Lỗi mã khác: "Đăng nhập không thành công. Vui lòng thử lại." (E-auth-account-003) ✅ [apps/web/src/features/auth/auth-screen.tsx:45; apps/web/src/features/__tests__/slice-a.test.tsx:528-543]
- Mất kết nối: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." (E-auth-account-005) ✅ [apps/web/src/features/__tests__/slice-a.test.tsx:646-658]

**h. Quy tắc & ghi chú:** BR-auth-account-001, BR-auth-account-002, BR-auth-account-003, BR-auth-account-006, BR-auth-account-007. Không có quên mật khẩu (OQ-4) và không có giới hạn thử sai (OQ-12) 🟡.

