---
type: reverse-usecase
feature: onboarding-profile
status: draft
slug: update-goal
updated: 2026-11-11
---

# UC: Sửa mục tiêu band và ngày thi

> Tái lập từ source code, **CHƯA duyệt**.

**a. Tên & mục tiêu:** Học viên đổi band mục tiêu hoặc ngày thi sau onboarding. Mục đích câu chữ: "Cập nhật lộ trình bất kỳ lúc nào để thuật toán AI bám sát tiến độ". ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:346-349]

**Actor chính:** Học viên đã onboard. ✅

**b. Điều kiện tiên quyết:** Đang ở /app/profile. ✅

**c. Trigger:** Bấm "Lưu mục tiêu". ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:350-364]

**d. Luồng chính:**
1. Học viên chọn một mức band khác (9 mức). ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:293-312]
2. Học viên chọn hoặc đổi ngày thi. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:325-331]
3. Học viên bấm "Lưu mục tiêu". ✅
4. Hệ thống kiểm tra ngày không trước hôm nay (UTC), lưu band + ngày. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:130-149]
5. Hệ thống cập nhật trạng thái, toast "Đã cập nhật mục tiêu luyện thi IELTS!", nút "Đã lưu mục tiêu" 2.5 giây. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:149-152] [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:109-134]

**e. Luồng thay thế:** A1: bấm "Xóa ngày" (chỉ hiện khi có ngày) rồi lưu → ngày thi thành trống. ✅ [S17: apps/web/src/features/profile/profile-screen.tsx:333-342, 130] (không có test riêng nút này — Gap)

**f. Ngoại lệ / lỗi:** E-onboarding-profile-013 (ngày quá khứ, không gọi máy chủ), E-onboarding-profile-012 (lưu lỗi). ✅ [S23: apps/web/src/features/profile/__tests__/profile-screen.test.tsx:159-193]

**g. Hậu điều kiện:** Hồ sơ cập nhật, thời điểm onboard giữ nguyên. ✅ [S6: packages/api/src/routers/profile.test.ts:129-141]

**h. Quy tắc & tham chiếu:** FR-020, 004, 005, 006; BR-001, 002, 003, 005, 006; Screen: Hồ sơ cá nhân; Error: E-002..005, E-012, E-013; OQ-2, 5.
