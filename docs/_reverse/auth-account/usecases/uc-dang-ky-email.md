---
type: reverse-usecase
feature: auth-account
slug: dang-ky-email
status: draft
updated: 2026-11-11
---

# UC: Đăng ký tài khoản bằng email

> Tái lập chưa duyệt từ code. Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Khách tạo tài khoản mới bằng Tên hiển thị, Email, Mật khẩu và được đăng nhập luôn. ✅ [apps/web/src/features/auth/auth-screen.tsx:118-143; packages/auth/src/index.ts:34-37]

**b. Actor:** Khách (chính); máy chủ xác thực (hệ thống). ✅

**c. Tiền điều kiện:** Khách ở màn hình S-1 (`/auth`) và đã chuyển sang chế độ đăng ký. Không có điều kiện đã đăng nhập: màn hình không chặn người đã có phiên (OQ-8). ✅ [apps/web/src/routes/_proto/auth.tsx:5-24]

**d. Hậu điều kiện:** Có tài khoản mới với email duy nhất; phiên đăng nhập được cấp; trình duyệt tải lại toàn trang tới đích hợp lệ do khách yêu cầu, mặc định `/onboarding`. ✅ [apps/web/src/features/auth/auth-screen.tsx:74,136-138; apps/web/src/features/__tests__/slice-a.test.tsx:570-593]

**e. Luồng chính:**
1. Khách bấm "Chưa có tài khoản? Đăng ký". ✅ [apps/web/src/features/auth/auth-screen.tsx:254]
2. Khách nhập Tên hiển thị, Email, Mật khẩu (tối thiểu 8 ký tự). ✅ [apps/web/src/features/auth/auth-screen.tsx:187-236]
3. Khách bấm "Tạo tài khoản". Hệ thống khóa form và cắt khoảng trắng tên và email. ✅ [apps/web/src/features/auth/auth-screen.tsx:120-128]
4. Hệ thống tạo tài khoản, cấp phiên (tự đăng nhập). ✅ [packages/auth/src/index.ts:36]
5. Hệ thống tải lại toàn trang tới đích. ✅ [apps/web/src/features/auth/auth-screen.tsx:137-138]

**f. Luồng thay thế:**
- 3a. Trình duyệt chặn gửi khi thiếu trường, email sai định dạng hoặc mật khẩu ngắn hơn 8 ký tự (E-auth-account-014 🟡). [apps/web/src/features/auth/auth-screen.tsx:196,213,227-228]
- 5a. Có tham số redirect hợp lệ: đích là redirect thay vì `/onboarding` (BR-auth-account-001, BR-auth-account-002). ✅ [apps/web/src/features/__tests__/slice-a.test.tsx:545-568]
- 5b. Tham số redirect không hợp lệ (vd "//evil.com/hack"): bỏ qua, đích `/onboarding`. ✅ [apps/web/src/features/__tests__/slice-a.test.tsx:627-643]

**g. Ngoại lệ:**
- Email đã tồn tại (kể cả email của tài khoản Google): "Email đã được sử dụng." (E-auth-account-002) ✅ [apps/web/src/features/auth/auth-screen.tsx:43; packages/api/src/test/auth.test.ts:223-284]
- Lỗi mã khác: "Đăng ký không thành công. Vui lòng thử lại." (E-auth-account-004) ✅ [apps/web/src/features/auth/auth-screen.tsx:46]
- Mất kết nối: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." (E-auth-account-005) ✅ [apps/web/src/features/auth/auth-screen.tsx:141]
- Mọi trường hợp lỗi: form mở khóa, giữ dữ liệu đã nhập, không chuyển trang. ✅ [apps/web/src/features/auth/auth-screen.tsx:131-133,140]

**h. Quy tắc & ghi chú:** BR-auth-account-001..005, BR-auth-account-007. Chính sách mật khẩu máy chủ, xác minh email, giới hạn tên: 🟡 OQ-1, OQ-3, OQ-11. Ảnh đại diện kèm đăng ký (nếu có) theo BR-auth-account-009..017.

