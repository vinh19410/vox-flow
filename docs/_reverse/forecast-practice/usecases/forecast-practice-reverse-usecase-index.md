---
type: reverse-usecase-index
feature: forecast-practice
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/forecast-practice/forecast-practice-reverse-spec.md
---

# forecast-practice — Use Case Index (reverse)

> Use case tái lập từ code, CHƯA duyệt. Mỗi use case là việc học viên làm được. Phía quản trị (soạn, đăng chủ đề) thuộc `forecast-curation`, không có use case ở đây.

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-browse-and-filter-topics](./uc-browse-and-filter-topics.md) | Duyệt, lọc và tìm chủ đề dự đoán | Học viên | FR-forecast-practice-001..014 | SCR-01 | E-forecast-practice-005..009 | OQ-2, OQ-5, OQ-6, OQ-7, OQ-9, OQ-13, OQ-14 | S1, S6, S7, S12 | 🟡 |
| [uc-view-topic-detail-and-save](./uc-view-topic-detail-and-save.md) | Xem chi tiết chủ đề và lưu vào danh sách ôn | Học viên | FR-forecast-practice-015, 016, 020 | SCR-01, SCR-02 | E-forecast-practice-009 | OQ-3, OQ-7, OQ-15 | S6, S9, S14 | 🟡 |
| [uc-see-coverage-and-suggestion](./uc-see-coverage-and-suggestion.md) | Xem độ phủ và nhận gợi ý chủ đề luyện tiếp | Học viên | FR-forecast-practice-017..019 | SCR-01 | E-forecast-practice-005 | OQ-2, OQ-5 | S6, S9, S14 | 🟡 |
| [uc-practice-topic-or-question](./uc-practice-topic-or-question.md) | Luyện cả chủ đề hoặc từng câu | Học viên | FR-forecast-practice-021..024, 031 | SCR-01, SCR-02 | E-forecast-practice-010..013 | OQ-2, OQ-8, OQ-11 | S6, S10, S17, S18, S19 | 🟡 |
| [uc-report-topic-encounter](./uc-report-topic-encounter.md) | Báo đã gặp một chủ đề trong kỳ thi | Học viên | FR-forecast-practice-025, 030 | — (chưa có màn) | E-forecast-practice-001..004 | OQ-4, OQ-5, OQ-12 | S1, S2, S20, S21 | 🟡 |
| [uc-continue-after-result](./uc-continue-after-result.md) | Tiếp tục luyện sau khi xem kết quả một câu | Học viên | FR-forecast-practice-026, 027 | SCR-01 (điểm đến) | — | OQ-10 | S6, S10, S19 | 🟡 |

## Ma trận UC - FR - Screen - Error - OQ

| FR | UC | Screen | Error | OQ |
|----|----|--------|-------|----|
| FR-001..014 | uc-browse-and-filter-topics | SCR-01 | E-005..009 | OQ-2, 5, 6, 7, 9, 13, 14 |
| FR-015, 016, 020 | uc-view-topic-detail-and-save | SCR-01, SCR-02 | E-009 | OQ-3, 7, 15 |
| FR-017, 018, 019 | uc-see-coverage-and-suggestion | SCR-01 | E-005 | OQ-2, 5 |
| FR-021..024, 031 | uc-practice-topic-or-question | SCR-01, SCR-02 | E-010..013 | OQ-2, 8, 11 |
| FR-025, 030 | uc-report-topic-encounter | — | E-001..004 | OQ-4, 5, 12 |
| FR-026, 027 | uc-continue-after-result | SCR-01 | — | OQ-10 |
| FR-028, 029 | (điều kiện truy cập và lối vào, nằm trong trigger/tiền điều kiện của mọi UC) | SCR-01 | — | OQ-9 |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Học viên đã đăng nhập và onboarding | người | S13 |
| Khách chưa đăng nhập (chỉ xem được qua API, màn web chuyển hướng) | người | S1, S13 |
| Quản trị viên (ngoài scope, `forecast-curation`) | người | S20 |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn. Chạy `/usecase forecast-practice` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Không có use case "quản trị đăng chủ đề" ở đây (thuộc `forecast-curation`).
