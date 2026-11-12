---
type: reverse-usecase
feature: forecast-curation
slug: uc-tao-ban-nhap
status: draft
updated: 2026-11-11
---

# UC: Tạo bản nháp đề thủ công

> Tái lập từ code, CHƯA duyệt. Mỗi mệnh đề mang nhãn ✅/🔵/🟡. Priority: TBD 🟡 (OQ-1).

**a. Tên & mục tiêu:** Tạo bản nháp đề thủ công. Thêm một đề mới vào quý đang chọn với nguồn và danh sách câu hỏi. 🟡 (mục tiêu là suy luận)

**b. Actor chính:** Quản trị viên ✅ [S10: packages/api/src/index.ts:31-38]

**c. Tiền điều kiện:** Đã vào màn hình quản trị; đã chọn quý. ✅

**d. Trigger:** Bấm "Thêm bản nháp". ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:320-330]

**e. Luồng chính:**

1. Quản trị viên điền tiêu đề, Part, loại nguồn, URL (nếu Web), ghi chú nguồn, câu hỏi mỗi dòng một câu. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:525-612]
2. Quản trị viên bấm "Tạo bản nháp"; màn hình kiểm tra tiêu đề và URL. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:167-176]
3. Hệ thống tạo đề trạng thái nháp, tách nhóm câu hỏi nếu Part 2, ghi 1 nguồn. ✅ [S1: packages/api/src/routers/forecast-admin.ts:134-178]
4. Đề mới hiện đầu danh sách, form đóng và đặt lại. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:200-228]

**f. Luồng thay thế / ngoại lệ:**

- Tiêu đề rỗng: "Vui lòng nhập tiêu đề cho chủ đề." ✅ (E-010)
- Web thiếu/sai URL: "Nguồn web bắt buộc có URL hợp lệ (bắt đầu bằng http:// hoặc https://)." ✅ (E-011)
- Máy chủ từ chối (Title is required, Quarter is required, Only HTTP/HTTPS URLs are allowed, sourceUrl is required for web sources): hiện lỗi trong hộp thoại. ✅ (E-005..008)
- Lỗi không có thông điệp: "Tạo bản nháp thất bại". ✅ (E-012)

**g. Hậu điều kiện:** Đề mới tồn tại với trạng thái nháp, chưa có người duyệt. ✅ [S2: packages/api/src/routers/forecast-admin.test.ts:126-127,189-193]

**h. Truy vết:**

| Hạng mục | Liên kết |
|----------|----------|
| FR | FR-012..019 (tiền tố FR-forecast-curation-) |
| Business Rule | BR-001, BR-007..010 (tiền tố BR-forecast-curation-) |
| Screen | Hộp thoại Thêm bản nháp đề mới |
| Error | E-004..008, E-010..012 (tiền tố E-forecast-curation-) |
| OQ | OQ-12, OQ-18 |
| Nguồn | S1, S2, S7, S9 |
