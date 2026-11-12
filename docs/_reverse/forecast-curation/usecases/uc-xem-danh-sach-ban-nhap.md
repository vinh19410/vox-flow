---
type: reverse-usecase
feature: forecast-curation
slug: uc-xem-danh-sach-ban-nhap
status: draft
updated: 2026-11-11
---

# UC: Xem danh sách đề theo quý và trạng thái

> Tái lập từ code, CHƯA duyệt. Mỗi mệnh đề mang nhãn ✅/🔵/🟡. Priority: TBD 🟡 (OQ-1).

**a. Tên & mục tiêu:** Xem danh sách đề theo quý và trạng thái. Xem các đề của một quý cùng nguồn và số học viên đã báo gặp, để quyết định sửa/duyệt/lưu trữ. 🟡 (mục tiêu là suy luận)

**b. Actor chính:** Quản trị viên ✅ [S10: packages/api/src/index.ts:31-38]

**c. Tiền điều kiện:** Đã vào được màn hình quản trị (UC vào màn hình). ✅

**d. Trigger:** Chọn quý, bấm Làm mới, hoặc mở màn hình. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:96-100,309-319]

**e. Luồng chính:**

1. Hệ thống tải đề của quý đã chọn, mới tạo trước, kèm nguồn và số học viên khác nhau đã báo. ✅ [S1: packages/api/src/routers/forecast-admin.ts:21-105]
2. Quản trị viên chọn tab Tất cả / Bản nháp / Đã duyệt / Lưu trữ để lọc ngay trên trình duyệt. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:249-252]
3. Hệ thống hiển thị mỗi đề: Part, tiêu đề, huy hiệu trạng thái, câu hỏi (có nhãn [Cue]/[Part 3]), số báo, nguồn. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:345-412]

**f. Luồng thay thế / ngoại lệ:**

- Không có đề nào: hiển thị "Không có đề nào phù hợp với bộ lọc.". ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:338]
- Lỗi tải khác: banner lỗi với thông điệp thô. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:89] (E-013)
- Lỗi quyền: màn "Truy cập bị từ chối". ✅ (E-002)

**g. Hậu điều kiện:** Danh sách hiển thị; không thay đổi dữ liệu.

**h. Truy vết:**

| Hạng mục | Liên kết |
|----------|----------|
| FR | FR-005..011 (tiền tố FR-forecast-curation-) |
| Business Rule | BR-013, BR-022, BR-025 (tiền tố BR-forecast-curation-) |
| Screen | Danh sách đề |
| Error | E-002, E-013 (tiền tố E-forecast-curation-) |
| OQ | OQ-13, OQ-19 |
| Nguồn | S1, S2, S7, S9 |
