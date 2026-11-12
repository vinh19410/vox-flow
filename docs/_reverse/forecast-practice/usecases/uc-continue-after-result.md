---
type: reverse-usecase
feature: forecast-practice
slug: continue-after-result
status: draft
updated: 2026-11-11
---

# UC: Tiếp tục luyện sau khi xem kết quả một câu (reverse, CHƯA duyệt)

**a. Mục tiêu.** Sau khi xem kết quả bài luyện một câu, học viên luyện câu kế tiếp của chủ đề hoặc quay lại chủ đề (mục tiêu suy luận từ hành vi màn). 🟡 [S19: apps/web/src/features/results/results-screen.tsx:262-292, :344-361] · luồng này có kích hoạt được ở production không 🟡

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên đã đăng nhập | S13: apps/web/src/routes/_proto/app/route.tsx:6-9 | ✅ |
| Tiền điều kiện | Có "phiên luyện cuối" của một câu, mã bài khớp bài đang xem. Không có code đặt phiên này | S19: apps/web/src/features/results/results-screen.tsx:262-268 · negative-search N3 | 🟡 |

**c. Trigger.** Mở trang kết quả của bài luyện từng câu. 🟡 [S19: apps/web/src/features/results/results-screen.tsx:262-268]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Hiện nút "Luyện câu kế tiếp trong chủ đề" nếu còn câu kế không phải thẻ gợi ý | FR-forecast-practice-027 | S19: apps/web/src/features/results/results-screen.tsx:272-275, :344-348 | ✅ |
| 2 | Bấm nút: tạo phiên một câu kế, xóa phiên cuối, sang phòng thi | FR-forecast-practice-027 | S10: apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx:390-431 | ✅ |
| 3 | Hoặc bấm "Quay lại chủ đề": đặt mã chủ đề cần mở lại và về màn forecast | FR-forecast-practice-026 | S19: apps/web/src/features/results/results-screen.tsx:349-361 | ✅ |
| 4 | Màn forecast chuyển đúng tab Part, mở chi tiết chủ đề, xóa mã cần mở lại | FR-forecast-practice-026 | S6: apps/web/src/features/forecast/forecast-screen.tsx:40-49, S10: apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx:462-472 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Xem bài khác (lịch sử) | Không hiện hai nút | — | S10: apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx:433-460 | ✅ |
| Không còn câu kế | Ẩn nút "câu kế tiếp", vẫn có "Quay lại chủ đề" | — | S19: apps/web/src/features/results/results-screen.tsx:272-275 | ✅ |
| Mã mở lại không khớp chủ đề | Không mở gì, vẫn xóa mã | — | S6: apps/web/src/features/forecast/forecast-screen.tsx:41-48 | ✅ |
| Production | Phiên cuối không được đặt nên hai nút không hiện | — | negative-search N3 | 🟡 |

**f. Hậu điều kiện.** Phiên luyện mới được đặt (câu kế) hoặc màn forecast mở chi tiết chủ đề; phiên cuối bị xóa. ✅ [S19: apps/web/src/features/results/results-screen.tsx:292]

**g. Quy tắc liên quan.** BR-forecast-practice-037, 038. 🟡

**h. Nguồn và câu hỏi mở.** S6, S10, S19. OQ-10. 🟡
