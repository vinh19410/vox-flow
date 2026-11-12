# UC: Xác nhận ghi âm và bắt đầu bài thi

> Trạng thái: draft (reverse).

**a. Mục tiêu:** Học viên đọc lời thông báo về việc ghi âm / lưu bài và bấm đồng ý để vào bài thi. 🟡 [S12:22-38] (mục tiêu suy từ giao diện, không có nguồn nghiệp vụ)

**b. Actor:** Học viên đã đăng nhập đang ở màn chọn bài thi. ✅ [S12:7-10]

**c. Tiền điều kiện:** Đã chọn chế độ thi (thuộc mock-exam); có phiên đăng nhập. 🟡 [S12:33-35] (suy đoán, code không kiểm tra chế độ thi tại thẻ này)

**d. Hậu điều kiện:** Chuyển sang màn thi; khi bắt đầu bài thi, bài được tạo với inHistory=true, calibrationGranted=false. KHÔNG có sự kiện đồng ý nào được ghi. ✅ [S12:32-36; S5:12-16; S7:88-97]

**e. Luồng chính:**
1. Hệ thống hiển thị "Ghi âm được xử lý bảo mật để chấm bài và tự động lưu vào lịch sử làm bài của bạn." ✅ [S12:22-26; S23:266]
2. Học viên bấm "Đồng ý ghi âm & bắt đầu". ✅ [S12:38; S23:268]
3. Web xoá phiên luyện, bỏ cờ chờ nộp, chuyển sang màn thi. ✅ [S12:33-35]
4. Khi bài thi bắt đầu, hệ thống luôn lưu bài vào lịch sử với hiệu chuẩn tắt. ✅ [S7:88-110]

**f. Luồng thay thế / ngoại lệ:**
- A1: học viên từng "không đồng ý lưu bài" qua API → vẫn được lưu (BR-010). ✅ [S5:12-16]
- Không có luồng "từ chối": giao diện chỉ có nút đồng ý (không có nút từ chối trong thẻ). ✅ [S12:28-38]

**g. Quy tắc / yêu cầu liên quan:** FR-021, FR-025; BR-010, BR-011, BR-022.

**h. Câu hỏi mở:** OQ-2 (hàm chặn không được dùng), OQ-5 (ý nghĩa đồng ý sau D-10).
