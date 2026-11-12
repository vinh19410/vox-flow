# UC: Học viên xem trạng thái báo lỗi trên trang kết quả

**Nhãn UC:** ✅ hành vi API; 🟡 hiển thị nút/badge (FR-016, 017, 018, 023 đã hạ vì có thể không tới được bài thi thật, OQ-2; negative-search đã lặp lại và xác nhận).

## a. Mô tả
Khi mở trang kết quả của một bài thi, học viên thấy nút báo lỗi (nếu chưa báo lỗi và tính năng bật) hoặc badge cho biết báo lỗi đang xử lý (kèm hạn phản hồi), đã xử lý, hoặc không được chấp nhận 🟡 [S5: apps/web/src/features/results/results-screen.tsx:318-344].

## b. Actor
- Chính: Học viên (chủ bài thi) ✅ [S1: packages/api/src/routers/dispute.ts:151-156].

## c. Tiền điều kiện
1. Đã đăng nhập ✅ [S16: packages/api/src/index.ts:15-22].
2. Đang mở trang kết quả của bài thi của mình, mã khác "latest" ✅ [S5: apps/web/src/features/results/results-screen.tsx:76].
3. 🔵 Mã bài thi nằm trong danh sách bài cục bộ hoặc là bài chưa lưu; nếu không, giao diện không tải trạng thái (BR-018).
4. Việc xem KHÔNG phụ thuộc cờ; cờ chỉ quyết định việc hiện nút ✅ [S1: packages/api/src/routers/dispute.ts:136,165-168].

## d. Luồng chính
1. Trang tải trạng thái báo lỗi của bài thi ✅ [S5: apps/web/src/features/results/results-screen.tsx:75-88].
2. Hệ thống trả báo lỗi mới nhất (hoặc "chưa có") kèm cờ bật/tắt ✅ [S1: packages/api/src/routers/dispute.ts:158-168].
3. Giao diện hiển thị theo trạng thái:
   - open / reviewing → badge "Báo lỗi đang xử lý · Cam kết phản hồi trước HH:mm dd/MM/yyyy" ✅ [S5: apps/web/src/features/results/results-screen.tsx:319-328];
   - resolved → badge "Báo lỗi đã xử lý" ✅;
   - rejected → badge "Báo lỗi không được chấp nhận" ✅;
   - chưa có và cờ bật → nút "Báo lỗi chấm" ✅;
   - chưa có và cờ tắt → không hiện gì ✅.
4. Sau khi gửi báo lỗi thành công, trạng thái được tải lại ✅ [S5: apps/web/src/features/results/results-screen.tsx:427-432].

## e. Luồng thay thế / ngoại lệ
- 2a. Bài thi không tồn tại → E-011 "Không tìm thấy bài thi"; giao diện im lặng ✅.
- 2b. Bài thi của người khác → E-012 "Bạn không có quyền xem thông tin bài thi này"; im lặng ✅.
- 2c. Lỗi mạng/máy chủ → E-013 ghi console "Failed to load dispute status:"; không hiện nút/badge ✅.
- 3a. Báo lỗi đã resolved/rejected: nút ẩn, học viên không gửi lại qua giao diện dù tầng nghiệp vụ cho phép 🟡 (FR-026, OQ-4).

## f. Hậu điều kiện
Chỉ đọc; không thay đổi dữ liệu ✅.

## g. Quy tắc nghiệp vụ liên quan
BR-score-dispute-015, 016, 017, 018; 🟡 BR-007 (reviewing), BR-021 (không có thông báo chủ động).

## h. Truy vết
- FR: FR-score-dispute-014..018, 023, 026.
- Screen: Trang kết quả (nút/badge).
- Error: E-score-dispute-011..013.
- OQ: OQ-1, 2, 3, 4, 6, 9, 13.
- Test: packages/api/src/routers/dispute.test.ts:235,288; apps/web/src/features/results/__tests__/report-modal.test.tsx:179,184,195,215 (rejected: không có test).
