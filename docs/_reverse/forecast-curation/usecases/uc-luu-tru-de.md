---
type: reverse-usecase
feature: forecast-curation
slug: uc-luu-tru-de
status: draft
updated: 2026-11-11
---

# UC: Lưu trữ đề

> Tái lập từ code, CHƯA duyệt. Mỗi mệnh đề mang nhãn ✅/🔵/🟡. Priority: TBD 🟡 (OQ-1).

**a. Tên & mục tiêu:** Lưu trữ đề. Rút đề cũ hoặc không phù hợp khỏi học viên. 🟡 (mục tiêu lấy từ runbook, code không nói)

**b. Actor chính:** Quản trị viên ✅ [S10: packages/api/src/index.ts:31-38]

**c. Tiền điều kiện:** Có đề chưa lưu trữ trong danh sách. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:443]

**d. Trigger:** Bấm "Lưu trữ". ✅

**e. Luồng chính:**

1. Hệ thống đặt trạng thái lưu trữ, cập nhật thời điểm sửa, giữ người duyệt cũ. ✅ [S1: packages/api/src/routers/forecast-admin.ts:345-351]
2. Màn hình đổi huy hiệu thành "Lưu trữ" và ẩn nút Lưu trữ. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:127-129]

**f. Luồng thay thế / ngoại lệ:**

- Đề không tồn tại: "Forecast topic not found". ✅ (E-003)
- Đọc lại thất bại: "Failed to archive forecast topic". ✅ (E-004)
- Lỗi không thông điệp: "Lưu trữ đề thất bại". ✅ (E-012)

**g. Hậu điều kiện:** Đề trạng thái lưu trữ, học viên không còn thấy. ✅ [S15: packages/api/src/routers/forecast.ts:38]; không có đường bỏ lưu trữ trên giao diện 🟡 (OQ-7).

**h. Truy vết:**

| Hạng mục | Liên kết |
|----------|----------|
| FR | FR-025, 026 (tiền tố FR-forecast-curation-) |
| Business Rule | BR-004, BR-005, BR-023 (tiền tố BR-forecast-curation-) |
| Screen | Thẻ đề (nút Lưu trữ) |
| Error | E-003, E-004, E-012 (tiền tố E-forecast-curation-) |
| OQ | OQ-7 |
| Nguồn | S1, S2, S7, S15 |
