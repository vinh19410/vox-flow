---
type: reverse-usecase
feature: auth-account
slug: dang-nhap-google
status: draft
updated: 2026-11-11
---

# UC: Đăng nhập bằng Google

> Tái lập chưa duyệt từ code. Nhãn ✅/🟡. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Người dùng đăng nhập bằng tài khoản Google từ cùng màn hình S-1. ✅ [apps/web/src/features/auth/auth-screen.tsx:91-116] Việc đây thuộc feature nào là 🟡 (OQ-6).

**b. Actor:** Khách / học viên; Google (ngoài); máy chủ xác thực. ✅ [packages/auth/src/index.ts:38-43]

**c. Tiền điều kiện:** Ở màn hình S-1; cấu hình Google (client id, secret) có trên máy chủ. ✅ [packages/infra/alchemy.run.ts:57-58]

**d. Hậu điều kiện:** Thành công: quay về đích hợp lệ, mặc định `/app/dashboard` (kể cả tài khoản mới — OQ-13). Lỗi/hủy: quay về `/auth` (kèm redirect hợp lệ nếu có) và hiện thông báo. ✅ [apps/web/src/features/auth/auth-screen.tsx:97-100; apps/web/src/features/__tests__/slice-a.test.tsx:661-699]

**e. Luồng chính:**
1. Người dùng bấm "Tiếp tục với Google"; nút đổi thành "Đang kết nối...", form bị khóa. ✅ [apps/web/src/features/auth/auth-screen.tsx:162-179]
2. Hệ thống tính đích thành công và đích lỗi từ redirect hợp lệ. ✅ [apps/web/src/features/auth/auth-screen.tsx:97-100]
3. Hệ thống chuyển trình duyệt sang Google. ✅ [apps/web/src/features/auth/auth-screen.tsx:102-106; apps/web/src/features/__tests__/slice-a.test.tsx:662-665]
4. Người dùng đồng ý tại Google; trình duyệt trở về đích. 🟡 (phần Google/callback ngoài tầm nhìn của UI; redirect URI máy chủ xác nhận ở packages/api/src/test/auth.test.ts:54-56)

**f. Luồng thay thế:**
- 4a. Người dùng hủy hoặc Google lỗi: về `/auth?error=...`; giá trị khác `account_not_linked` hiển thị E-auth-account-007. ✅ [apps/web/src/features/auth/auth-screen.tsx:87-88; apps/web/src/features/__tests__/slice-a.test.tsx:719-742]
- 4b. Email trùng với tài khoản mật khẩu: tham số `account_not_linked` → E-auth-account-008. 🟡 (máy chủ trả mã này là hành vi thư viện chưa xác nhận) [apps/web/src/features/auth/auth-screen.tsx:85-86; apps/web/src/features/__tests__/slice-a.test.tsx:726-729]

**g. Ngoại lệ:**
- Khởi tạo trả lỗi ngay: "Đăng nhập Google không thành công. Vui lòng thử lại." (E-auth-account-006), nút mở khóa. ✅ [apps/web/src/features/auth/auth-screen.tsx:108-111; apps/web/src/features/__tests__/slice-a.test.tsx:744-764]
- Ngoại lệ mạng: "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau." (E-auth-account-005) ✅ [apps/web/src/features/auth/auth-screen.tsx:112-115]

**h. Quy tắc & ghi chú:** BR-auth-account-001, BR-auth-account-002, BR-auth-account-008, BR-auth-account-031. Chưa rõ quy tắc liên kết tài khoản Google với tài khoản mật khẩu ở phía máy chủ (G-1).

