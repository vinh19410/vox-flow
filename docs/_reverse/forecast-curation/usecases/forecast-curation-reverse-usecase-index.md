---
type: reverse-usecase-index
feature: forecast-curation
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/forecast-curation/forecast-curation-reverse-spec.md
---

# forecast-curation — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-vao-man-hinh-quan-tri](./uc-vao-man-hinh-quan-tri.md) | Vào màn hình quản trị đề forecast | Quản trị viên | FR-001..004, 035 | Màn hình quản trị; khối Truy cập bị từ chối | E-001, E-002 | OQ-14, OQ-15, OQ-17 | S7, S8, S10, S11 | ✅ |
| [uc-xem-danh-sach-ban-nhap](./uc-xem-danh-sach-ban-nhap.md) | Xem danh sách đề theo quý và trạng thái | Quản trị viên | FR-005..011 | Danh sách đề | E-002, E-013 | OQ-13, OQ-19 | S1, S2, S7, S9 | ✅ |
| [uc-tao-ban-nhap](./uc-tao-ban-nhap.md) | Tạo bản nháp đề thủ công | Quản trị viên | FR-012..019 | Hộp thoại Thêm bản nháp đề mới | E-004..008, E-010..012 | OQ-12, OQ-18 | S1, S2, S7, S9 | ✅ |
| [uc-nhap-nguon-tho-gop-trung](./uc-nhap-nguon-tho-gop-trung.md) | Nhập nguồn thô và gộp trùng thành bản nháp | Quản trị viên (qua API, không có màn hình) | FR-027..034 | (không có màn hình) 🟡 | E-001, E-002, E-007..009 | OQ-2, OQ-3, OQ-4, OQ-8, OQ-10, OQ-11, OQ-20 | S1, S2, S3, S4 | ✅ |
| [uc-sua-ban-nhap](./uc-sua-ban-nhap.md) | Sửa tiêu đề và câu hỏi của đề | Quản trị viên | FR-020..022 | Hộp thoại Chỉnh sửa đề thi nháp | E-003, E-009, E-014 | OQ-7, OQ-9, OQ-12, OQ-18 | S1, S2, S7, S9 | ✅ |
| [uc-duyet-xuat-ban-de](./uc-duyet-xuat-ban-de.md) | Duyệt (xuất bản) đề | Quản trị viên | FR-023, 024 | Thẻ đề (nút Duyệt) | E-003, E-004, E-012 | OQ-7, OQ-19 | S1, S2, S7, S15 | ✅ |
| [uc-luu-tru-de](./uc-luu-tru-de.md) | Lưu trữ đề | Quản trị viên | FR-025, 026 | Thẻ đề (nút Lưu trữ) | E-003, E-004, E-012 | OQ-7 | S1, S2, S7, S15 | ✅ |

Nhãn cột cuối: ✅ cho luồng lấy từ code/test; riêng UC nhập nguồn thô, phần "ai gọi và gọi bằng gì" là 🟡 (OQ-2). Mục tiêu (mục a) của mọi UC là suy luận 🟡, không tính vào cột Nhãn. Ma trận UC ↔ FR ↔ Screen ↔ Error ↔ OQ nằm ngay trong bảng trên (tiền tố FR-forecast-curation-, E-forecast-curation-).

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Quản trị viên | người | S10 packages/api/src/index.ts:31-45 |
| Người dùng chưa đăng nhập / không là quản trị viên | người (ca bị từ chối) | S10 packages/api/src/index.ts:15-38 |
| Hệ thống gộp trùng | hệ thống | S3 packages/api/src/forecast/dedupe.ts:124-239 |
| Dịch vụ AI (chưa có bản cài đặt) | ngoài | S3 packages/api/src/forecast/dedupe.ts:27-43 (🟡) |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn. Chạy `/usecase forecast-curation` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Không có UC cho: bỏ lưu trữ, đưa đề về nháp, xóa đề, xem người duyệt/thời điểm duyệt, nhập nguồn thô từ màn hình, vì code không có chức năng tương ứng (xem `reverse-gaps.md`, OQ-2, OQ-7, OQ-19).
* UC phía học viên (xem đề đã duyệt, báo đã gặp) thuộc feature `forecast-practice`.
