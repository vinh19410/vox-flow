# UC: Học viên gửi báo lỗi chấm cho một bài thi

**Nhãn UC:** ✅ hành vi (S1, S2, S4, S6). Điều kiện bật: cờ `SCORE_DISPUTE_ENABLED` (mặc định tắt 🟡).

## a. Mô tả
Học viên đã nộp bài thi báo rằng điểm của một tiêu chí (hoặc band tổng) chưa đúng, nêu band mong đợi và lý do, và tùy chọn đồng ý chia sẻ ghi âm. Hệ thống tạo báo lỗi "đang mở" với hạn phản hồi 72 giờ ✅ [S1: packages/api/src/routers/dispute.ts:80-119].

## b. Actor
- Chính: Học viên (chủ bài thi, đã đăng nhập) ✅ [S1: packages/api/src/routers/dispute.ts:48-53].

## c. Tiền điều kiện
1. Tính năng đang bật (cờ bằng chuỗi `true`) ✅ [S1: packages/api/src/routers/dispute.ts:27]. 🟡 Chưa biết đang bật ở môi trường thật (OQ-1).
2. Học viên đã đăng nhập ✅ [S16: packages/api/src/index.ts:15-22].
3. Bài thi thuộc học viên và ở trạng thái đã nộp ✅ [S1: packages/api/src/routers/dispute.ts:48-60].
4. Bài thi chưa có báo lỗi đang mở/đang xem xét ✅ [S1: packages/api/src/routers/dispute.ts:62-78].
5. Học viên thấy nút "Báo lỗi chấm" (cần: máy chủ báo bật, chưa có báo lỗi, mã bài thi nằm trong danh sách cục bộ) ✅ [S5: apps/web/src/features/results/results-screen.tsx:339]; 🔵 với bài thật nút có thể không hiện (OQ-2).

## d. Luồng chính
1. Học viên bấm "Báo lỗi chấm" trên trang kết quả → form mở, mặc định Ngữ pháp, band 6.5, đồng ý chưa chọn ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:27-30].
2. Chọn tiêu chí: Band tổng / Độ trôi chảy & mạch lạc / Vốn từ vựng / Ngữ pháp / Phát âm ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:11-17,85-100].
3. Chọn band mong đợi trong 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0 ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:102-113].
4. (Tùy chọn) Nhập lý do tối đa 1000 ký tự, có bộ đếm ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:115-128].
5. (Tùy chọn) Đánh dấu đồng ý chia sẻ (xem `uc-consent-share-audio`) ✅.
6. Bấm "Gửi báo lỗi" → nút đổi thành "Đang gửi..." và bị vô hiệu ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:143-155].
7. Hệ thống kiểm tra cờ, bài thi, chủ sở hữu, đã nộp, trùng; tạo báo lỗi `open` với hạn = bây giờ + 72 giờ ✅ [S1: packages/api/src/routers/dispute.ts:27-99].
8. Giao diện hiện thông báo "Đã gửi báo lỗi. Chúng tôi cam kết phản hồi trong vòng 72 giờ.", tải lại trạng thái, đóng form; trang hiện badge "Báo lỗi đang xử lý" ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:56-58; S5: apps/web/src/features/results/results-screen.tsx:427-432; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:113-155].

## e. Luồng thay thế / ngoại lệ
- 7a. Cờ tắt → E-score-dispute-001 "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt" ✅.
- 7b. Chưa đăng nhập → E-002 "Authentication required" ✅.
- 7c. Bài thi không tồn tại → E-003 "Không tìm thấy bài thi" ✅.
- 7d. Bài thi của người khác → E-004 "Bạn không có quyền báo lỗi cho bài thi này" ✅.
- 7e. Bài thi chưa nộp → E-005 "Chỉ bài thi đã nộp mới có thể gửi báo lỗi" ✅.
- 7f. Đã có báo lỗi hoạt động (kể cả gửi đồng thời) → E-006/E-007 "Bài thi này đã có báo lỗi đang được xử lý" ✅.
- 7g. Không lưu được → E-008 "Không thể lưu báo lỗi" ✅.
- 7h. Đầu vào sai / lỗi khác → E-010 / E-009, wording ⚠️ chưa resolve 🟡.
- 8a. Mọi lỗi: banner đỏ trong form + toast cùng nội dung, form giữ mở; không có thông điệp → "Không thể gửi báo lỗi. Vui lòng thử lại sau." (E-014) ✅.
- *. Bấm Hủy: đóng form, không gửi (nút bị vô hiệu khi đang gửi) ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:143-145].
- *. Nếu client không có hàm gửi: vẫn báo thành công mà không gửi 🟡 (OQ-12).

## f. Hậu điều kiện
- Thành công: có một báo lỗi `open` gắn với bài thi và học viên, hạn phản hồi 72 giờ, đồng ý chia sẻ theo lựa chọn; trang kết quả hiện badge đang xử lý và ẩn nút ✅.
- Thất bại: không có bản ghi nào mới (trừ lỗi DB không rõ), form còn mở ✅.

## g. Quy tắc nghiệp vụ liên quan
BR-score-dispute-001, 002, 003, 005, 006, 008, 009, 010, 011, 019, 020; 🟡 BR-004 (ý nghĩa cam kết), BR-007.

## h. Truy vết
- FR: FR-score-dispute-001..013, 019..022.
- Screen: Form "Báo lỗi chấm"; Trang kết quả.
- Error: E-score-dispute-001..010, 014.
- OQ: OQ-1, 2, 4, 7, 8, 10, 11, 12, 14, 15.
- Test: packages/api/src/routers/dispute.test.ts:29,66,120,154,190; apps/web/src/features/results/__tests__/report-modal.test.tsx:100,113,157.
