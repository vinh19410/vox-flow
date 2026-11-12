---
type: reverse-usecase
feature: forecast-practice
slug: view-topic-detail-and-save
status: draft
updated: 2026-11-11
---

# UC: Xem chi tiết chủ đề và lưu vào danh sách ôn (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên đọc đủ các câu của một chủ đề và lưu chủ đề để ôn sau (mục tiêu suy luận từ hành vi màn). 🟡 [S9: apps/web/src/features/forecast/components/topic-detail-modal.tsx:34-131]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên đã đăng nhập, đang ở màn forecast | S13: apps/web/src/routes/_proto/app/route.tsx:6-9 | ✅ |
| Tiền điều kiện | Danh sách chủ đề đã tải | S6: apps/web/src/features/forecast/forecast-screen.tsx:227 | ✅ |

**c. Trigger.** Học viên bấm một thẻ chủ đề hoặc bấm "Bốc ngẫu nhiên đề hot". ✅ [S9: apps/web/src/features/forecast/components/topic-card.tsx:19; S6: apps/web/src/features/forecast/forecast-screen.tsx:128-133]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Mở chi tiết: nhãn, tiêu đề, số thí sinh báo gặp, "Gặp gần nhất", thẻ gợi ý Part 2, danh sách câu, ghi chú | FR-forecast-practice-015 | S9: apps/web/src/features/forecast/components/topic-detail-modal.tsx:34-123 | ✅ |
| 1b | Nếu bốc ngẫu nhiên: chọn trong nhóm "Hay gặp" chưa luyện, rỗng thì trong mọi chủ đề | FR-forecast-practice-020 | S6: apps/web/src/features/forecast/forecast-screen.tsx:128-133 | ✅ |
| 2 | Học viên bấm "Lưu vào danh sách ôn" (hoặc biểu tượng lưu trên thẻ) | FR-forecast-practice-016 | S9: apps/web/src/features/forecast/components/topic-detail-modal.tsx:124-127 | ✅ |
| 3 | Nút đổi thành "Đã lưu", toast "Đã lưu vào danh sách ôn"; bấm lại thì bỏ lưu và toast "Đã bỏ khỏi danh sách ôn" | FR-forecast-practice-016 | S6: apps/web/src/features/forecast/forecast-screen.tsx:122-126 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Bốc ngẫu nhiên khi chưa có chủ đề hoặc đang tải | Nút bị vô hiệu | E-forecast-practice-009 | S6: apps/web/src/features/forecast/forecast-screen.tsx:141 | ✅ |
| Tải lại trang | Danh sách lưu mất | — | S14: apps/web/src/features/app-state/store.tsx:94-106 | ✅ |
| Chủ đề đã luyện (có band) | Hiện "Lần luyện trước: band x.x" và nút "Luyện lại"; nhưng không có nơi ghi band | — | S9: apps/web/src/features/forecast/components/topic-detail-modal.tsx:53 | 🟡 |
| Dòng "câu hỏi nối tiếp" | Có vẻ không bao giờ hiện với dữ liệu máy chủ (negative-search N7, OQ-15) | — | S9: apps/web/src/features/forecast/components/topic-detail-modal.tsx:108-111 | 🟡 |

**f. Hậu điều kiện.** Danh sách lưu thay đổi trong bộ nhớ phiên; không đổi dữ liệu máy chủ. ✅ [S6: apps/web/src/features/forecast/forecast-screen.tsx:124]

**g. Quy tắc liên quan.** BR-forecast-practice-022, 026, 036, 039. Danh sách ôn không theo tài khoản (OQ-3). 🟡

**h. Nguồn và câu hỏi mở.** S6, S9, S12 (slice-b.test.tsx:228-235), S14. OQ-3, OQ-7, OQ-15. 🟡
