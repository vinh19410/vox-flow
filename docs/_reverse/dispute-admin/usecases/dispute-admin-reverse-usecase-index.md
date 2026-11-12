---
type: reverse-usecase-index
feature: dispute-admin
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/dispute-admin/dispute-admin-reverse-spec.md
---

# dispute-admin — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-xem-hang-doi](./uc-xem-hang-doi.md) | Xem hàng đợi báo lỗi và lọc theo nhóm trạng thái | Quản trị viên | FR-dispute-admin-001..006, 023, 024, 032, 033 | SCR-01, SCR-03 | E-dispute-admin-001, 002, 015, 019 | OQ-1, 13, 15 | S1, S11, S12 | ✅ |
| [uc-xem-so-lieu](./uc-xem-so-lieu.md) | Xem số liệu vận hành báo lỗi | Quản trị viên | FR-dispute-admin-017, 031 | SCR-01 | E-dispute-admin-015 | OQ-7, 14, 20 | S1, S11 | ✅ |
| [uc-xem-chi-tiet-va-nghe-audio](./uc-xem-chi-tiet-va-nghe-audio.md) | Xem chi tiết ca và nghe lại bản ghi âm khi học viên đồng ý | Quản trị viên | FR-dispute-admin-007..009, 025, 026, 034 | SCR-02 | E-dispute-admin-003, 010..014, 016 | OQ-8, 9 | S1, S7, S8, S11 | ✅ |
| [uc-chap-nhan-khieu-nai](./uc-chap-nhan-khieu-nai.md) | Chấp nhận khiếu nại, nâng band và phản hồi học viên | Quản trị viên | FR-dispute-admin-010, 012..016, 027..030 | SCR-02 | E-dispute-admin-004..008, 017 | OQ-2, 3, 5, 10, 11, 16, 19 | S1, S11 | ✅ |
| [uc-tu-choi-khieu-nai](./uc-tu-choi-khieu-nai.md) | Từ chối khiếu nại, giữ nguyên điểm và phản hồi học viên | Quản trị viên | FR-dispute-admin-011, 012, 014, 015, 029, 030 | SCR-02 | E-dispute-admin-004, 005, 007, 017 | OQ-3, 16, 19 | S1, S11 | ✅ |
| [uc-canh-bao-sap-qua-han](./uc-canh-bao-sap-qua-han.md) | Cảnh báo ca sắp quá hạn 12 giờ bằng tác vụ định kỳ | Tác vụ định kỳ (hệ thống) | FR-dispute-admin-018..022 | — (hiệu ứng ở SCR-01) | E-dispute-admin-018, 020 | OQ-3, 6, 17 | S3, S5, S4, S6 | ✅ |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Quản trị viên | người | S10, S8 |
| Tác vụ định kỳ (cron theo giờ) | hệ thống | S5, S3 |
| Học viên (người nhận kết quả, ngoài scope) | người | S17, S18 |
| Kho R2 | ngoài | S7 |

## Ma trận UC - FR - Screen - Error - OQ

| UC | FR | Screen | Error | OQ |
|----|----|--------|-------|----|
| xem-hang-doi | 001-006, 023, 024, 032, 033 | SCR-01, SCR-03 | 001, 002, 015, 019 | 1, 13, 15 |
| xem-so-lieu | 017, 031 | SCR-01 | 015 | 7, 14, 20 |
| xem-chi-tiet-va-nghe-audio | 007-009, 025, 026, 034 | SCR-02 | 003, 010-014, 016 | 8, 9 |
| chap-nhan-khieu-nai | 010, 012-016, 027-030 | SCR-02 | 004-008, 017 | 2, 3, 5, 10, 11, 16, 19 |
| tu-choi-khieu-nai | 011, 012, 014, 015, 029, 030 | SCR-02 | 004, 005, 007, 017 | 3, 16, 19 |
| canh-bao-sap-qua-han | 018-022 | — | 018, 020 | 3, 6, 17 |

(FR/Error viết gọn phần số; đầy đủ tiền tố `FR-dispute-admin-` / `E-dispute-admin-`.)

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn — mỗi mệnh đề mang nhãn ✅/🔵/🟡. Chạy `/usecase dispute-admin` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Học viên gửi báo lỗi không là UC của feature này (thuộc `score-dispute`).
* Không tách UC "đăng nhập/kiểm tra quyền" vì không phải việc admin chủ động làm; nằm trong tiền điều kiện (FR-001, FR-002).
