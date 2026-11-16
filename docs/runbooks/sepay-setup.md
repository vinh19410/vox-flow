# Hướng dẫn thiết lập và vận hành SePay (Runbook)

Tình trạng hộ kinh doanh: Sử dụng tài khoản cá nhân cho giai đoạn Beta/MVP theo quyết định của PO ngày 2026-11-16 (khi đóng #8, không qua tư vấn luật sư); chưa đăng ký hộ kinh doanh và chưa thu tiền học viên thật cho tới khi hoàn tất #20 và đạt cổng #21.

Tài liệu này hướng dẫn người sở hữu sản phẩm (PO) và đội ngũ kỹ thuật vận hành tài khoản SePay, đồng bộ bí mật qua GitHub Actions / Cloudflare Worker, bảo đảm hợp đồng kỹ thuật cho #19 (`billing`) và #20 (`payment-reconciliation`), thực hiện giao dịch thử và xoay khóa an toàn.

## Tài khoản

### 1. Phân định trách nhiệm và trạng thái hiện tại
- PO đã trực tiếp đăng ký tài khoản tại [SePay](https://my.sepay.vn) và liên kết tài khoản ngân hàng cá nhân nhận tiền cho môi trường Beta/MVP (xác nhận ngày `2026-11-16`).
- Agent và kỹ thuật viên tuyệt đối không yêu cầu, không nhập và không lưu trữ số tài khoản ngân hàng đầy đủ, token hay khóa bí mật trong mã nguồn hoặc tài liệu repository.

### 2. Quyết định pháp lý và điều kiện mở thu tiền thật
- Ngày `2026-11-16`, PO quyết định đóng #8 (OQ-6) không qua tư vấn luật sư, đưa điều khoản chuyển dữ liệu ra nước ngoài, giới hạn độ tuổi (16+) và quyền dữ liệu lên trang `/terms`.
- Phương án tài khoản thụ hưởng: dùng tài khoản ngân hàng cá nhân cho giai đoạn Beta/MVP; chưa đăng ký hộ kinh doanh.
- Tạm thời chưa thu tiền học viên thật cho tới khi hoàn tất #19, #20 và người sở hữu ký mở cổng kiểm tra tại #21 (`LAUNCH_OPEN=true`).

### 3. Quy tắc tương thích ngân hàng và VietQR (bàn giao cho #19)
- Chỉ các ngân hàng có `supported: true` trong danh sách `https://vietqr.app/banks.json` (23/54 ngân hàng tại thời điểm tham chiếu) mới hỗ trợ tự động hóa giao dịch SePay.
- **BIDV, OCB, MSB, KienLongBank (cá nhân / hộ kinh doanh):** bắt buộc cấu hình **VA (Virtual Account)** (truyền số VA chính thức vào `acc`, hoặc dùng VA theo ghi chú với tiền tố `TKP<mã>` trong `des` theo đúng tài liệu `qr-codes.md`).
- **VietinBank (cá nhân / hộ kinh doanh):** bắt buộc nội dung chuyển khoản (`des`) chứa chuỗi **`SEVQR`**; nếu thiếu, SePay sẽ không nhận được giao dịch.
- Khi #19 bổ sung biến cấu hình tài khoản nhận tiền (`SEPAY_BANK_ACCOUNT`, `SEPAY_BANK_CODE`), bắt buộc khai báo đồng bộ trong `packages/infra/alchemy.run.ts`, schema môi trường và `.github/workflows/deploy-beta.yml`.

### 4. Bảo mật và cô lập dữ liệu tài khoản cá nhân
- Không bao giờ ghi đầy đủ số tài khoản ngân hàng vào runbook, issue, PR hoặc commit git; khi cần tham chiếu chỉ ghi tối đa 4 chữ số cuối (ví dụ: `****1234`).
- Ưu tiên dùng tài khoản phụ chuyên biệt cho SePay nếu #19 sinh VietQR bằng số tài khoản thường. **Chỉ bật lọc theo VA (`VA mode: selected` / `only_va`)** trên SePay khi ngân hàng và #19 thực sự tạo giao dịch qua VA; nếu bật `only_va` trong khi #19 sinh QR bằng số tài khoản thường, SePay sẽ lọc bỏ toàn bộ giao dịch thanh toán của học viên.
- **Ràng buộc dữ liệu cho #19:** Không lưu trường số dư sau giao dịch (`accumulated`) hoặc chi tiết sao kê cá nhân dư thừa vào bảng `payment_event` trên D1, vì `.github/workflows/deploy-beta.yml` sao lưu định kỳ toàn bộ D1 lên GitHub Actions artifact (lưu 7 ngày).

## Webhook

### 1. Thông số tích hợp trên SePay (`my.sepay.vn` → Tích hợp → Webhooks)
- **URL tiếp nhận (Beta):** `https://api.vox.vinhtran.io.vn/webhooks/sepay` (phải trỏ đúng domain API Worker `api.vox.vinhtran.io.vn`, tuyệt đối không trỏ vào domain frontend SPA `vox.vinhtran.io.vn`).
- **Trạng thái bật/tắt trước khi có #19:** Giữ cấu hình webhook ở trạng thái **Tắt (Inactive)** cho tới khi #19 triển khai xong route `POST /webhooks/sepay` lên môi trường Beta để tránh bão retry `404` và cảnh báo lỗi liên tiếp (ngưỡng mặc định 3 lần).
- **Phương thức & sự kiện (`Step 1`):** `POST`, `Content-Type: application/json`, loại sự kiện `Tiền vào (Money in)` (`In_only`).
- **Retry & Cảnh báo (`Step 1 & 4`):** **BẬT** `Auto retry` (`retry_conditions.non_2xx_status_code = 1`) để kích hoạt cơ chế gửi lại Fibonacci (1, 1, 2, 3, 5, 8, 13 phút — tổng 8 lần trong khoảng ~33 phút); bật cảnh báo lỗi liên tiếp (mặc định 3 lần).
- **Phạm vi tài khoản & bộ lọc mã (`Step 2`):** Gắn đúng **1 tài khoản nhận tiền** (`bank_mode: single`, không chọn `all accounts`). **TẮT** tùy chọn *"Bỏ qua giao dịch không có mã thanh toán"* (`skip_if_no_code = OFF`) và không lọc cứng bằng `prefix_filters` trên SePay để mọi giao dịch sai/thiếu mã vẫn đi tới Worker cho #19 ghi `payment_event` và #20 phân loại `unknown_code`. Nếu #19 sử dụng trường `payload.code`, cần cấu hình *Payment code structure* (Company → General settings) khớp tiền tố mã đơn.
- **Xác thực (`Step 3`):** `API Key`, gửi qua header `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>` (khóa ngẫu nhiên tối thiểu 32 byte, chỉ hiển thị đầy đủ một lần duy nhất khi tạo).

### 2. Hợp đồng xử lý và phản hồi bắt buộc cho #19
- **Response Contract của SePay:** Một lần gửi webhook chỉ được SePay tính là thành công khi thỏa mãn đồng thời 3 điều kiện:
  1. HTTP status là **`200` hoặc `201`** (mọi mã `202`, `204` hay redirect đều bị SePay coi là **thất bại** và kích hoạt retry).
  2. Thân JSON chính xác là `{"success": true}`.
  3. Thời gian phản hồi trong vòng **30 giây** (connect timeout 15 giây).
- Mọi sự kiện hợp lệ về xác thực — bao gồm sự kiện trùng `id`, `transferType === "out"`, sai số tiền hoặc không khớp đơn hàng — đều phải được ghi nhận an toàn và trả về `HTTP 200` kèm JSON `{"success": true}`.
- **Kiểm tra an toàn trong handler #19 (`POST /webhooks/sepay`):**
  - Từ chối ngay nếu biến môi trường `SEPAY_WEBHOOK_API_KEY` rỗng hoặc chưa cấu hình.
  - Bóc tách tiền tố `Apikey` và đối chiếu khóa bằng hàm so sánh thời gian hằng số (`crypto.timingSafeEqual`).
  - Đối chiếu tài khoản thụ hưởng trước khi xét kích hoạt gói: khi dùng Official VA, webhook SePay trả `payload.accountNumber` là **số tài khoản gốc** và `payload.subAccount` là **số VA**; do đó #19 cần đối chiếu `payload.accountNumber` với số tài khoản gốc đã liên kết (và đối chiếu thêm `payload.subAccount` nếu cấu hình dùng Official VA).
  - Chống xử lý trùng lặp bằng ràng buộc `UNIQUE` trên cột lưu `payload.id` (`sepayId` kiểu số nguyên).

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2024-07-02 11:08:33",
  "accountNumber": "1017588888",
  "subAccount": "",
  "code": "SEVN63DC8E5C",
  "content": "SEVN63DC8E5C chuyen tien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 5000000,
  "accumulated": 105000000,
  "referenceCode": "FT24012345678"
}
```

### 3. Cấu hình Cloudflare WAF cho dải IP Outbound của SePay
- Trên Cloudflare zone `vinhtran.io.vn`, tạo rule **WAF Skip / Allowlist** cho đường dẫn `/webhooks/sepay` với các dải IP outbound của SePay để tránh Bot Fight Mode chặn `403` (kiểm tra cập nhật định kỳ tại `https://developer.sepay.vn/en/dia-chi-ip`):
  - **IPv4:** `172.236.138.20`, `172.233.83.68`, `171.244.35.2`, `151.158.108.68`, `151.158.109.79`, `103.255.238.139`, `45.57.137.67`
  - **IPv6:** `2400:8905::2000:8cff:fe98:45cd`, `2600:3c15::2000:8aff:fedd:874b`

### 4. Quản lý biến môi trường Worker, CI Beta và biến mở rộng (#19, #20)
- `SEPAY_WEBHOOK_API_KEY` đã được khai báo bằng `Config.Redacted("SEPAY_WEBHOOK_API_KEY")` tại `packages/infra/alchemy.run.ts:52` (kiểu TypeScript sinh tại `apps/server/src/env.ts:37`), nạp giá trị trong **GitHub Actions Environment `beta` secrets** (`secrets.SEPAY_WEBHOOK_API_KEY` tại `.github/workflows/deploy-beta.yml:83`) và triển khai tự động lên Worker `api.vox.vinhtran.io.vn`.
- **Phát triển cục bộ (Local Dev):** Khai báo chuỗi mô phỏng không rỗng trong file `.env.local` (được `.gitignore` bỏ qua) hoặc quản lý qua `ak secrets`.
- **Quản trị `SEPAY_API_TOKEN` cho #20:** Token gọi SePay API v2 (tạo tại `my.sepay.vn` → *Company settings → API Access → + Add API*) là chuỗi 64 ký tự chỉ hiển thị **1 lần duy nhất**, mang **toàn quyền công ty (no scopes)** và tách biệt giữa Test mode với Live mode. Khi #19 bổ sung `SEPAY_BANK_ACCOUNT`, `SEPAY_BANK_CODE` và #20 bổ sung `SEPAY_API_TOKEN` (`Config.Redacted`), bắt buộc cập nhật đồng thời `packages/infra/alchemy.run.ts`, schema môi trường và `.github/workflows/deploy-beta.yml`.

## Giao dịch thử

### 1. Kết quả kiểm thử thực tế ở WI-08
- PO đã thực hiện giao dịch thử `10.000 VND` ngày `2026-11-16` tới tài khoản cá nhân đã liên kết và xác nhận giao dịch hiển thị trạng thái **Thành công** trong mục **Giao dịch** trên `my.sepay.vn`.
- Bước kiểm tra SePay bắn webhook tới `https://api.vox.vinhtran.io.vn/webhooks/sepay` nhận `HTTP 200` + `{"success": true}` sẽ được nghiệm thu E2E trong #19 sau khi route webhook được viết và deploy lên Beta.

### 2. Quy trình kiểm thử E2E khi kích hoạt webhook ở #19
1. Bảo đảm PR #19 đã deploy route `POST /webhooks/sepay` lên `https://api.vox.vinhtran.io.vn`.
2. Trên `my.sepay.vn` → **Tích hợp → Webhooks**, bật trạng thái **Active** cho cấu hình webhook đã khai báo theo Mục `## Webhook` ở trên và bấm **Test send**.
3. Thực hiện một giao dịch chuyển khoản nhỏ (ví dụ `10.000 VND`) theo cú pháp đơn hàng thử nghiệm.
4. Kiểm tra mục **Giao dịch** trên SePay và bảng `payment_event` trên D1 xem dữ liệu đã khớp chưa.
5. Truy cập **Tích hợp → Webhooks → Lịch sử gửi** xác nhận phản hồi là `HTTP 200` cùng JSON body `{"success": true}`.

### 3. Nhật ký giao dịch thử nghiệm
| Ngày | Số tiền | Trạng thái SePay | Webhook HTTP | Ghi chú |
|---|---|---|---|---|
| 2026-11-16 | 10.000 VND | Thành công | Nghiệm thu ở #19 | PO xác nhận giao dịch xuất hiện trên my.sepay.vn; route POST /webhooks/sepay thuộc #19 |

## Xoay khóa

### 1. Quy trình xoay `SEPAY_WEBHOOK_API_KEY`
Mỗi cấu hình webhook trên SePay chỉ giữ một `api_key` và Worker hiện chỉ nhận một biến đơn `SEPAY_WEBHOOK_API_KEY` (`packages/infra/alchemy.run.ts:52`). Không tạo hai webhook song song bắn vào cùng URL vì 50% lượt gọi sẽ lỗi `401` và kích hoạt cảnh báo lỗi liên tiếp. Thực hiện tuần tự 4 bước sau:
1. **Sinh và cập nhật khóa mới trên SePay:** Tạo chuỗi ngẫu nhiên mạnh (`openssl rand -hex 32`), truy cập `my.sepay.vn` → Tích hợp → Webhooks → cập nhật khóa mới cho webhook hiện tại (khóa cũ mất hiệu lực ngay khi lưu).
2. **Cập nhật secret trong GitHub Environment `beta`:** Bắt buộc cập nhật để các lần merge tiếp theo vào `dev` không ghi đè lại khóa cũ:
   ```bash
   gh secret set SEPAY_WEBHOOK_API_KEY --env beta
   ```
3. **Triển khai Worker Beta theo quy trình an toàn:**
   - **Cách A (Khuyến nghị — qua CI Beta có sẵn bước sao lưu D1):**
     ```bash
     gh workflow run deploy-beta.yml --ref dev
     gh run watch
     ```
   - **Cách B (Triển khai trực tiếp từ máy quản trị khi có xác nhận của PO):** Bắt buộc cập nhật `SEPAY_WEBHOOK_API_KEY` mới vào tệp cấu hình môi trường cục bộ mà `varlock/auto-load` nạp (`packages/infra/alchemy.run.ts:5`, theo Cách 1 Mục 3.2 trong `docs/runbooks/cloudflare-deploy.md`) **trước khi deploy** để không ghi đè ngược khóa cũ lên Worker; nếu đồng thời lưu trong `ak secrets`, cập nhật bằng `ak secrets rotate` (hoặc `--force` nếu tạo mới), sau đó sao lưu D1 ra ngoài repo (nếu có migration mới) rồi chạy kèm `ALCHEMY_STAGE=prod` (không dùng `ak secrets run -- env ... pnpm ...` vì `ak secrets run` chặn launcher wrapper; tuyệt đối không dùng `pnpm deploy` hoặc `-- --stage prod`):
     ```bash
     # Nếu có lưu khóa trong ak secrets:
     ak secrets rotate SEPAY_WEBHOOK_API_KEY   # hoặc: ak secrets set SEPAY_WEBHOOK_API_KEY --force

     # Sau khi đã cập nhật khóa mới trong cấu hình env cục bộ và sao lưu D1 (nếu cần):
     ALCHEMY_STAGE=prod pnpm --filter @vox-flow/infra run deploy --yes
     ```
4. **Kiểm tra và phục hồi sự kiện trong thời gian chuyển đổi:** Dùng **Test send** trên SePay xác nhận webhook trả `HTTP 200` + `{"success": true}`, sau đó dùng **Replay** cho các giao dịch (nếu có) bị `401` trong lúc triển khai.

### 2. Quy trình xoay `SEPAY_API_TOKEN` (áp dụng từ #20 trở đi)
1. Vào `my.sepay.vn` → *Company settings → API Access → + Add API* tạo token mới (sao lưu an toàn ngay vì chỉ hiển thị 1 lần).
2. Cập nhật GitHub secret: `gh secret set SEPAY_API_TOKEN --env beta`.
3. Chạy lại `gh workflow run deploy-beta.yml --ref dev` và xác nhận job đối soát #20 chạy sạch.
4. Thu hồi `SEPAY_API_TOKEN` cũ trên dashboard SePay.

### 3. Lưu ý về khoảng thời gian chuyển đổi (Cutover Window)
- Trong vài phút cập nhật secret và deploy Worker, webhook gửi đến sẽ tạm nhận `401`.
- Khi đã bật `Auto retry` (`non_2xx_status_code = 1`), SePay tự động gửi lại theo lịch Fibonacci (1, 1, 2, 3, 5, 8, 13 phút — tổng 8 lần trong khoảng ~33 phút). Nếu thời gian gián đoạn vượt 33 phút, phục hồi bằng nút **Replay** trên SePay hoặc cron đối soát của #20.
