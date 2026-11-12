---
type: reverse-usecase
feature: onboarding-profile
status: draft
slug: view-profile
updated: 2026-11-11
---

# UC: Xem hồ sơ cá nhân

> Tái lập từ source code, **CHƯA duyệt**.

**a. Tên & mục tiêu:** Học viên xem thông tin định danh và mục tiêu hiện tại. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:160-166]

**Actor chính:** Học viên đã onboard. ✅ [S30: apps/web/src/routes/_proto/app/route.tsx:7]

**b. Điều kiện tiên quyết:** Có phiên và đã onboard. ✅

**c. Trigger:** Mở /app/profile. ✅ [S16: apps/web/src/routes/_proto/app/profile.tsx:5-7]

**d. Luồng chính:**
1. Hệ thống hiện ảnh đại diện (hoặc chữ cái đầu tên), tên, email, band mục tiêu "Mục tiêu hiện tại: x.x Overall", ngày thi. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:188-199, 251, 290, 328]
2. Hệ thống hiện trạng thái "Đang đăng nhập" và ID rút gọn 12 ký tự. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:434-444]
3. Khi dữ liệu phiên/mục tiêu tải xong hoặc đổi, ô tương ứng được cập nhật. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:48-55, 64-67] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:254-285]

**e. Luồng thay thế:** Email trống → "Chưa thiết lập"; không có phiên → ID hiện "Khách". ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:251, 441]

**f. Ngoại lệ / lỗi:** Không có lỗi hiển thị riêng cho việc xem. Chưa onboard thì bị chuyển sang /onboarding (FR-015). ✅

**g. Hậu điều kiện:** Không đổi dữ liệu. ✅

**h. Quy tắc & tham chiếu:** FR-018, 015, 017; Screen: Hồ sơ cá nhân; Error: E-031; OQ-9, 16. Nhãn "Đã xác thực" là hiển thị cố định 🟡 (OQ-9).
