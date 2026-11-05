---
title: "Chốt 12 điểm lệch, cập nhật PRD và thay roadmap cũ"
description: "12 điểm lệch giữa feature map và PRD đều có quyết định ghi lại, PRD phản ánh các quyết định đó và roadmap mới thay roadmap cũ, nên việc viết SRS có thể bắt đầu."
status: pending
priority: P1
effort: 1d
issue: 6
branch: vinh19410/feat/reconcile-prd-roadmap
tags: [docs, advice]
blockedBy: []
blocks: [project:261105-0910-wi10-onboarding, project:261105-0910-wi11-privacy-controls]
created: 2026-11-05
---

# Chốt 12 điểm lệch, cập nhật PRD và thay roadmap cũ

Tracking: #6

Mục 02 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
12 điểm lệch giữa feature map và PRD đều có quyết định ghi lại, PRD phản ánh các quyết định đó và roadmap mới thay roadmap cũ, nên việc viết SRS có thể bắt đầu.

## Phụ thuộc
- Phải chờ: Không có
- Mở khóa: #14, #15

## Constraints
- Người sở hữu sản phẩm là người chốt; agent chỉ soạn đề xuất.
- Không đổi các quyết định OQ-1 đến OQ-4 đã chốt trong roadmap.

## Non-goals
- Viết SRS cho từng tính năng.
- Sửa code theo quyết định; từng tính năng tự xử lý.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Thu thập và chốt quyết định](./phase-01-thu-thap-va-chot-quyet-dinh.md) | Pending |
| 2 | [Phase 2: Cập nhật PRD và roadmap](./phase-02-cap-nhat-prd-va-roadmap.md) | Pending |

## Acceptance Criteria
- [ ] Có đúng 12 quyết định trong `docs/product-decisions.md`, mỗi quyết định ghi người chốt và ngày chốt.
- [ ] `docs/_product/prd.md` khớp với 12 quyết định, không còn nội dung trái ngược.
- [ ] `docs/_product/roadmap.md` là bản từ `docs/roadmap-chamro.md` và có ghi ngày thay thế.

## Câu hỏi mở
- 12 điểm lệch sẽ chốt theo đề xuất của feature map hay xem xét từng điểm?

<!-- slug: wi02-reconcile-prd-roadmap -->
