---
type: reverse-usecase
feature: forecast-curation
slug: uc-sua-ban-nhap
status: draft
updated: 2026-11-11
---

# UC: Sửa tiêu đề và câu hỏi của đề

> Tái lập từ code, CHƯA duyệt. Mỗi mệnh đề mang nhãn ✅/🔵/🟡. Priority: TBD 🟡 (OQ-1).

**a. Tên & mục tiêu:** Sửa tiêu đề và câu hỏi của đề. Chuẩn hóa tiêu đề và câu hỏi của một đề. 🟡 (mục tiêu là suy luận)

**b. Actor chính:** Quản trị viên ✅ [S10: packages/api/src/index.ts:31-38]

**c. Tiền điều kiện:** Đề đã có trong danh sách (mọi trạng thái). ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:418-430]

**d. Trigger:** Bấm "Sửa" trên thẻ đề. ✅

**e. Luồng chính:**

1. Hệ thống mở hộp thoại "Chỉnh sửa đề thi nháp" với tiêu đề và câu hỏi hiện tại. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:421-425,469]
2. Quản trị viên sửa và bấm "Lưu thay đổi". ✅
3. Hệ thống cập nhật tiêu đề, câu hỏi (Part 2 tách nhóm và giữ cờ đề mới), giữ nguyên trạng thái. ✅ [S1: packages/api/src/routers/forecast-admin.ts:219-259]
4. Màn hình cập nhật thẻ và đóng hộp thoại. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:152-159]

**f. Luồng thay thế / ngoại lệ:**

- "Hủy": đóng, không đổi. ✅ [S9: apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:139-142]
- Mã đề không tồn tại: "Forecast topic not found" ở banner đầu trang. ✅ (E-003)
- Tiêu đề rỗng: lỗi kiểm tra đầu vào ở banner đầu trang, hộp thoại vẫn mở. 🔵 (E-009, E-014)

**g. Hậu điều kiện:** Nội dung đề đổi; trạng thái không đổi, kể cả đề đã duyệt (nội dung xuất bản đổi ngay). ✅ [S1: packages/api/src/routers/forecast-admin.ts:219-257]; ý đồ 🟡 (OQ-7)

**h. Truy vết:**

| Hạng mục | Liên kết |
|----------|----------|
| FR | FR-020..022 (tiền tố FR-forecast-curation-) |
| Business Rule | BR-006, BR-009..012 (tiền tố BR-forecast-curation-) |
| Screen | Hộp thoại Chỉnh sửa đề thi nháp |
| Error | E-003, E-009, E-014 (tiền tố E-forecast-curation-) |
| OQ | OQ-7, OQ-9, OQ-12, OQ-18 |
| Nguồn | S1, S2, S7, S9 |
