# Delivery Readiness Rules (`delivery-readiness.md`)

Tiêu chí sẵn sàng chuyển giao giữa các bước BA → QC → Automation / Dev:

1. **Requirement Testability:** Mọi `FR` / `NFR` / `E` được coi là sẵn sàng kiểm thử khi có kết quả quan sát được (observable outcome), wording lỗi rõ ràng hoặc tiêu chí đo lường cụ thể; không chứa từ mơ hồ (`nhanh`, `thân thiện`, `nếu có`, `hoặc`).
2. **Coverage Closure (`/test-checklist`):** Một phạm vi kiểm thử chỉ đóng được khi mọi nghĩa vụ kiểm thử (`eligible` — không tính `excluded-approved` đã có BA duyệt kèm lý do + ngày) đều đạt trạng thái `covered`. Các mục `blocked` / `tbd` / `partial` phải được cảnh báo rõ ở L1.
3. **Codegen-ready vs Run-ready (`/test-cases` → `/playwright-gen` / `/api-test`):**
   - **Not-ready:** Còn bất kỳ trường `TBD` nào ở `Preconditions`, `Expected`, hoặc `Test Data` → gom vào bảng `## Cần bổ sung`, không đưa vào tự động hoá.
   - **Codegen-ready:** Đủ thông tin nghiệp vụ (không còn `TBD`) để sinh kịch bản kiểm thử.
   - **Run-ready:** Môi trường đích (`baseURL`), seed data / fixture và trạng thái tiên quyết đã sẵn sàng để thực thi thật. Khi môi trường chưa bật (connection refused), ghi nhận `PENDING`, không kết luận `FAIL` giả.
