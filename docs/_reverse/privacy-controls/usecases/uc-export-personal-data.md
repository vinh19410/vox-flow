# UC: Xuất dữ liệu cá nhân của mình

> Trạng thái: draft (reverse). Không có UI gọi use case này (🟡, OQ-1).

**a. Mục tiêu:** Học viên lấy bản xuất toàn bộ dữ liệu cá nhân của chính mình, gom theo từng bảng. 🟡 [S1:124-127; S3:256-266] (mục tiêu suy từ API)

**b. Actor:** Học viên đã đăng nhập (chỉ dữ liệu của chính mình, mã học viên lấy từ phiên). ✅ [S1:125; S2:161-175]

**c. Tiền điều kiện:** Có phiên đăng nhập. ✅ [S8:15-22]

**d. Hậu điều kiện:** Trả về đối tượng gồm exportedAt (ISO), userId, data theo bảng; không ghi gì vào hệ thống. ✅ [S3:261-265]

**e. Luồng chính:**
1. Học viên yêu cầu xuất. ✅ [S1:124]
2. Hệ thống chạy lần lượt hàm xuất của 12 bảng cá nhân. ✅ [S3:257-260]
3. Điểm chấm chỉ gồm 7 trường kết quả; dữ liệu chạy chấm trả rỗng; tài khoản liên kết chỉ 4 trường; phiên gồm id, createdAt, expiresAt, userAgent, ipAddress. ✅ [S3:78-85, S3:94-100, S3:127-138, S3:151; S4:527-582]
4. Hệ thống trả bản xuất. ✅ [S3:261-265]

**f. Luồng thay thế / ngoại lệ:**
- A1: dữ liệu học viên khác không xuất hiện trong bản xuất của học viên này. ✅ [S3:51, S3:60; S4:268-275]
- E1: chưa đăng nhập → E-001. ✅ [S8:15-22]
- E2: lỗi DB giữa chừng → không có xử lý riêng (E-008, 🟡).

**g. Quy tắc / yêu cầu liên quan:** FR-010..015, FR-022; BR-013..015; NFR-001, NFR-002, NFR-005.

**h. Câu hỏi mở:** OQ-1 (không có UI), OQ-6 (có xuất dữ liệu vận hành không), OQ-11 (định dạng tải về), OQ-12 (giới hạn tần suất / kích thước).
