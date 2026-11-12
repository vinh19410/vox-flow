---
type: reverse-usecase
feature: dispute-admin
slug: xem-chi-tiet-va-nghe-audio
status: draft
updated: 2026-11-11
---

# UC: Xem chi tiết ca và nghe lại bản ghi âm khi học viên đồng ý

> Tái lập từ code, CHƯA duyệt. Nhãn: ✅ / 🔵 / 🟡.

**a. Mục tiêu:** Admin xem thông tin ca và nghe audio từng câu để đối chiếu, chỉ khi học viên đã đồng ý chia sẻ. 🟡 [S1:148-226][S11:468-524]

**b. Actor chính:** Quản trị viên ✅. **Actor phụ:** Kho R2 (ngoài) ✅ [S7:365-373].

**c. Tiền điều kiện:** Admin đã vào màn hình; ca tồn tại. ✅

**d. Hậu điều kiện:** Hộp thoại hiển thị thông tin ca; không đổi dữ liệu. ✅

**e. Luồng chính:**
1. Admin bấm "Xử lý khiếu nại" (hoặc "Xem chi tiết" với ca đã xử lý). ✅ [S11:418-422]
2. Giao diện đặt giá trị mặc định cho biểu mẫu rồi tải chi tiết ca. ✅ [S11:154-171]
3. Hộp thoại hiện học viên, tiêu chí khiếu nại, band kỳ vọng, lý do. ✅ [S11:446-466]
4. Nếu học viên đồng ý: nhãn "Được phép nghe" và trình phát cho từng câu (kèm "Part N: nội dung câu hỏi"). ✅ [S11:474-510]
5. Admin bấm phát; cổng tải audio kiểm tra: chủ bài hoặc admin có đồng ý mới được; trả luồng audio. ✅ [S7:301-394][S8:23-37]

**f. Luồng thay thế / ngoại lệ:**
- 1a. Ca không tồn tại: "Không tìm thấy hồ sơ khiếu nại" (E-003). ✅ [S1:176-181]
- 4a. Học viên không đồng ý: nhãn "Không được phép nghe", thông báo "⚠️ Không xem được audio", không có trình phát; API không cấp đường dẫn. ✅ [S11:477-480, S11:513-523][S1:218-224]
- 5a. Lỗi cổng audio: 401 / 403 / 404 / 503 (E-010..E-014). ✅ [S7:304-368]
- 5b. Ca đã xử lý vẫn nghe được nếu có đồng ý (OQ-8). ✅ [S7:322-340]
- Không có transcript hay điểm AI trong hộp thoại (OQ-9). ✅ [S1:195-209]

**g. Quy tắc / FR liên quan:** BR-006..BR-009; FR-007, FR-008, FR-009, FR-025, FR-026, FR-034. Priority: TBD 🟡.

**h. Màn hình / Lỗi / OQ:** SCR-02; E-003, E-010..E-014, E-016; OQ-8, OQ-9. Test: S2:204-220, S9:35-110, S13:156-181.

