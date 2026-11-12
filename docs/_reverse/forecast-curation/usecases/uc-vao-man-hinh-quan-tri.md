---
type: reverse-usecase
feature: forecast-curation
slug: uc-vao-man-hinh-quan-tri
status: draft
updated: 2026-11-11
---

# UC: Vào màn hình quản trị đề forecast

> Tái lập từ code, CHƯA duyệt. Mỗi mệnh đề mang nhãn ✅/🔵/🟡. Priority: TBD 🟡 (OQ-1).

**a. Tên & mục tiêu:** Vào màn hình quản trị đề forecast. Truy cập công cụ duyệt đề forecast. 🟡 (mục tiêu là suy luận)

**b. Actor chính:** Quản trị viên ✅ [S10: packages/api/src/index.ts:31-38]

**c. Tiền điều kiện:** Có tài khoản; email nằm trong danh sách quản trị cấu hình. ✅ [S10: packages/api/src/index.ts:31-38]

**d. Trigger:** Mở đường dẫn /admin/forecast. ✅ [S8: apps/web/src/routes/admin/forecast.tsx:7]

**e. Luồng chính:**

1. Hệ thống lấy phiên đăng nhập. ✅ [S8: apps/web/src/routes/admin/forecast.tsx:9]
2. Hệ thống kiểm tra quyền quản trị. ✅ [S8: apps/web/src/routes/admin/forecast.tsx:16-19]
3. Hệ thống hiển thị màn hình "Duyệt đề Forecast" và tải danh sách quý 2026-Q1. ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:52,96-100,256-260]

**f. Luồng thay thế / ngoại lệ:**

- Chưa đăng nhập: chuyển sang /auth. ✅ [S8: apps/web/src/routes/admin/forecast.tsx:10-14] (E-001)
- Kiểm tra quyền lỗi bất kỳ (kể cả không phải quản trị viên): chuyển về /app/dashboard. ✅ [S8: apps/web/src/routes/admin/forecast.tsx:20-24] (E-002; OQ-17)
- Danh sách tải trả lỗi quyền: hiển thị "Truy cập bị từ chối". ✅ [S7: apps/web/src/features/admin/forecast-admin-screen.tsx:86-87,235-247] (E-002)

**g. Hậu điều kiện:** Quản trị viên thấy màn hình quản trị hoặc bị chuyển hướng.

**h. Truy vết:**

| Hạng mục | Liên kết |
|----------|----------|
| FR | FR-001..004, 035 (tiền tố FR-forecast-curation-) |
| Business Rule | BR-024; NFR-001 (tiền tố BR-forecast-curation-) |
| Screen | Màn hình quản trị; khối Truy cập bị từ chối |
| Error | E-001, E-002 (tiền tố E-forecast-curation-) |
| OQ | OQ-14, OQ-15, OQ-17 |
| Nguồn | S7, S8, S10, S11 |
