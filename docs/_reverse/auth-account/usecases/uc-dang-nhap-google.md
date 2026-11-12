---
type: reverse-usecase
feature: auth-account
slug: dang-nhap-google
status: approved
updated: 2026-11-12
---

# UC: Đăng nhập bằng Google

> Đã duyệt (#134). Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Người dùng đăng nhập bằng tài khoản Google từ cùng màn hình S-1; thuộc feature `auth-account` theo D-03 / PRD F-02. ✅ [apps/web/src/features/auth/auth-screen.tsx; docs/_product/prd.md:78]

**b. Actor:** Khách / học viên; Google (ngoài); máy chủ xác thực. ✅ [packages/auth/src/index.ts]

**c. Tiền điều kiện:** Ở màn hình S-1; cấu hình Google (client id, secret) có trên máy chủ. Người đã onboard và có phiên bị route `/auth` chuyển đi trước (BR-auth-account-033). ✅ [packages/infra/alchemy.run.ts]

**d. Hậu điều kiện:** Thành công: quay về đích hợp lệ — tài khoản Google **đã có** về `callbackURL` (`safeRedirect ?? "/app/dashboard"`), tài khoản Google **mới** về `newUserCallbackURL` (`safeRedirect ?? "/onboarding"`, #134). Lỗi/hủy: quay về `/auth` (kèm redirect hợp lệ nếu có) và hiện thông báo. ✅

**e. Luồng chính:**
1. Người dùng bấm "Tiếp tục với Google"; nút đổi thành "Đang kết nối...", form bị khóa. ✅
2. Hệ thống tính đích thành công (`callbackURL`), đích cho tài khoản mới (`newUserCallbackURL` = `safeRedirect ?? "/onboarding"`) và đích lỗi từ redirect hợp lệ. ✅
3. Hệ thống chuyển trình duyệt sang Google. ✅
4. Người dùng đồng ý tại Google; với tài khoản mới, máy chủ chuẩn hóa tên hồ sơ Google về `1..50` ký tự (`normalizeOAuthUserName`) trước khi tạo user; trình duyệt trở về đích tương ứng — tài khoản mới vào thẳng `/onboarding`, tài khoản cũ vào đích đăng nhập. ✅ (cơ chế callback của `better-auth@1.7.12`; redirect URI và `mapProfileToUser` xác nhận ở `packages/api/src/test/auth.test.ts`)

**f. Luồng thay thế:**
- 4a. Người dùng hủy hoặc Google lỗi: về `/auth?error=...`; giá trị khác `account_not_linked` hiển thị E-auth-account-007. ✅
- 4b. Email trùng với tài khoản mật khẩu: tham số `account_not_linked` → E-auth-account-008 (máy chủ trả mã này là hành vi đã xác minh của `better-auth@1.7.12`). ✅

**g. Ngoại lệ:**
- Khởi tạo trả lỗi ngay: "Đăng nhập Google không thành công. Vui lòng thử lại." (E-auth-account-006), nút mở khóa. ✅
- Gửi quá nhanh vượt `3 lần/10s`: máy chủ trả HTTP `429` → "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây." (E-auth-account-015) ✅
- Ngoại lệ mạng: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." (E-auth-account-005) ✅

**h. Quy tắc & ghi chú:** BR-auth-account-001, BR-auth-account-002, BR-auth-account-008, BR-auth-account-031, BR-auth-account-032, BR-auth-account-033. Tài khoản Google không tự gắn vào tài khoản mật khẩu cùng email (`account_not_linked`).
