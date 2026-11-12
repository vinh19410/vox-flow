---
type: reverse-usecase
feature: forecast-practice
slug: browse-and-filter-topics
status: draft
updated: 2026-11-11
---

# UC: Duyệt, lọc và tìm chủ đề dự đoán (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên xem các chủ đề dự đoán đã đăng của quý và thu hẹp theo Part, nhãn, trạng thái ôn và từ khóa để chọn chủ đề cần luyện (mục tiêu suy luận từ hành vi màn). 🟡 [S6:33, S6:68-96]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên đã đăng nhập và đã onboarding | S13: apps/web/src/routes/_proto/app/route.tsx:6-9 | ✅ |
| Tiền điều kiện | Có ít nhất một chủ đề đã đăng của quý 2026-Q3 (nếu không thì thấy trạng thái rỗng) | S1: packages/api/src/routers/forecast.ts:38-54 | ✅ |

**c. Trigger.** Học viên mở mục "Đề forecast" trong điều hướng hoặc nút "Luyện đề forecast" ở trang chính. ✅ [S22: apps/web/src/layouts/nav-items.ts:39-46; apps/web/src/features/dashboard/components/today-tasks.tsx:26-28]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Màn tải danh sách chủ đề đã đăng của quý cố định, hiện khung chờ | FR-forecast-practice-001, FR-forecast-practice-002, FR-forecast-practice-013 | S6: apps/web/src/features/forecast/forecast-screen.tsx:33, :196-211 | ✅ |
| 2 | Hiện lưới thẻ của tab Part 1, sắp theo số thí sinh báo giảm dần | FR-forecast-practice-009, FR-forecast-practice-012, FR-forecast-practice-014 | S6: apps/web/src/features/forecast/forecast-screen.tsx:96, :227-240 | ✅ |
| 3 | Học viên đổi sang tab "Part 2 & 3" (số lượng mỗi tab cố định theo toàn bộ chủ đề) | FR-forecast-practice-009 | S12: apps/web/src/features/__tests__/slice-b.test.tsx:151-156 | ✅ |
| 4 | Học viên chọn bộ lọc "Hay gặp", "Mới trong quý", "Chưa luyện" hoặc "Đã lưu" | FR-forecast-practice-010 | S6: apps/web/src/features/forecast/forecast-screen.tsx:68-82 | ✅ |
| 5 | Học viên gõ từ khóa; lưới lọc theo tiêu đề, nhóm, câu hỏi, điểm gợi ý, phần kết | FR-forecast-practice-011 | S6: apps/web/src/features/forecast/forecast-screen.tsx:83-94 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Tải lỗi | Hiện "Không thể tải danh sách đề forecast" kèm nút "Thử lại" | E-forecast-practice-005 | S6: apps/web/src/features/forecast/forecast-screen.tsx:213-224 | ✅ |
| Không khớp bộ lọc | "Không có chủ đề nào khớp bộ lọc." kèm "Xem tất cả chủ đề" | E-forecast-practice-006 | S6: apps/web/src/features/forecast/forecast-screen.tsx:242-266 | ✅ |
| Không khớp từ khóa | `Không tìm thấy chủ đề nào cho "<từ khóa>". Thử tìm kiếm với từ khóa khác.` | E-forecast-practice-007 | S6: apps/web/src/features/forecast/forecast-screen.tsx:253-257 | ✅ |
| "Đã lưu" rỗng | "Chưa có chủ đề nào được lưu" | E-forecast-practice-008 | S6: apps/web/src/features/forecast/forecast-screen.tsx:246-255 | ✅ |
| Quý chưa có chủ đề | Dùng chung câu rỗng, nút bốc ngẫu nhiên vô hiệu | E-forecast-practice-009 | S6: apps/web/src/features/forecast/forecast-screen.tsx:141, :242 | 🟡 |
| Bộ lọc "Chưa luyện" | Khớp mọi chủ đề vì không có nơi ghi tiến độ | — | S14: apps/web/src/features/app-state/initial-state.ts:16 | 🟡 |
| Bộ lọc "Mới trong quý" ở tab Part 1 | Luôn rỗng vì Part 1 không có nhãn Mới | E-forecast-practice-006 | S7: apps/web/src/features/forecast/builders.ts:57 | ✅ |

**f. Hậu điều kiện.** Không đổi dữ liệu máy chủ; bộ lọc và từ khóa chỉ nằm trên màn. ✅ [S6: apps/web/src/features/forecast/forecast-screen.tsx:22-25]

**g. Quy tắc liên quan.** BR-forecast-practice-001, 002, 003, 019, 020, 024, 039. Mốc 200 cho "Hay gặp" và nhãn "Gặp Gần đây" cố định chưa rõ ý (OQ-5, OQ-7). 🟡

**h. Nguồn và câu hỏi mở.** S1, S6, S7, S12, S14. OQ-2, OQ-5, OQ-6, OQ-7, OQ-9, OQ-13, OQ-14. 🟡
