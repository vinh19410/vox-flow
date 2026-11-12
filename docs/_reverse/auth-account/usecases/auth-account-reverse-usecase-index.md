---
type: reverse-usecase-index
feature: auth-account
status: approved
updated: 2026-11-12
links:
  - docs/_reverse/auth-account/auth-account-reverse-spec.md
---

# auth-account — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-dang-ky-email](./uc-dang-ky-email.md) | Đăng ký tài khoản bằng email | Khách | FR-auth-account-001..005, 012 | S-1 | E-auth-account-002, 004, 005, 014, 015, 016 | OQ-1, 3, 11 | S3, S1, S17, S20, S24 | ✅ |
| [uc-dang-nhap-email](./uc-dang-nhap-email.md) | Đăng nhập bằng email + mật khẩu | Khách / học viên | FR-auth-account-006..012, 015 | S-1 | E-auth-account-001, 003, 005, 014, 015 | OQ-4, 8, 12 | S3, S17, S20 | ✅ |
| [uc-dang-nhap-google](./uc-dang-nhap-google.md) | Đăng nhập bằng Google | Khách / học viên | FR-auth-account-013, 014, 015 | S-1 | E-auth-account-005..008, 015 | OQ-6, 13 | S3, S1, S17 | ✅ |
| [uc-dang-xuat](./uc-dang-xuat.md) | Đăng xuất | Học viên | FR-auth-account-016..018 | điểm vào ngoài S-1 (sidebar, bottom nav, hồ sơ) | E-auth-account-009 | OQ-2 | S6, S15, S19 | ✅ |
| [uc-truy-cap-route-bao-ve](./uc-truy-cap-route-bao-ve.md) | Truy cập trang cần đăng nhập / onboarding | Học viên / khách | FR-auth-account-015, 019..023 | chuyển tới S-1 | (chuyển hướng, không có lỗi hiển thị) | OQ-8, 10 | S5, S8, S18 | ✅ |
| [uc-truy-cap-khu-quan-tri](./uc-truy-cap-khu-quan-tri.md) | Truy cập khu vực quản trị | Quản trị viên | FR-auth-account-024, 026 | chuyển hướng S-1 hoặc dashboard | E-auth-account-010, 011 | OQ-9 | S9, S11, S21 | ✅ |

> Use case `dung-khu-legacy` đã xóa ở #134 cùng khu `_app-legacy` (route `/login`, `/dashboard` và 6 component riêng).

## Ma trận UC ↔ FR ↔ Screen ↔ Error ↔ OQ

| UC | FR | Screen | Error | OQ |
|----|----|--------|-------|----|
| dang-ky-email | 001, 002, 003, 004, 005, 009, 010, 011, 012 | S-1 | 002, 004, 005, 014, 015, 016 | 1, 3, 11 |
| dang-nhap-email | 006, 007, 008, 009, 010, 011, 012, 015 | S-1 | 001, 003, 005, 014, 015 | 4, 8, 12 |
| dang-nhap-google | 013, 014, 015 | S-1 | 005, 006, 007, 008, 015 | 6, 13 |
| dang-xuat | 016, 017, 018 | (sidebar, bottom nav, hồ sơ) | 009 | 2 |
| truy-cap-route-bao-ve | 015, 019, 020, 021, 022, 023 | — | — | 8, 10 |
| truy-cap-khu-quan-tri | 024, 025, 026 | — | 010, 011 | 9 |

FR chưa gắn UC vì không phải việc người dùng làm trực tiếp: FR-auth-account-027 (điểm audio yêu cầu phiên), FR-auth-account-028 (hợp lệ hóa ảnh, nằm trong UC của `onboarding-profile`), FR-auth-account-029 (điều hướng tới màn hình đăng nhập).

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Khách | người | S3 |
| Học viên | người | S6 |
| Quản trị viên | người | S9, S11 |
| Máy chủ xác thực | hệ thống | S1, S10 |
| Google | ngoài | S1 |

## Ghi chú

* Use case **đã duyệt (#134)** — mỗi mệnh đề mang nhãn ✅. Chạy `/usecase auth-account` (downstream mode) khi cần điền traceability mở rộng.
* Không viết use case cho quên mật khẩu, xác minh email, đổi mật khẩu, xóa tài khoản vì nằm ngoài MVP theo D-03 (xem `reverse-gaps.md` OQ-3, OQ-4 và `docs/_product/prd.md:69`).
