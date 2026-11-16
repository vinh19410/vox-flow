---
title: "Đối soát thanh toán (`payment-reconciliation`)"
description: "Tiền về sai hoặc trễ đều có đường xử lý, nên học viên không mất tiền oan và có thể bật thu tiền thật."
status: in_progress
priority: P1
effort: 3d
issue: 20
branch: vinh19410/plan-16-i-so-t-thanh-to-n-payment-reconciliation
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0910-wi08-sepay-setup, project:261105-0910-wi15-billing-qr]
blocks: [project:261105-0910-wi17-first-real-students-gate]
created: 2026-11-05
---

# Đối soát thanh toán (`payment-reconciliation`)

Tracking: #20

Mục 16 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `payment-reconciliation`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Tiền về sai hoặc trễ đều có đường xử lý, nên học viên không mất tiền oan và có thể bật thu tiền thật.

## Phụ thuộc
- Phải chờ: #12, #19
- Mở khóa: #21

## Constraints
- Phải xong trước khi thu tiền thật.
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Thao tác tay phải được lưu lịch sử.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Tự động hoàn tiền.
- Hóa đơn VAT.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Phân loại và phát hiện giao dịch lỗi](./phase-01-phan-loai-va-phat-hien-giao-dich-loi.md) | Pending |
| 2 | [Phase 2: Công cụ xử lý và runbook](./phase-02-cong-cu-xu-ly-va-runbook.md) | Pending |

## Acceptance Criteria
- [ ] Mọi giao dịch không khớp đều vào hàng đợi: thiếu tiền, thừa tiền, sai hoặc thiếu mã, trễ sau khi đơn hết hạn.
- [ ] Người sở hữu kích hoạt tay hoặc đánh dấu hoàn tiền được, có lưu lại lịch sử.
- [ ] Có kiểm tra định kỳ phát hiện giao dịch webhook bị lỡ.
- [ ] Có runbook xử lý từng trường hợp.

## Quyết định đã chốt (Gate 1 - 2026-11-16)
- Thời hạn phản hồi / xử lý học viên (SLA) khi tiền về sai hoặc trễ: **24 giờ** kể từ lúc giao dịch phát sinh.
- Thiếu tiền (`underpaid`): **Chỉ hoàn tiền thủ công ngoài ngân hàng** và đánh dấu hoàn tiền (không nhận chuyển bù).
- Thừa tiền (`overpaid`): **Không tự động kích hoạt**; giữ giao dịch ở hàng đợi `overpaid` để admin kiểm tra rồi kích hoạt tay (hoàn phần thừa ngoài ngân hàng) hoặc đánh dấu hoàn tiền toàn bộ.
- Ghi chú môi trường Beta: tạm thời bỏ qua cấu hình live `SEPAY_API_TOKEN` và `ADMIN_EMAILS` trên environment `beta` bằng fallback rỗng an toàn; người sở hữu sẽ nạp sau khi kiểm thử thật.

<!-- slug: wi16-payment-reconciliation -->
