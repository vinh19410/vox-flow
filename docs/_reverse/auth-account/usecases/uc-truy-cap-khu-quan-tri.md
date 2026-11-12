---
type: reverse-usecase
feature: auth-account
slug: truy-cap-khu-quan-tri
status: draft
updated: 2026-11-11
---

# UC: Truy cập khu vực quản trị

> Tái lập chưa duyệt từ code. Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Chỉ quản trị viên vào được `/admin/disputes` và `/admin/forecast`. ✅ [apps/web/src/routes/admin/disputes.tsx:7-29; apps/web/src/routes/admin/forecast.tsx:7-29]

**b. Actor:** Quản trị viên (email nằm trong danh sách admin); người dùng không phải admin; máy chủ. ✅ [packages/api/src/auth-utils.ts:1-13]

**c. Tiền điều kiện:** Người dùng mở địa chỉ khu quản trị. ✅

**d. Hậu điều kiện:** Admin: vào màn hình quản trị. Người khác: chuyển `/auth` (không phiên) hoặc `/app/dashboard`. ✅

**e. Luồng chính:**
1. Hệ thống hỏi phiên: có. ✅ [apps/web/src/routes/admin/disputes.tsx:9-14]
2. Hệ thống gọi kiểm tra quyền admin ở máy chủ; máy chủ so email với danh sách (trim, không phân biệt hoa/thường). ✅ [apps/web/src/routes/admin/disputes.tsx:16-19; packages/api/src/index.ts:31-45]
3. Thành công: vào màn hình. ✅ [apps/web/src/routes/admin/disputes.tsx:26-28]

**f. Luồng thay thế:**
- 1a. Không có phiên: chuyển `/auth` (không kèm redirect). ✅ [apps/web/src/routes/admin/disputes.tsx:11-13]
- 2a. Không phải admin: máy chủ trả FORBIDDEN "Admin access required" (E-auth-account-011) → web chuyển `/app/dashboard`. ✅ [packages/api/src/routers/dispute-admin.test.ts:95-101]
- 2b. Lỗi bất kỳ khác (kể cả mạng): cũng chuyển `/app/dashboard` (OQ-9). ✅ [apps/web/src/routes/admin/disputes.tsx:20-24]

**g. Ngoại lệ:** API không phiên: UNAUTHORIZED "Authentication required" (E-auth-account-010) ✅ [packages/api/src/routers/dispute-admin.test.ts:103-109]; danh sách admin rỗng hoặc chưa cấu hình: không ai là admin ✅ [packages/api/src/auth-utils.test.ts:14-18].

**h. Quy tắc & ghi chú:** BR-auth-account-018, BR-auth-account-019, BR-auth-account-027. Hai route admin chưa có test (G-5, N-7).

