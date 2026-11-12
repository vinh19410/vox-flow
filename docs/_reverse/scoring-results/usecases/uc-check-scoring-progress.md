---
type: reverse-usecase
feature: scoring-results
slug: check-scoring-progress
status: draft
updated: 2026-11-11
---

# UC: Kiểm tra lại tiến trình khi chấm chậm hoặc mất kết nối (reverse, CHƯA duyệt)

**a. Mục tiêu.** Khi màn chấm tạm ngừng hỏi trạng thái (chậm hoặc mất kết nối), hoặc học viên quay lại từ trang kết quả, học viên tiếp tục theo dõi mà không nộp lại bài. 🟡 [S19: apps/web/src/features/scoring/use-scoring-job.ts:65-67]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên | S19: apps/web/src/features/scoring/use-scoring-job.ts:129 | ✅ |
| Tiền điều kiện | Bài đã nộp, bản ghi chấm đang `queued`/`processing` | S22: apps/web/src/features/results/results-screen.tsx:162 | ✅ |

**c. Trigger.** Một trong ba: (1) màn hiện "Đang chậm hơn bình thường" sau 10 phút; (2) màn hiện "Mất kết nối khi kiểm tra kết quả" sau 3 lần hỏi lỗi liên tiếp; (3) trang kết quả hiện "Bài thi đang được chấm" và học viên bấm "Xem tiến trình chấm". ✅ [S19: apps/web/src/features/scoring/use-scoring-job.ts:243-252; S22: apps/web/src/features/results/results-screen.tsx:162-176]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Học viên bấm "Kiểm tra lại" (chậm) hoặc "Thử lại" (mất kết nối) | FR-scoring-results-035 | S20: apps/web/src/features/scoring/scoring-screen.tsx:208-232 | ✅ |
| 2 | Màn trở lại "Đang chấm bài của bạn" và hỏi trạng thái ngay; chu kỳ hỏi tính lại từ đầu (2,5 giây) | FR-scoring-results-034 | S19: apps/web/src/features/scoring/use-scoring-job.ts:331-335, apps/web/src/features/scoring/use-scoring-job.ts:202-209 | ✅ |
| 3 | Khi chấm xong, chuyển sang trang kết quả | FR-scoring-results-035 | S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:449-456 | ✅ |
| 3b | Từ trang kết quả: "Xem tiến trình chấm" mở lại màn chấm với job đã nộp | FR-scoring-results-043 | S22: apps/web/src/features/results/results-screen.tsx:93-96 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Vẫn chậm | Sau 10 phút nữa lại dừng ở "Đang chậm hơn bình thường" | E-scoring-results-036 | S19: apps/web/src/features/scoring/use-scoring-job.ts:208, apps/web/src/features/scoring/use-scoring-job.ts:248-252 | ✅ |
| Vẫn mất kết nối | Sau 3 lần lỗi nữa lại hiện "Mất kết nối khi kiểm tra kết quả" | E-scoring-results-037 | S19: apps/web/src/features/scoring/use-scoring-job.ts:243-246 | ✅ |
| Rời màn | Dừng hỏi trạng thái; bài vẫn được chấm nền, xem kết quả trong lịch sử | — | S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:198; S20: apps/web/src/features/scoring/scoring-screen.tsx:300-302 | ✅ |
| Quá lâu mà bài vẫn kẹt | Bộ quét đưa bài về hàng đợi hoặc đánh dấu `failed` (đi UC chấm lại) | — | S8: packages/api/src/scoring/requeue.ts:25-61 | ✅ |

**f. Hậu điều kiện.** Không đổi dữ liệu máy chủ (chỉ đọc trạng thái). Màn quay lại chế độ theo dõi. ✅ [S19: apps/web/src/features/scoring/use-scoring-job.ts:331-335]

**g. Quy tắc liên quan.** BR-scoring-results-025 (mốc 10 phút, 3 lỗi, 4 lần chưa chấm). Các mốc này là hằng số giao diện không có lý do đi kèm (OQ-9). Không có thông báo chủ động khi xong (OQ-12). 🟡

**h. Nguồn và câu hỏi mở.** Nguồn S19, S20, S21, S22. OQ-9, OQ-12. 🟡
