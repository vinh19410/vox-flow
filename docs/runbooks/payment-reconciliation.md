# Hướng dẫn đối soát và xử lý giao dịch thanh toán (Runbook)

Tài liệu này hướng dẫn người sở hữu sản phẩm (PO) và quản trị viên quy trình đối soát, xử lý các giao dịch chuyển khoản sai lệch hoặc trễ hạn trên `/admin/payments` (tính năng `payment-reconciliation`, #20), đảm bảo **SLA phản hồi và xử lý học viên trong vòng 24 giờ** kể từ lúc giao dịch phát sinh.

Các cấu hình tài khoản SePay, hợp đồng webhook, danh sách IP WAF và quy trình xoay khóa xem tại [docs/runbooks/sepay-setup.md](./sepay-setup.md).

## Nguyên tắc chung và bảo mật

- **Quyền truy cập hàng đợi:** Chỉ tài khoản quản trị có email nằm trong biến môi trường `ADMIN_EMAILS` mới truy cập được `/admin/payments` (theo cơ chế `adminProcedure`).
- **Cô lập và bảo mật dữ liệu tài khoản:**
  - Không bao giờ ghi đầy đủ số tài khoản ngân hàng vào runbook, ghi chú thao tác, issue, PR hoặc commit git; khi cần tham chiếu chỉ ghi tối đa 4 chữ số cuối (ví dụ: `****1234`).
  - Bảng `payment_event` trên D1 **không lưu** nội dung chuyển khoản thô (`content`, `description`) và số dư sau giao dịch (`accumulated`) để tránh lộ dữ liệu sao kê cá nhân qua bản sao lưu D1 (xem `packages/db/src/schema/billing.ts` và `packages/api/src/data-registry.ts`).
- **Hoàn tiền thủ công ngoài ngân hàng:** Hệ thống không tự động hoàn tiền và không thực hiện lệnh chuyển tiền từ ứng dụng. Mọi giao dịch cần hoàn tiền đều do quản trị viên chuyển khoản thủ công qua ngân hàng bên ngoài. (Chưa xuất hóa đơn VAT trong MVP theo Quyết định D-11 tại [docs/product-decisions.md](../product-decisions.md)).
- **Bắt buộc ghi chú và lưu vết kiểm toán:** Mọi thao tác xử lý tay trên `/admin/payments` (`activate` hoặc `markRefunded`) **bắt buộc có ghi chú** và được ghi nhận vào bảng `payment_action` (`eventId`, `orderId`, `action`, `note`, `actorEmail`, `createdAt`). Chỉ ghi thông tin đối soát cần thiết (`referenceCode`, số tiền đã hoàn/xử lý, lý do), không dán thông tin cá nhân dư thừa vào ghi chú.
- **Cam kết thời gian xử lý (SLA):** Phản hồi và hoàn tất xử lý (kích hoạt hoặc hoàn tiền) cho học viên trong vòng **24 giờ** kể từ lúc giao dịch phát sinh.

## underpaid

Giao dịch chuyển **thiếu tiền** so với giá trị đơn hàng (`transferAmount < order.amountVnd`).

- **SLA phản hồi / xử lý:** Trong vòng **24 giờ** kể từ lúc giao dịch phát sinh.
- **Chính sách:** **Chỉ hoàn tiền thủ công ngoài ngân hàng** và đánh dấu hoàn tiền; **không hỗ trợ chuyển bù** thêm cho đơn cũ. Nếu vẫn muốn mua gói, học viên tạo đơn mới và thanh toán lại đúng số tiền.
- **Các bước xử lý:**
  1. Mở giao dịch trong hàng đợi `/admin/payments` và đối chiếu với sao kê giao dịch trên `my.sepay.vn` (`referenceCode`, thời gian, số tiền thực nhận `transferAmount`, số tiền đơn `amountVnd`).
  2. Chuyển khoản hoàn lại đúng số tiền thực nhận (`transferAmount`) cho học viên bằng ứng dụng ngân hàng bên ngoài.
  3. Trên `/admin/payments`, bấm **Đánh dấu hoàn tiền** (`markRefunded`) và nhập ghi chú bắt buộc (ghi rõ: hoàn tiền do chuyển thiếu, số tiền đã hoàn, `referenceCode` / mã tham chiếu giao dịch hoàn tiền).
  4. Phản hồi học viên xác nhận đã hoàn tiền và hướng dẫn tạo đơn hàng mới nếu tiếp tục mua gói.

## overpaid

Giao dịch chuyển **thừa tiền** so với giá trị đơn hàng (`transferAmount > order.amountVnd`).

- **SLA phản hồi / xử lý:** Trong vòng **24 giờ** kể từ lúc giao dịch phát sinh.
- **Chính sách:** Hệ thống **không tự động kích hoạt** gói đối với giao dịch thừa tiền. Giao dịch được giữ ở hàng đợi để quản trị viên kiểm tra và chọn phương án xử lý phù hợp với xác nhận của học viên.
- **Các bước xử lý:**
  1. Kiểm tra giao dịch trên `/admin/payments` và đối chiếu sao kê trên `my.sepay.vn` để xác nhận số tiền thực nhận (`transferAmount`), giá trị đơn (`amountVnd`) và khoản tiền thừa (`transferAmount - amountVnd`).
  2. Liên hệ / xác nhận với học viên và thực hiện một trong hai hướng:
     - **Phương án A — Kích hoạt gói và hoàn phần tiền thừa:** Bấm `activate` trên `/admin/payments` để kích hoạt gói cho đơn hàng, đồng thời chuyển khoản hoàn lại đúng phần tiền thừa thủ công ngoài ngân hàng.
     - **Phương án B — Hoàn lại toàn bộ số tiền:** Nếu học viên không muốn tiếp tục đơn (hoặc chuyển nhầm), chuyển khoản hoàn lại toàn bộ `transferAmount` ngoài ngân hàng rồi bấm `markRefunded` trên `/admin/payments`.
  3. **Ghi chú bắt buộc:** Luôn ghi rõ **số tiền thừa đã hoàn** (hoặc toàn bộ số tiền đã hoàn) và **`referenceCode` / mã tham chiếu ngân hàng** vào ô ghi chú khi bấm `activate` hoặc `markRefunded` để lưu vào `payment_action`.

## unknown_code

Giao dịch chuyển khoản **sai hoặc thiếu mã thanh toán** (`VF...`), khiến hệ thống không đối chiếu được đơn hàng và giao dịch chưa gắn `orderId` (`orderId = null`).

- **SLA phản hồi / xử lý:** Trong vòng **24 giờ** kể từ lúc giao dịch phát sinh.
- **Các bước xử lý:**
  1. Kiểm tra thông tin giao dịch `unknown_code` trên `/admin/payments` (`transferAmount`, `transactionDate`, `referenceCode`, `gateway`).
  2. Liên hệ hoặc tiếp nhận yêu cầu từ học viên để xác minh quyền sở hữu giao dịch: yêu cầu cung cấp **ảnh biên lai chuyển khoản**, **số tiền**, **thời gian chuyển** và **`referenceCode`**, đối chiếu khớp với sao kê trên `my.sepay.vn`.
  3. Tra cứu đơn `pending` hoặc `expired` tương ứng của học viên trên hệ thống:
     - **Nếu tìm thấy đơn khớp và học viên muốn kích hoạt:** Chọn gắn `orderId` tương ứng với giao dịch và bấm `activate` trên `/admin/payments` kèm ghi chú bắt buộc (mã đơn đã gắn, `referenceCode`, kết quả xác minh biên lai).
     - **Nếu không tìm thấy đơn phù hợp hoặc học viên không còn nhu cầu:** Chuyển khoản hoàn tiền thủ công ngoài ngân hàng và bấm `markRefunded` trên `/admin/payments` kèm ghi chú bắt buộc (số tiền hoàn, `referenceCode`, lý do không khớp đơn).

## expired_order

Giao dịch được chuyển **trễ sau khi mã QR đã hết hạn 15 phút** (`ORDER_QR_TTL_MS` trong `packages/api/src/billing/plans.ts`), khi đơn hàng đã chuyển sang trạng thái `expired`. Hệ thống giữ giao dịch ở hàng đợi thay vì tự động kích hoạt.

- **SLA phản hồi / xử lý:** Trong vòng **24 giờ** kể từ lúc giao dịch phát sinh.
- **Các bước xử lý:**
  1. Kiểm tra giao dịch và đơn hàng gắn kèm trên `/admin/payments`; kiểm tra xem học viên đã tạo và thanh toán một đơn mới thay thế hay chưa.
  2. Xác minh điều kiện hợp lệ tại thời điểm xử lý:
     - Số tiền thực nhận (`transferAmount`) khớp giá gói của đơn.
     - **Đối với gói `exam` ("Đến ngày thi"):** Kiểm tra ngày thi lưu trên đơn (`examDateSnapshot`) vẫn còn ở tương lai / hợp lệ (theo quy tắc `validateExamDateForOrder` tại `packages/api/src/billing/plans.ts`).
  3. Ra quyết định và thao tác trên `/admin/payments`:
     - **Nếu học viên vẫn muốn kích hoạt và giá gói / ngày thi (với gói `exam`) còn hợp lệ:** Bấm `activate` kèm ghi chú bắt buộc (xác nhận đơn trễ hạn QR 15 phút, đã kiểm tra giá và ngày thi hợp lệ).
     - **Nếu học viên không còn nhu cầu, đơn đã bị hủy/thay thế, hoặc giá / ngày thi gói `exam` không còn hợp lệ:** Chuyển khoản hoàn tiền thủ công ngoài ngân hàng rồi bấm `markRefunded` kèm ghi chú bắt buộc (`referenceCode`, số tiền hoàn, lý do hoàn).

## Lưu ý hoàn tiền gói Theo lượt (`pack`)

- Gói `pack` cấp **3 lượt mở chi tiết** trong bảng `detail_credit`; mỗi lần học viên mở khóa phân tích chi tiết của một bài thi được ghi nhận vào bảng `detail_unlock`.
- Khi quản trị viên bấm `markRefunded` cho một đơn thuộc gói `pack`, hệ thống **thu hồi các lượt chưa sử dụng** trong `detail_credit` **nhưng giữ nguyên các bài đã mở (`detail_unlock`)** mà học viên đã dùng lượt trước đó.
- Trước khi hoàn tiền ngoài ngân hàng cho đơn `pack` (hoặc các gói theo thời hạn), cần kiểm tra phần quyền lợi học viên đã tiêu thụ trên hệ thống để trao đổi rõ ràng với học viên theo chính sách hỗ trợ.

## Kiểm tra định kỳ và xử lý khi lỡ webhook

- **Cơ chế quét định kỳ (`sweepTransactions`):**
  - Cloudflare Cron chạy mỗi giờ (`0 * * * *`, khai báo trong `packages/infra/alchemy.run.ts` và điều phối tại `apps/server/src/scheduled.ts`) gọi `sweepTransactions` bằng `SEPAY_API_TOKEN` để truy vấn giao dịch từ SePay API và bổ sung các giao dịch bị lỡ webhook.
  - Khóa duy nhất `sepayId` (`UNIQUE` trên `payment_event`) đảm bảo giao dịch đã được webhook xử lý sẽ không bị kích hoạt hay ghi nhận hai lần; giao dịch được bù qua cron áp dụng cùng logic phân loại như webhook (`matched` tự kích hoạt, ngoại lệ vào hàng đợi `/admin/payments`).
- **Quy trình xử lý khi nghi ngờ webhook bị lỡ:**
  1. Kiểm tra `my.sepay.vn` → *Tích hợp → Webhooks → Lịch sử gửi* để xem webhook có bị lỗi HTTP khác `200`/`201` hoặc timeout quá ~33 phút retry Fibonacci của SePay hay không (chi tiết xem [docs/runbooks/sepay-setup.md](./sepay-setup.md)).
  2. Chờ lần chạy cron `sweepTransactions` vào đầu giờ tiếp theo, hoặc bấm **Replay** cho giao dịch tương ứng trên dashboard SePay.
  3. Nếu cả Replay và cron hàng giờ đều không ghi nhận được giao dịch: kiểm tra log Cloudflare Worker cho `handleScheduled` / `POST /webhooks/sepay`, đồng thời xác nhận `SEPAY_API_TOKEN` và `SEPAY_WEBHOOK_API_KEY` chưa hết hạn hoặc chưa bị thu hồi (nếu cần xoay khóa, làm theo mục `## Xoay khóa` trong [docs/runbooks/sepay-setup.md](./sepay-setup.md)).
  4. Sau khi khắc phục, kiểm tra lại hàng đợi `/admin/payments` và trạng thái đơn hàng của học viên để đảm bảo không bỏ sót trong khung SLA **24 giờ**.
