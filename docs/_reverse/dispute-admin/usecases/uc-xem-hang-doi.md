---
type: reverse-usecase
feature: dispute-admin
slug: xem-hang-doi
status: draft
updated: 2026-11-11
---

# UC: Xem hàng đợi báo lỗi và lọc theo nhóm trạng thái

> Tái lập từ code, CHƯA duyệt. Nhãn: ✅ / 🔵 / 🟡.

**a. Mục tiêu:** Admin thấy các ca báo lỗi cần xử lý, ca gần hạn nhất trước, và có thể chuyển giữa Chờ xử lý / Tất cả / Đã xử lý. 🟡 [S1:94-146][S11:310-336]

**b. Actor chính:** Quản trị viên ✅ [S10:31-45]. **Actor phụ:** học viên (chủ ca, không tương tác).

**c. Tiền điều kiện:** Đã đăng nhập và email nằm trong danh sách admin. ✅ [S12:7-27]

**d. Hậu điều kiện:** Danh sách ca hiển thị theo bộ lọc, mỗi ca có cờ sắp quá hạn/quá hạn; không có dữ liệu bị đổi. ✅ [S1:132-145]

**e. Luồng chính:**
1. Admin mở trang quản trị báo lỗi; hệ thống kiểm tra phiên và quyền. ✅ [S12:7-27]
2. Hệ thống tải số liệu và hàng đợi với bộ lọc mặc định "Chờ xử lý" (ca open và reviewing). ✅ [S11:111, S11:127-146][S1:100-102]
3. Hệ thống sắp ca theo hạn xử lý tăng dần, gắn huy hiệu "Sắp quá hạn (<12h)" cho ca sắp quá hạn. ✅ [S1:130-137][S11:371-377]
4. Mỗi ca hiện tên học viên (hoặc email, hoặc "Học viên"), tiêu chí, band kỳ vọng, band cũ, lý do rút gọn, hạn xử lý, trạng thái quyền nghe audio. ✅ [S11:361-408]
5. Admin bấm "Tất cả" hoặc "Đã xử lý" hoặc "Làm mới" để tải lại. ✅ [S11:148-152, S11:338-341]

**f. Luồng thay thế / ngoại lệ:**
- 2a. Chưa đăng nhập: chuyển tới trang đăng nhập (E-001). ✅ [S12:9-14]
- 2b. Không phải admin: chuyển về trang tổng quan học viên (E-002). ✅ [S12:16-24]
- 2c. Tải lỗi bất kỳ nguyên nhân: màn "Truy cập bị từ chối" (E-015, OQ-15). ✅ [S11:141-143]
- 3a. Hàng đợi rỗng: "Không có báo lỗi nào trong hàng đợi." (E-019). ✅ [S11:346-349]

**g. Quy tắc / FR liên quan:** BR-002, BR-003, BR-004, BR-005, BR-028, BR-031; FR-001..006, FR-023, FR-024, FR-032. Priority: TBD 🟡.

**h. Màn hình / Lỗi / OQ:** SCR-01, SCR-03; E-001, E-002, E-015, E-019; OQ-1, OQ-13, OQ-15.

