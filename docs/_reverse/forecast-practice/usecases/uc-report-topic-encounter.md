---
type: reverse-usecase
feature: forecast-practice
slug: report-topic-encounter
status: draft
updated: 2026-11-11
---

# UC: Báo đã gặp một chủ đề trong kỳ thi (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên báo mình đã gặp chủ đề này trong kỳ thi thật (kèm ghi chú), để tăng "số thí sinh báo gặp". 🟡 [S1: packages/api/src/routers/forecast.ts:87-135] · mục tiêu nghiệp vụ và cách gọi từ giao diện 🟡

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên đã đăng nhập | S16: packages/api/src/index.ts:15-24 | ✅ |
| Tiền điều kiện | Chủ đề ở trạng thái đã đăng | S1: packages/api/src/routers/forecast.ts:101 | ✅ |

**c. Trigger.** Không có nút hay màn nào trên web gọi chức năng này (negative-search N1). Test gọi trực tiếp với ghi chú ví dụ "Met this topic in IDP Hanoi". 🟡 [S2: packages/api/src/routers/forecast.test.ts:115-118]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Học viên gửi mã chủ đề và ghi chú tùy chọn | FR-forecast-practice-025 | S1: packages/api/src/routers/forecast.ts:89-92 | ✅ |
| 2 | Hệ thống xác nhận chủ đề đã đăng và học viên chưa báo chủ đề này | FR-forecast-practice-025 | S1: packages/api/src/routers/forecast.ts:95-117 | ✅ |
| 3 | Ghi báo gặp và trả thành công với alreadyReported bằng false | FR-forecast-practice-025 | S1: packages/api/src/routers/forecast.ts:124-134 | ✅ |
| 4 | Số thí sinh báo gặp của chủ đề tăng 1 trong danh sách công khai | FR-forecast-practice-005 | S2: packages/api/src/routers/forecast.test.ts:121-123 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Chưa đăng nhập | UNAUTHORIZED "Authentication required" | E-forecast-practice-001 | S16: packages/api/src/index.ts:16-21 | ✅ |
| Chủ đề không có hoặc chưa đăng | NOT_FOUND "Published forecast topic not found" | E-forecast-practice-002 | S1: packages/api/src/routers/forecast.ts:101-105 | ✅ |
| Báo lại cùng chủ đề | Thành công, alreadyReported true, không ghi thêm | — | S20: packages/api/src/routers/forecast-admin.test.ts:239-245 | ✅ |
| Tham số sai kiểu | Lỗi kiểm tra dữ liệu vào (⚠️ chưa resolve câu chữ) | E-forecast-practice-004 | S1: packages/api/src/routers/forecast.ts:89-92 | ✅ |
| Ghi chú dài, báo nhiều chủ đề | Không giới hạn | — | S1: packages/api/src/routers/forecast.ts:91 | 🟡 |

**f. Hậu điều kiện.** Có đúng một bản ghi báo gặp cho cặp học viên-chủ đề; dữ liệu nằm trong gói xuất/xóa dữ liệu cá nhân. ✅ [S5: packages/db/src/schema/forecast.ts:78; S21: packages/api/src/data-registry.ts:106-123]

**g. Quy tắc liên quan.** BR-forecast-practice-007, 014..018. Tên gọi "báo lỗi chủ đề" trong yêu cầu giao việc khác ngữ nghĩa của code (Conflict C2). 🟡

**h. Nguồn và câu hỏi mở.** S1, S2, S5, S16, S20, S21. OQ-4, OQ-5, OQ-12. 🟡
