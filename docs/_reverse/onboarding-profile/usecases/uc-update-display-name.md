---
type: reverse-usecase
feature: onboarding-profile
status: draft
slug: update-display-name
updated: 2026-11-11
---

# UC: Sửa tên hiển thị

> Tái lập từ source code, **CHƯA duyệt**.

**a. Tên & mục tiêu:** Học viên đổi tên hiển thị xuất hiện trên bài thi và bảng điểm (theo câu chữ trên màn hình). ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:179-181]

**Actor chính:** Học viên đã onboard. Hệ thống phụ: dịch vụ xác thực. ✅

**b. Điều kiện tiên quyết:** Đang ở /app/profile; ô tên không rỗng thì nút "Lưu tên" mới bật. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:229]

**c. Trigger:** Bấm "Lưu tên". ✅

**d. Luồng chính:**
1. Học viên nhập tên (tối đa 50 ký tự). ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:217-225]
2. Hệ thống cắt khoảng trắng hai đầu, khóa nút (hiện vòng quay). ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:72, 78, 231-232]
3. Hệ thống lưu tên (kèm ảnh hiện tại nếu có). ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:83-86] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:90-107]
4. Hệ thống cập nhật trạng thái, toast "Đã cập nhật thông tin cá nhân thành công!", nút "Đã lưu" 2.5 giây. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:90-93]

**e. Luồng thay thế:** Không có.

**f. Ngoại lệ / lỗi:** E-onboarding-profile-014 (tên trống), E-onboarding-profile-015 (lỗi cập nhật, kể cả trả về lỗi INVALID_IMAGE khi ảnh hiện tại không hợp lệ). ✅ [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:136-157]

**g. Hậu điều kiện:** Thành công: tên mới trong trạng thái và tài khoản. Thất bại: trạng thái không đổi. ✅

**h. Quy tắc & tham chiếu:** FR-019; BR-013, 014; Screen: Hồ sơ cá nhân; Error: E-014, E-015, E-017; OQ-11.
