---
type: reverse-usecase
feature: dispute-admin
slug: chap-nhan-khieu-nai
status: draft
updated: 2026-11-11
---

# UC: Chấp nhận khiếu nại, nâng band và phản hồi học viên

> Tái lập từ code, CHƯA duyệt. Nhãn: ✅ / 🔵 / 🟡.

**a. Mục tiêu:** Admin ghi nhận AI chấm khắt khe, chọn band mới, gửi phản hồi cho học viên và đóng ca. 🟡 [S1:228-288][S11:194-222]

**b. Actor chính:** Quản trị viên ✅. **Actor phụ:** học viên (người nhận kết quả, ngoài scope) ✅ [S18:329-338].

**c. Tiền điều kiện:** Admin đã mở ca đang open/reviewing. ✅ [S11:527-531]

**d. Hậu điều kiện:** Ca chuyển sang trạng thái đã chấp nhận, lưu band mới, band cũ, phản hồi, thời điểm xử lý; danh sách và số liệu tải lại. KHÔNG cập nhật điểm bài thi, KHÔNG thông báo học viên (OQ-2, OQ-3). ✅ [S1:258-268][S11:213-215]

**e. Luồng chính:**
1. Hộp thoại mặc định chọn "Nâng band điểm (Chấp nhận)", band mới = band kỳ vọng, phản hồi = mẫu "Chấp nhận nâng band". ✅ [S11:154-165]
2. Admin có thể đổi band mới (7 mức), sửa ô "Band cũ", chọn mẫu khác, sửa nội dung phản hồi. ✅ [S11:555-616]
3. Admin bấm "Xác nhận & Hoàn tất" (khóa khi phản hồi rỗng hoặc đang gửi; nhãn "Đang gửi..."). ✅ [S11:622-629]
4. Hệ thống kiểm tra ca tồn tại, chưa xử lý, có band, rồi cập nhật có điều kiện và trả thành công. ✅ [S1:231-287]
5. Giao diện đóng hộp thoại và tải lại số liệu + hàng đợi. ✅ [S11:213-215]

**f. Luồng thay thế / ngoại lệ:**
- 4a. Ca đã xử lý: "Báo lỗi này đã được xử lý trước đó" (E-005). ✅ [S1:244-249]
- 4b. Thiếu band: "Vui lòng chọn band điểm cập nhật khi chấp nhận khiếu nại" (E-006). ✅ [S1:251-256]
- 4c. Hai admin cùng lúc: "Báo lỗi này đã được xử lý bởi người khác" (E-007). ✅ [S1:277-282]
- 4d. Ca không tồn tại: E-004. ✅
- 4e. Lỗi chung: "Lỗi khi xử lý báo lỗi" (E-017); lỗi hiện ở thân trang, hộp thoại giữ nguyên. ✅ [S11:217, S11:303-307]
- 2a. Đổi band mới sau khi chọn mẫu: nội dung phản hồi không tự đổi theo (BR-030). ✅ [S11:180-191]

**g. Quy tắc / FR liên quan:** BR-010..BR-016, BR-029, BR-030, BR-032; FR-010, FR-012..FR-016, FR-027..FR-030. Test: S2:224-248 (đường vui), S2:250-263 (đã xử lý). Chưa có test cho 4b, 4c. Priority: TBD 🟡.

**h. Màn hình / Lỗi / OQ:** SCR-02; E-004..E-008, E-017; OQ-2, OQ-3, OQ-5, OQ-10, OQ-11, OQ-16, OQ-19.

