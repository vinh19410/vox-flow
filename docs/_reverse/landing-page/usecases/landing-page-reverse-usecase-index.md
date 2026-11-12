---
type: reverse-usecase-index
feature: landing-page
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/landing-page/landing-page-reverse-spec.md
---

# landing-page — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-xem-gioi-thieu-san-pham](./uc-xem-gioi-thieu-san-pham.md) | Xem giới thiệu sản phẩm | Khách truy cập | FR-landing-page-001..006, 009..014 | S01 Landing | E-landing-page-001..002 | OQ-2, OQ-6, OQ-8, OQ-9, OQ-10 | apps/web/src/features/landing/landing-screen.tsx:9-47 | ✅ |
| [uc-xem-bang-gia](./uc-xem-bang-gia.md) | Xem bảng giá và hạn mức miễn phí | Khách truy cập | FR-landing-page-015..019 | S01 Landing | — | OQ-1, OQ-3, OQ-4, OQ-12 | apps/web/src/features/landing/components/pricing-teaser.tsx:9-50 | ✅ |
| [uc-vao-dang-nhap-tu-trang-chu](./uc-vao-dang-nhap-tu-trang-chu.md) | Vào màn đăng nhập/đăng ký từ trang chủ | Khách truy cập | FR-landing-page-007, 008, 010 | S01 Landing | — | OQ-6, OQ-7 | apps/web/src/features/landing/landing-screen.tsx:20-21 | ✅ |
| [uc-doc-dieu-khoan](./uc-doc-dieu-khoan.md) | Đọc điều khoản dịch vụ | Khách truy cập | FR-landing-page-020..025 | S01 Landing, S25 Điều khoản | — | OQ-5, OQ-11 | apps/web/src/routes/_proto/terms.tsx:11-102 | ✅ |

### Ma trận UC ↔ FR ↔ Screen ↔ Error ↔ OQ

| UC | FR | Screen | Error | OQ |
|----|----|--------|-------|----|
| uc-xem-gioi-thieu-san-pham | 001-006, 009-014 | S01 | E-001, E-002 | 2, 6, 8, 9, 10 |
| uc-xem-bang-gia | 015-019 | S01 | — | 1, 3, 4, 12 |
| uc-vao-dang-nhap-tu-trang-chu | 007, 008, 010 | S01 | — | 6, 7 |
| uc-doc-dieu-khoan | 020-025 | S01, S25 | — | 5, 11 |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Khách truy cập (chưa đăng nhập) | người | apps/web/src/features/landing/landing-screen.tsx:20-21 |
| Người dùng đã đăng nhập mở trang gốc (cùng hành vi như khách) | người | apps/web/src/routes/_proto/index.tsx:5-7 |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn — mỗi mệnh đề mang nhãn ✅/🔵/🟡. Chạy `/usecase landing-page` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Chỉ viết use case mà nguồn đủ; không có use case "thanh toán" hay "đăng ký" vì thuộc feature khác.
