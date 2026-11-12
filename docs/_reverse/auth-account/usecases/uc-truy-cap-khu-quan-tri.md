---
type: reverse-usecase
feature: auth-account
slug: truy-cap-khu-quan-tri
status: approved
updated: 2026-11-12
---

# UC: Truy cập khu vực quản trị

> Đã duyệt (#134). Nhãn ✅. Spec: [auth-account-reverse-spec.md](../auth-account-reverse-spec.md).

**a. Tên & mô tả:** Chỉ quản trị viên vào được `/admin/disputes` và `/admin/forecast`. ✅ [apps/web/src/routes/admin/disputes.tsx; apps/web/src/routes/admin/forecast.tsx]

**b. Actor:** Quản trị viên (email nằm trong danh sách admin); người dùng không phải admin; máy chủ. ✅ [packages/api/src/auth-utils.ts]

**c. Tiền điều kiện:** Người dùng mở địa chỉ khu quản trị. ✅

**d. Hậu điều kiện:** Admin: vào màn hình quản trị. Người khác: chuyển `/auth` (không phiên) hoặc `/app/dashboard`. ✅

**e. Luồng chính:**
1. Hệ thống hỏi phiên: có. ✅
2. Hệ thống gọi kiểm tra quyền admin ở máy chủ; máy chủ so email với danh sách (trim, không phân biệt hoa/thường). ✅
3. Thành công: vào màn hình. ✅

**f. Luồng thay thế:**
- 1a. Không có phiên: chuyển `/auth` (không kèm redirect). ✅
- 2a. Không phải admin: máy chủ trả FORBIDDEN "Admin access required" (E-auth-account-011) → web chuyển `/app/dashboard`. ✅
- 2b. Lỗi bất kỳ khác (kể cả mạng): cũng chuyển `/app/dashboard` — *fail-closed* an toàn có chủ ý, đã khóa bằng unit test (#134, OQ-9). ✅

**g. Ngoại lệ:** API không phiên: UNAUTHORIZED "Authentication required" (E-auth-account-010) ✅; danh sách admin rỗng hoặc chưa cấu hình: không ai là admin ✅.

**h. Quy tắc & ghi chú:** BR-auth-account-018, BR-auth-account-019, BR-auth-account-027. Hai route admin đã có unit test (#134).
