# UC: Xem các gói và gói hiện tại (reverse, draft)

> Nhãn: ✅ code khẳng định · 🔵 suy đoán · 🟡 cần xác nhận. CHƯA duyệt.

**a. Mô tả & mục tiêu:** Người học xem 4 gói trả phí (tên, giá, đơn vị, quyền lợi) và biết mình đang ở gói nào, hiệu lực đến khi nào. ✅ [S1 apps/web/src/features/billing/data.ts:10-40, S2 apps/web/src/features/billing/billing-screen.tsx:24-56]. Mục tiêu nghiệp vụ "để cân nhắc nâng cấp": 🟡 OQ-9.

**b. Actor:** Người học đã đăng nhập ✅ [S14 apps/web/src/routes/_proto/app/route.tsx:7, apps/web/src/lib/auth-guard.ts:41-57]. Khách chưa đăng nhập xem bảng giá ở trang giới thiệu ✅ [S19 apps/web/src/features/landing/components/pricing-teaser.tsx:10-45].

**c. Tiền điều kiện:** Đã vào trang Gói và thanh toán qua menu "Gói & thanh toán" ✅ [S14 apps/web/src/layouts/nav-items.ts:54-60].

**d. Hậu điều kiện:** Không đổi dữ liệu. ✅ [S2 apps/web/src/features/billing/billing-screen.tsx:19-98]

**e. Luồng chính:**
1. Người học mở trang. Thấy khối "Gói hiện tại": chưa có gói thì "Miễn phí", nhãn "Band tổng không giới hạn", dòng "Nâng cấp để xem chi tiết 4 tiêu chí và bằng chứng."; có gói thì tên gói, "Đang hoạt động", "Hiệu lực đến: {hiệu lực}". ✅ FR-billing-004
2. Thấy 4 thẻ gói theo thứ tự Theo lượt, 7 ngày, Đến ngày thi (Khuyên dùng), 30 ngày, kèm giá và quyền lợi. ✅ FR-billing-001..003
3. Gói "Đến ngày thi" hiện "{n} ngày, đến {ngày}" nếu có ngày thi, nếu không "Tối đa 60 ngày". ✅ FR-billing-003

**f. Luồng thay thế:** Tại trang giới thiệu, thấy cột "Miễn phí" (0đ) và 3 gói (không có "30 ngày"). ✅ FR-billing-026. Tên gói cũng hiện ở thẻ người dùng, menu dưới và hồ sơ. ✅ FR-billing-023

**g. Ngoại lệ / lỗi:** Không có lỗi riêng. Gói không còn sau khi tải lại trang. ✅ FR-billing-025 (OQ-2)

**h. Quy tắc & ghi chú:** BR-billing-001, 012, 013. Mâu thuẫn hạn mức miễn phí giữa các màn (🟡 OQ-10). Nhãn UC: ✅ hành vi; mục tiêu 🟡.
