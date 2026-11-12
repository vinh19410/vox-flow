---
type: reverse-usecase
feature: forecast-curation
slug: uc-nhap-nguon-tho-gop-trung
status: draft
updated: 2026-11-11
---

# UC: Nhập nguồn thô và gộp trùng thành bản nháp

> Tái lập từ code, CHƯA duyệt. Mỗi mệnh đề mang nhãn ✅/🔵/🟡. Priority: TBD 🟡 (OQ-1).

**a. Tên & mục tiêu:** Nhập nguồn thô và gộp trùng thành bản nháp. Đưa nhiều nguồn thô (tự soạn, học viên báo, web) vào để hệ thống gộp đề giống nhau thành bản nháp. 🟡 (mục tiêu là suy luận)

**b. Actor chính:** Quản trị viên (qua API, không có màn hình) ✅ [S10: packages/api/src/index.ts:31-38]

**c. Tiền điều kiện:** Là quản trị viên có phiên đăng nhập. ✅ [S10: packages/api/src/index.ts:15-38]

**d. Trigger:** Gọi thao tác nhập nguồn thô với danh sách nguồn. ✅ [S1: packages/api/src/routers/forecast-admin.ts:368] Người gọi thực tế chưa rõ 🟡 (OQ-2).

**e. Luồng chính:**

1. Hệ thống kiểm tra từng nguồn (tiêu đề thô, quý, part, URL; web bắt buộc URL). ✅ [S1: packages/api/src/routers/forecast-admin.ts:370-391]
2. Hệ thống gộp các nguồn cùng quý và part có tiêu đề giống từ 0,25 trở lên. ✅ [S3: packages/api/src/forecast/dedupe.ts:165-195]
3. Với cụm có nguồn web: đổi "describe" đầu tiêu đề thành "Describe" và viết IN HOA từ hỏi đầu câu hỏi (không diễn đạt lại); loại câu hỏi trùng. ✅ [S3: packages/api/src/forecast/dedupe.ts:207-232]
4. Hệ thống ghi từng bản nháp (trạng thái nháp) cùng các nguồn gốc. ✅ [S1: packages/api/src/routers/forecast-admin.ts:398-423]
5. Hệ thống trả số nguồn đã xử lý, số bản nháp tạo, danh sách bản nháp. ✅ [S1: packages/api/src/routers/forecast-admin.ts:433-437]

**f. Luồng thay thế / ngoại lệ:**

- Danh sách rỗng: trả 0 và 0. ✅ [S4: packages/api/src/forecast/dedupe.test.ts:145-148]
- Sai ràng buộc: lỗi kiểm tra đầu vào, không ghi gì. ✅ (E-007..009)
- Không quyền/không phiên: FORBIDDEN / UNAUTHORIZED. ✅ (E-001, E-002)

**g. Hậu điều kiện:** Các bản nháp mới xuất hiện trong danh sách theo quý; không đối chiếu đề đã có trong kho. ✅ [S1: packages/api/src/routers/forecast-admin.ts:394-409; S3: packages/api/src/forecast/dedupe.ts:168]

**h. Truy vết:**

| Hạng mục | Liên kết |
|----------|----------|
| FR | FR-027..034 (tiền tố FR-forecast-curation-) |
| Business Rule | BR-001, BR-014..021 (tiền tố BR-forecast-curation-) |
| Screen | (không có màn hình) 🟡 |
| Error | E-001, E-002, E-007..009 (tiền tố E-forecast-curation-) |
| OQ | OQ-2, OQ-3, OQ-4, OQ-8, OQ-10, OQ-11, OQ-20 |
| Nguồn | S1, S2, S3, S4 |
