---
type: reverse-usecase
feature: scoring-results
slug: retry-failed-scoring
status: draft
updated: 2026-11-11
---

# UC: Chấm lại bài chấm lỗi (reverse, CHƯA duyệt)

**a. Mục tiêu.** Khi hệ thống chấm bài không thành công, học viên yêu cầu chấm lại mà không phải thi lại. 🟡 [S20: apps/web/src/features/scoring/scoring-screen.tsx:249-252]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên (chủ bài thi) | S1: packages/api/src/routers/scoring.ts:22-31 | ✅ |
| Tiền điều kiện | Bản ghi chấm của bài ở trạng thái `failed`; bài chưa được thử lại thủ công lần nào; người dùng chưa dùng 3 lượt trong ngày giờ Việt Nam | S1: packages/api/src/routers/scoring.ts:72-74, packages/api/src/routers/scoring.ts:117-123 | ✅ |

**c. Trigger.** Học viên bấm "Chấm lại" ở màn "Chấm điểm chưa thành công" (màn chấm) hoặc ở trang kết quả. ✅ [S20: apps/web/src/features/scoring/scoring-screen.tsx:254; S22: apps/web/src/features/results/results-screen.tsx:178-197]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Màn báo "Hệ thống gặp lỗi khi chấm bài này. Bài thi của bạn vẫn được lưu đầy đủ, bạn có thể chấm lại ngay." và bật nút "Chấm lại" | FR-scoring-results-036 | S20: apps/web/src/features/scoring/scoring-screen.tsx:249-254 | ✅ |
| 2 | Nút đổi thành "Đang gửi yêu cầu…" | FR-scoring-results-037 | S20: apps/web/src/features/scoring/scoring-screen.tsx:254 | ✅ |
| 3 | Hệ thống kiểm chủ sở hữu, kiểm điều kiện, ghi nhật ký, tăng số lần thử lại, đặt bản ghi về `queued` (tries về 0, xóa lỗi) và xếp hàng sau 10 giây — nguyên tử | FR-scoring-results-008, FR-scoring-results-010 | S1: packages/api/src/routers/scoring.ts:104-143, packages/api/src/routers/scoring.ts:167-169 | ✅ |
| 4 | Màn quay về "Đang chấm bài của bạn" và hỏi trạng thái tiếp | FR-scoring-results-037 | S19: apps/web/src/features/scoring/use-scoring-job.ts:269 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Máy chủ báo không còn được thử lại (hết lượt bài) | Nút "Chấm lại" bị vô hiệu; mô tả "Bài thi đã được thử lại tối đa 1 lần. Vui lòng tạo bài luyện tập mới." | E-scoring-results-004, E-scoring-results-038 | S20: apps/web/src/features/scoring/scoring-screen.tsx:239-252; S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:244 | ✅ |
| Hết lượt trong ngày | Nút vô hiệu; mô tả "Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai." | E-scoring-results-005, E-scoring-results-038 | S20: apps/web/src/features/scoring/scoring-screen.tsx:251; S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:260 | ✅ |
| Hết lượt nhưng cờ hiển thị cũ (hai tab / đua) | Máy chủ từ chối; màn giữ trạng thái lỗi và hiện câu thân thiện theo mã: "Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai." hoặc "Bài thi đã hết số lần thử lại cho phép." | E-scoring-results-004, E-scoring-results-005 | S19: apps/web/src/features/scoring/use-scoring-job.ts:73-87, apps/web/src/features/scoring/use-scoring-job.ts:270-274; S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:279-304 | ✅ |
| Lỗi khác (mạng, bài không còn `failed`) | Hiện "Chưa gửi được yêu cầu chấm lại. Vui lòng thử lại sau ít phút." | E-scoring-results-006, E-scoring-results-039 | S19: apps/web/src/features/scoring/use-scoring-job.ts:273; S21: apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:231 | ✅ |
| Thử lại từ trang kết quả | Nút luôn bấm được, không dùng cờ được phép thử lại; mọi lỗi (kể cả hết lượt) hiện câu chung; thành công mở màn chấm | E-scoring-results-039, E-scoring-results-044 | S22: apps/web/src/features/results/results-screen.tsx:93-109, apps/web/src/features/results/results-screen.tsx:178-197 | ✅ |
| Hai yêu cầu đồng thời | Chỉ một thành công (hạn mức không bị vượt) | — | S17: packages/api/src/routers/scoring.test.ts:324-345 | ✅ |

**f. Hậu điều kiện.** Thành công: bản ghi `queued`, tries 0, số lần thử lại thủ công là 1, có một dòng nhật ký thử lại; thất bại do hạn mức: bản ghi giữ nguyên `failed`. ✅ [S17: packages/api/src/routers/scoring.test.ts:250-276, packages/api/src/routers/scoring.test.ts:302-322]

**g. Quy tắc liên quan.** BR-scoring-results-007 (1 lần/bài), BR-scoring-results-008 (3 lần/ngày giờ Việt Nam; 23:59 và 00:01 giờ Việt Nam là hai ngày khác nhau), BR-scoring-results-010, BR-scoring-results-023 (khớp mã lỗi giữa máy chủ và web). ✅ [S17: packages/api/src/routers/scoring.test.ts:347-387]

**h. Nguồn và câu hỏi mở.** Nguồn S1, S17, S19, S20, S22. OQ-2 (lý do và đối tượng áp hạn mức), OQ-7 (màn kết quả không tôn trọng cờ được phép thử lại). 🟡
