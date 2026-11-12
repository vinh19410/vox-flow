---
type: reverse-usecase-index
feature: score-dispute
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/score-dispute/score-dispute-reverse-spec.md
---

# score-dispute — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-submit-score-dispute](./uc-submit-score-dispute.md) | Học viên gửi báo lỗi chấm cho một bài thi | Học viên | FR-score-dispute-001..013, 019..022 | Form "Báo lỗi chấm" | E-score-dispute-001..010, 014 | OQ-1, 2, 4, 7, 8, 10, 11, 12, 14, 15 | S1: packages/api/src/routers/dispute.ts:24-131; S4: apps/web/src/features/results/components/report-modal.tsx:25-161 | ✅ |
| [uc-view-dispute-status](./uc-view-dispute-status.md) | Học viên xem trạng thái báo lỗi trên trang kết quả | Học viên | FR-score-dispute-014..018, 023, 026 | Trang kết quả (nút/badge) | E-score-dispute-011..013 | OQ-1, 2, 3, 4, 6, 9, 13 | S1: packages/api/src/routers/dispute.ts:133-169; S5: apps/web/src/features/results/results-screen.tsx:75-91,318-344 | 🟡 |
| [uc-consent-share-audio](./uc-consent-share-audio.md) | Học viên đồng ý chia sẻ ghi âm và transcript cho giám khảo khi báo lỗi | Học viên | FR-score-dispute-010, 024 | Form "Báo lỗi chấm" (ô đồng ý) | — (không có lỗi riêng) | OQ-5 | S4: apps/web/src/features/results/components/report-modal.tsx:130-140; S9: apps/server/src/index.ts:322-344 | ✅ |

### Ma trận UC - FR - Screen - Error - OQ

| UC | FR | Screen | Error | OQ |
|----|----|--------|-------|----|
| uc-submit-score-dispute | 001, 002, 003, 004, 005, 006, 007, 008, 009, 011, 012, 013, 019, 020, 021, 022 | Form báo lỗi; Trang kết quả | 001 đến 010, 014 | 1, 2, 4, 7, 8, 10, 11, 12, 14, 15 |
| uc-view-dispute-status | 014, 015, 016, 017, 018, 023, 026 | Trang kết quả (nút / badge) | 011, 012, 013 | 1, 2, 3, 4, 6, 9, 13 |
| uc-consent-share-audio | 010, 024 | Form báo lỗi (ô đồng ý) | — | 5 |

> Use case của phía quản trị (xử lý báo lỗi, nghe audio, nhận cảnh báo quá hạn) thuộc feature `dispute-admin`, không liệt kê ở đây.

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Học viên (chủ bài thi) | người | S1: packages/api/src/routers/dispute.ts:48-53 |
| Quản trị/giám khảo (bàn giao) | người | S15: packages/api/src/routers/dispute-admin.ts:1-14 |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn — mỗi mệnh đề mang nhãn ✅/🔵/🟡. Chạy `/usecase score-dispute` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Feature chỉ có use case phía học viên; không đủ nguồn để bịa use case khác (hủy báo lỗi, sửa đồng ý, thông báo kết quả đều không có trong code — xem `../reverse-gaps.md`).
* Tất cả use case phụ thuộc cờ `SCORE_DISPUTE_ENABLED` (mặc định tắt 🟡 chưa biết giá trị thật).
