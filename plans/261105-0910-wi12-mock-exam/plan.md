---
title: "Thi thử AI (`mock-exam`)"
description: "Học viên thi Full Test hoặc từng Part với câu hỏi nối tiếp do AI tạo và ghi âm thật, tạo ra bài nói đủ chất lượng để chấm."
status: pending
priority: P1
effort: 6d
issue: 16
branch: vinh19410/feat/mock-exam
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0909-wi03-scoring-eval-oq5, project:261105-0910-wi10-onboarding, project:261105-0910-wi11-privacy-controls]
blocks: [project:261105-0910-wi13-scoring-results, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi20-forecast-practice]
created: 2026-11-05
---

# Thi thử AI (`mock-exam`)

Tracking: #16

Mục 12 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `mock-exam`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên thi Full Test hoặc từng Part với câu hỏi nối tiếp do AI tạo và ghi âm thật, tạo ra bài nói đủ chất lượng để chấm.

## Phụ thuộc
- Phải chờ: #7, #14, #15
- Mở khóa: #17, #21, #24

## Constraints
- Chỉ dùng dịch vụ đã chọn ở #7.
- Chỉ thử với người đã đồng ý cho tới khi #21 đạt.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Chấm điểm; thuộc #17.
- Đếm hạn mức; thuộc #18.
- Luyện theo đề forecast; thuộc #24.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Lưu trữ và mô hình lượt thi](./phase-01-luu-tru-va-mo-hinh-luot-thi.md) | Pending |
| 2 | [Phase 2: Câu hỏi nối tiếp](./phase-02-cau-hoi-noi-tiep.md) | Pending |
| 3 | [Phase 3: Ghi âm thật trong phòng thi](./phase-03-ghi-am-that-trong-phong-thi.md) | Pending |

## Acceptance Criteria
- [ ] Mỗi câu trả lời được ghi âm thật và tải lên kho lưu trữ, được gắn với đúng lượt thi.
- [ ] Câu hỏi nối tiếp bám theo câu trả lời trước và có phương án dự phòng khi AI lỗi.
- [ ] Mất mạng không làm mất các câu đã trả lời.
- [ ] Không có đồng ý thì không ghi âm được.
- [ ] Chạy được trên Chrome, Android và Safari trên iPhone.

## Câu hỏi mở
- Mới có brainstorm và cần chạy `/srs`, nhưng không có PRD gốc (người sở hữu xác nhận ngày 2026-11-05) và SRS, brainstorm cũng không có trong repo, nên phải viết lại phạm vi trong plan trước khi code. PRD được dựng lại ở #6.

<!-- slug: wi12-mock-exam -->
