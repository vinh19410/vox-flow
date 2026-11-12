# UC: Đồng ý / rút đồng ý lưu bài và hiệu chuẩn

> Trạng thái: draft (reverse). Nhãn ✅/🔵/🟡. Không có UI gọi use case này (🟡, OQ-1).

**a. Mục tiêu:** Học viên đã đăng nhập ghi nhận lựa chọn đồng ý hoặc rút đồng ý cho việc lưu bài (save) và hiệu chuẩn chấm điểm (calibration). 🟡 [S1:88-122] (mục tiêu suy từ API)

**b. Actor:** Học viên đã đăng nhập (chính chủ; không có thao tác thay mặt người khác). ✅ [S1:91]

**c. Tiền điều kiện:** Có phiên đăng nhập. ✅ [S8:15-22]

**d. Hậu điều kiện:**
- Thành công: có thêm 1 hoặc 2 sự kiện đồng ý mới; trạng thái hiện hành của loại tương ứng là sự kiện mới nhất. ✅ [S1:95-118]
- Thất bại: không ghi sự kiện nào. ✅ (từ chối trước khi vào xử lý) [S1:37-57]

**e. Luồng chính:**
1. Học viên gửi lựa chọn dạng từng loại (loại + đồng ý/không + phiên bản chính sách tùy chọn). ✅ [S1:38-42]
2. Hệ thống ghi thêm một sự kiện với phiên bản chính sách (mặc định "v1" nếu không gửi). ✅ [S1:92-100]
3. Hệ thống trả success=true. ✅ [S1:121]

**f. Luồng thay thế / ngoại lệ:**
- A1 (gửi gộp): học viên gửi save và/hoặc calibration/train; mỗi trường có giá trị đúng/sai tạo một sự kiện; nếu cùng có calibration và train thì dùng calibration. ✅ [S1:101-118; S2:113-124]
- A2 (rút lại): học viên gửi granted=false cho loại đã bật → thêm sự kiện mới, trạng thái trở về tắt. ✅ [S2:102-111]
- E1: chưa đăng nhập → E-001 "Authentication required". ✅ [S8:15-22]
- E2: gửi gộp không trường nào đúng/sai → E-003 "At least one consent setting (save, calibration, or train) must be provided" (mã/wording client 🟡). [S1:50-56]
- E3: sai dạng đầu vào → E-004 (🟡 wording).

**g. Quy tắc / yêu cầu liên quan:** FR-001..006, FR-009, BR-001, BR-005..007. Kết quả không làm thay đổi việc lưu bài thi (BR-010). ✅ [S5:12-16]

**h. Câu hỏi mở:** OQ-1 (không có UI), OQ-5 (ý nghĩa sau D-10), OQ-7 (policyVersion), OQ-10 (wording lỗi).
