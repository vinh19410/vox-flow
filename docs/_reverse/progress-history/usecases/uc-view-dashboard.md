---
type: reverse-usecase
feature: progress-history
slug: uc-view-dashboard
status: draft
updated: 2026-11-11
---

# UC: Xem Trang chủ (mức sẵn sàng, đếm ngược, bài gần nhất)

> Tái lập chưa duyệt. Nhãn: ✅. Ở production danh sách lượt thi luôn rỗng (OQ-1), nên các bước "có dữ liệu" chỉ được xác nhận bằng test giả lập.

**a. Mục tiêu / mô tả:** Xem Trang chủ (mức sẵn sàng, đếm ngược, bài gần nhất). 🟡 apps/web/src/features/dashboard/dashboard-screen.tsx:13-69

**b. Actor chính:** Học viên đã đăng nhập, đã onboarding ✅ [apps/web/src/routes/_proto/app/route.tsx:7-8]

**c. Tiền điều kiện:**
1. Có phiên đăng nhập và đã hoàn tất onboarding ✅ [apps/web/src/lib/auth-guard.ts:41-56].

**d. Hậu điều kiện:**
1. Học viên thấy mức sẵn sàng, ngày thi, việc hôm nay, bài gần nhất, hoặc trạng thái trống ✅ [apps/web/src/features/dashboard/dashboard-screen.tsx:17-65].

**e. Luồng chính:**
1. Học viên mở Trang chủ ✅ [apps/web/src/routes/_proto/app/dashboard.tsx:5-7].
2. Hệ thống nạp mục tiêu và ngày thi từ hồ sơ ✅ [apps/web/src/features/app-state/use-profile-hydration.ts:61-77].
3. Nếu có lượt thi, hệ thống tính band ước lượng từ 4 lượt cuối, làm tròn 0.5 ✅ [apps/web/src/features/dashboard/dashboard-screen.tsx:42-44].
4. Hệ thống hiện thẻ sẵn sàng với chênh lệch so với mục tiêu ✅ [apps/web/src/features/dashboard/components/readiness-card.tsx:13,41].
5. Hệ thống hiện đếm ngược nếu có ngày thi, nhịp luyện 1 bài/ngày (tĩnh) ✅ [apps/web/src/features/dashboard/components/countdown-card.tsx:16-35].
6. Hệ thống hiện Việc hôm nay (trống) và bài gần nhất cùng cột band 8 lượt ✅ [apps/web/src/features/dashboard/components/today-tasks.tsx:16-30; apps/web/src/features/dashboard/components/recent-attempt-card.tsx:34-65].

**f. Luồng thay thế / ngoại lệ:**
- 3a. Chưa có lượt thi: chỉ hiện trạng thái trống (E-001), nút Thi thử bài đầu tiên dẫn tới chọn bài thi ✅ [apps/web/src/features/dashboard/dashboard-screen.tsx:17-40; apps/web/src/features/__tests__/slice-b.test.tsx:296-301].
- 2a. Lỗi đọc hồ sơ: giữ giá trị hiện có, không báo lỗi (E-009) ✅ [apps/web/src/features/app-state/use-profile-hydration.ts:62-65].
- 5a. Chưa có ngày thi: thẻ hiện ô chọn ngày (xem uc-set-exam-date) ✅ [apps/web/src/features/dashboard/components/countdown-card.tsx:38-46].
- Học viên bấm bài gần nhất: mở chi tiết (uc-open-attempt-detail); bấm Tất cả: mở Lịch sử ✅ [apps/web/src/features/dashboard/components/recent-attempt-card.tsx:39,43].

**g. Quy tắc & yêu cầu liên quan:** FR-progress-history-001..016, 024; BR-progress-history-001, 002, 003, 004, 010, 011. Màn: Trang chủ (S06). Lỗi: E-progress-history-001, 004, 009.

**h. Câu hỏi mở:** OQ-1, OQ-2, OQ-4, OQ-5, OQ-7
