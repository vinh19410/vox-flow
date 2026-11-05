---
title: "Luyện forecast (`forecast-practice`)"
description: "Học viên luyện đúng chủ đề có khả năng gặp trong quý, thấy độ phủ đề và lưu được danh sách ôn, trên dữ liệu đề đã được duyệt."
status: pending
priority: P2
effort: 3d
issue: 24
branch: vinh19410/feat/forecast-practice
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi12-mock-exam, project:261105-0910-wi13-scoring-results, project:261105-0910-wi14-free-quota, project:261105-0910-wi15-billing-qr, project:261105-0910-wi19-forecast-curation]
blocks: []
created: 2026-11-05
---

# Luyện forecast (`forecast-practice`)

Tracking: #24

Mục 20 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `forecast-practice`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên luyện đúng chủ đề có khả năng gặp trong quý, thấy độ phủ đề và lưu được danh sách ôn, trên dữ liệu đề đã được duyệt.

## Phụ thuộc
- Phải chờ: #16, #17, #18, #19, #23

## Constraints
- "Số thí sinh báo đã gặp" chỉ đếm báo cáo thật.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Công cụ quản trị đề; thuộc #23.
- Gợi ý việc mỗi ngày; thuộc #25.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: API luyện đề](./phase-01-api-luyen-de.md) | Pending |
| 2 | [Phase 2: Nối giao diện](./phase-02-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Chỉ hiện đề đã đăng của quý hiện tại.
- [ ] Lọc, tìm và danh sách ôn được lưu theo tài khoản.
- [ ] "Luyện ngay" chạy qua phòng thi thật, được chấm và trừ hạn mức đúng.
- [ ] Độ phủ tính từ bài luyện thật.
- [ ] Phân quyền theo gói kiểm tra ở server.

## Câu hỏi mở
- Tính năng nào của forecast cần gói trả phí, tính năng nào miễn phí?

<!-- slug: wi20-forecast-practice -->
