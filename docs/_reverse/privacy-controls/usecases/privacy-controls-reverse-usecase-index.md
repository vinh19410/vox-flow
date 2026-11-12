---
type: reverse-usecase-index
feature: privacy-controls
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/privacy-controls/privacy-controls-reverse-spec.md
---

# privacy-controls — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-set-consent](./uc-set-consent.md) | Đồng ý / rút đồng ý lưu bài và hiệu chuẩn | Học viên | FR-001..006, FR-009, FR-022 | Chưa có màn (🟡) | E-001, E-003, E-004 | OQ-1, OQ-5, OQ-7, OQ-10 | S1, S2 | ✅ (hành vi API) · 🟡 (mục tiêu, không có UI) |
| [uc-view-consent-status](./uc-view-consent-status.md) | Xem / nạp trạng thái đồng ý hiện tại | Học viên | FR-007..009, FR-022..024 | Nạp tự động sau đăng nhập, chưa có màn hiển thị | E-001 | OQ-1, OQ-8 | S1, S10 | ✅ (hành vi) · 🟡 (mục tiêu) |
| [uc-export-personal-data](./uc-export-personal-data.md) | Xuất dữ liệu cá nhân của mình | Học viên | FR-010..015, FR-022 | Chưa có màn (🟡) | E-001, E-008 | OQ-1, OQ-6, OQ-11, OQ-12 | S1, S3, S4 | ✅ (hành vi API) · 🟡 (mục tiêu, không có UI) |
| [uc-confirm-recording-before-exam](./uc-confirm-recording-before-exam.md) | Xác nhận ghi âm và bắt đầu bài thi | Học viên | FR-021, FR-025 | Thẻ "Trước khi bắt đầu" | — | OQ-2, OQ-5 | S5, S7, S12 | ✅ (hành vi) · 🟡 (mục tiêu) |

> UC xoá dữ liệu cá nhân (FR-016..018) KHÔNG lập: không có actor nào thực hiện được (không có điểm kích hoạt). Ghi ở `reverse-gaps.md` OQ-3. UC chặn thao tác khi thiếu đồng ý (FR-019, FR-020) cũng không lập vì không có thao tác nào bị chặn (OQ-2).

## Ma trận UC ↔ FR ↔ Screen ↔ Error ↔ OQ

| UC | FR | Screen | Error | OQ |
|----|----|--------|-------|----|
| uc-set-consent | 001, 002, 003, 004, 005, 006, 009, 022 | không có | E-001, E-003, E-004 | 1, 5, 7, 10 |
| uc-view-consent-status | 007, 008, 009, 022, 023, 024 | không có (chỉ nạp state) | E-001 | 1, 8 |
| uc-export-personal-data | 010, 011, 012, 013, 014, 015, 022 | không có | E-001, E-008 | 1, 6, 11, 12 |
| uc-confirm-recording-before-exam | 021, 025 | Thẻ "Trước khi bắt đầu" | — | 2, 5 |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Học viên đã đăng nhập | người | S1, S8 |
| Hệ thống (API) | hệ thống | S1, S3 |
| Kho ghi âm R2 / D1 | ngoài | S3:19-31 |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn — mỗi mệnh đề mang nhãn ✅/🔵/🟡.
* Ba trong bốn UC chỉ có API, không có màn hình trong code; "việc học viên làm được" ở đây nghĩa là việc API cho phép khi một client gọi, không phải thao tác thật của học viên hiện nay (🟡 OQ-1).
