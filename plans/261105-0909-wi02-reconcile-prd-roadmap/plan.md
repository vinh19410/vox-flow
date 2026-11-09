---
title: "Chốt 12 điểm lệch, cập nhật PRD và thay roadmap cũ"
description: "12 điểm lệch giữa feature map và PRD đều có quyết định ghi lại, PRD phản ánh các quyết định đó và roadmap mới thay roadmap cũ, nên việc viết SRS có thể bắt đầu."
status: completed
priority: P1
effort: 1d
issue: 6
branch: vinh19410/vox-flow-ai-6
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
| 1 | [Phase 1: Thu thập và chốt quyết định](./phase-01-thu-thap-va-chot-quyet-dinh.md) | Completed |
| 2 | [Phase 2: Cập nhật PRD và roadmap](./phase-02-cap-nhat-prd-va-roadmap.md) | Completed |

## Red Team & Advisory Review

### Session — 2026-11-05
- **Reviewers:** Security Adversary, Assumption Destroyer, Kongming Advisory Supervisor
- **Key Adjustments:**
  1. PRD dựng lại từ 3 nguồn: Mục 7 PRD, trích dẫn PRD trong `docs/roadmap-chamro.md`, và Feature Map `plans/reports/advise-261104-0948-chamro-feature-map.md` (21 feature + 6 GAP), có gắn tag xuất xứ `[PRD-trích]`, `[Feature map F-xx/GAP-xx]`, `[D-xx]` hoặc `chưa có`.
  2. Pre-fill D-07, D-08, D-09 theo OQ-2, OQ-3, OQ-4 đã chốt trong roadmap ngày 2026-11-05; pre-fill D-02, D-03 theo quyết định đã chốt trong feature map ngày 2026-11-04. Soạn đề xuất rõ ràng cho 7 điểm còn lại (D-01, D-04, D-05, D-06, D-10, D-11, D-12).
  3. Không phá vỡ `docs/roadmap-chamro.md` để đảm bảo lệnh verify của #7 (OQ-5), #8 (OQ-6), #9 (billing) không bị ảnh hưởng. `docs/_product/roadmap.md` đặt stub trỏ về Mục 2 và Mục 7 cho tới khi các issue đó hoàn thành.
  4. Đưa ranh giới bảo mật & ủy quyền (vai trò admin tách biệt Google auth của học viên) và yêu cầu bảo vệ dữ liệu theo Luật 91/2025/QH15 & Nghị định 356/2025 vào PRD dưới dạng yêu cầu chức năng/phi chức năng chờ tư vấn luật sư OQ-6 (#8).
  5. Thêm kiểm tra nhất quán toàn plan: toàn bộ 12 mã `D-xx` có mặt trong PRD, không còn giá trị cũ bị loại bỏ.

## Acceptance Criteria
- [x] Có đúng 12 quyết định trong `docs/product-decisions.md`, mỗi quyết định ghi người chốt và ngày chốt.
- [x] `docs/_product/prd.md` khớp với 12 quyết định, không còn nội dung trái ngược.
- [x] `docs/_product/roadmap.md` là bản từ `docs/roadmap-chamro.md` và có ghi ngày thay thế.

## Câu hỏi mở
- 12 điểm lệch đã được Người sở hữu sản phẩm xem xét và chốt toàn bộ vào ngày 2026-11-05 tại `docs/product-decisions.md`.

<!-- slug: wi02-reconcile-prd-roadmap -->
