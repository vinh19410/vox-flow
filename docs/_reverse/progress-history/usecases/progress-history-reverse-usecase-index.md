---
type: reverse-usecase-index
feature: progress-history
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/progress-history/progress-history-reverse-spec.md
---

# progress-history — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-view-dashboard](./uc-view-dashboard.md) | Xem Trang chủ (sẵn sàng, đếm ngược, bài gần nhất) | Học viên | FR-progress-history-001..016, 024 | S06 | E-progress-history-001, 004, 009 | OQ-1, 2, 4, 5, 7 | S6, S7, S8, S9, S10 | ✅ |
| [uc-view-attempt-history](./uc-view-attempt-history.md) | Xem lịch sử lượt thi, biểu đồ band, lọc chế độ | Học viên | FR-progress-history-017..022 | S19 | E-progress-history-002, 003 | OQ-1, 3, 8, 9, 12, 14, 15 | S1, S4, S5 | ✅ |
| [uc-open-attempt-detail](./uc-open-attempt-detail.md) | Mở chi tiết một lượt thi | Học viên | FR-progress-history-014, 020, 023 | S19, S06, chi tiết lượt | E-progress-history-005..008, 010 | OQ-1, 16, 17 | S2, S5, S16 | ✅ |
| [uc-set-exam-date](./uc-set-exam-date.md) | Nhập ngày thi từ thẻ đếm ngược (chỉ cục bộ) | Học viên | FR-progress-history-009..012 | S06 | — | OQ-6, 7 | S8, S12 | 🔵 |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Học viên đã đăng nhập, đã onboarding | người | S15: apps/web/src/routes/_proto/app/route.tsx:7-8 |
| Hồ sơ học viên (nguồn mục tiêu, ngày thi) | hệ thống | S12: apps/web/src/features/app-state/use-profile-hydration.ts:61-77; S22: packages/api/src/routers/profile.ts:42-51 |
| Hệ thống chấm điểm (nguồn chi tiết lượt) | hệ thống | S16: apps/web/src/features/results/use-scored-result.ts:42-45 |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn, mỗi mệnh đề mang nhãn ✅/🔵/🟡. Danh sách lượt thi không có nguồn nạp ở production nên UC1-3 chỉ chạy đầy đủ trong dữ liệu giả lập (OQ-1).
* Không viết UC "xuất lịch sử JSON", "xem việc hôm nay", "xem điểm mạnh/cần cải thiện": code không có chức năng (xem `reverse-gaps.md` mục 2).

## Ma trận UC ↔ FR ↔ Screen ↔ Error ↔ OQ

| UC | FR | Screen | Error | OQ |
|----|----|--------|-------|-----|
| uc-view-dashboard | 001-016, 024 | S06 | 001, 004, 009 | 1, 2, 4, 5, 7 |
| uc-view-attempt-history | 017-022 | S19 | 002, 003 | 1, 3, 8, 9, 12, 14, 15 |
| uc-open-attempt-detail | 014, 020, 023 | chi tiết lượt | 005-008, 010 | 1, 16, 17 |
| uc-set-exam-date | 009-012 | S06 | — | 6, 7 |
