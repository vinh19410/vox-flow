---
title: "Dựng môi trường backend Cloudflare"
description: "Backend Worker và D1 chạy được cả ở máy phát triển lẫn trên Cloudflare, có migration đầu tiên và có bộ test cho `packages/api`, để các tính năng sau có chỗ chạy thật."
status: in_progress
priority: P1
effort: 1d
issue: 10
branch: vinh19410/vox-flow-ai-10
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
| 1 | [Phase 1: Test và migration cục bộ](./phase-01-test-va-migration-cuc-bo.md) | Completed |
| 2 | [Phase 2: Triển khai lên Cloudflare](./phase-02-trien-khai-len-cloudflare.md) | Blocked (Runbook done; deploy waiting credentials) |

## Acceptance Criteria
- [x] `pnpm --filter @vox-flow/api test` chạy được và có test `healthCheck`.
- [x] Migration auth được sinh trong `packages/db/src/migrations`.
- [ ] Sau khi triển khai, URL server trả về `OK` và `/trpc/healthCheck` hoạt động (Blocked: Chờ thông tin xác thực tài khoản Cloudflare).
- [x] Có tài liệu cách lấy thông tin xác thực và cách triển khai (`docs/runbooks/cloudflare-deploy.md`).
## Câu hỏi mở
- Có tách môi trường staging và production không? (Chưa quyết định; tài liệu runbook ghi cấu hình theo stage mặc định của Alchemy).
- Dùng tên miền nào? (Chưa quyết định; dùng URL do Cloudflare cấp mặc định).
- [Đã giải quyết] Xác minh Alchemy có áp được cấu trúc `<timestamp>/migration.sql` của drizzle-kit không: `@alchemy.run/sql@2.0.0-beta.84` đã hỗ trợ cấu trúc `<dir>/migration.sql` của Drizzle v1.

## Advisory & Validation Review (Kongming)

### Key Decisions & Adjustments
1. **Thứ tự Phase 1:** Điều chỉnh thành 1.1 (lockfile) -> 1.2a (cài `vitest`, `miniflare`, test script) -> 1.3 (sinh migration) -> 1.4 (helper D1 miniflare) -> 1.2b (`index.test.ts` dùng helper D1 thật).
2. **Biện pháp an toàn cho D1 helper:** Không dùng `exec()` cho toàn bộ file vì ngắt dòng sai cú pháp; tách theo `--> statement-breakpoint` của Drizzle và chạy nguyên tử qua `d1.batch()`. Gọi `mf.dispose()` cả trong `afterAll` và trong khối `try/catch` khởi tạo để chống rò rỉ workerd. Bật `PRAGMA foreign_keys = ON;`. Ép kiểu an toàn ở tầng helper.
3. **Ranh giới Phase 2:** Hoàn thành Task 2.1 (soạn runbook `docs/runbooks/cloudflare-deploy.md`). Task 2.2 đánh dấu bị chặn bên ngoài do chưa có thông tin xác thực Cloudflare và lệnh cấm deploy lên thật trong `AGENTS.md`. PR tạo dưới dạng `Refs #10`, giữ #10 mở để hoàn tất deploy khi có thông tin xác thực.

### Whole-Plan Consistency Sweep
- **Nhất quán:** Branch chuẩn hóa thành `vinh19410/vox-flow-ai-10`.
- **Đồng bộ mã nguồn:** Helper D1 dùng `createTestDb()`, thực thi `d1.batch()`, có test cả nhánh `UNAUTHORIZED` và nhánh authenticated `privateData`.
<!-- slug: wi06-cloudflare-backend-env -->
