---
type: reverse-usecase
feature: onboarding-profile
status: draft
slug: check-mic
updated: 2026-11-11
---

# UC: Kiểm tra micro 5 giây (onboarding bước 2)

> Tái lập từ source code, **CHƯA duyệt**.

**a. Tên & mục tiêu:** Học viên thử ghi 5 giây để hệ thống xác nhận micro có tín hiệu. ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:70-71] — Lý do sản phẩm cho bước này (chấm phát âm chính xác hơn) là câu chữ trên màn hình; ngưỡng và tính bắt buộc xem OQ-3. 🟡

**Actor chính:** Học viên mới. Hệ thống phụ: trình duyệt/thiết bị micro. ✅

**b. Điều kiện tiên quyết:** Đã lưu mục tiêu ở bước 1 (đang ở bước 2). ✅ [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:38-54]

**c. Trigger:** Học viên bấm "Ghi thử 5 giây". ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:173-184]

**d. Luồng chính:**
1. Hệ thống xin quyền micro và hiện sóng âm, đồng hồ "x.x s / 5.0s". ✅ [S12: apps/web/src/hooks/use-mic-level.ts:40-80] [S10: apps/web/src/features/onboarding/components/mic-check.tsx:118-121]
2. Học viên đọc to câu mẫu "I usually spend my weekends reading books and meeting friends." ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:122-124]
3. Đồng hồ chạy khi micro đang nghe; hệ thống ghi nhận mức âm đỉnh. ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:23-41]
4. Đủ 5.0 giây và đỉnh từ 0.05: hiện "Đã nhận tín hiệu micro thành công" và nút "Micro ổn, tiếp tục". ✅ [S10: apps/web/src/features/onboarding/components/mic-check.tsx:43-47, 126-130] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:283-322]

**e. Luồng thay thế:**
- A1: Micro bị chặn / không có thiết bị / lỗi âm thanh → "Micro bị chặn" + nút "Thử lại quyền micro" (đặt lại và ghi lại). ✅ [S22: apps/web/src/features/__tests__/slice-a.test.tsx:253-281]
- A2: Đỉnh dưới 0.05 sau 5.0 giây → "Không nghe thấy tiếng" + nút "Thử lại âm thanh". ✅ [S22: apps/web/src/features/__tests__/slice-a.test.tsx:324-359]
- A3: Tín hiệu thay đổi liên tục mỗi lần vẽ vẫn đếm đủ 5 giây. ✅ [S22: apps/web/src/features/__tests__/slice-a.test.tsx:361-392]

**f. Ngoại lệ / lỗi:** E-onboarding-profile-010 (chặn), E-onboarding-profile-011 (quá nhỏ). Không có nút bỏ qua. ✅

**g. Hậu điều kiện:** Không có bản ghi âm nào được lưu hay gửi; luồng micro được giải phóng. ✅ [S12: apps/web/src/hooks/use-mic-level.ts:32-38, 102-106] [S28: apps/web/src/hooks/__tests__/use-mic-level.test.ts:79-100]

**h. Quy tắc & tham chiếu:** FR-007, 008, 009; BR-008, 009, 010; NFR-003; Screen: Onboarding bước 2; Error: E-010, E-011; OQ-3, 15, 18.
