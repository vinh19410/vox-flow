# Runbook Cập Nhật Đề Forecast Mỗi Quý (`forecast-update`)

Runbook này hướng dẫn quy trình vận hành định kỳ cho người sở hữu sản phẩm để đưa bộ đề forecast IELTS Speaking mới lên hệ thống mỗi quý từ 3 nguồn (tự soạn, học viên báo, thu thập web), sử dụng công cụ AI gộp trùng thành bản nháp và thực hiện duyệt thủ công trước khi xuất bản.

---

## Lịch cập nhật đề forecast mỗi quý

Đề thi IELTS Speaking thường đổi theo chu kỳ 3 quý trong năm theo thông lệ quốc tế:
1. **Quý 1 (Tháng 1 – Tháng 4):**
   - Đợt cập nhật lớn (khoảng 50% số đề Part 1 & Part 2/3 được thay mới).
   - Thời gian thực hiện: Bắt đầu thu thập từ ngày 01 đến ngày 10 tháng 1; hoàn tất duyệt bản nháp trước ngày 15 tháng 1.
2. **Quý 2 (Tháng 5 – Tháng 8):**
   - Đợt cập nhật giữa năm (khoảng 50% số đề cũ được thay thế).
   - Thời gian thực hiện: Thu thập từ ngày 01 đến ngày 10 tháng 5; hoàn tất duyệt bản nháp trước ngày 15 tháng 5.
3. **Quý 3 (Tháng 9 – Tháng 12):**
   - Đợt cập nhật cuối năm.
   - Thời gian thực hiện: Thu thập từ ngày 01 đến ngày 10 tháng 9; hoàn tất duyệt bản nháp trước ngày 15 tháng 9.

Hàng tuần trong quý: Người sở hữu sản phẩm vào màn hình quản trị `/admin/forecast` để theo dõi các báo cáo đề mới do học viên gửi về và gộp bổ sung.

---

## Các bước thực hiện cập nhật và duyệt đề

### Bước 1: Thu thập dữ liệu từ 3 nguồn
1. **Nguồn tự soạn (manual):** Người sở hữu sản phẩm chuẩn bị các chủ đề mới dựa trên giáo trình hoặc chuyên môn khảo thí.
2. **Nguồn học viên báo (student):** Hệ thống tự động ghi nhận báo cáo từ học viên qua endpoint `forecast.reportTopic` vào bảng `forecast_report`. Chỉ đếm báo cáo từ tài khoản học viên thực tế (unique `(userId, topicId)`).
3. **Nguồn thu thập từ web (web):** Thu thập tín hiệu chủ đề từ các diễn đàn hoặc nhóm luyện thi công khai. **Lưu ý:** Giữ lại URL nguồn gốc (`sourceUrl`) phục vụ đối chiếu và kiểm duyệt.

### Bước 2: Chạy công cụ gộp trùng AI (Deduplication)
1. Đưa các nguồn thô vào module `deduplicateAndDraftTopics`:
   - AI thực hiện đối sánh ngữ nghĩa giữa các đề có cùng quý và phần thi.
   - Gộp các đề trùng lặp từ nhiều nguồn thành một chủ đề duy nhất.
   - **Quy tắc an toàn bất biến:** Mọi đầu ra từ công cụ AI luôn ở trạng thái `status: 'draft'` (bản nháp). AI tuyệt đối không thể tự động xuất bản đề lên hệ thống.

### Bước 3: Duyệt và chỉnh sửa trên giao diện quản trị
1. Đăng nhập với tài khoản có email trong cấu hình `ADMIN_EMAILS`.
2. Truy cập màn hình quản trị tại `/admin/forecast`.
3. Chọn quý cần làm việc (ví dụ: `2026-Q1`).
4. Kiểm tra từng bản nháp:
   - Nhấn **Sửa** để chuẩn hóa lại câu hỏi (tiếng Anh chuẩn, rõ ràng, không sai ngữ pháp).
   - Kiểm tra nguồn gốc và đường dẫn tham chiếu.
   - Đối với câu hỏi từ nguồn web: đảm bảo nội dung câu hỏi đã được viết lại hoàn toàn, không sao chép nguyên văn.
5. Nhấn **Duyệt** (`Publish`): Hệ thống tự động ghi nhận mã định danh người duyệt (`reviewedBy = session.user.id`) và thời gian duyệt (`reviewedAt = now`). Trạng thái chuyển sang `published`.
6. Đối với các đề cũ hoặc không còn phù hợp: Nhấn **Lưu trữ** (`Archive`).

---

## Bản quyền và rủi ro pháp lý đối với nguồn web (theo #8 / OQ-6)

Căn cứ theo hồ sơ tư vấn pháp lý OQ-6 (`docs/legal/oq-6-tu-van-luat-su.md`) và Quyết định D-04:

1. **Bản chất của nguồn đề thi IELTS trên mạng:**
   - Các tổ chức sở hữu kỳ thi (British Council, IDP, Cambridge) nắm bản quyền đối với các tài liệu và đề thi chính thức do họ phát hành.
   - Các câu hỏi và chủ đề lưu truyền trên mạng thực chất là do thí sinh đi thi về nhớ lại (recalled questions), bản thân các trang web này không sở hữu độc quyền chủ đề thực tế.

2. **Quy tắc tuân thủ bản quyền bắt buộc khi đưa lên Vox Flow:**
   - **Tuyệt đối không sao chép nguyên văn (copy verbatim)** văn bản, bài văn mẫu, hoặc hệ thống câu hỏi độc quyền từ bất kỳ trang web cụ thể nào.
   - Nguồn web chỉ được sử dụng làm **tín hiệu chủ đề (topic signal)** (ví dụ: phát hiện chủ đề "Describe an energetic person" đang xuất hiện trong phòng thi).
   - Hệ thống và người sở hữu sản phẩm bắt buộc phải **viết lại (rewrite/paraphrase)** toàn bộ câu hỏi và gợi ý trả lời theo phong cách và ngôn ngữ riêng của Vox Flow.
   - Lưu trữ `sourceUrl` trong bảng `forecast_source` nhằm mục đích kiểm tra chéo nội bộ (audit trail), chứng minh tính độc lập khi biên soạn và không xâm phạm bản quyền của bên thứ ba.
