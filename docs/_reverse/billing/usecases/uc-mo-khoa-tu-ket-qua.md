# UC: Mở khóa chi tiết từ màn kết quả (paywall) (reverse, draft)

> Nhãn: ✅ code khẳng định · 🔵 suy đoán · 🟡 cần xác nhận. CHƯA duyệt.

**a. Mô tả & mục tiêu:** Từ kết quả chưa mở khóa, người dùng bấm "Mở khóa từ 49.000đ", xem lợi ích và chọn gói để thanh toán. ✅ [S11 apps/web/src/features/results/components/soft-paywall.tsx:17, S6 apps/web/src/features/billing/components/paywall-modal.tsx:18-53]

**b. Actor:** Người dùng chưa trả phí ✅.

**c. Tiền điều kiện:** Đang xem kết quả không phải kết quả chấm thật và chưa có gói; `FEATURES.scoring` phải bật (khi tắt, màn kết quả hiện "sắp ra mắt" và không có paywall, OQ-15). Kết quả chấm thật luôn mở khóa nên không hiện paywall. ✅ [S12 apps/web/src/features/results/results-screen.tsx:223,258-259,402]

**d. Hậu điều kiện:** Giống UC thanh toán QR. Paywall đóng khi bấm nút cuối hoặc khi đổi trang. ✅ [S13 apps/web/src/features/app-state/app-state-provider.tsx:15-20]

**e. Luồng chính:**
1. Bấm "Mở khóa từ 49.000đ" (hoặc chọn một tiêu chí, hoặc "Mở khóa đánh dấu lỗi"). 🟡 FR-billing-019
2. Thấy cửa sổ "Mở khóa chi tiết", tiêu đề "Biết chính xác cần sửa gì để lên {mục tiêu}", 4 lợi ích, 4 gói dạng gọn, chân trang "Band tổng vẫn miễn phí cho mọi lượt, kể cả khi bạn không nâng cấp.". ✅ FR-billing-020
3. Chọn gói; thực hiện như UC thanh toán QR. Bấm "Xem chi tiết 4 tiêu chí" đóng paywall. ✅ [S16 apps/web/src/features/__tests__/slice-c.test.tsx:446-453]

**f. Luồng thay thế:** Đã có gói và chưa chọn gói: paywall không hiện. ✅ FR-billing-021. Đổi trang: paywall tự đóng. ✅ FR-billing-022. Cờ tắt: sau khi chọn gói thấy "Cổng thanh toán sắp ra mắt". ✅

**g. Ngoại lệ / lỗi:** E-billing-001.

**h. Quy tắc & ghi chú:** BR-billing-005, 009. Giá "49.000đ" viết cứng trong chữ, không lấy từ danh mục gói 🟡 (rủi ro lệch giá khi đổi giá). Mức mở khóa chi tiết của gói chưa phân biệt 🟡 OQ-5.
