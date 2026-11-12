# UC: Nghe lại audio của một câu trả lời

> Tái lập chưa duyệt (draft). Màn nghe lại thuộc feature khác (kết quả/lịch sử); UC này chỉ đặc tả việc lấy audio.

## a. Tóm tắt / mục tiêu
Người dùng phát lại audio của một câu trả lời; quản trị viên chỉ nghe được khi học viên đã đồng ý chia sẻ. ✅ [S13: apps/server/src/index.ts:301-394] [S32: packages/api/src/auth-utils.ts:23-37]

## b. Actor
- Chính: Học viên (chủ lượt thi) hoặc Quản trị viên.
- Phụ: Kho audio, cơ sở dữ liệu.

## c. Tiền điều kiện
- Đã đăng nhập ✅
- Lượt thi có câu trả lời với file trong kho ✅
- Với admin: tranh chấp mới nhất của lượt thi có cờ chia sẻ = đúng ✅ [S13: apps/server/src/index.ts:322-331]

## d. Hậu điều kiện
- Trình duyệt nhận file hoặc một đoạn (206), kèm header an toàn ✅ [S9: packages/api/src/audio.ts:114-124, 143-189]

## e. Luồng chính
1. Người dùng yêu cầu phát audio một câu (theo mã câu trả lời hoặc mã câu). ✅
2. Hệ thống kiểm đăng nhập, quyền, khóa file thuộc đúng học viên và lượt thi. ✅
3. Hệ thống lấy file từ kho và trả 200, hoặc 206 khi có Range. ✅

## f. Luồng thay thế
- 3a. Có Range (dải byte, dải mở, dải từ cuối): trả 206 với Content-Range và Content-Length chính xác. ✅ [S9: packages/api/src/audio.test.ts:332-393]

## g. Ngoại lệ
- Chưa đăng nhập: 401 "Unauthorized". Không có lượt thi / không đủ quyền / khóa file không hợp lệ: 403 "Forbidden". Không có câu trả lời: 404 "Not found". File không có trong kho: 404 "Audio not found". Kho không sẵn sàng: 503 "Storage unavailable" (E-mock-exam-032). ✅

## h. Quy tắc & truy vết
- FR: FR-mock-exam-052..053. BR: BR-022. NFR: NFR-005, NFR-006.
- Screens: Màn nghe lại (ngoài phạm vi). Errors: E-032. OQ: OQ-1.
- Quyền admin phụ thuộc cờ chia sẻ của tranh chấp (feature scoring-results) 🟡 chi tiết ngoài phạm vi.
