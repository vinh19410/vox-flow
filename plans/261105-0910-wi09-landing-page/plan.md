---
title: "Landing (`landing-page`)"
description: "Landing đưa người mới vào lần thi đầu với lời hứa đúng với hạn mức 3 điểm/ngày, không còn câu nào hứa không giới hạn."
status: pending
priority: P1
effort: 4h
issue: 13
branch: vinh19410/feat/landing-page
tags: [frontend, advice]
blockedBy: []
blocks: [project:261105-0910-wi17-first-real-students-gate]
created: 2026-11-05
---

# Landing (`landing-page`)

Tracking: #13

Mục 09 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `landing-page`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Landing đưa người mới vào lần thi đầu với lời hứa đúng với hạn mức 3 điểm/ngày, không còn câu nào hứa không giới hạn.

## Phụ thuộc
- Phải chờ: Không có
- Mở khóa: #21

## Constraints
- Hạn mức 3 điểm/ngày đã chốt ở OQ-1.
- Không đổi bố cục đã khớp với prototype nếu không cần.

## Non-goals
- Đếm hạn mức thật; thuộc #18.
- Sửa `billing-screen.tsx:34`; thuộc #19.
- SEO và đo lường chuyển đổi.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Sửa lời hứa và kiểm tra luồng vào](./phase-01-sua-loi-hua-va-kiem-tra-luong-vao.md) | Pending |

## Acceptance Criteria
- [ ] Không còn lời hứa trái hạn mức trong `apps/web/src/features/landing`.
- [ ] Nêu đúng 3 điểm/ngày: Full Test 3 điểm, mỗi Part 1 điểm.
- [ ] Nút chính dẫn tới `/auth`.
- [ ] Test và kiểm tra kiểu đều qua.

## Câu hỏi mở
- Có nên nói rõ trần miễn phí toàn hệ thống trên landing, hay chỉ thông báo khi chạm trần?

<!-- slug: wi09-landing-page -->
