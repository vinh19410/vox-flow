---
title: "Thiết lập SePay"
description: "Tài khoản SePay và tài khoản nhận tiền sẵn sàng, khóa webhook được lưu an toàn và cách vận hành được ghi lại, để #19 có thể nhận tiền thật."
status: pending
priority: P1
effort: 1d
issue: 12
branch: vinh19410/feat/sepay-setup
tags: [infra, advice]
blockedBy: []
blocks: [project:261105-0910-wi15-billing-qr, project:261105-0910-wi16-payment-reconciliation]
created: 2026-11-05
---

# Thiết lập SePay

Tracking: #12

Mục 08 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Tài khoản SePay và tài khoản nhận tiền sẵn sàng, khóa webhook được lưu an toàn và cách vận hành được ghi lại, để #19 có thể nhận tiền thật.

## Phụ thuộc
- Phải chờ: #8 (mềm)
- Yếu tố ngoài: Tài khoản ngân hàng nhận tiền và đăng ký SePay
- Mở khóa: #19, #20

## Constraints
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Chưa nhận tiền của học viên thật cho tới khi #21 đạt.
- Nên chờ luật sư trả lời có cần đăng ký hộ kinh doanh trước khi thu tiền.

## Non-goals
- Viết webhook và tạo QR; thuộc #19.
- Đối soát; thuộc #20.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Tạo tài khoản và lưu cấu hình](./phase-01-tao-tai-khoan-va-luu-cau-hinh.md) | Pending |

## Acceptance Criteria
- [ ] Tài khoản SePay đã liên kết tài khoản nhận tiền.
- [ ] Có khóa webhook trong secret của Worker, không có trong git.
- [ ] Một giao dịch thử xuất hiện trên SePay và được ghi lại trong runbook.
- [ ] Có ghi nhận về việc có cần đăng ký hộ kinh doanh theo trả lời của luật sư.

## Câu hỏi mở
- Tài khoản nhận tiền đứng tên cá nhân hay hộ kinh doanh?

<!-- slug: wi08-sepay-setup -->
