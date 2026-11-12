---
type: reverse-usecase
feature: auth-account
slug: dung-khu-legacy
status: draft
updated: 2026-11-11
---

# UC: Dùng form đăng ký / đăng nhập legacy (nghi dead)

> Tái lập chưa duyệt từ code. Nhãn 🟡. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Truy cập trực tiếp `/login` để đăng ký/đăng nhập bằng form tiếng Anh, rồi xem `/dashboard` legacy. 🟡 [apps/web/src/routes/_app-legacy/login.tsx:7-18] Route vẫn đăng ký trong cây route (apps/web/src/routeTree.gen.ts:44-48) nhưng không có liên kết vào từ giao diện chính (N-4).

**b. Actor:** Người dùng legacy 🟡; máy chủ xác thực. 

**c. Tiền điều kiện:** Biết URL `/login` hoặc `/dashboard`. 🟡

**d. Hậu điều kiện:** Thành công: toast "Sign up successful" hoặc "Sign in successful", chuyển `/dashboard`; có phiên dùng chung với ứng dụng chính. 🟡 [apps/web/src/components/sign-up-form.tsx:33-37; apps/web/src/components/sign-in-form.tsx:31-35]

**e. Luồng chính:**
1. Mở `/login`: hiện form "Create Account" (mặc định). 🟡 [apps/web/src/routes/_app-legacy/login.tsx:12-18]
2. Nhập Name, Email, Password rồi bấm "Sign Up". 🟡
3. Hợp lệ → gửi đăng ký → toast thành công → `/dashboard`. 🟡
4. `/dashboard` hiển thị "Welcome {tên}" và thông điệp API riêng tư. 🟡 [apps/web/src/routes/_app-legacy/_auth/dashboard.tsx:15-21]

**f. Luồng thay thế:**
- 1a. Bấm "Already have an account? Sign In" → form "Welcome Back". 🟡 [apps/web/src/components/sign-up-form.tsx:155; apps/web/src/routes/_app-legacy/login.tsx:12-18]
- 4a. Mở `/dashboard` khi không có phiên → chuyển `/login`. 🟡 [apps/web/src/routes/_app-legacy/_auth/route.tsx:7-15]
- 5. Menu người dùng ở header: Sign In (khi chưa phiên), tên + email + Sign Out (khi có phiên); Sign Out đưa về `/auth` chứ không về `/login` (C-3). 🟡 [apps/web/src/components/user-menu.tsx:21-51]

**g. Ngoại lệ:** Lỗi kiểm tra form: "Invalid email address", "Password must be at least 8 characters", "Name must be at least 2 characters" (E-auth-account-015); lỗi máy chủ: toast thông điệp máy chủ hoặc statusText (E-auth-account-016) ⚠️ chưa resolve. 🟡

**h. Quy tắc & ghi chú:** BR-auth-account-030. Không có test cho toàn bộ nhóm này. Quyết định giữ/gỡ: OQ-5.

