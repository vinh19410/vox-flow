---
type: reverse-usecase
feature: forecast-practice
slug: practice-topic-or-question
status: draft
updated: 2026-11-11
---

# UC: Luyện cả chủ đề hoặc từng câu (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên luyện nói trên đúng chủ đề (hoặc một câu) đã chọn, nộp bài để được chấm (mục tiêu suy luận từ hành vi màn). 🟡 [S6: apps/web/src/features/forecast/forecast-screen.tsx:100-121; S18: apps/web/src/features/exam/exam-screen.tsx:131-139]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên đã đăng nhập, đã onboarding | S13: apps/web/src/routes/_proto/app/route.tsx:6-9 | ✅ |
| Tiền điều kiện | Chủ đề ở trạng thái đã đăng; cổng pilot mở hoặc email được phép (để lượt thi lưu trên máy chủ) | S17: packages/api/src/routers/attempt.ts:43-56, :61-70 | ✅ |

**c. Trigger.** Bấm "Luyện chủ đề này", "Luyện ngay" (thẻ gợi ý), "Luyện câu này" hoặc "Luyện lại" (từng câu). ✅ [S9: apps/web/src/features/forecast/components/topic-detail-modal.tsx:93-104, :128-130]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Hệ thống tạo phiên luyện: cả chủ đề (toàn bộ câu) hoặc một câu (bỏ thẻ gợi ý, lưu danh sách câu cả chủ đề) và chuyển sang phòng thi | FR-forecast-practice-021, FR-forecast-practice-022 | S6: apps/web/src/features/forecast/forecast-screen.tsx:100-121, S10: apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx:138-313 | ✅ |
| 2 | Phòng thi mở lượt thi gắn chủ đề (và khóa câu) với chế độ Part 1, Part 3 hoặc Part 2 | FR-forecast-practice-023 | S18: apps/web/src/features/exam/use-exam-session.ts:83-100, S10: apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx:315-368 | ✅ |
| 3 | Máy chủ kiểm tra chủ đề đã đăng và khóa câu hợp lệ rồi ghi lượt thi | FR-forecast-practice-023, FR-forecast-practice-031 | S17: packages/api/src/routers/attempt.ts:61-112 | ✅ |
| 4 | Học viên ghi âm các câu và nộp bài | FR-forecast-practice-024 | S18: apps/web/src/features/exam/exam-screen.tsx:131-139 | ✅ |
| 5 | Chuyển sang màn chấm với bài chưa nộp; màn chấm tự nộp và xóa phiên luyện | FR-forecast-practice-024 | S19: apps/web/src/features/scoring/scoring-screen.tsx:31-36 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Cổng pilot đóng | FORBIDDEN "Mock exam is currently restricted to pilot candidates."; phòng thi tiếp tục không có lượt trên máy chủ | E-forecast-practice-010 | S17: packages/api/src/routers/attempt.ts:53-56; S18: apps/web/src/features/exam/use-exam-session.ts:170-174 | ✅ |
| Chủ đề không có/chưa đăng | BAD_REQUEST "Unknown or unpublished forecast topic" | E-forecast-practice-011 | S17: packages/api/src/routers/attempt.ts:71-76 | ✅ |
| Khóa câu không thuộc chủ đề | BAD_REQUEST "Invalid questionKey for topic" | E-forecast-practice-012 | S17: packages/api/src/routers/attempt.ts:79-84 | ✅ |
| Sai định dạng tham số | BAD_REQUEST với các câu "Invalid topicId format", "Invalid questionKey format", "questionKey requires topicId" | E-forecast-practice-013 | S17: packages/api/src/routers/attempt.ts:26-35 | ✅ |
| Thoát phòng thi giữa chừng | Xóa phiên luyện và về màn forecast | — | S18: apps/web/src/features/exam/exam-screen.tsx:179-184 | ✅ |
| Luyện cả chủ đề Part 2 và 3 | Chế độ lượt thi là Part 2 dù có câu Part 3 | — | S18: apps/web/src/features/exam/use-exam-session.ts:83-97 | 🟡 |
| Hạn mức, gói trả phí | Không có kiểm tra trong feature | — | negative-search N6 | 🟡 |

**f. Hậu điều kiện.** Một lượt thi "in_progress" gắn chủ đề (và khóa câu) được ghi trên máy chủ; phiên luyện được xóa khi sang màn chấm. Tiến độ trên màn forecast không được cập nhật. ✅ [S17: packages/api/src/routers/attempt.ts:94-112; S19: apps/web/src/features/scoring/scoring-screen.tsx:31-36] · cập nhật tiến độ 🟡

**g. Quy tắc liên quan.** BR-forecast-practice-001, 028..035. Kết quả chấm do `scoring-results`. 🟡

**h. Nguồn và câu hỏi mở.** S6, S10, S11, S17, S18, S19. OQ-2, OQ-8, OQ-11. 🟡
