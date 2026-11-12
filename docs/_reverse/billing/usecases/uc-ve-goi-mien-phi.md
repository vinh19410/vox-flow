# UC: Chuyển về gói miễn phí (reverse, draft)

> Nhãn: ✅ code khẳng định · 🔵 suy đoán · 🟡 cần xác nhận. CHƯA duyệt.

**a. Mô tả & mục tiêu:** Người học đang có gói bấm "Về gói miễn phí" để bỏ gói. ✅ [S2 apps/web/src/features/billing/billing-screen.tsx:41-52]. Mục đích nghiệp vụ (hủy, hoàn tiền): 🟡 G-7.

**b. Actor:** Người học có gói ✅.

**c. Tiền điều kiện:** Đã có gói đang hoạt động; nếu không, nút không hiện. ✅

**d. Hậu điều kiện:** Gói bị xóa khỏi trạng thái phiên, hiện "Miễn phí", mục Hóa đơn về trạng thái rỗng "Chưa có hóa đơn nào". Không có hoàn tiền, không có gọi mạng. ✅ [S2 apps/web/src/features/billing/billing-screen.tsx:46,59-92]

**e. Luồng chính:**
1. Bấm "Về gói miễn phí" (không có bước xác nhận). ✅ FR-billing-017
2. Thấy toast "Đã chuyển về gói Miễn phí (prototype)". ✅

**f. Luồng thay thế:** Xem hóa đơn trước: bấm nút tải hiện toast "Đã tải hóa đơn PDF", không có tệp. ✅ FR-billing-018 (🟡 G-5)

**g. Ngoại lệ / lỗi:** Không có.

**h. Quy tắc & ghi chú:** Không có test phủ nút này (G-6). Chữ "(prototype)" nằm trong thông báo hiển thị cho người dùng. ✅
