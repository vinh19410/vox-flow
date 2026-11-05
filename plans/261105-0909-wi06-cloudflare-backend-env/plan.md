---
title: "Dựng môi trường backend Cloudflare"
description: "Backend Worker và D1 chạy được cả ở máy phát triển lẫn trên Cloudflare, có migration đầu tiên và có bộ test cho `packages/api`, để các tính năng sau có chỗ chạy thật."
status: pending
priority: P1
effort: 1d
issue: 10
branch: vinh19410/feat/cloudflare-backend-env
tags: [infra, backend, advice]
blockedBy: []
blocks: [project:261105-0910-wi07-google-login, project:261105-0910-wi19-forecast-curation]
created: 2026-11-05
---

# Dựng môi trường backend Cloudflare

Tracking: #10

Mục 06 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Backend Worker và D1 chạy được cả ở máy phát triển lẫn trên Cloudflare, có migration đầu tiên và có bộ test cho `packages/api`, để các tính năng sau có chỗ chạy thật.

## Phụ thuộc
- Phải chờ: Không có
- Yếu tố ngoài: Thông tin xác thực tài khoản Cloudflare
- Mở khóa: #11, #23

## Constraints
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Sao lưu D1 trước khi áp migration lên môi trường thật.
- Giữ deploy qua Alchemy theo `packages/infra`, không thêm công cụ khác.

## Non-goals
- Thêm R2 hoặc Queue; thêm khi #16 và #17 cần.
- CI/CD tự động.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Test và migration cục bộ](./phase-01-test-va-migration-cuc-bo.md) | Pending |
| 2 | [Phase 2: Triển khai lên Cloudflare](./phase-02-trien-khai-len-cloudflare.md) | Pending |

## Acceptance Criteria
- [ ] `pnpm --filter @vox-flow/api test` chạy được và có test `healthCheck`.
- [ ] Migration auth được sinh trong `packages/db/src/migrations`.
- [ ] Sau khi triển khai, URL server trả về `OK` và `/trpc/healthCheck` hoạt động.
- [ ] Có tài liệu cách lấy thông tin xác thực và cách triển khai.

## Câu hỏi mở
- Có tách môi trường staging và production không?
- Dùng tên miền nào?
- Chưa xác minh Alchemy có áp được cấu trúc `<timestamp>/migration.sql` của drizzle-kit không; lần triển khai đầu sẽ cho biết.

<!-- slug: wi06-cloudflare-backend-env -->
