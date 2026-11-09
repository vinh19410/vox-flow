# Runbook Triển Khai Backend Lên Cloudflare

Runbook này hướng dẫn cách thiết lập thông tin xác thực, cấu hình biến môi trường, triển khai hạ tầng backend (Cloudflare Worker và D1 Database) bằng Alchemy, cũng như quy trình kiểm tra và rollback cho Vox Flow.

---

## 1. Chuẩn bị thông tin xác thực và biến môi trường

Trước khi triển khai, người quản trị hoặc chủ sở hữu sản phẩm cần cung cấp các thông tin xác thực tài khoản Cloudflare và các biến môi trường cấu hình bí mật.

### 1.1. Thông tin xác thực Cloudflare
Alchemy sử dụng Cloudflare API Token để tương tác và tạo tài nguyên hạ tầng.
- **`CLOUDFLARE_API_TOKEN`**: Tạo token từ trang quản lý Cloudflare Dashboard (yêu cầu quyền truy cập Workers Scripts, D1, Pages/Website).
- **`CLOUDFLARE_ACCOUNT_ID`**: Lấy ID tài khoản tại thanh điều hướng bên phải của Cloudflare Dashboard.
- *(Tùy chọn tương đương)*: `CLOUDFLARE_API_KEY` và `CLOUDFLARE_EMAIL`.

> **Bảo mật tuyệt đối**: Không bao giờ commit các giá trị token hoặc ghi thẳng vào file mã nguồn. Quản lý an toàn qua biến môi trường hoặc hệ thống quản lý bí mật `ak secrets`.

### 1.2. Biến môi trường của ứng dụng
Theo định nghĩa trong `apps/server/.env.schema` và `packages/infra/alchemy.run.ts`:
- **`BETTER_AUTH_SECRET`**: Chuỗi bí mật ngẫu nhiên (tối thiểu 32 ký tự) dùng để ký session token cho Better Auth. Tạo nhanh bằng lệnh: `openssl rand -hex 32`.
- **`CORS_ORIGIN`**: Tên miền hoặc URL của frontend Web được phép gửi request đến Worker (ví dụ: `http://localhost:3001` cục bộ hoặc `https://vox.vinhtran.io.vn` khi triển khai). **Lưu ý**: Tuyệt đối không để dấu gạch chéo ở cuối (`/`).
- **`BETTER_AUTH_URL`**: Tự động được gán từ `Cloudflare.Worker.URL` trong runtime của Worker.
- **`GOOGLE_CLIENT_ID`**: Client ID của ứng dụng Google OAuth 2.0 tạo trên Google Cloud Console (loại Web Application).
- **`GOOGLE_CLIENT_SECRET`**: Client Secret tương ứng của ứng dụng Google OAuth 2.0.

### 1.3. Cấu hình Google Cloud Console OAuth Client
Trên Google Cloud Console (APIs & Services > Credentials > OAuth 2.0 Client IDs):
- **Authorized JavaScript origins**:
  - Cục bộ: `http://localhost:3001`
  - Triển khai: `https://vox.vinhtran.io.vn`
- **Authorized redirect URIs**:
  - Cục bộ: `http://localhost:3000/api/auth/callback/google`
  - Triển khai: `https://api.vox.vinhtran.io.vn/api/auth/callback/google`

> **Lưu ý về Cookie và Domain (WI-07)**: Do `workers.dev` nằm trong danh sách Public Suffix List (PSL), hai worker `web-xyz.workers.dev` và `server-xyz.workers.dev` được trình duyệt coi là hai site khác nhau. Khi đưa vào vận hành thực tế cho học viên, bắt buộc cấu hình tên miền tùy chỉnh cùng eTLD+1 hoặc định tuyến proxy `/api/*` qua web worker để tránh các trình duyệt (Safari ITP, Brave, Chrome) chặn cookie session bên thứ ba.
>
> **Đã áp dụng từ `alchemy.run.ts`**: worker `web` gắn `domain: "vox.vinhtran.io.vn"`, worker `server` gắn `domain: "api.vox.vinhtran.io.vn"` (cùng eTLD+1 `vinhtran.io.vn`, zone đã nằm trên Cloudflare với NS `*.ns.cloudflare.com`). Đây là môi trường **Beta** phục vụ kiểm thử cho nhánh `dev` (mọi code merge vào `dev` sẽ triển khai lên domain này). Khi `domain` được set, URL của worker là `https://<domain>` (không còn workers.dev), nên `VITE_SERVER_URL` và `BETTER_AUTH_URL` tự nhận custom domain. Alchemy tự tạo DNS record và chứng chỉ cho cả hai hostname trong zone.

---

## 2. Sao lưu cơ sở dữ liệu D1 trước khi áp Migration

> **BẮT BUỘC THEO `AGENTS.md`**: Do Alchemy tự động áp các migration mới ngay trong quá trình chạy lệnh `deploy`, mọi lần triển khai lên môi trường thật có database D1 hiện hữu đều phải thực hiện sao lưu trước khi deploy.

### 2.1. Thực hiện sao lưu D1
Tìm tên chính xác của database D1 do Alchemy tạo ra:

```bash
pnpm dlx wrangler d1 list
```

> **Lưu ý triển khai lần đầu**: Nếu đây là lần đầu tiên triển khai hệ thống (database chưa từng được tạo trên Cloudflare), bỏ qua bước sao lưu này.

Đối với các lần triển khai sau (khi đã có dữ liệu và chuẩn bị áp migration mới):

```bash
# Tạo thư mục sao lưu bên ngoài repository để tránh nguy cơ commit nhầm dữ liệu người dùng:
mkdir -p "$HOME/.vox-flow/backups"

# Xuất dữ liệu hiện tại của D1 ra file SQL an toàn nằm ngoài repo:
pnpm dlx wrangler d1 export <ten-database-d1> --remote --output="$HOME/.vox-flow/backups/backup-d1-$(date +%Y%m%d%H%M%S).sql"
```

### 2.2. Cơ chế áp Migration của Alchemy
Alchemy tự động phát hiện các thư mục migration dạng `<dir>/migration.sql` trong `packages/db/src/migrations` (chuẩn Drizzle v1 theo regex `^\d{14}_.+`, xác nhận qua `@alchemy.run/sql` `Migrations/Detect.ts`) và áp tuần tự vào D1 Database trong lúc `deploy` (`D1/Database.ts`), đồng thời ghi nhận lịch sử vào bảng `__alchemy_migrations`.

---

## 3. Quy trình triển khai với Alchemy

Vox Flow sử dụng `@alchemy.run/cloudflare` trong package `@vox-flow/infra` để quản lý hạ tầng dưới dạng mã nguồn (IaC).

### 3.1. Cố định Stage triển khai (`prod`)
Mặc định Alchemy sẽ tạo stage theo tên `live_${USER}` nếu không chỉ định, dẫn tới phân mảnh tài nguyên. Đối với bản Beta của Vox Flow triển khai từ nhánh `dev`, toàn bộ lệnh triển khai cố định biến môi trường `ALCHEMY_STAGE=prod`.

> **CẢNH BÁO QUAN TRỌNG VỀ STAGE**: Stage `prod` trong Alchemy hiện tại được gán cho **môi trường Beta** (gắn với domain `vox.vinhtran.io.vn` và `api.vox.vinhtran.io.vn`). Khi thiết lập môi trường Production thật sau này, bắt buộc phải dùng tên stage khác (ví dụ: `production` hoặc `live`) VÀ cấu hình lại trường `domain` trong `packages/infra/alchemy.run.ts` để tránh ghi đè lên stack Beta hoặc xung đột hostname trên Cloudflare.

### 3.2. Quản lý bí mật và lệnh triển khai chuẩn

Cấu hình biến môi trường và bí mật:
- **Cách 1 (Khuyên dùng)**: Lưu biến vào file `.env` ở thư mục gốc repo (đã được `.gitignore` bảo vệ). `packages/infra/alchemy.run.ts` tự động nạp cấu hình thông qua `varlock/auto-load`.
- **Cách 2**: Sử dụng công cụ `ak secrets run` nếu có quyền cấp phát thực thi:
  ```bash
  ak secrets run -- env ALCHEMY_STAGE=prod pnpm --filter @vox-flow/infra run deploy
  ```

Lệnh triển khai tiêu chuẩn từ thư mục gốc của repo:

```bash
ALCHEMY_STAGE=prod pnpm --filter @vox-flow/infra run deploy
```

> **LƯU Ý QUAN TRỌNG**:
> - **KHÔNG ĐƯỢC DÙNG `pnpm deploy`**: Đây là lệnh nội tại được xây dựng sẵn của trình quản lý gói `pnpm` (dùng để trích xuất monorepo package), không phải lệnh triển khai Alchemy của dự án.
> - **KHÔNG truyền stage qua `pnpm run deploy -- --stage prod`**: pnpm giữ nguyên `--` khi chuyển đối số, alchemy đọc `--stage` thành positional config và lỗi `Expected: Path does not exist: .../--stage` (xảy ra thực tế 2026-11-06). Dùng biến môi trường `ALCHEMY_STAGE=prod` như lệnh trên.
> - Luôn tuân thủ quy tắc trong `AGENTS.md`: Chỉ thực hiện lệnh triển khai lên môi trường thật khi đã có sự xác nhận trực tiếp từ người sở hữu sản phẩm.

### 3.3. `CORS_ORIGIN` cho lần triển khai đầu tiên

Kể từ khi worker `web` gắn domain cố định `vox.vinhtran.io.vn` trong `alchemy.run.ts`, URL frontend đã biết ngay từ đầu nên **không còn vòng lặp 2 bước**: đặt thẳng `CORS_ORIGIN=https://vox.vinhtran.io.vn` trong `.env` trước lần deploy đầu tiên. Lưu ý DNS/chứng chỉ custom domain cần vài phút để active sau khi Alchemy tạo record; request `curl` có thể thất bại tạm thời trong khoảng này — chờ rồi thử lại, không cần deploy lại.

---

## 4. Kiểm tra xác nhận sau triển khai (Verification)

Sau khi lệnh deploy hoàn tất thành công, thực hiện 2 bước kiểm tra sau:

### 4.1. Kiểm tra Endpoint Worker
Kiểm tra root URL và healthCheck endpoint tRPC (domain Beta cố định; nếu DNS/chứng chỉ chưa active thì chờ vài phút rồi thử lại):

```bash
# Kiểm tra root text
curl -s https://api.vox.vinhtran.io.vn/
# Kết quả mong đợi: OK

# Kiểm tra tRPC healthCheck
curl -s https://api.vox.vinhtran.io.vn/trpc/healthCheck | jq -r .result.data
# Kết quả mong đợi: OK

# Kiểm tra web SPA đã được phục vụ tại domain Beta
# Kết quả mong đợi: HTTP/2 200
```

### 4.2. Kiểm tra bảng dữ liệu trong D1
Xác minh 4 bảng auth cốt lõi (`user`, `session`, `account`, `verification`) đã được khởi tạo:

```bash
pnpm dlx wrangler d1 execute <ten-database-d1> --remote \
  --command "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('user','session','account','verification')" \
  --json | jq '.[0].results[0].n'
# Kết quả mong đợi: 4
```

---

## 5. Xử lý sự cố và Rollback

### 5.1. Rollback Cơ sở dữ liệu D1
Nếu việc áp migration gặp lỗi hoặc gây sai lệch dữ liệu:
- **D1 Time Travel**: Tra cứu bookmark ID trước thời điểm áp migration rồi khôi phục:
  ```bash
  # Tra cứu bookmark
  pnpm dlx wrangler d1 time-travel info <ten-database-d1> --timestamp="2026-11-05T10:00:00Z"

  # Khôi phục theo bookmark
  pnpm dlx wrangler d1 time-travel restore <ten-database-d1> --bookmark=<bookmark-id>
  ```
- **Khôi phục từ file backup SQL**:
  *Lưu ý*: Việc thực thi trực tiếp file backup SQL vào database hiện hữu có thể gặp lỗi nếu các bảng đã tồn tại (`table already exists`). Cần xóa các bảng bị lỗi hoặc khôi phục vào một database sạch trước khi chuyển hướng kết nối:
  ```bash
  pnpm dlx wrangler d1 execute <ten-database-d1> --remote --file="$HOME/.vox-flow/backups/backup-d1-<timestamp>.sql"
  ```
### 5.2. Rollback Code Worker
- Có thể dùng dashboard Cloudflare Worker để chuyển đổi phiên bản deployment (revert version) về phiên bản ổn định trước đó.
  *Lưu ý*: Việc revert trên dashboard chỉ mang tính tạm thời trong tình huống khẩn cấp, vì trạng thái của Alchemy sẽ bị lệch với Cloudflare cho đến lần `alchemy deploy` kế tiếp.
- Lệnh `pnpm --filter @vox-flow/infra run destroy` chỉ dùng khi muốn hủy toàn bộ tài nguyên ngăn xếp và **phải có xác nhận trực tiếp từ người sở hữu sản phẩm**.
