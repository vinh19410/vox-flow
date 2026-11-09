---
title: "Tiến độ band (`progress-history`)"
description: "Học viên phân biệt được tiến bộ thật với dao động giữa các bài, qua dashboard và lịch sử dùng dữ liệu chấm thật."
status: pending
priority: P2
effort: 2d
issue: 22
branch: vinh19410/feat/progress-history
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi11-privacy-controls, project:261105-0910-wi13-scoring-results]
blocks: []
created: 2026-11-05
---

# Tiến độ band (`progress-history`)

Tracking: #22

Mục 18 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `progress-history`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên phân biệt được tiến bộ thật với dao động giữa các bài, qua dashboard và lịch sử dùng dữ liệu chấm thật.

## Phụ thuộc
- Phải chờ: #15, #17

## Constraints
- Không để band ước lượng tạo kỳ vọng sai: luôn hiện khoảng và cơ sở dữ liệu.

## Non-goals
- Việc hôm nay và chuỗi ngày; thuộc #25.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: API tiến độ](./phase-01-api-tien-do.md) | Pending |
| 2 | [Phase 2: Nối giao diện](./phase-02-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Dashboard và lịch sử đọc từ dữ liệu thật của đúng học viên.
- [ ] Band ước lượng luôn hiện kèm khoảng tin cậy và số bài làm cơ sở.
- [ ] Bài bị xóa theo quyền riêng tư không còn xuất hiện.
- [ ] Có trạng thái khi chưa có bài và khi chưa đủ dữ liệu.

## Câu hỏi mở
- Cần tối thiểu bao nhiêu bài mới hiện band ước lượng?

<!-- slug: wi18-progress-history -->
