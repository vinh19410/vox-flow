---
type: reverse-usecase
feature: scoring-results
slug: request-scoring-unscored
status: draft
updated: 2026-11-11
---

# UC: Yêu cầu chấm bài đã nộp nhưng chưa có điểm (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên có một bài đã nộp nhưng hệ thống chưa tạo bản ghi chấm (bước xếp hàng khi nộp từng lỗi, hoặc bài có trước khi chuyển sang chấm mọi chế độ) muốn lấy điểm mà không mất lượt thử lại. 🟡 [S1: packages/api/src/routers/scoring.ts:88-92]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên (chủ bài thi) | S1: packages/api/src/routers/scoring.ts:22-31 | ✅ |
| Tiền điều kiện | Bài ở trạng thái đã nộp; chưa có bản ghi chấm | S1: packages/api/src/routers/scoring.ts:87-98; S22: apps/web/src/features/results/results-screen.tsx:200 | ✅ |

**c. Trigger.** Học viên mở trang kết quả của bài và bấm "Chấm điểm ngay". ✅ [S22: apps/web/src/features/results/results-screen.tsx:200-220]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Trang kết quả hiện "Bài thi chưa được chấm điểm" / "Bài thi của bạn đã được lưu đầy đủ. Bạn có thể yêu cầu chấm điểm AI ngay bây giờ." | FR-scoring-results-043 | S22: apps/web/src/features/results/results-screen.tsx:200-208 | ✅ |
| 2 | Học viên bấm "Chấm điểm ngay"; nút đổi thành "Đang gửi yêu cầu…" | FR-scoring-results-043 | S22: apps/web/src/features/results/results-screen.tsx:209 | ✅ |
| 3 | Hệ thống tạo bản ghi chấm `queued` (không trừ lượt, không ghi nhật ký) và xếp hàng sau 10 giây | FR-scoring-results-009 | S1: packages/api/src/routers/scoring.ts:99-103, packages/api/src/routers/scoring.ts:167-169 | ✅ |
| 4 | Màn chuyển sang màn chấm để theo dõi tiến trình | FR-scoring-results-043 | S22: apps/web/src/features/results/results-screen.tsx:93-96 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Bài chưa nộp (đang làm hoặc đã bỏ) | Trang kết quả KHÔNG hiện nút này mà hiện thẻ trung tính "Tính năng chấm điểm AI sắp ra mắt" | E-scoring-results-003 | S22: apps/web/src/features/results/results-screen.tsx:199-200; S25: apps/web/src/features/results/__tests__/scored-results.test.tsx:187 | ✅ |
| Máy chủ từ chối (bài chưa nộp, hoặc lỗi mạng) | Hiện "Chưa gửi được yêu cầu chấm lại. Vui lòng thử lại sau ít phút." | E-scoring-results-003, E-scoring-results-039 | S22: apps/web/src/features/results/results-screen.tsx:105 | ✅ |
| Hai yêu cầu đồng thời | Ghi có điều kiện, chỉ một bản ghi được tạo và xếp hàng | — | S1: packages/api/src/routers/scoring.ts:85, packages/api/src/routers/scoring.ts:102 | ✅ |
| Hàng đợi lỗi | Bản ghi giữ `queued`; bộ quét xếp lại | — | S7: packages/api/src/scoring/queue.ts:25-47 | ✅ |

**f. Hậu điều kiện.** Có bản ghi chấm `queued` cho bài, `manualRetries` = 0, không có dòng nhật ký thử lại. ✅ [S17: packages/api/src/routers/scoring.test.ts:177-195]

**g. Quy tắc liên quan.** BR-scoring-results-009 (đường cứu không tính hạn mức), BR-scoring-results-022 (chỉ bài đã nộp thấy nút). Lý do không tính hạn mức: suy từ comment, nhãn 🟡 (OQ-2). Chữ "Chấm điểm ngay" xuất hiện kể cả khi cờ tính năng tắt vì nhánh này chạy trước kiểm cờ (FR-048).

**h. Nguồn và câu hỏi mở.** Nguồn S1, S17, S22, S25. OQ-2, OQ-7. 🟡
