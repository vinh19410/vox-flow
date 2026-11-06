---
title: "Đăng nhập Google"
description: "Học viên đăng nhập thật bằng Google qua Better Auth, và màn `/auth` không còn đường email + mật khẩu theo quyết định chỉ dùng Google ở MVP."
status: pending
priority: P1
effort: 1d
issue: 11
branch: vinh19410/vox-flow-ai-11
tags: [auth, backend, frontend, advice]
blockedBy: []
blocks: [project:261105-0910-wi10-onboarding, project:261105-0910-wi19-forecast-curation]
created: 2026-11-05
---

# Đăng nhập Google

Tracking: #11

Mục 07 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên đăng nhập thật bằng Google qua Better Auth, và màn `/auth` không còn đường email + mật khẩu theo quyết định chỉ dùng Google ở MVP.

## Phụ thuộc
- Phụ thuộc đã đạt: PR #36 (nền backend D1/Miniflare từ #10) đã merge vào `dev`.
- Yếu tố ngoài: OAuth client trên Google Cloud Console (cần cho deploy Cloudflare remote; môi trường dev/test dùng giá trị test).
- Mở khóa: #14, #23
## Constraints
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Giữ `sameSite: none`, `secure` và `httpOnly` của cookie hiện tại.
- Chỉ Google, theo quyết định trong feature map.

## Non-goals
- Đăng nhập bằng link email (PRD đang ghi; xử lý ở #6).
- Xóa `_app-legacy` trừ khi cần để code biên dịch.
- Đồng bộ thông tin người dùng Google (`name`, `email`, `image`) vào `AppStateProvider` thuộc phạm vi WI-10 (Onboarding) và plan mock-to-real-data; không thực hiện trong WI-07.
## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Bật Google ở backend](./phase-01-bat-google-o-backend.md) | Pending |
| 2 | [Phase 2: Nối màn đăng nhập](./phase-02-noi-man-dang-nhap.md) | Pending |

## Acceptance Criteria
- [ ] Nhấn "Tiếp tục với Google" trên `/auth` gọi `signIn.social` với Google provider và callback đầy đủ.
- [ ] `emailAndPassword` không còn bật trong `createAuth` (`packages/auth/src/index.ts`).
- [ ] Route cần đăng nhập (`_proto/app/*`, `_proto/exam`, `_proto/scoring`, `_proto/onboarding`) chuyển người chưa đăng nhập về `/auth`.
- [ ] Test và kiểm tra kiểu đều qua (`pnpm --filter web test`, `pnpm --filter @vox-flow/api test`, `pnpm check-types`).

## Quyết định câu hỏi mở
- Giữ nguyên `_app-legacy` và các component form legacy liên quan theo đúng non-goal để tránh mở rộng phạm vi và không làm gãy các route legacy.

<!-- slug: wi07-google-login -->
