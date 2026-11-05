---
title: "Cập nhật đề forecast (`forecast-curation`)"
description: "Người sở hữu sản phẩm có công cụ để đưa đề forecast mới lên mỗi quý từ 3 nguồn, với AI gộp trùng thành bản nháp và mọi đề đều được duyệt trước khi đăng."
status: completed
priority: P2
effort: 4d
issue: 23
branch: vinh19410/vox-flow-ai-23
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
| 1 | [Phase 1: Dữ liệu và nguồn đề](./phase-01-du-lieu-va-nguon-de.md) | Completed |
| 2 | [Phase 2: Giao diện quản trị](./phase-02-giao-dien-quan-tri.md) | Completed |

## Acceptance Criteria
- [x] Chỉ người sở hữu sản phẩm truy cập được công cụ.
- [x] Có đủ 3 nguồn: tự soạn, học viên báo, thu thập từ web.
- [x] Không có đề nào đăng mà chưa duyệt.
- [x] Câu hỏi từ nguồn web được viết lại và lưu đường dẫn nguồn.
- [x] "Số thí sinh báo đã gặp" chỉ đếm báo cáo thật từ học viên.

## Câu hỏi mở
- Thu thập web lấy từ những nguồn nào?

## Red Team Review

### Session — 2026-11-05
**Findings:** 5 (5 accepted, 0 rejected)
**Severity breakdown:** 2 Critical, 2 High, 1 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Dependency check deadlock on issue states (OPEN vs CLOSED in dev flow) | Critical | Accept | Phase 1 (Task 1.0) |
| 2 | Missing `Context.env` plumbing and admin authorization deadlock | Critical | Accept | Phase 1 (Task 1.2) |
| 3 | Unclassified tables breaking `data-registry.test.ts` on CI | High | Accept | Phase 1 (Task 1.1) |
| 4 | Missing `listDrafts`/`updateDraft` in router and student reporting procedure | High | Accept | Phase 1 (Task 1.2), Phase 2 (Task 2.1) |
| 5 | Unprotected `/admin/forecast` route and malformed verify command syntax | Medium | Accept | Phase 2 (Task 2.1) |

### Whole-Plan Consistency Sweep
- Gated Task 1.0 against verifiable repository artifacts (`packages/db/src/schema/auth.ts`, `packages/api/src/test/db.ts`, `packages/api/src/data-registry.ts`) instead of GitHub issue `.state` fields that remain `OPEN` until `main`.
- Extended `Context` to include optional `env?: { ADMIN_EMAILS?: string }` with strict email parsing (`Set<string>`), wiring through `apps/server/src/context.ts` without breaking existing test callers.
- Registered `forecast_topic` and `forecast_source` into `NON_PERSONAL_TABLES` and `forecast_report` into `DATA_REGISTRY` with `export` and `erase` handlers.
- Expanded `forecastAdminRouter` with `listDrafts` and `updateDraft`, added student report submission procedure, and enforced `reviewedBy = ctx.session.user.id`.
- Added route protection for `/admin/forecast` and fixed Task 2.1 verify command syntax.

<!-- slug: wi19-forecast-curation -->
