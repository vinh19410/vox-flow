---
type: reverse-usecase
feature: forecast-curation
slug: uc-duyet-xuat-ban-de
status: draft
updated: 2026-11-11
---

# UC: Duyệt (xuất bản) đề

> Tái lập từ code, CHƯA duyệt. Mỗi mệnh đề mang nhãn ✅/🔵/🟡. Priority: TBD 🟡 (OQ-1).

**a. Tên & mục tiêu:** Duyệt (xuất bản) đề. Cho phép đề đến tay học viên sau khi đã kiểm tra. 🟡 (mục tiêu là suy luận)

**b. Actor chính:** Quản trị viên ✅ [S10: packages/api/src/index.ts:31-38]

**c. Tiền điều kiện:** Có đề trạng thái nháp trong danh sách. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:432]

**d. Trigger:** Bấm "Duyệt". ✅

**e. Luồng chính:**

1. Hệ thống đặt trạng thái đã duyệt, ghi người duyệt là tài khoản đang đăng nhập và thời điểm duyệt. ✅ [S1: packages/api/src/routers/forecast-admin.ts:298-308]
2. Màn hình đổi huy hiệu thành "Đã duyệt" và ẩn nút Duyệt. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:108-114]

**f. Luồng thay thế / ngoại lệ:**

- Đề không tồn tại: "Forecast topic not found". ✅ (E-003)
- Đọc lại thất bại: "Failed to publish forecast topic". ✅ (E-004)
- Lỗi không thông điệp: "Duyệt đề thất bại". ✅ (E-012)

**g. Hậu điều kiện:** Đề ở trạng thái đã duyệt, học viên xem và báo đã gặp được. ✅ [S15: packages/api/src/routers/forecast.ts:38,101-106]

**h. Truy vết:**

| Hạng mục | Liên kết |
|----------|----------|
| FR | FR-023, 024 (tiền tố FR-forecast-curation-) |
| Business Rule | BR-002, BR-003, BR-023 (tiền tố BR-forecast-curation-) |
| Screen | Thẻ đề (nút Duyệt) |
| Error | E-003, E-004, E-012 (tiền tố E-forecast-curation-) |
| OQ | OQ-7, OQ-19 |
| Nguồn | S1, S2, S7, S15 |
