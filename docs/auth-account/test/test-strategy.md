---
type: test-strategy
feature: auth-account
status: active
updated: 2026-11-12
---

# Test Strategy — auth-account

## 1. Cấu hình bền vững (Durable)

| Thuộc tính | Giá trị | Ghi chú |
|---|---|---|
| **Ngôn ngữ checklist / test case** | Vietnamese (`vi`) | Giữ nguyên nhãn nút, tên trường, đường dẫn route và mã kỹ thuật (`Đăng nhập`, `Tạo tài khoản`, `Tiếp tục với Google`, `Email`, `Mật khẩu`, `Tên hiển thị`, `INVALID_EMAIL_OR_PASSWORD`...) |
| **Môi trường kiểm thử** | Local (`http://localhost:3001` ↔ API `http://localhost:3000`) & Cloudflare Staging (`https://vox.vinhtran.io.vn` ↔ `https://api.vox.vinhtran.io.vn`) | Cookie phiên `SameSite=None; Secure; HttpOnly`; kiểm thử đầy đủ vòng đời cookie cross-origin và Google OAuth thực trên Staging HTTPS |
| **Nguồn dữ liệu test** | Tài khoản động sinh theo phiên (`qa+<timestamp>@voxflow.local`) + tài khoản seed quản trị (`TEST_ADMIN_EMAIL` trong `ADMIN_EMAILS`) | Không ghi mật khẩu/khóa bí mật thật vào tài liệu markdown |
| **Thiết bị & Viewport mục tiêu** | Web responsive (PRD 3.2 — v1 chỉ làm Web): Desktop `1280px` (`>= 1024px`), Tablet `768px`, Mobile `375px` (`< 1024px`) | Trình duyệt Chromium / WebKit / Firefox qua Playwright |
| **Ngưỡng NFR định lượng** | Chưa đặt chỉ tiêu thời gian phản hồi/tải đồng thời ở MVP (`NFR-auth-account-010`) | Giới hạn tốc độ bảo mật: `3 lần/10s` trên `/sign-in*`, `/sign-up*` (`NFR-auth-account-006`) |
| **Xử lý khi thiếu nguồn (Missing source)** | Không tự giả định expected/wording/threshold/side-effect — mở `OQ` và chặn đóng cổng tới khi BA chốt | Đặc tả `auth-account-reverse-spec.md` đã duyệt 100% (`✅128 🔵0 🟡0`, 0 OQ mở) |

## 2. Cấu hình theo đợt chạy (Per-run)

| Thuộc tính | Giá trị lần gần nhất (2026-11-12) |
|---|---|
| **Mục đích đợt chạy** | Regression & UAT trước mở người dùng thật |
| **Đối tượng bàn giao** | QC review nghiệp vụ + Đầu vào sinh Test Cases 1:1 (`/test-cases`) & Playwright E2E (`/playwright-gen`) |
| **Baseline phạm vi** | Toàn bộ tính năng `auth-account` (`scope = feature`) |
| **Coverage Profile bật** | `Core-functional (Baseline)` — luồng chính/phụ, validation/BVA, Error Matrix, security cơ bản, loading/a11y/responsive cơ bản, edge cases |
