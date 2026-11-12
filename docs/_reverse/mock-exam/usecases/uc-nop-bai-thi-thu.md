# UC: Kiểm tra và nộp bài thi thử

> Tái lập chưa duyệt (draft). Không đặc tả chấm điểm; điểm bàn giao: lượt thi "đã nộp" + dòng điểm "queued" + hàng đợi.

## a. Tóm tắt / mục tiêu
Sau khi trả lời hết câu, học viên xem lại danh sách, nói lại câu ngắn nếu muốn, rồi nộp để chấm. ✅ [S20: apps/web/src/features/exam/exam-screen.tsx:110-151]

## b. Actor
- Chính: Học viên. Phụ: bộ tải audio, máy chủ API, hàng đợi chấm điểm (bàn giao).

## c. Tiền điều kiện
- Đã đến câu cuối và bấm "Hoàn thành" (mở hộp thoại) ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:326-330]
- Đồng bộ lượt thi không còn ở "đang chờ" (nút bị khóa khi chờ) ✅ [S20: apps/web/src/features/exam/exam-screen.tsx:132]

## d. Hậu điều kiện
- Thành công: lượt thi "đã nộp", có dòng điểm "queued", lượt thi vào hàng đợi trễ 10 giây; client sang màn chấm điểm ✅ [S1: packages/api/src/routers/attempt.ts:270-296] [S20: apps/web/src/features/exam/exam-screen.tsx:86-90]
- Thất bại: ở lại hộp thoại, lượt thi vẫn "đang làm" ✅

## e. Luồng chính
1. Hộp thoại liệt kê từng câu và số từ; dòng đầu báo số câu có thể làm giảm điểm hoặc "Tất cả câu trả lời đều đủ độ dài. Sẵn sàng chấm!". ✅ [S21: apps/web/src/features/exam/components/pre-submit-modal.tsx:54-125]
2. Học viên bấm "Nộp & chấm điểm" (hoặc "Vẫn nộp & chấm" nếu có câu ngắn). ✅
3. Hệ thống đẩy mọi bản ghi lên (nhãn "Đang tải lên bản ghi…"). ✅ [S18: apps/web/src/features/exam/answer-uploads.ts:279-343]
4. Mọi bản ghi đã lên: hệ thống gửi nộp (nhãn "Đang nộp…"). ✅
5. Máy chủ kiểm quyền, trạng thái, giới hạn, ít nhất 1 câu; đặt "đã nộp", tạo dòng điểm queued, đẩy hàng đợi. ✅ [S1: packages/api/src/routers/attempt.ts:203-304]
6. Phòng thi ghi nhận việc chấm của lượt thi là đã nộp, đặt cờ chờ nộp, chuyển sang màn chấm điểm. ✅ [S20: apps/web/src/features/exam/exam-screen.tsx:86-90]

## f. Luồng thay thế
- 2a. Học viên bấm "Nói lại" ở câu ngắn: quay về ghi lại, xong nút tiếp là "Về danh sách nộp". ✅ [S17: apps/web/src/features/exam/use-exam-session.ts:366-372]
- 2b. Học viên bấm "Quay lại" khi đang đẩy audio: hủy lượt chạy, lượt thi vẫn "đang làm"; nộp lại bình thường. ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:327-347, 456-490]
- 4a. Đóng hộp thoại khi đang gửi nộp: lượt chạy vẫn tiếp tục và vẫn điều hướng nếu thành công; lỗi thì im lặng. ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:349-398]
- 4b. Máy chủ trả "Attempt is already submitted": coi như thành công. ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:212-228]
- 3a. Kho thiết bị không đọc được nhưng mọi lần tải đã biết xong: hiện cảnh báo với "Thử lại" và "Vẫn nộp". ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:182-210]
- 1a. Không có mã lượt thi (khởi tạo thất bại/quá 15 giây): không tải, không nộp; ghi nhận "chỉ cục bộ" và sang màn chấm điểm. ✅ [S20: apps/web/src/features/exam/exam-screen.tsx:141-149]
- 2c. Bấm nộp lần hai khi đang chạy: bị bỏ qua. ✅ [S27: apps/web/src/features/exam/__tests__/exam-submit.test.tsx:304-325]

## g. Ngoại lệ
- Còn câu chưa lên sau thử lại: "Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại." (E-033) ✅
- Nộp BAD_REQUEST (quá số câu, quá 35 MiB, không có câu, "Attempt is abandoned"): "Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi." (E-034) ✅
- Nộp lỗi khác (mạng, không tìm thấy, không phải chủ): "Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại." (E-035) ✅
- Kho thiết bị không đọc được: "Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận." (E-036) ✅

## h. Quy tắc & truy vết
- FR: FR-mock-exam-039..047. BR: BR-009..011, BR-013, BR-015..017.
- Screens: Hộp thoại Kiểm tra trước khi nộp. Errors: E-005..E-011, E-033..E-036. OQ: OQ-3, OQ-4.
