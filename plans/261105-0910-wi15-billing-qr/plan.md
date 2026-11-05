---
title: "Mua gói & QR (`billing`)"
description: "Học viên mua một trong 4 gói qua QR và gói tự kích hoạt khi tiền về, nhờ đó có doanh thu nuôi chi phí chấm."
status: pending
priority: P1
effort: 4d
issue: 19
branch: vinh19410/feat/billing-qr
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0910-wi08-sepay-setup, project:261105-0910-wi10-onboarding, project:261105-0910-wi13-scoring-results]
blocks: [project:261105-0910-wi16-payment-reconciliation, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi20-forecast-practice, project:261105-0910-wi23-practice-reminder]
created: 2026-11-05
---

# Mua gói & QR (`billing`)

Tracking: #19

Mục 15 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `billing`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên mua một trong 4 gói qua QR và gói tự kích hoạt khi tiền về, nhờ đó có doanh thu nuôi chi phí chấm.

## Phụ thuộc
- Phải chờ: #12, #14, #17; #9 (mềm)
- Mở khóa: #20, #21, #24, #27

## Constraints
- Không thu tiền thật cho tới khi #20 xong và #21 đạt.
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Sao lưu D1 trước khi áp migration lên môi trường thật.
- Gói "Đến ngày thi" hết hạn tự dừng, không tự gia hạn.

## Non-goals
- Đối soát tiền sai hoặc trễ; thuộc #20.
- Hóa đơn VAT.
- Nhắc hết hạn gói; thuộc #27.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Đơn hàng và webhook](./phase-01-don-hang-va-webhook.md) | Pending |
| 2 | [Phase 2: Nối giao diện](./phase-02-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] 4 gói đúng giá: 49k, 99k, 249k, 349k. Gói "Đến ngày thi" tối đa 60 ngày và không tự gia hạn.
- [ ] QR thật, mỗi đơn có mã riêng, tiền về tự kích hoạt.
- [ ] Webhook được xác thực và gọi lại không kích hoạt hai lần.
- [ ] `billing-screen.tsx:34` không còn "Band tổng không giới hạn".

## Câu hỏi mở
- Chưa chốt gói "Theo lượt" 49k, cần chốt trước Task 1.2. Đề xuất đang chờ xác nhận: giữ 3 lượt mở chi tiết, không hết hạn, không miễn hạn mức thi; khi đó gói này không được tính là `paid` trong `getEntitlement`.
- Mua gói mới khi đang có gói thì cộng dồn hay thay thế?

<!-- slug: wi15-billing-qr -->
