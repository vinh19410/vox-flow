---
type: reverse-usecase
feature: scoring-results
slug: review-each-answer
status: draft
updated: 2026-11-11
---

# UC: Xem lại từng câu trả lời (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên đọc lại câu hỏi và nội dung mình đã nói (phiên âm) theo từng câu. 🟡 [S23: apps/web/src/features/results/scored-result.ts:32-46]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên (chủ bài thi) | S1: packages/api/src/routers/scoring.ts:22-31 | ✅ |
| Tiền điều kiện | Trang kết quả của bài đã chấm xong đang mở | S22: apps/web/src/features/results/results-screen.tsx:383-405 | ✅ |

**c. Trigger.** Học viên bấm tab "Xem lại từng câu". ✅ [S22: apps/web/src/features/results/results-screen.tsx:381-394]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Hệ thống liệt kê từng câu trả lời theo thứ tự phần rồi thứ tự câu | FR-scoring-results-029 | S1: packages/api/src/routers/scoring.ts:206-216 | ✅ |
| 2 | Mỗi thẻ hiện nhãn "Part n · Câu m" (m đếm lại trong từng phần), câu hỏi, thời lượng làm tròn giây, toàn văn phiên âm | FR-scoring-results-046 | S23: apps/web/src/features/results/scored-result.ts:33-46 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Phiên âm rỗng | Hiện "(Không nhận diện được lời nói)" | — | S23: apps/web/src/features/results/scored-result.ts:43 | ✅ |
| Không có câu nào | Hiện "Chưa có dữ liệu phân tích từng câu." | — | S24: apps/web/src/features/results/components/review-list.tsx:43-49 | ✅ |
| Kết quả chấm thật | Không có nút phát lại (không có bản ghi âm phát lại) và không có đánh dấu lỗi trên câu | — | S22: apps/web/src/features/results/results-screen.tsx:405; S24: apps/web/src/features/results/components/review-list.tsx:73 | ✅ |
| Bài không tồn tại / của người khác | Xem UC xem band tổng (cùng điều kiện tải) | E-scoring-results-001, E-scoring-results-002 | S22: apps/web/src/features/results/results-screen.tsx:121-140 | ✅ |

**f. Hậu điều kiện.** Không đổi dữ liệu. ✅ [S1: packages/api/src/routers/scoring.ts:179-228]

**g. Quy tắc liên quan.** BR-scoring-results-018 (chuỗi cho câu không có phiên âm). Phát lại ghi âm và đánh dấu lỗi từng cụm từ (ngữ pháp/từ vựng/phát âm) chỉ tồn tại ở đường dữ liệu prototype, không phải hành vi thật (FR-051, OQ-5). 🟡

**h. Nguồn và câu hỏi mở.** Nguồn S1, S22, S23, S24. OQ-5. 🟡
