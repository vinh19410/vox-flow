# Runbook Xử Lý Báo Lỗi Chấm Điểm (`score-dispute`)

Runbook này hướng dẫn quy trình vận hành cho người sở hữu sản phẩm trực tiếp xử lý các khiếu nại báo lỗi chấm điểm từ học viên, đảm bảo cam kết giải quyết trong 72 giờ (SLA theo OQ-4), bảo vệ quyền riêng tư âm thanh và sử dụng các mẫu phản hồi chuẩn mực.

---

## Quy trình

Quy trình chuẩn gồm 5 bước xử lý trực tiếp trên giao diện quản trị:

### 1. Truy cập hàng đợi
- Đăng nhập tài khoản quản trị viên (email được cấu hình trong `ADMIN_EMAILS`).
- Truy cập vào đường dẫn `/admin/disputes`.
- Hàng đợi được sắp xếp tự động theo hạn chót giải quyết (`dueAt` tăng dần), ưu tiên các báo lỗi sắp quá hạn (cảnh báo màu vàng khi thời gian còn dưới 12 giờ).

### 2. Tiếp nhận và đối chiếu hồ sơ
- Nhấn **Xử lý khiếu nại** để mở hồ sơ chi tiết của học viên.
- Kiểm tra tiêu chí khiếu nại (`targetCriterion`), band điểm hiện tại (`previousBand`), band kỳ vọng (`expectedBand`) và lý do học viên ghi chú.
- Kiểm tra quyền truy cập âm thanh:
  - **Nếu học viên đồng ý (`shareConsent = true`):** Được phép nghe lại các câu trả lời âm thanh qua player tích hợp trên màn hình để đánh giá phát âm, độ trôi chảy và ngữ điệu.
  - **Nếu học viên không đồng ý (`shareConsent = false`):** Tuyệt đối không được tìm cách truy cập file audio. Quản trị viên chỉ đối chiếu dựa trên bản ghi văn bản transcript đã lưu trữ.

### 3. Đưa ra quyết định chuyên môn
- **Trường hợp 1 (Chấp nhận khiếu nại):** Nếu nhận thấy AI đánh giá quá khắt khe hoặc bỏ sót cấu trúc ngữ pháp/từ vựng tốt, chọn **Nâng band điểm (Chấp nhận)** và chọn band điểm mới (ví dụ: nâng từ 6.0 lên 6.5). Điểm mới sẽ được lưu vào `resolvedBand`, giữ lại `previousBand` đối chiếu.
- **Trường hợp 2 (Từ chối khiếu nại):** Nếu điểm số AI đã phản ánh chính xác các lỗi sai và tiêu chí IELTS chuẩn, chọn **Giữ nguyên điểm (Từ chối)**.

### 4. Gửi phản hồi học viên
- Chọn mẫu trả lời phù hợp trong danh sách mẫu có sẵn để tiết kiệm thời gian, hoặc điều chỉnh nội dung cho phù hợp với trường hợp cụ thể.
- Nhấn **Xác nhận & Hoàn tất**. Hệ thống tự động cập nhật trạng thái hồ sơ, ghi nhận thời điểm hoàn tất (`resolvedAt = now`). Học viên có thể xem kết quả trực tiếp trên màn hình kết quả bài thi.

### 5. Kích hoạt tính năng cho toàn hệ thống
- Mặc định, cờ tính năng `SCORE_DISPUTE_ENABLED` được đặt là `false` để ngăn học viên gửi báo lỗi khi quản trị viên chưa sẵn sàng.
- Khi quy trình hàng đợi và nhân sự đã sẵn sàng, người sở hữu sản phẩm thiết lập:
  ```bash
  SCORE_DISPUTE_ENABLED=true
  ```
  trong biến môi trường (`packages/infra/alchemy.run.ts` hoặc Cloudflare Workers Dashboard) và thực hiện triển khai lại hệ thống.

---

## Mẫu trả lời

Quản trị viên sử dụng 3 mẫu phản hồi chuẩn hóa sau:

### Mẫu 1: Chấp nhận nâng điểm
> "Chào bạn, sau khi rà soát bài thi phần {targetCriterion}, ban chuyên môn xác nhận hệ thống AI đã chấm khắt khe hơn tiêu chí IELTS chuẩn. Điểm của bạn đã được cập nhật thành Band {resolvedBand}. Chúc bạn ôn tập tốt và đạt mục tiêu thi sắp tới!"

### Mẫu 2: Giữ nguyên điểm số
> "Chào bạn, sau khi xem xét chi tiết bài thi phần {targetCriterion}, ban chuyên môn nhận thấy kết quả hiện tại đã phản ánh chính xác các tiêu chí chấm điểm IELTS (về ngữ pháp, từ vựng hoặc phát âm). Điểm số của bạn được giữ nguyên. Cảm ơn bạn đã phản hồi để hệ thống ngày càng hoàn thiện hơn!"

### Mẫu 3: Rà soát không có audio (theo transcript)
> "Chào bạn, do bạn không đồng ý chia sẻ bản ghi âm cho lần báo lỗi này, ban chuyên môn chỉ có thể đối chiếu bài thi dựa trên dữ liệu văn bản transcript. Điểm số của bạn đã được xem xét kỹ lưỡng theo đúng tiêu chí chuẩn. Cảm ơn bạn!"

---

## Khi nào tìm thêm người

Theo quyết định D-04 và OQ-4, người sở hữu sản phẩm tự mình xử lý khiếu nại trong giai đoạn đầu nhằm tiết kiệm chi phí và nắm bắt trực tiếp chất lượng AI. Tuy nhiên, cần tìm thêm người hỗ trợ (mở rộng nhóm giám khảo theo #30) khi vi phạm một trong hai ngưỡng sau:

1. **Số lượng báo lỗi quá tải:** Khi số lượng khiếu nại gửi về vượt quá **5 báo lỗi/tuần** (`> 5 báo lỗi/tuần`).
2. **Nguy cơ vi phạm cam kết 72 giờ:** Khi tỷ lệ giải quyết đúng hạn giảm xuống dưới **90%** (`< 90%`).

Khi đạt một trong hai ngưỡng này:
- Kích hoạt kế hoạch mở rộng quy trình phân công nhiều giám khảo rà soát (thuộc WI-26 / Issue #30).
- Xem xét lại bộ tham số hiệu chuẩn chấm điểm (prompt/scoring criteria) của hệ thống AI chấm.
