---
type: reverse-usecase
feature: landing-page
slug: doc-dieu-khoan
status: draft
updated: 2026-11-11
---

# UC: Đọc điều khoản dịch vụ

> Tái lập từ source, **CHƯA duyệt**. Nhãn ✅/🔵/🟡.

**a. Actor chính:** Khách truy cập. ✅ [apps/web/src/routes/_proto/terms.tsx:11-102]

**b. Tiền điều kiện:** Có thể đến từ footer trang chủ hoặc màn đăng nhập. ✅ [apps/web/src/features/landing/landing-screen.tsx:31-42; apps/web/src/features/auth/auth-screen.tsx:257-270]

**c. Kích hoạt:** Khách bấm liên kết "Điều khoản dịch vụ & Chính sách sử dụng". ✅

**d. Luồng chính:**
1. Hệ thống chuyển trong ứng dụng tới trang điều khoản (giữ Ctrl/Meta thì trình duyệt mở mặc định). ✅ [apps/web/src/features/landing/landing-screen.tsx:33-37]
2. Khách đọc nhãn "Cập nhật lần cuối: Tháng 11/2026" và sáu mục (phạm vi dịch vụ; tài khoản; xử lý và lưu trữ dữ liệu bài làm; quy định sử dụng hợp lý; quyền sở hữu trí tuệ; thay đổi điều khoản) — nguyên văn ở FR-023, không diễn giải pháp lý. ✅ [apps/web/src/routes/_proto/terms.tsx:32-90]
3. Khách bấm "Quay lại" hoặc "Quay lại Đăng nhập". ✅ [apps/web/src/routes/_proto/terms.tsx:17-23; apps/web/src/routes/_proto/terms.tsx:95-97]

**e. Luồng thay thế / ngoại lệ:**
- "Quay lại": lịch sử dài hơn 1 thì về trang trước, ngược lại sang màn đăng nhập. ✅ [apps/web/src/routes/_proto/terms.tsx:19]
- Không có kênh liên hệ cụ thể dù trang bảo "vui lòng liên hệ đội ngũ Vox Flow". ✅ [apps/web/src/routes/_proto/terms.tsx:93]

**f. Hậu điều kiện:** Không ghi nhận việc người dùng đã đọc/chấp nhận (không thấy cơ chế lưu trong các file đã đọc). 🟡

**g. Business rule / lỗi liên quan:** BR-015, BR-016, BR-017. Không có lỗi.

**h. Ghi chú / OQ:** OQ-5, OQ-11.
