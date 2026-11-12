---
type: reverse-usecase
feature: landing-page
slug: xem-bang-gia
status: draft
updated: 2026-11-11
---

# UC: Xem bảng giá và hạn mức miễn phí

> Tái lập từ source, **CHƯA duyệt**. Nhãn ✅/🔵/🟡.

**a. Actor chính:** Khách truy cập. ✅ [apps/web/src/features/landing/components/pricing-teaser.tsx:9-50]

**b. Tiền điều kiện:** Đang ở trang chủ. ✅

**c. Kích hoạt:** Khách cuộn xuống hoặc bấm "Bảng giá" ở đầu trang. ✅ [apps/web/src/features/landing/landing-screen.tsx:17]

**d. Luồng chính:**
1. Hệ thống hiển thị thẻ "Miễn phí" 0đ với ba gạch đầu dòng, gồm "3 điểm miễn phí mỗi ngày (Full Test 3 điểm, mỗi Part 1 điểm)". ✅ [apps/web/src/features/landing/components/pricing-teaser.tsx:18-29]
2. Hệ thống hiển thị ba thẻ trả phí: Theo lượt 49.000đ, 7 ngày 99.000đ, Đến ngày thi 349.000đ (nhãn "Phổ biến"). ✅ [apps/web/src/features/billing/data.ts:10-32]
3. Khách đọc quyền lợi từng gói. ✅

**e. Luồng thay thế / ngoại lệ:**
- Gói "30 ngày" 249.000đ không hiển thị. ✅ [apps/web/src/features/landing/components/pricing-teaser.tsx:30]
- Không có nút mua/chọn gói trên trang chủ. ✅ [apps/web/src/features/landing/components/pricing-teaser.tsx:17-48]

**f. Hậu điều kiện:** Không thay đổi dữ liệu. ✅

**g. Business rule / lỗi liên quan:** BR-002, BR-004, BR-005, BR-006, BR-007.

**h. Ghi chú / OQ:** Hạn mức "3 điểm/ngày" chưa có cơ chế đối ứng xác nhận được (OQ-1); "chi tiết 4 tiêu chí cần trả phí" và "Thanh toán QR" lệch với Beta/cờ tắt (OQ-3, OQ-4); OQ-12.
