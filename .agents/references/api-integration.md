# API Integration & Testing Architecture (`api-integration.md`)

 Khung phân loại và kiểm thử tích hợp API cho `/api-checklist` và `/api-test`:

## 1. Ba làn kiểm thử (`test_layer`)

| Lane | Định nghĩa | Mục tiêu kiểm chứng |
|------|------------|---------------------|
| **`own`** | API nội bộ do chính dự án xây dựng | Backend thực thi đúng SRS, Business Rules, Error Matrix và phân quyền phiên đăng nhập (`public` vs `session`). |
| **`3rd`** (`3rd:{provider}`) | API của đối tác bên ngoài (thanh toán, gửi mail, AI/STT...) | Hợp đồng đối tác hoạt động đúng tài liệu (payload, mã lỗi, giới hạn tần suất) trước khi ghép nối. |
| **`mixed`** (`mixed:{provider}`) | Endpoint nội bộ có gọi sang đối tác bên ngoài | Toàn luồng điều phối (orchestration): xử lý thành công, ánh xạ lỗi khi đối tác từ chối/timeout, chuyển đổi trạng thái và đồng bộ dữ liệu. |

## 2. Hai chiều giao tiếp (`direction`)

| Chiều | Ký hiệu | Đặc thù kiểm thử bắt buộc |
|-------|---------|---------------------------|
| **Outbound** | `out` | Ứng dụng gọi ra ngoài: kiểm tra validation, auth header/cookie, idempotency key, xử lý mã lỗi HTTP/body. |
| **Inbound (Webhook)** | `in` | Đối tác gọi vào endpoint nhận webhook của ứng dụng: kiểm tra xác thực chữ ký (HMAC/signature), tính lũy đẳng khi nhận sự kiện trùng (`idempotency`), thứ tự sự kiện đến trễ (`out-of-order`), và cơ chế retry. |

## 3. Tách 4 tầng sự thật (Separation of Concerns)

1. **Contract / Behavior gốc:** `srs/{feature}-spec.md` (cho `own`) hoặc `integration/api-summary*.md` + OpenAPI gốc (cho `3rd`).
2. **Coverage & Intent (`api-checklist.md`):** Kiểm **CÁI GÌ** — danh sách kịch bản, chiều gọi, fixtures và câu hỏi mở (OQ).
3. **Executable Specification (`api-tests.md` + `bruno/`):** Kiểm **THẾ NÀO** — phương thức, đường dẫn, headers, body cụ thể và biểu thức assert.
4. **Run Evidence (`Kết quả` / `Lịch sử chạy`):** Bằng chứng theo từng môi trường và thời điểm chạy (`PASS` / `FAIL` / `PENDING`).

## 4. Nguyên tắc bảo mật khóa bí mật

- Không bao giờ đưa API key thật, webhook secret, hay mật khẩu tài khoản seed vào tài liệu Markdown (`.md`) hoặc file `.bru` được commit.
- Chỉ khai báo tên biến môi trường trong `.env.example`; giá trị thật chỉ nằm trong `.env` (đã gitignore) và agent tuyệt đối không đọc giá trị file `.env`.
