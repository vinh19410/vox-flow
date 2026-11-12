---
type: reverse-usecase-index
feature: scoring-results
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/scoring-results/scoring-results-reverse-spec.md
---

# scoring-results — Use Case Index (reverse)

> Use case tái lập từ code, CHƯA duyệt. Mỗi use case là việc học viên làm được. Quy trình nền (worker chấm, bộ quét) là flow hệ thống, nằm ở `srs/scoring-results-reverse-flows.md`, không phải use case. Không có chức năng quản trị chấm điểm trong code nên không có use case của quản trị viên. Cấu trúc mỗi use case: (a) mục tiêu, (b) actor và tiền điều kiện, (c) trigger, (d) luồng chính, (e) luồng thay thế và ngoại lệ, (f) hậu điều kiện, (g) quy tắc liên quan, (h) nguồn và câu hỏi mở.

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-submit-and-wait-scoring](./uc-submit-and-wait-scoring.md) | Nộp bài và chờ chấm | Học viên | FR-scoring-results-001..004, FR-scoring-results-032..035, FR-scoring-results-040 | SCR-01 | E-scoring-results-008..011, E-scoring-results-032, E-scoring-results-036, E-scoring-results-037 | OQ-8, OQ-9, OQ-12, OQ-13, OQ-14 | S16, S19, S20 | ✅ |
| [uc-resend-submission](./uc-resend-submission.md) | Gửi lại bài khi nộp lỗi hoặc thiếu ghi âm | Học viên | FR-scoring-results-032, FR-scoring-results-033, FR-scoring-results-038, FR-scoring-results-039 | SCR-01 | E-scoring-results-010, E-scoring-results-011, E-scoring-results-032..035, E-scoring-results-040 | OQ-6, OQ-13 | S19, S20 | ✅ |
| [uc-retry-failed-scoring](./uc-retry-failed-scoring.md) | Chấm lại bài chấm lỗi | Học viên | FR-scoring-results-006..008, FR-scoring-results-010, FR-scoring-results-011, FR-scoring-results-036, FR-scoring-results-037 | SCR-01, SCR-02 | E-scoring-results-004..006, E-scoring-results-038, E-scoring-results-039, E-scoring-results-044 | OQ-2, OQ-7 | S1, S19, S20, S22 | ✅ |
| [uc-request-scoring-unscored](./uc-request-scoring-unscored.md) | Yêu cầu chấm bài đã nộp nhưng chưa có điểm | Học viên | FR-scoring-results-009, FR-scoring-results-043 | SCR-02 | E-scoring-results-003, E-scoring-results-039, E-scoring-results-045 | OQ-2, OQ-7 | S1, S22 | ✅ |
| [uc-view-overall-and-criteria](./uc-view-overall-and-criteria.md) | Xem band tổng và chi tiết từng tiêu chí | Học viên | FR-scoring-results-005, FR-scoring-results-029..031, FR-scoring-results-041, FR-scoring-results-042, FR-scoring-results-044, FR-scoring-results-045, FR-scoring-results-047, FR-scoring-results-048, FR-scoring-results-050 | SCR-02, SCR-02a..c | E-scoring-results-001, E-scoring-results-002, E-scoring-results-007, E-scoring-results-041..043 | OQ-3, OQ-5, OQ-14, OQ-16, OQ-17 | S1, S22, S23, S24 | ✅ |
| [uc-review-each-answer](./uc-review-each-answer.md) | Xem lại từng câu trả lời | Học viên | FR-scoring-results-046 | SCR-02d | E-scoring-results-001, E-scoring-results-002 | OQ-5 | S23, S24 | ✅ |
| [uc-check-scoring-progress](./uc-check-scoring-progress.md) | Kiểm tra lại tiến trình khi chấm chậm hoặc mất kết nối | Học viên | FR-scoring-results-034, FR-scoring-results-035, FR-scoring-results-043 | SCR-01, SCR-02 | E-scoring-results-036, E-scoring-results-037 | OQ-9, OQ-12 | S19, S20, S22 | ✅ |
| [uc-unlock-details](./uc-unlock-details.md) | Mở khóa chi tiết tiêu chí (soft paywall) | Học viên | FR-scoring-results-049, FR-scoring-results-051 | SCR-02b, SCR-02e | — | OQ-4, OQ-5 | S22, S24 | 🟡 |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Học viên (chủ bài thi) | người | S1: packages/api/src/routers/scoring.ts:22-31 |
| Quản trị viên chấm điểm | — (không có trong code) | S1: packages/api/src/routers/scoring.ts:57-229 |

## Ma trận truy vết UC — FR — Screen — Error — OQ

| UC | FR chính | Screen | Error | OQ |
|----|----------|--------|-------|----|
| uc-submit-and-wait-scoring | 001..004, 032..035, 040 | SCR-01 | 008..011, 032, 036, 037 | 8, 9, 12, 13, 14 |
| uc-resend-submission | 032, 033, 038, 039 | SCR-01 | 010, 011, 032..035, 040 | 6, 13 |
| uc-retry-failed-scoring | 006..008, 010, 011, 036, 037 | SCR-01, SCR-02 | 004..006, 038, 039, 044 | 2, 7 |
| uc-request-scoring-unscored | 009, 043 | SCR-02 | 003, 039, 045 | 2, 7 |
| uc-view-overall-and-criteria | 005, 029..031, 041, 042, 044, 045, 047, 048, 050 | SCR-02, 02a..c | 001, 002, 007, 041..043 | 3, 5, 14, 16, 17 |
| uc-review-each-answer | 046 | SCR-02d | 001, 002 | 5 |
| uc-check-scoring-progress | 034, 035, 043 | SCR-01, SCR-02 | 036, 037 | 9, 12 |
| uc-unlock-details | 049, 051 | SCR-02b, SCR-02e | — | 4, 5 |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn; mọi dòng mang nhãn ✅/🔵/🟡. Chạy `/usecase scoring-results` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Hành vi khiếu nại điểm ("Báo lỗi chấm") thuộc feature score-dispute, không đưa vào đây. Nguồn chỉ đủ cho use case nào thì viết use case đó; chức năng không đủ nguồn ghi Gap ở `reverse-gaps.md`, KHÔNG bịa use case.
* ID Error/FR viết tắt trong bảng ma trận là phần số của ID đầy đủ `E-scoring-results-NNN` / `FR-scoring-results-NNN`.
