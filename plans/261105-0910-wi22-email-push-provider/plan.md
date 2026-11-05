---
title: "Chọn dịch vụ email + thông báo đẩy"
description: "Có quyết định về dịch vụ email và thông báo đẩy, dựa trên chi phí và khả năng chạy trên Cloudflare Workers, để #27 có thể bắt đầu."
status: pending
priority: P3
effort: 1d
issue: 26
branch: vinh19410/feat/email-push-provider
tags: [docs, advice]
blockedBy: []
blocks: [project:261105-0910-wi23-practice-reminder]
created: 2026-11-05
---

# Chọn dịch vụ email + thông báo đẩy

Tracking: #26

Mục 22 trong `docs/roadmap-work-items.md` · Giai đoạn: Next

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Có quyết định về dịch vụ email và thông báo đẩy, dựa trên chi phí và khả năng chạy trên Cloudflare Workers, để #27 có thể bắt đầu.

## Phụ thuộc
- Phải chờ: Không có
- Yếu tố ngoài: Tên miền gửi email
- Mở khóa: #27

## Constraints
- Chưa cần làm sớm vì chỉ #27 phụ thuộc vào việc này.
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.

## Non-goals
- Viết logic nhắc; thuộc #27.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: So sánh và quyết định](./phase-01-so-sanh-va-quyet-dinh.md) | Pending |

## Acceptance Criteria
- [ ] So sánh ít nhất 2 dịch vụ email và cách làm thông báo đẩy trên web.
- [ ] Có gửi thử thật tới Gmail và kết quả không rơi vào thư rác.
- [ ] Ghi rõ giới hạn trên iPhone: chỉ nhận đẩy khi đã thêm app vào màn hình chính.
- [ ] Có quyết định và chi phí ước tính.

## Câu hỏi mở
- Dùng tên miền nào để gửi email?

<!-- slug: wi22-email-push-provider -->
