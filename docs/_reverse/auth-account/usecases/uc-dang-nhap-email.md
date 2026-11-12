---
type: reverse-usecase
feature: auth-account
slug: dang-nhap-email
status: approved
updated: 2026-11-12
---

# UC: Đăng nhập bằng email + mật khẩu

> Đã duyệt (#134). Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Người dùng đã có tài khoản đăng nhập bằng email và mật khẩu. ✅ [apps/web/src/features/auth/auth-screen.tsx]

**b. Actor:** Khách / học viên đã có tài khoản; máy chủ xác thực. ✅

**c. Tiền điều kiện:** Ở màn hình S-1, chế độ đăng nhập (mặc định). Có thể đến từ việc bị guard chuyển về kèm tham số redirect. Người đã có phiên VÀ đã hoàn tất onboarding (khi không có `?error=`) bị route `/auth` chuyển đi trước sang đích hợp lệ (BR-auth-account-033); người chưa onboard vẫn mở được `/auth` để giữ nút "Quay lại" từ bước 1 của `/onboarding`. ✅ [apps/web/src/features/auth/auth-screen.tsx; apps/web/src/lib/auth-guard.ts; apps/web/src/routes/_proto/auth.tsx]

**d. Hậu điều kiện:** Phiên đăng nhập được cấp (7 ngày, gia hạn trượt 24 giờ); trình duyệt tải lại toàn trang tới đích hợp lệ, mặc định `/app/dashboard`. ✅

**e. Luồng chính:**
1. Người dùng nhập Email, Mật khẩu, bấm "Đăng nhập". ✅
2. Hệ thống khóa form, cắt khoảng trắng email, gửi mật khẩu nguyên bản. ✅
3. Hệ thống xác thực, cấp phiên. ✅
4. Hệ thống tải lại toàn trang tới đích. ✅

**f. Luồng thay thế:**
- 4a. Có redirect hợp lệ (vd `/app/history/att-123`): đích là redirect. ✅ [BR-auth-account-001]
- 4b. Redirect nhắm tới `/auth`, `/login` hoặc ngoài site: bỏ qua, đích `/app/dashboard`. ✅
- 1a. Chuyển sang đăng ký bằng nút chuyển chế độ (UC dang-ky-email). ✅

**g. Ngoại lệ:**
- Sai email hoặc mật khẩu — cùng một mã `INVALID_EMAIL_OR_PASSWORD` (HTTP 401) cho cả mật khẩu sai, email không tồn tại và tài khoản chỉ có Google (chống dò email; đã xác minh `better-auth@1.7.12` và khóa bằng test tích hợp): "Sai email hoặc mật khẩu." (E-auth-account-001) ✅
- Gửi quá nhanh vượt `3 lần/10s`: máy chủ trả HTTP `429` → "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."; không khóa tài khoản (E-auth-account-015) ✅
- Lỗi mã khác: "Đăng nhập không thành công. Vui lòng thử lại." (E-auth-account-003) ✅
- Mất kết nối: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." (E-auth-account-005) ✅

**h. Quy tắc & ghi chú:** BR-auth-account-001, BR-auth-account-002, BR-auth-account-003, BR-auth-account-006, BR-auth-account-007, BR-auth-account-032, BR-auth-account-033. Không có quên mật khẩu ở MVP (D-03); giới hạn tốc độ `3 lần/10s` cho `/sign-in*` theo header `cf-connecting-ip`, không khóa cứng tài khoản (OQ-12).
