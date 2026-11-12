---
type: reverse-usecase
feature: scoring-results
slug: resend-submission
status: draft
updated: 2026-11-11
---

# UC: Gửi lại bài khi nộp lỗi hoặc thiếu ghi âm (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên cứu bài của mình khi mạng lỗi lúc nộp hoặc khi một số ghi âm chưa lên được, mà không mất câu trả lời và không tốn lượt thử lại. 🟡 [S19: apps/web/src/features/scoring/use-scoring-job.ts:57-63]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên | S19: apps/web/src/features/scoring/use-scoring-job.ts:129 | ✅ |
| Tiền điều kiện | Đang ở màn chấm với trạng thái "Chưa tải lên đủ câu trả lời" hoặc "Chưa gửi được bài thi" | S20: apps/web/src/features/scoring/scoring-screen.tsx:156-198 | ✅ |

**c. Trigger.** Học viên bấm "Gửi lại", hoặc "Bỏ qua câu bị lỗi và nộp bài", hoặc "Vẫn nộp bài". ✅ [S20: apps/web/src/features/scoring/scoring-screen.tsx:162, apps/web/src/features/scoring/scoring-screen.tsx:195]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Nút chuyển sang "Đang gửi…" và bị vô hiệu | FR-scoring-results-038 | S20: apps/web/src/features/scoring/scoring-screen.tsx:162 | ✅ |
| 2 | Hệ thống thử tải lại các ghi âm còn trên thiết bị (nếu bấm "Gửi lại") | FR-scoring-results-032 | S19: apps/web/src/features/scoring/use-scoring-job.ts:286-291 | ✅ |
| 3 | Nộp bài; thành công → vào trạng thái chờ chấm | FR-scoring-results-038 | S19: apps/web/src/features/scoring/use-scoring-job.ts:292-317 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Vẫn còn ghi âm chưa lên | Hiện "Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại." | E-scoring-results-034 | S19: apps/web/src/features/scoring/use-scoring-job.ts:286-290 | ✅ |
| Nộp vẫn lỗi | Hiện "Vẫn chưa gửi được bài. Kiểm tra kết nối mạng rồi thử lại." | E-scoring-results-035 | S19: apps/web/src/features/scoring/use-scoring-job.ts:318-321 | ✅ |
| Máy chủ báo bài đã nộp từ trước | Hỏi trạng thái. Chưa có bản ghi chấm → yêu cầu chấm (đường cứu, không tốn lượt). Đã `failed` → hiện màn lỗi chấm, KHÔNG tự thử lại. Trạng thái khác → tiếp tục chờ | E-scoring-results-010 | S19: apps/web/src/features/scoring/use-scoring-job.ts:294-314; S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:356-392 | ✅ |
| Bài đã bỏ hoặc lỗi 400 khác | Hiện lỗi gửi chung, không tự chấm | E-scoring-results-011 | S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:393 | ✅ |
| Không biết ghi âm nào thiếu (bản lưu thiết bị không đọc được) | Có thêm nút "Vẫn nộp bài"; khi biết số câu lỗi thì nút là "Bỏ qua câu bị lỗi và nộp bài" (nộp không kiểm tra ghi âm) | E-scoring-results-033 | S20: apps/web/src/features/scoring/scoring-screen.tsx:195; S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:148-190 | ✅ |
| Bài chỉ lưu cục bộ (không có bài thi trên máy chủ) | Không có nút gửi lại; hiện "Chưa gửi được bài thi lên máy chủ" | E-scoring-results-040 | S20: apps/web/src/features/scoring/scoring-screen.tsx:99-115 | ✅ |

**f. Hậu điều kiện.** Bài được nộp (nếu thành công), có bản ghi chấm `queued`, hoặc học viên thấy màn lỗi chấm với số lượt còn lại. Các câu bị bỏ qua có thể không được chấm. ✅ [S19: apps/web/src/features/scoring/use-scoring-job.ts:315-317]

**g. Quy tắc liên quan.** BR-scoring-results-009 (đường cứu không tốn hạn mức), BR-scoring-results-007 (1 lần thử lại/bài; nộp lại không tự tiêu lượt này). Nộp bỏ qua câu lỗi nghĩa là kết quả chỉ dựa trên các câu đã lên (OQ-14). ✅

**h. Nguồn và câu hỏi mở.** Nguồn S19, S20, S21. OQ-6 (nhánh không chấm được), OQ-13 (thông điệp lỗi nộp vượt trần). 🟡
