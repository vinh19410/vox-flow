---
type: reverse-usecase
feature: dispute-admin
slug: tu-choi-khieu-nai
status: draft
updated: 2026-11-11
---

# UC: Từ chối khiếu nại, giữ nguyên điểm và phản hồi học viên

> Tái lập từ code, CHƯA duyệt. Nhãn: ✅ / 🔵 / 🟡.

**a. Mục tiêu:** Admin xác nhận điểm AI đã đúng, giữ nguyên điểm, gửi lời giải thích và đóng ca. 🟡 [S1:228-288][S11:541-552]

**b. Actor chính:** Quản trị viên ✅. **Actor phụ:** học viên (người nhận) ✅.

**c. Tiền điều kiện:** Admin đã mở ca đang open/reviewing. ✅ [S11:527-531]

**d. Hậu điều kiện:** Ca chuyển sang đã từ chối; band mới để trống; lưu phản hồi, band cũ, thời điểm xử lý; học viên thấy huy hiệu "Báo lỗi không được chấp nhận". ✅ [S1:263][S18:333-338]

**e. Luồng chính:**
1. Admin chọn "Giữ nguyên điểm (Từ chối)" hoặc bấm mẫu "Giữ nguyên điểm số" (mẫu tự chuyển quyết định sang từ chối). ✅ [S11:186-190, S11:543-552]
2. Ô "Band mới cập nhật" bị ẩn; admin sửa phản hồi nếu cần. ✅ [S11:568-584]
3. Admin bấm "Xác nhận & Hoàn tất"; giao diện không gửi band mới. ✅ [S11:204-207]
4. Hệ thống kiểm tra ca, lưu đã từ chối với band mới trống. ✅ [S1:263]
5. Giao diện đóng hộp thoại và tải lại. ✅ [S11:213-215]

**f. Luồng thay thế / ngoại lệ:**
- Như UC chấp nhận: E-004, E-005, E-007, E-017 (E-006 không áp dụng). ✅
- 1a. Mẫu "Rà soát không có audio" không đổi quyết định; admin phải tự chọn từ chối nếu muốn. ✅ [S11:186-190]
- 4a. Nếu client gửi band khi từ chối, server bỏ qua. ✅ [S1:263]

**g. Quy tắc / FR liên quan:** BR-010, BR-012, BR-014, BR-015, BR-029; FR-011, FR-012, FR-014, FR-015, FR-029, FR-030. Chưa có test cho nhánh từ chối (OQ-19). Priority: TBD 🟡.

**h. Màn hình / Lỗi / OQ:** SCR-02; E-004, E-005, E-007, E-017; OQ-3, OQ-16, OQ-19.

