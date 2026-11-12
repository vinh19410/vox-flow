---
type: reverse-usecase
feature: dispute-admin
slug: xem-so-lieu
status: draft
updated: 2026-11-11
---

# UC: Xem số liệu vận hành báo lỗi

> Tái lập từ code, CHƯA duyệt. Nhãn: ✅ / 🔵 / 🟡.

**a. Mục tiêu:** Admin thấy 4 thẻ số liệu: tỷ lệ đúng hạn, báo lỗi tuần này, đang chờ xử lý, sắp quá hạn. 🟡 [S1:290-335][S11:256-301]

**b. Actor chính:** Quản trị viên ✅.

**c. Tiền điều kiện:** Admin đã vào màn hình (UC xem-hang-doi bước 1). ✅ [S12:7-27]

**d. Hậu điều kiện:** Thẻ số liệu hiển thị; không đổi dữ liệu. ✅

**e. Luồng chính:**
1. Khi mở màn hình hoặc đổi bộ lọc hoặc bấm làm mới, giao diện tải số liệu. ✅ [S11:127-152]
2. Hệ thống đọc toàn bộ ca và tính: tổng, chưa xử lý, đã xử lý, tỷ lệ đúng hạn (làm tròn 1 chữ số, 100 nếu chưa có ca đã xử lý), ca tạo trong 7 ngày, ca sắp quá hạn. ✅ [S1:291-335]
3. Giao diện hiển thị 4 trong 6 số liệu (tổng và đã xử lý không hiển thị ở thẻ). ✅ [S11:256-301]

**f. Luồng thay thế / ngoại lệ:**
- 2a. Không phải admin hoặc chưa đăng nhập: E-001/E-002. ✅ [S10:15-45]
- 3a. Tải lỗi: E-015. ✅ [S11:141-143]
- 3b. Chưa có số liệu: tỷ lệ hiện 100%, tuần này 0, sắp quá hạn 0; "Đang chờ xử lý" đếm ca open trong danh sách đang hiển thị. ✅ [S11:264, S11:275, S11:286, S11:297]

**g. Quy tắc / FR liên quan:** BR-017..BR-021; FR-017, FR-031. Ghi chú: chú thích "Cam kết dưới 72 giờ", "> 5 cần tìm thêm người" là chữ cố định (🟡 OQ-7). Priority: TBD 🟡.

**h. Màn hình / Lỗi / OQ:** SCR-01; E-015; OQ-7, OQ-14, OQ-20. Test: số liệu chỉ kiểm tra ">=" (S2:265-273) nên công thức chưa được test khẳng định.

