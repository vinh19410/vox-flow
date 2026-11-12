---
type: reverse-usecase
feature: onboarding-profile
status: draft
slug: set-goal-onboarding
updated: 2026-11-11
---

# UC: Thiết lập mục tiêu band và ngày thi (onboarding bước 1)

> Tái lập từ source code, **CHƯA duyệt**. Nhãn: ✅ / 🔵 / 🟡.

**a. Tên & mục tiêu:** Học viên mới đặt band mục tiêu và (tùy chọn) ngày thi để tiếp tục sang bước kiểm tra mic. ✅ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:56-57] — Mục đích nghiệp vụ sâu hơn (so sánh tiến độ, gợi ý việc luyện mỗi ngày) là câu chữ trên màn hình; cách dùng thật xem OQ-2. 🟡

**Actor chính:** Học viên mới (chưa onboard). ✅ [S15: apps/web/src/routes/_proto/onboarding.tsx:9-17]

**b. Điều kiện tiên quyết:**
- Có phiên đăng nhập. ✅ [S15: apps/web/src/routes/_proto/onboarding.tsx:9]
- Hồ sơ chưa có thời điểm onboard (nếu có thì bị chuyển về Dashboard). ✅ [S15: apps/web/src/routes/_proto/onboarding.tsx:14-17]

**c. Trigger:** Học viên đăng ký xong được dẫn tới trang onboarding, hoặc bị cổng chặn đẩy sang khi vào khu vực ứng dụng chưa onboard. ✅ [S32: apps/web/src/features/auth/auth-screen.tsx:21, 74] [S14: apps/web/src/lib/auth-guard.ts:52-56]

**d. Luồng chính:**
1. Hệ thống hiện "Mục tiêu của bạn là gì?", 9 mức band, band đang chọn mặc định 7.0. ✅ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:56-77] [S34: apps/web/src/features/app-state/initial-state.ts:7]
2. Học viên chọn một mức band. ✅ [S22: apps/web/src/features/__tests__/slice-a.test.tsx:181-196]
3. Học viên (tùy chọn) chọn ngày thi không sớm hơn hôm nay (giờ địa phương). ✅ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:82-90]
4. Học viên bấm "Tiếp tục". ✅
5. Hệ thống khóa các điều khiển, hiện "Đang lưu…", lưu band + ngày thi. ✅ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:31-41, 115-118]
6. Hệ thống cập nhật trạng thái ứng dụng và chuyển sang bước 2 (kiểm tra mic). ✅ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:42-43] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:198-203]

**e. Luồng thay thế:**
- A1 (bước 4): Học viên bấm "Bỏ qua ngày thi": ngày bị xóa, lưu với ngày trống, rồi sang bước 2. ✅ [S9: apps/web/src/features/onboarding/components/goal-step.tsx:99-110] [S22: apps/web/src/features/__tests__/slice-a.test.tsx:283-302]
- A2: Học viên bấm "Quay lại" ở bước 1 → về màn đăng nhập. ✅ [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:35] (hệ quả: OQ-14 🟡)
- A3: Quay lại từ bước 2 → ngày đã chọn được giữ. ✅ [S22: apps/web/src/features/__tests__/slice-a.test.tsx:222-251]

**f. Ngoại lệ / lỗi:**
- E-onboarding-profile-008: lưu thất bại → banner "Không thể lưu mục tiêu. Vui lòng kiểm tra kết nối và thử lại.", ở lại bước 1. ✅ [S22: apps/web/src/features/__tests__/slice-a.test.tsx:394-404]
- Máy chủ từ chối band/ngày (E-002..004) cũng hiện câu trên (gây hiểu nhầm — OQ-6). ✅ câu / 🟡 ý định
- Ngày thi gõ tay trong quá khứ không bị chặn ở giao diện onboarding, chỉ bị máy chủ từ chối (E-004). 🔵 [S9: apps/web/src/features/onboarding/components/goal-step.tsx:85-88] [S1: packages/api/src/routers/profile.ts:21-38]

**g. Hậu điều kiện:**
- Thành công: hồ sơ có band + ngày thi (hoặc rỗng), chưa có thời điểm onboard. ✅ [S6: packages/api/src/routers/profile.test.ts:99-116]
- Thất bại: không đổi hồ sơ; học viên ở lại bước 1. ✅

**h. Quy tắc & tham chiếu:** FR-001, 002, 003, 004, 005, 006, 013, 025; BR-001, 002, 003, 004, 005; Screen: Onboarding bước 1; Error: E-001..005, E-008; OQ-2, 5, 6, 7, 14.
