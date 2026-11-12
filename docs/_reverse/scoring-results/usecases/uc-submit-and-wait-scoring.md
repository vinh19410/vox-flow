---
type: reverse-usecase
feature: scoring-results
slug: submit-and-wait-scoring
status: draft
updated: 2026-11-11
---

# UC: Nộp bài và chờ chấm (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên nộp bài thi vừa làm và nhận kết quả chấm AI mà không phải làm thêm gì. 🟡 [S19: apps/web/src/features/scoring/use-scoring-job.ts:124-129]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên (chủ bài thi) | S1: packages/api/src/routers/scoring.ts:22-31 | ✅ |
| Tiền điều kiện | Đã đăng nhập và hoàn tất onboarding; bài thi ở trạng thái đang làm, có ít nhất một câu trả lời; các ghi âm đã (hoặc sẽ) lên máy chủ | S26: apps/web/src/routes/_proto/scoring.tsx:6; S16: packages/api/src/routers/attempt.ts:229-268 | ✅ |

**c. Trigger.** Học viên kết thúc bài thi và được chuyển sang màn chấm. ✅ [S20: apps/web/src/features/scoring/scoring-screen.tsx:29-48]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Màn chấm hiện "Đang gửi bài thi…" và chờ mọi ghi âm còn trên thiết bị lên máy chủ | FR-scoring-results-032 | S19: apps/web/src/features/scoring/use-scoring-job.ts:159-172 | ✅ |
| 2 | Hệ thống nộp bài: đánh dấu đã nộp, tạo bản ghi chấm `queued`, xếp hàng sau 10 giây | FR-scoring-results-001, FR-scoring-results-003 | S16: packages/api/src/routers/attempt.ts:280-296 | ✅ |
| 3 | Màn chuyển sang "Đang chấm bài của bạn": "Bài thi đang chờ đến lượt chấm." rồi "AI đang phân tích phần nói của bạn." kèm ba bước tĩnh | FR-scoring-results-034, FR-scoring-results-040 | S20: apps/web/src/features/scoring/scoring-screen.tsx:265-271 | ✅ |
| 4 | Hệ thống nền chấm bài (worker, F2) trong khi màn hỏi trạng thái giãn dần | FR-scoring-results-034 | S19: apps/web/src/features/scoring/use-scoring-job.ts:210-261 | ✅ |
| 5 | Khi chấm xong, màn tự chuyển sang trang kết quả (thay thế mục lịch sử) | FR-scoring-results-035 | S20: apps/web/src/features/scoring/scoring-screen.tsx:46-49 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Còn ghi âm chưa lên hoặc không đọc được bản lưu | Không nộp; hiện "Chưa tải lên đủ câu trả lời" → xem UC gửi lại | E-scoring-results-033 | S19: apps/web/src/features/scoring/use-scoring-job.ts:159-164 | ✅ |
| Nộp lỗi mà máy chủ chưa có bản ghi | Hiện "Chưa gửi được bài thi" → xem UC gửi lại | E-scoring-results-032 | S19: apps/web/src/features/scoring/use-scoring-job.ts:179-196 | ✅ |
| Nộp lỗi nhưng thực ra đã nộp (mất phản hồi) | Hỏi trạng thái và tiếp tục chờ, không báo lỗi | E-scoring-results-010 | S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:409 | ✅ |
| Không có câu trả lời, vượt trần, bài đã bỏ | Máy chủ từ chối; học viên thấy lỗi nộp chung | E-scoring-results-008, E-scoring-results-009, E-scoring-results-011 | S16: packages/api/src/routers/attempt.ts:233-268 | 🟡 |
| Chờ từ 10 phút | "Đang chậm hơn bình thường" → UC kiểm tra tiến trình | E-scoring-results-036 | S19: apps/web/src/features/scoring/use-scoring-job.ts:248-252 | ✅ |
| 3 lần hỏi lỗi liên tiếp | "Mất kết nối khi kiểm tra kết quả" → UC kiểm tra tiến trình | E-scoring-results-037 | S19: apps/web/src/features/scoring/use-scoring-job.ts:243-246 | ✅ |
| Chấm thất bại | "Chấm điểm chưa thành công" → UC chấm lại | E-scoring-results-038 | S20: apps/web/src/features/scoring/scoring-screen.tsx:236-262 | ✅ |

**f. Hậu điều kiện.** Bài ở trạng thái đã nộp có bản ghi chấm; khi thành công bản ghi `done` có band tổng và 4 tiêu chí. Học viên đang ở trang kết quả. ✅ [S2: packages/api/src/scoring/score-attempt.ts:478-493]

**g. Quy tắc liên quan.** BR-scoring-results-010 (tối đa 3 lần xử lý), BR-scoring-results-011 (lease 12 phút), BR-scoring-results-025 (mốc chờ ở màn). Không có thông báo chủ động: học viên phải giữ trang hoặc quay lại xem lịch sử (OQ-12). ✅ [S20: apps/web/src/features/scoring/scoring-screen.tsx:300-302]

**h. Nguồn và câu hỏi mở.** Nguồn chính S16, S19, S20, S21. OQ-8 (ba bước tĩnh), OQ-9 (mục tiêu thời gian), OQ-12 (không thông báo), OQ-13 (lỗi nộp vượt trần không có câu riêng), OQ-14 (bài ít câu vẫn được chấm). 🟡
