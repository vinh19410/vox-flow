---
title: "Luyện mỗi ngày (`daily-practice`)"
description: "Mỗi ngày học viên thấy việc cụ thể bám lỗi thật của mình, kèm chuỗi ngày và nhịp luyện theo ngày thi."
status: pending
priority: P2
effort: 3d
issue: 25
branch: vinh19410/feat/daily-practice
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi13-scoring-results]
blocks: [project:261105-0910-wi23-practice-reminder]
created: 2026-11-05
---

# Luyện mỗi ngày (`daily-practice`)

Tracking: #25

Mục 21 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `daily-practice`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Mỗi ngày học viên thấy việc cụ thể bám lỗi thật của mình, kèm chuỗi ngày và nhịp luyện theo ngày thi.

## Phụ thuộc
- Phải chờ: #17
- Mở khóa: #27

## Constraints
- Rủi ro chính là gợi ý chung chung; việc phải bám lỗi thật.

## Non-goals
- Gửi nhắc; thuộc #27.
- Mua thêm hạn mức.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Sinh việc hôm nay](./phase-01-sinh-viec-hom-nay.md) | Pending |
| 2 | [Phase 2: Nối giao diện](./phase-02-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Việc hôm nay được tạo từ tiêu chí yếu thật trong các bài gần nhất.
- [ ] Chuỗi ngày tính theo giờ Việt Nam.
- [ ] Nhịp luyện thay đổi theo ngày thi còn lại.
- [ ] Học viên chưa có bài nhận việc khởi đầu rõ ràng.

## Câu hỏi mở
- Nếu #6 (D-05) giữ "luyện lại câu yếu", việc đó có nằm trong mục này không?
- Có cho phép bỏ lỡ một ngày mà không mất chuỗi không?

<!-- slug: wi21-daily-practice -->
