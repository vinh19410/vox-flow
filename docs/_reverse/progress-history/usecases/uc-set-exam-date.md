---
type: reverse-usecase
feature: progress-history
slug: uc-set-exam-date
status: draft
updated: 2026-11-11
---

# UC: Nhập ngày thi từ thẻ đếm ngược

> Tái lập chưa duyệt. Nhãn: ✅ (luồng) / 🔵 (không lưu). Ở production danh sách lượt thi luôn rỗng (OQ-1), nên các bước "có dữ liệu" chỉ được xác nhận bằng test giả lập.

**a. Mục tiêu / mô tả:** Nhập ngày thi từ thẻ đếm ngược. 🟡 apps/web/src/features/dashboard/components/countdown-card.tsx:38-46

**b. Actor chính:** Học viên đã đăng nhập, đã onboarding ✅ [apps/web/src/routes/_proto/app/route.tsx:7-8]

**c. Tiền điều kiện:**
1. Trang chủ ở trạng thái có lượt thi (thẻ đếm ngược chỉ hiện khi đó) ✅ [apps/web/src/features/dashboard/dashboard-screen.tsx:17,60].
2. Chưa có ngày thi ✅ [apps/web/src/features/dashboard/components/countdown-card.tsx:38-46].

**d. Hậu điều kiện:**
1. Ngày thi trong state được cập nhật; số ngày còn lại hiện ngay ✅ [apps/web/src/features/dashboard/components/countdown-card.tsx:43].
2. Hồ sơ trên máy chủ **không** đổi từ thao tác này 🔵 [apps/web/src/features/dashboard/components/countdown-card.tsx:43; apps/web/src/features/profile/profile-screen.tsx:144-147].

**e. Luồng chính:**
1. Học viên chọn ngày ở ô ngày ✅ [apps/web/src/features/dashboard/components/countdown-card.tsx:41-45].
2. Hệ thống đặt ngày thi trong state (chuỗi rỗng thì null) ✅ [apps/web/src/features/dashboard/components/countdown-card.tsx:43].
3. Hệ thống tính và hiện số ngày còn lại (tối thiểu 0) và ngày dd/mm/yyyy ✅ [apps/web/src/lib/format.ts:8-11; apps/web/src/features/dashboard/components/countdown-card.tsx:19-24].

**f. Luồng thay thế / ngoại lệ:**
- 2a. Ngày chọn ở quá khứ: thẻ không chặn, hiển thị 0 ngày ✅ [apps/web/src/lib/format.ts:8-11; apps/web/src/lib/__tests__/format.test.ts:40-41].
- 2b. Tải lại trang hoặc nạp hồ sơ lại: giá trị từ máy chủ ghi đè 🔵 [apps/web/src/features/app-state/use-profile-hydration.ts:70-74].
- Muốn lưu bền: dùng màn Hồ sơ (kiểm tra không quá khứ, định dạng) ✅ [packages/api/src/routers/profile.ts:16-38].

**g. Quy tắc & yêu cầu liên quan:** FR-progress-history-009..012; BR-progress-history-004, 011, 014. Màn: Trang chủ (S06). Lỗi: (không có lỗi hiển thị).

**h. Câu hỏi mở:** OQ-6, OQ-7
