---
type: reverse-usecase
feature: onboarding-profile
status: draft
slug: change-avatar
updated: 2026-11-11
---

# UC: Đổi ảnh đại diện

> Tái lập từ source code, **CHƯA duyệt**.

**a. Tên & mục tiêu:** Học viên đổi ảnh đại diện bằng mẫu có sẵn, ảnh tải lên hoặc link https. ✅ [S18: apps/web/src/features/profile/components/avatar-modal.tsx:77-80, 104-153]

**Actor chính:** Học viên đã onboard. ✅

**b. Điều kiện tiên quyết:** Đang ở /app/profile. ✅

**c. Trigger:** Bấm nút máy ảnh "Đổi ảnh đại diện". ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:201-208] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:195-207]

**d. Luồng chính (mẫu có sẵn):**
1. Hộp thoại mở ở tab "Mẫu có sẵn", 6 mẫu. ✅ [S18: apps/web/src/features/profile/components/avatar-modal.tsx:26, 162-196]
2. Học viên chọn một mẫu; xem trước đổi theo. ✅
3. Bấm "Xác nhận đổi ảnh": hộp thoại đóng, ảnh trên màn đổi ngay. ✅ [S24: apps/web/src/features/profile/__tests__/avatar-modal.test.tsx:46-68]
4. Hệ thống lưu ảnh (kèm tên nếu không rỗng) và báo "Đã cập nhật ảnh đại diện mới!". ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:102-119] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:209-232]

**e. Luồng thay thế:**
- A1 (tải ảnh lên): chọn tệp, hệ thống nén vuông 180x180 rồi dùng làm xem trước. ✅ [S18: apps/web/src/features/profile/components/avatar-modal.tsx:32-48] [S19: apps/web/src/features/profile/utils/image-compress.ts:9-105]
- A2 (link): dán link https, bấm "Xem thử" rồi xác nhận. ✅ [S24: apps/web/src/features/profile/__tests__/avatar-modal.test.tsx:70-98]
- A3: Bấm "Hủy" → đóng, không lưu. ✅ [S24: apps/web/src/features/profile/__tests__/avatar-modal.test.tsx:100-118]
- A4: Xác nhận mà chưa chọn gì → vẫn lưu ảnh đang xem trước (mặc định ảnh hiện tại hoặc mẫu đầu). ✅ (BR-021)

**f. Ngoại lệ / lỗi:** E-onboarding-profile-018..030 (lỗi trong hộp thoại/nén ảnh), E-onboarding-profile-016 (lưu lỗi), E-onboarding-profile-017 (máy chủ từ chối ảnh, hiện qua E-016). Ảnh trên màn không hoàn lại khi lưu lỗi (OQ-10). ✅

**g. Hậu điều kiện:** Thành công: ảnh mới được lưu. Thất bại: ảnh lưu cũ giữ nguyên nhưng màn vẫn hiển thị ảnh mới đến khi tải lại. ✅ câu / 🔵 hệ quả hiển thị

**h. Quy tắc & tham chiếu:** FR-021, 022, 023, 024; BR-014, 015, 016, 017, 021; NFR-002, 006; Screen: Hồ sơ cá nhân, Hộp thoại ảnh; Error: E-016..030; OQ-10, 12, 13.
