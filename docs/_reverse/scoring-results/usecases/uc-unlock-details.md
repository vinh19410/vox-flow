---
type: reverse-usecase
feature: scoring-results
slug: unlock-details
status: draft
updated: 2026-11-11
---

# UC: Mở khóa chi tiết tiêu chí qua soft paywall (reverse, CHƯA duyệt, độ tin cậy thấp)

> CẢNH BÁO: use case này chỉ có thể xảy ra trên đường dữ liệu prototype (bài xem thử "latest", bài cục bộ không có điểm thật). Với kết quả chấm thật, chi tiết luôn mở trong Beta nên học viên không bao giờ gặp paywall. Không dùng làm yêu cầu chắc chắn. 🟡

**a. Mục tiêu.** Học viên chưa có gói muốn xem lý do từng band, trích dẫn và cách sửa bằng cách mở hộp thoại thanh toán. 🟡 [S24: apps/web/src/features/results/components/soft-paywall.tsx:15-16]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên chưa có gói | S22: apps/web/src/features/results/results-screen.tsx:259 | 🟡 |
| Tiền điều kiện | Trang kết quả hiển thị không phải điểm thật (`pro` = false khi không có điểm thật và `s.plan` rỗng) | S22: apps/web/src/features/results/results-screen.tsx:259 | ✅ |

**c. Trigger.** Học viên bấm một ô tiêu chí đang khóa, "Mở khóa chi tiết →", hoặc "Mở khóa từ 49.000đ". ✅ [S24: apps/web/src/features/results/components/criteria-grid.tsx:43; S24: apps/web/src/features/results/components/soft-paywall.tsx:17-19]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Lưới tiêu chí làm mờ band và hiện biểu tượng khóa; vùng chi tiết bị che mờ | FR-scoring-results-049 | S24: apps/web/src/features/results/components/criteria-grid.tsx:30-43; S22: apps/web/src/features/results/results-screen.tsx:399 | ✅ |
| 2 | Thẻ phủ "Xem vì sao bạn được từng band" kèm "Band 4 tiêu chí, lý do, trích dẫn câu nói và cách sửa — cho bài này và mọi bài sau." | FR-scoring-results-049 | S24: apps/web/src/features/results/components/soft-paywall.tsx:15-16 | ✅ |
| 3 | Học viên bấm "Mở khóa từ 49.000đ" (hoặc chọn tiêu chí) → hộp thoại thanh toán mở | FR-scoring-results-049 | S22: apps/web/src/features/results/results-screen.tsx:305-309; S24: apps/web/src/features/results/components/soft-paywall.tsx:17 | ✅ |
| 4 | Dòng chú "Thanh toán QR · kích hoạt tự động trong vài giây" | FR-scoring-results-049 | S24: apps/web/src/features/results/components/soft-paywall.tsx:20 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Kết quả chấm thật | Không bao giờ che; `pro` luôn true | — | S22: apps/web/src/features/results/results-screen.tsx:258-259; S25: apps/web/src/features/results/__tests__/scored-results.test.tsx:95-139 | ✅ |
| Tab "Xem lại từng câu" khi chưa có gói | Có nút "Mở khóa đánh dấu lỗi" (chỉ khi có đánh dấu lỗi, tức dữ liệu prototype) | — | S24: apps/web/src/features/results/components/review-list.tsx:49-63 | ✅ |
| Hoàn tất thanh toán | Thuộc feature billing; không có trong phạm vi này | — | S24: apps/web/src/features/results/components/soft-paywall.tsx:17 | 🟡 |

**f. Hậu điều kiện.** Hộp thoại thanh toán mở. Trạng thái gói sau khi thanh toán thuộc billing. 🟡

**g. Quy tắc liên quan.** BR-scoring-results-024 và FR-scoring-results-049, FR-scoring-results-051. Giá "49.000đ", câu "kích hoạt tự động trong vài giây" và kế hoạch che kết quả thật sau Beta chưa có bằng chứng backend (OQ-4).

**h. Nguồn và câu hỏi mở.** Nguồn S22, S24, S25. OQ-4, OQ-5. 🟡
