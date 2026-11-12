---
type: reverse-usecase
feature: landing-page
slug: vao-dang-nhap-tu-trang-chu
status: draft
updated: 2026-11-11
---

# UC: Vào màn đăng nhập/đăng ký từ trang chủ

> Tái lập từ source, **CHƯA duyệt**. Nhãn ✅/🔵/🟡.

**a. Actor chính:** Khách truy cập. ✅ [apps/web/src/features/landing/landing-screen.tsx:20-21]

**b. Tiền điều kiện:** Đang ở trang chủ. ✅

**c. Kích hoạt:** Khách bấm "Đăng nhập", "Thi thử miễn phí" hoặc "Thi thử ngay — miễn phí". ✅ [apps/web/src/features/landing/components/hero.tsx:31-33]

**d. Luồng chính:**
1. Hệ thống điều hướng tới màn đăng nhập/đăng ký (đúng 1 lần, theo test). ✅ [apps/web/src/features/__tests__/slice-a.test.tsx:155-173]
2. Khách tiếp tục ở feature auth. ✅ [apps/web/src/features/app-state/routes.ts:9]

**e. Luồng thay thế / ngoại lệ:**
- Cả ba nút cùng đích, không có trang đăng ký riêng hay thi thử cho khách. ✅ (ý đồ: 🟡 OQ-7)

**f. Hậu điều kiện:** Khách ở màn đăng nhập; không dữ liệu nào ghi. ✅

**g. Business rule / lỗi liên quan:** BR-001. Không có lỗi hướng người dùng.

**h. Ghi chú / OQ:** OQ-6, OQ-7.
