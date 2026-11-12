# UC: Chọn gói và thanh toán QR (mô phỏng) (reverse, draft)

> Nhãn: ✅ code khẳng định · 🔵 suy đoán · 🟡 cần xác nhận. CHƯA duyệt. Toàn bộ là prototype, không thu tiền thật.

**a. Mô tả & mục tiêu:** Người học chọn một gói, xem bảng thanh toán QR và kích hoạt gói. Khi cờ billing tắt (mặc định), chỉ thấy thông báo "sắp ra mắt". ✅ [S4 apps/web/src/features/billing/components/payment-panel.tsx:22-126]. Mục tiêu thu tiền: 🟡 OQ-3.

**b. Actor:** Người học đã đăng nhập ✅. Ngân hàng / SePay: không nối, thay bằng nút giả lập "Đã chuyển khoản" 🟡 [S4 apps/web/src/features/billing/components/payment-panel.tsx:119-124].

**c. Tiền điều kiện:** Đang ở trang Gói và thanh toán, hoặc trong cửa sổ paywall. ✅ [S2 apps/web/src/features/billing/billing-screen.tsx:56]

**d. Hậu điều kiện:** Cờ bật: gói đang dùng được ghi vào trạng thái phiên (mất khi tải lại trang), kết quả được mở khóa, mục Hóa đơn hiện 1 dòng. Cờ tắt: không đổi gì. ✅ [S4 apps/web/src/features/billing/components/payment-panel.tsx:52-56, S13 apps/web/src/features/app-state/store.tsx:94-107]

**e. Luồng chính (cờ bật):**
1. Người học bấm thẻ gói; cửa sổ thanh toán mở. ✅ FR-billing-005
2. Thấy "Quét mã để thanh toán", QR giả, Gói / Số tiền / Nội dung CK (CR + 4 ký tự email + 7Q), đếm ngược từ 10:00. ✅ FR-billing-007..010
3. Bấm "Đã chuyển khoản" (nút Prototype). ✅ FR-billing-011
4. Thấy "Đã nhận tiền, đang kích hoạt…"; sau 1200 ms thấy "Đã kích hoạt gói {tên}", "Hiệu lực: ..." và toast. ✅ FR-billing-012..014
5. Bấm "Xem chi tiết 4 tiêu chí": cửa sổ đóng. ✅ FR-billing-014

**f. Luồng thay thế:**
* Cờ tắt (mặc định): thấy "Cổng thanh toán sắp ra mắt" và nút "Đóng". ✅ FR-billing-006, E-billing-001
* Bấm "Đổi gói" bất kỳ lúc nào trước khi hoàn tất: về danh sách gói; kích hoạt đang chờ bị hủy. ✅ FR-billing-016
* Phím Escape hoặc bấm nền mờ: đóng cửa sổ. ✅ FR-billing-005

**g. Ngoại lệ / lỗi:** E-billing-001 (cổng tắt). Đồng hồ về 0:00 không có xử lý (E-billing-002 🟡 OQ-8). Lỗi mạng, từ chối, sai số tiền không tồn tại (E-billing-003 🟡 G-2).

**h. Quy tắc & ghi chú:** BR-billing-001..004, 006, 007, 013; FR-billing-015 về hiệu lực. Câu "Hóa đơn đã gửi tới {email}" không có cơ chế gửi (G-4). Mua khi đã có gói: ghi đè, chưa rõ quy tắc 🟡.
