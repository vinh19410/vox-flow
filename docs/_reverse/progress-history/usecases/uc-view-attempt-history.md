---
type: reverse-usecase
feature: progress-history
slug: uc-view-attempt-history
status: draft
updated: 2026-11-11
---

# UC: Xem lịch sử lượt thi và biểu đồ band, lọc theo chế độ

> Tái lập chưa duyệt. Nhãn: ✅ (luồng) / 🔵 (thứ tự). Ở production danh sách lượt thi luôn rỗng (OQ-1), nên các bước "có dữ liệu" chỉ được xác nhận bằng test giả lập.

**a. Mục tiêu / mô tả:** Xem lịch sử lượt thi và biểu đồ band, lọc theo chế độ. 🟡 apps/web/src/features/history/history-screen.tsx:15-78

**b. Actor chính:** Học viên đã đăng nhập, đã onboarding ✅ [apps/web/src/routes/_proto/app/route.tsx:7-8]

**c. Tiền điều kiện:**
1. Có phiên đăng nhập và đã hoàn tất onboarding ✅ [apps/web/src/routes/_proto/app/route.tsx:7-8].

**d. Hậu điều kiện:**
1. Học viên thấy biểu đồ và danh sách (đã lọc), hoặc trạng thái trống ✅ [apps/web/src/features/history/history-screen.tsx:47-75].

**e. Luồng chính:**
1. Học viên mở Lịch sử ✅ [apps/web/src/routes/_proto/app/history.index.tsx:5-7].
2. Hệ thống hiện nút lọc Tất cả, Full Test, Part 1, Part 2, Part 3; mặc định Tất cả ✅ [apps/web/src/features/history/history-screen.tsx:17,25-30].
3. Hệ thống vẽ biểu đồ band theo thời gian kèm khoảng tin cậy và đường mục tiêu ✅ [apps/web/src/features/history/components/trend-chart.tsx:16-41].
4. Hệ thống liệt kê các lượt, lượt đầu mang nhãn Mới nhất ✅ [apps/web/src/features/history/components/attempt-list.tsx:14-27].
5. Học viên chọn chế độ; biểu đồ và danh sách chỉ còn lượt chế độ đó ✅ [apps/web/src/features/__tests__/slice-b.test.tsx:238-243].

**f. Luồng thay thế / ngoại lệ:**
- 3a. Bộ lọc không có lượt: "Chưa có bài nào cho bộ lọc này." (E-002) ✅ [apps/web/src/features/__tests__/slice-b.test.tsx:248-257].
- 3b. Danh sách gốc rỗng: thêm thẻ "Chưa có lịch sử làm bài" và nút Thi thử ngay (E-003) ✅ [apps/web/src/features/history/history-screen.tsx:62-74].
- 4a. Lượt được sắp theo thứ tự mảng, không sắp theo ngày 🔵 [apps/web/src/features/history/components/attempt-list.tsx:14].

**g. Quy tắc & yêu cầu liên quan:** FR-progress-history-017..022; BR-progress-history-005, 006, 007, 008, 009, 016. Màn: Lịch sử (S19). Lỗi: E-progress-history-002, 003.

**h. Câu hỏi mở:** OQ-1, OQ-3, OQ-8, OQ-9, OQ-12, OQ-14, OQ-15
