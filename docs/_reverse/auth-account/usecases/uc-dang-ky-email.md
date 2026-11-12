---
type: reverse-usecase
feature: auth-account
slug: dang-ky-email
status: approved
updated: 2026-11-12
---

# UC: Đăng ký tài khoản bằng email

> Đã duyệt (#134). Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Khách tạo tài khoản mới bằng Tên hiển thị, Email, Mật khẩu và được đăng nhập luôn. ✅ [apps/web/src/features/auth/auth-screen.tsx; packages/auth/src/index.ts]

**b. Actor:** Khách (chính); máy chủ xác thực (hệ thống). ✅

**c. Tiền điều kiện:** Khách ở màn hình S-1 (`/auth`) và đã chuyển sang chế độ đăng ký. Người đã có phiên và đã hoàn tất onboarding (khi không có `?error=`) bị route chuyển đi trước (BR-auth-account-033), nên luồng này chỉ chạy cho người chưa onboard hoặc chưa có phiên. ✅ [apps/web/src/routes/_proto/auth.tsx]

**d. Hậu điều kiện:** Có tài khoản mới với email duy nhất; phiên đăng nhập được cấp; trình duyệt tải lại toàn trang tới đích hợp lệ do khách yêu cầu, mặc định `/onboarding`. ✅ [apps/web/src/features/auth/auth-screen.tsx; apps/web/src/features/__tests__/slice-a.test.tsx]

**e. Luồng chính:**
1. Khách bấm "Chưa có tài khoản? Đăng ký". ✅
2. Khách nhập Tên hiển thị (1..50 ký tự, `maxLength=50`), Email, Mật khẩu (8..128 ký tự; ô nhập gợi ý "Tối thiểu 8 ký tự."). ✅
3. Khách bấm "Tạo tài khoản". Hệ thống khóa form và cắt khoảng trắng tên và email. ✅
4. Hệ thống tạo tài khoản, cấp phiên (tự đăng nhập); máy chủ băm mật khẩu `scrypt` và kiểm tra lại tên (1..50 sau `trim()`) với `validateUserName`. ✅ [packages/auth/src/index.ts; packages/auth/src/name-validation.ts]
5. Hệ thống tải lại toàn trang tới đích. ✅

**f. Luồng thay thế:**
- 3a. Trình duyệt chặn gửi khi thiếu trường, email sai định dạng hoặc mật khẩu ngắn hơn 8 ký tự (`minLength=8`; ô tên giới hạn nhập `maxLength=50`, còn mật khẩu vượt 128 ký tự do máy chủ từ chối và hiển thị E-auth-account-004) — câu chữ HTML5 do trình duyệt sinh theo ngôn ngữ trình duyệt của người dùng (E-auth-account-014). ✅
- 5a. Có tham số redirect hợp lệ: đích là redirect thay vì `/onboarding` (BR-auth-account-001, BR-auth-account-002). ✅
- 5b. Tham số redirect không hợp lệ (vd "//evil.com/hack"): bỏ qua, đích `/onboarding`. ✅

**g. Ngoại lệ:**
- Email đã tồn tại (kể cả email của tài khoản Google): "Email đã được sử dụng." (E-auth-account-002) ✅
- Tên hiển thị ngoài 1..50 ký tự sau `trim()`: máy chủ trả BAD_REQUEST `INVALID_NAME` → "Tên hiển thị không hợp lệ (1–50 ký tự)." (E-auth-account-016) ✅
- Gửi quá nhanh vượt `3 lần/10s`: máy chủ trả HTTP `429` → "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây." (E-auth-account-015) ✅
- Lỗi mã khác: "Đăng ký không thành công. Vui lòng thử lại." (E-auth-account-004) ✅
- Mất kết nối: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." (E-auth-account-005) ✅
- Mọi trường hợp lỗi: form mở khóa, giữ dữ liệu đã nhập, không chuyển trang. ✅

**h. Quy tắc & ghi chú:** BR-auth-account-001..005, BR-auth-account-007, BR-auth-account-032, BR-auth-account-033. Mật khẩu máy chủ 8..128 ký tự + băm `scrypt`; không xác minh email (D-03); tên hiển thị 1..50 ký tự sau `trim()` ở cả giao diện và máy chủ. Ảnh đại diện kèm đăng ký (nếu có) theo BR-auth-account-009..017.
