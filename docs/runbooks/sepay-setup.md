# Hướng dẫn thiết lập và vận hành SePay (Runbook)

Tình trạng hộ kinh doanh: chờ #8

Tài liệu này hướng dẫn người sở hữu sản phẩm và đội ngũ kỹ thuật thiết lập tài khoản SePay, cấu hình biến môi trường an toàn trên Cloudflare Worker, thực hiện kiểm thử và quy trình xoay khóa bảo mật.

## Tài khoản

### 1. Phân định trách nhiệm và đăng ký
- Người sở hữu sản phẩm trực tiếp thực hiện đăng ký và quản lý tài khoản tại [SePay](https://my.sepay.vn).
- Agent/kỹ thuật viên tuyệt đối không yêu cầu, không nhập và không lưu trữ thông tin ngân hàng cá nhân hoặc tổ chức trong mã nguồn hay tài liệu repository.
- Trạng thái hiện tại: Chờ người sở hữu sản phẩm đăng ký tài khoản SePay và liên kết tài khoản ngân hàng thụ hưởng.

### 2. Vấn đề pháp lý mở
- Câu hỏi về tư cách pháp nhân thụ hưởng ("Tài khoản nhận tiền đứng tên cá nhân hay hộ kinh doanh?") hiện đang chờ kết luận từ buổi tư vấn pháp lý thuộc issue #8 (OQ-6 Câu hỏi 1).
- Tạm thời chưa tiếp nhận thanh toán từ người dùng thật cho đến khi có ý kiến tư vấn pháp lý rõ ràng và tiêu chuẩn tại #21 được đáp ứng.

### 3. Nguyên tắc bảo mật thông tin tài khoản
- Không bao giờ ghi đầy đủ số tài khoản ngân hàng vào tài liệu runbook, issue hoặc commit git.
- Khi cần đối soát hoặc tham chiếu trong tài liệu, chỉ ghi tối đa 4 chữ số cuối (ví dụ: `Vietcombank ****1234`).

## Webhook

### 1. Thông số tích hợp webhook
- **URL tiếp nhận:** `https://<server-domain>/webhooks/sepay` (đường dẫn tiếp nhận webhook được hiện thực hóa trong issue #19).
- **Phương thức HTTP:** `POST`
- **Loại nội dung (Content-Type):** `application/json`
- **Loại sự kiện:** Tiền vào (`Money in`)
- **Phương thức xác thực:** `API Key` (gửi qua header `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>`).

### 2. Quản lý biến môi trường Worker
- Khóa webhook được khai báo trong `packages/infra/alchemy.run.ts` dưới dạng bảo mật `Config.Redacted("SEPAY_WEBHOOK_API_KEY")`.
- Biến được định nghĩa trong `apps/server/.env.schema` và import tại `packages/infra/.env.schema`.
- Giá trị khóa thực tế được thiết lập trực tiếp qua Cloudflare Worker Secrets / Alchemy secrets khi deploy, tuyệt đối không đưa vào git.

### 3. Hướng dẫn cho môi trường phát triển cục bộ (Local Dev)
- Để chạy `apps/server` hoặc `alchemy dev` trên máy cá nhân mà không bị chặn bởi kiểm tra biến môi trường, lập trình viên khai báo giá trị mô phỏng trong file gitignored `.env.local` hoặc cấu hình qua `ak secrets`.

## Giao dịch thử

### 1. Trạng thái kiểm thử
Chưa thực hiện — chờ người sở hữu thực hiện giao dịch thử và ghi nhận kết quả.

### 2. Quy trình thực hiện giao dịch thử
1. Đăng nhập vào trang quản trị SePay tại `https://my.sepay.vn`.
2. Thực hiện một giao dịch chuyển khoản với số tiền nhỏ (ví dụ: 10.000 VND) tới tài khoản ngân hàng đã liên kết, với nội dung chuyển khoản theo cú pháp quy định hoặc sử dụng VietQR test.
3. Kiểm tra mục **Giao dịch** trên SePay xem hệ thống đã ghi nhận giao dịch thành công chưa.
4. Truy cập **Tích hợp → Webhooks → Lịch sử gửi** để kiểm tra SePay gửi webhook thông báo và xác nhận trạng thái phản hồi HTTP 200.
5. Ghi nhận kết quả vào bảng nhật ký giao dịch thử bên dưới (không ghi thông tin nhạy cảm).

### 3. Nhật ký giao dịch thử nghiệm
| Ngày | Số tiền | Trạng thái SePay | Webhook HTTP | Ghi chú |
|---|---|---|---|---|
| *(Chờ kiểm thử)* | *(Ví dụ: 10.000đ)* | *(Thành công/Chờ xử lý)* | *(200)* | *(Chờ người sở hữu xác nhận)* |

## Xoay khóa

### 1. Quy trình xoay khóa định kỳ hoặc khi có sự cố lộ khóa
Khi cần thay đổi hoặc xoay `SEPAY_WEBHOOK_API_KEY`, thực hiện tuần tự theo các bước sau:
1. **Tạo khóa mới trên SePay:** Truy cập `my.sepay.vn` → Tích hợp Webhooks → Cấu hình webhook hiện tại → Sinh API Key mới (hoặc tạo cấu hình webhook song song nếu muốn chuyển tiếp mượt).
2. **Cập nhật bí mật Worker:** Cập nhật giá trị secret mới vào cấu hình triển khai Worker.
3. **Triển khai Worker mới:** Chạy lệnh triển khai hạ tầng:
   ```bash
   pnpm --filter @vox-flow/infra run deploy
   ```
4. **Kiểm tra kết nối:** Sử dụng tính năng "Test send" trong giao diện SePay để gửi một payload webhook mẫu đến Worker và xác nhận kết quả trả về HTTP 200.
5. **Thu hồi khóa cũ:** Xóa bỏ API Key cũ trên SePay sau khi xác nhận toàn bộ webhook gửi đến đều dùng khóa mới thành công.

### 2. Lưu ý về khoảng thời gian chuyển đổi (Cutover Window)
- Trong thời gian Worker cập nhật cấu hình và triển khai (thường mất vài chục giây), các webhook có thể gặp lỗi xác thực tạm thời nếu khóa chưa đồng bộ.
- SePay áp dụng chính sách tự động gửi lại (retry policy theo lịch Fibonacci: 1, 1, 2, 3, 5, 8, 13 phút gồm 8 lần thử trong khoảng 33 phút), do đó các sự kiện trong khoảng thời gian chuyển tiếp sẽ không bị thất thoát.
