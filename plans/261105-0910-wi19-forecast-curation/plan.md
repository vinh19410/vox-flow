---
title: "Cập nhật đề forecast (`forecast-curation`)"
description: "Người sở hữu sản phẩm có công cụ để đưa đề forecast mới lên mỗi quý từ 3 nguồn, với AI gộp trùng thành bản nháp và mọi đề đều được duyệt trước khi đăng."
status: pending
priority: P2
effort: 4d
issue: 23
branch: vinh19410/feat/forecast-curation
tags: [backend, frontend, advice]
blockedBy: [project:261105-0909-wi06-cloudflare-backend-env, project:261105-0910-wi07-google-login, project:261105-0910-wi11-privacy-controls]
blocks: [project:261105-0910-wi20-forecast-practice]
created: 2026-11-05
---

# Cập nhật đề forecast (`forecast-curation`)

Tracking: #23

Mục 19 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `forecast-curation`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Người sở hữu sản phẩm có công cụ để đưa đề forecast mới lên mỗi quý từ 3 nguồn, với AI gộp trùng thành bản nháp và mọi đề đều được duyệt trước khi đăng.

## Phụ thuộc
- Phải chờ: #10, #11, #15; #8 (mềm)
- Mở khóa: #24

## Constraints
- Theo OQ-2: chỉ người sở hữu sản phẩm dùng, mọi đề phải được duyệt.
- Nên chờ luật sư trả lời về bản quyền nguồn web trước khi bật thu thập web.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Màn luyện của học viên; thuộc #24.
- Vai trò cộng tác viên.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Dữ liệu và nguồn đề](./phase-01-du-lieu-va-nguon-de.md) | Pending |
| 2 | [Phase 2: Giao diện quản trị](./phase-02-giao-dien-quan-tri.md) | Pending |

## Acceptance Criteria
- [ ] Chỉ người sở hữu sản phẩm truy cập được công cụ.
- [ ] Có đủ 3 nguồn: tự soạn, học viên báo, thu thập từ web.
- [ ] Không có đề nào đăng mà chưa duyệt.
- [ ] Câu hỏi từ nguồn web được viết lại và lưu đường dẫn nguồn.
- [ ] "Số thí sinh báo đã gặp" chỉ đếm báo cáo thật từ học viên.

## Câu hỏi mở
- Thu thập web lấy từ những nguồn nào?

<!-- slug: wi19-forecast-curation -->
