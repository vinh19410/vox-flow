---
title: "Xử lý báo lỗi bản tối thiểu (GAP-03)"
description: "Người sở hữu sản phẩm tự xử lý được báo lỗi và giữ cam kết 72 giờ, nhờ hàng đợi, kiểm tra đồng ý, mẫu trả lời, cập nhật band và cảnh báo sắp quá hạn."
status: completed
priority: P2
effort: 3d
issue: 29
branch: vinh19410/feat/dispute-handling-minimal
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi24-score-dispute]
blocks: [project:261105-0910-wi26-dispute-handling-extended]
created: 2026-11-05
---

# Xử lý báo lỗi bản tối thiểu (GAP-03)

Tracking: #29

Mục 25 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `score-dispute (GAP-03)`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Người sở hữu sản phẩm tự xử lý được báo lỗi và giữ cam kết 72 giờ, nhờ hàng đợi, kiểm tra đồng ý, mẫu trả lời, cập nhật band và cảnh báo sắp quá hạn.

## Phụ thuộc
- Phải chờ: #28
- Mở khóa: #30

## Constraints
- Theo OQ-4: người sở hữu sản phẩm tự xử lý và giữ cam kết 72 giờ.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Phân công nhiều giám khảo; thuộc #30.
- Hiệu chuẩn chấm từ báo lỗi; thuộc #30.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: API xử lý](./phase-01-api-xu-ly.md) | Completed |
| 2 | [Phase 2: Giao diện xử lý](./phase-02-giao-dien-xu-ly.md) | Completed |

## Acceptance Criteria
- [x] Hàng đợi xếp theo hạn, chỉ người sở hữu truy cập được.
- [x] Không xem được audio nếu học viên không đồng ý.
- [x] Trả lời bằng mẫu và cập nhật band được, có lưu lại band cũ.
- [x] Có cảnh báo trước khi quá hạn 72 giờ.
- [x] Đo được tỷ lệ đúng hạn và số báo lỗi mỗi tuần.
## Câu hỏi mở
- Cảnh báo sắp quá hạn dùng mức 12 giờ có phù hợp không?
- Khi #26 chưa xong, cảnh báo chỉ hiện trong hàng đợi nên phải tự mở màn hình để thấy. Như vậy có đủ để giữ cam kết 72 giờ không?


## Red Team Review

### Session — 2026-11-05
**Findings:** 4 (4 accepted, 0 rejected)
**Severity breakdown:** 2 Critical, 1 High, 1 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Audio streaming REST route strictly checks attempt owner, blocking admin playback | Critical | Accept | Phase 1, Task 1.1 |
| 2 | `apps/server/src/scheduled.ts` is missing and crons trigger not registered in infra | Critical | Accept | Phase 1, Task 1.2 |
| 3 | Ensure `adminProcedure` handles `ADMIN_EMAILS` check robustly without lockouts | High | Accept | Phase 1, Task 1.1 |
| 4 | Previous band and resolved band persistence model clarified in dispute and attempt | Medium | Accept | Phase 1, Task 1.1 |

### Whole-Plan Consistency Sweep
- File names, routes, endpoints, and schema changes checked against current repository.
- All references to `scheduled.ts`, audio streaming in `apps/server/src/index.ts`, and `adminProcedure` aligned across Phase 1 and Phase 2.
- Zero unresolved contradictions remaining.

## Validation Log

### Verification Results
- Claims checked: 8
- Verified: 8 | Failed: 0 | Unverified: 0
- Tier: Light
- Decision: Plan is consistent, verified against codebase, and ready for execution.
<!-- slug: wi25-dispute-handling-minimal -->
