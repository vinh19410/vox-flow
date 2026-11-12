---
type: reverse-usecase-index
feature: billing
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/billing/billing-reverse-spec.md
---

# billing — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-xem-goi-va-trang-thai](./uc-xem-goi-va-trang-thai.md) | Xem các gói và gói hiện tại | Người học | FR-billing-001..004, 023..026 | Trang Gói và thanh toán, bảng giá trang giới thiệu | — | OQ-5..7, 10, 13 | S1, S2, S5 | ✅ |
| [uc-thanh-toan-qr-chon-goi](./uc-thanh-toan-qr-chon-goi.md) | Chọn gói và thanh toán QR (mô phỏng) | Người học | FR-billing-005..016 | Cửa sổ thanh toán | E-billing-001..003 | OQ-1..4, 8, 11, 14 | S4, S8, S16 | ✅ |
| [uc-mo-khoa-tu-ket-qua](./uc-mo-khoa-tu-ket-qua.md) | Mở khóa chi tiết từ màn kết quả (paywall) | Người dùng chưa trả phí | FR-billing-019..022 | Dải paywall mềm, cửa sổ paywall | E-billing-001 | OQ-4, 10, 15 | S6, S11, S12 | 🟡 |
| [uc-ve-goi-mien-phi](./uc-ve-goi-mien-phi.md) | Chuyển về gói miễn phí | Người học có gói | FR-billing-017, 018 | Trang Gói và thanh toán | — | OQ-6, 11 | S2 | ✅ |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Người học đã đăng nhập (mục tiêu là suy luận, 🟡) | người | S2, S14 |
| Người dùng chưa trả phí (thấy dải paywall) | người | S11 |
| Ngân hàng / SePay | ngoài (chưa nối, thay bằng nút giả lập) | S4, S20 |

## Ma trận truy vết UC - FR - Screen - Error - OQ

| UC | FR | Screen | Error | OQ |
|----|----|--------|-------|----|
| uc-xem-goi-va-trang-thai | FR-billing-001..004, 023..026 | Trang Gói và thanh toán, trang giới thiệu | — | OQ-5, 6, 7, 10, 13 |
| uc-thanh-toan-qr-chon-goi | FR-billing-005..016 | Cửa sổ thanh toán | E-billing-001, 002, 003 | OQ-1, 2, 3, 4, 8, 11, 14 |
| uc-mo-khoa-tu-ket-qua | FR-billing-019..022 | Dải paywall, cửa sổ paywall | E-billing-001 | OQ-4, 10, 15 |
| uc-ve-goi-mien-phi | FR-billing-017, 018 | Trang Gói và thanh toán | — | OQ-6, 11 |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn, nhãn nêu trên là nhãn của hành vi giao diện. "Thu tiền thật" KHÔNG có use case vì code không có (Gap G-1); không bịa.
* Use case quản trị (xem giao dịch, đối soát, hoàn tiền) không có trong code, ghi Gap, không viết use case.
