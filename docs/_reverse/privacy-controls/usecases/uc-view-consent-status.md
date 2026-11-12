# UC: Xem / nạp trạng thái đồng ý hiện tại

> Trạng thái: draft (reverse).

**a. Mục tiêu:** Lấy ra lựa chọn đồng ý hiện hành của học viên (save, calibration, train, đã trả lời hay chưa). 🟡 [S1:60-86] (mục tiêu suy từ API)

**b. Actor:** Học viên đã đăng nhập; trong thực tế, ứng dụng web gọi thay mặt học viên ngay sau khi nạp hồ sơ. ✅ [S10:79-96]

**c. Tiền điều kiện:** Có phiên đăng nhập; hồ sơ đã nạp xong (nếu hồ sơ lỗi thì không gọi). ✅ [S10:55-67]

**d. Hậu điều kiện:** Trạng thái consent trong ứng dụng web được cập nhật; không có màn hình hiển thị (🔵 N6). ✅ [S10:82-90]

**e. Luồng chính:**
1. Ứng dụng web gọi đọc đồng ý sau khi nạp hồ sơ. ✅ [S10:79-81]
2. Hệ thống lấy sự kiện save và calibration mới nhất của học viên. ✅ [S1:63-75]
3. Hệ thống trả save, calibration, train (= calibration), hasAnswered (có ít nhất một sự kiện save). ✅ [S1:80-85]
4. Web lưu vào state (giá trị thiếu rơi về true/false/false). ✅ [S10:84-88]

**f. Luồng thay thế / ngoại lệ:**
- A1: học viên chưa có sự kiện nào → save=false, calibration=false, hasAnswered=false. ✅ [S2:73-80]
- A2: học viên khác không bị lộ. ✅ [S2:126-134]
- E1: chưa đăng nhập → E-001. ✅ [S8:15-22]
- E2: lỗi mạng / server → web bỏ qua, giữ mặc định (save true, calibration false, train false). ✅ [S10:91-93, S11:9]

**g. Quy tắc / yêu cầu liên quan:** FR-007, FR-008, FR-009, FR-022, FR-023, FR-024; BR-002..004.

**h. Câu hỏi mở:** OQ-1, OQ-8 (mặc định web save=true lệch với server save=false, và không có nơi đọc).
