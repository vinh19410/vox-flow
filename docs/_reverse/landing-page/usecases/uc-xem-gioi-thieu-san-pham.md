---
type: reverse-usecase
feature: landing-page
slug: xem-gioi-thieu-san-pham
status: draft
updated: 2026-11-11
---

# UC: Xem giới thiệu sản phẩm

> Tái lập từ source, **CHƯA duyệt**. Nhãn ✅/🔵/🟡.

**a. Actor chính:** Khách truy cập. ✅ [apps/web/src/features/landing/landing-screen.tsx:9-47]

**b. Tiền điều kiện:** Không có. Không cần phiên; người đã đăng nhập cũng thấy cùng nội dung. ✅ [apps/web/src/routes/_proto/index.tsx:5-7]

**c. Kích hoạt:** Khách mở đường dẫn gốc. ✅

**d. Luồng chính:**
1. Hệ thống ép giao diện sáng và hiển thị trang chủ. ✅ [apps/web/src/routes/_proto/route.tsx:16-19]
2. Khách xem hero: tiêu đề "Biết rõ vì sao bạn được 6.5.", mô tả, ba số liệu, thẻ xem trước mẫu. ✅ [apps/web/src/features/landing/components/hero.tsx:19-89]
3. Khách xem bốn lời hứa và bốn bước sử dụng. ✅ [apps/web/src/features/landing/components/promises-section.tsx:12-35]
4. Khách xem footer có câu miễn trừ "Điểm chỉ mang tính tham khảo, không thay thế kỳ thi IELTS chính thức." ✅ [apps/web/src/features/landing/landing-screen.tsx:43]

**e. Luồng thay thế / ngoại lệ:**
- Màn hẹp: liên kết "Cách chấm", "Bảng giá" ẩn. ✅ [apps/web/src/features/landing/landing-screen.tsx:15]
- Bấm liên kết neo (màn rộng): cuộn tới khối tương ứng. ✅ [apps/web/src/features/landing/components/promises-section.tsx:5]
- Người đã đăng nhập: không chuyển hướng ✅ [apps/web/src/routes/_proto/index.tsx:5-7]; có chủ ý hay không: 🟡 (OQ-6).

**f. Hậu điều kiện:** Không thay đổi dữ liệu nào. ✅

**g. Business rule / lỗi liên quan:** BR-009, BR-010, BR-012, BR-013, BR-014 (lời hứa cần đối chiếu); E-landing-page-001, E-landing-page-002.

**h. Ghi chú / OQ:** Một số lời hứa lệch với hành vi hệ thống (khoảng tin cậy, "Báo lỗi chấm", hỏi nối tiếp) — xem Conflicts trong `reverse-gaps.md`. OQ-2, OQ-6, OQ-8, OQ-9, OQ-10.
