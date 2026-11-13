---
title: "fix(profile): conditional emailVerified badge on /app/profile"
description: "Chỉ hiển thị huy hiệu 'Đã xác thực' trên /app/profile khi người dùng có session.user.email hợp lệ và session?.user?.emailVerified === true."
status: pending
priority: P2
effort: 1h
issue: 135
branch: fix/135-profile-email-verified-badge
tags: [bugfix, frontend, auth]
blockedBy: []
blocks: []
created: 2026-11-13
---

# fix(profile): conditional emailVerified badge on /app/profile

## Overview

Chỉ hiển thị huy hiệu `<Badge tone="good">Đã xác thực</Badge>` bên cạnh Email tài khoản trên `/app/profile` (`apps/web/src/features/profile/profile-screen.tsx:253-255`) khi có địa chỉ email xác thực từ phiên (`Boolean(session?.user?.email?.trim() && session?.user?.emailVerified === true)`). Với tài khoản đăng ký bằng Email + Mật khẩu (`emailVerified: false` theo quyết định D-03 trong `docs/product-decisions.md:7`), session chưa hydrate, email phiên rỗng (kể cả khi hiển thị email fallback từ client state `s.email`), hoặc chưa có email (`"Chưa thiết lập"`), ẩn hoàn toàn huy hiệu thay vì hiển thị nhãn `"Chưa xác thực"` (tránh dead-end UX khi MVP không có luồng xác minh email).

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Gắn điều kiện `Boolean(session?.user?.email?.trim() && session?.user?.emailVerified === true)` cho `<Badge tone="good">Đã xác thực</Badge>` trên `/app/profile` | P2 |
| 2 | Bổ sung unit test TDD bao phủ đủ 5 trường hợp: `emailVerified: true` + `session.user.email`, `emailVerified: false`, `emailVerified: undefined` / `session: null`, `emailVerified: true` + `email` rỗng, và `emailVerified: true` + `session.user.email` rỗng kèm fallback `s.email` | P2 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Conditional Email Verified Badge](./phase-01-start.md) | Pending |

## Dependencies

- `apps/web/src/lib/auth-client.ts:5` (`authClient.useSession()` trả về `session?.user?.emailVerified` từ Better Auth schema `packages/db/src/schema/auth.ts:8`)
- `docs/product-decisions.md:7` (Quyết định D-03: MVP không có luồng xác minh email cho tài khoản email/mật khẩu)

## Success Criteria

- [ ] `apps/web/src/features/profile/__tests__/profile-screen.test.tsx` có unit test kiểm chứng cả nhánh hiển thị (`emailVerified: true` + `session.user.email`) và ẩn (`emailVerified: false`, `emailVerified: undefined`/`session: null`, `email` rỗng, và `session.user.email` rỗng với fallback `s.email`) và toàn bộ đều pass.
- [ ] `pnpm --filter web test src/features/profile/__tests__/profile-screen.test.tsx` pass 100%.
- [ ] `pnpm check-types` pass không lỗi TypeScript hay build Vite.

## Red Team Review

### Session — 2026-11-13
**Findings:** 1 (1 accepted, 0 rejected)
**Severity breakdown:** 0 Critical, 0 High, 1 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Badge `"Đã xác thực"` dựa vào biến fallback client-state `s.email` thay vì `session?.user?.email?.trim()` | Medium | Accept | Phase 1 |

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-start.md`
- Decision deltas checked: 1 (`Boolean(email && ...)` -> `Boolean(session?.user?.email?.trim() && ...)` + asymmetric fallback test)
- Reconciled stale references: 2 (`plan.md`, `phase-01-start.md`)
- Unresolved contradictions: 0

## Validation Log

### Verification Results
- **Tier:** Light (Fact Checker across 2 reviewers)
- **Claims checked:** 8
- **Verified:** 8 | **Failed:** 0 | **Unverified:** 0

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-start.md`
- Decision deltas checked: 1
- Reconciled stale references: 0 (all synced in Red Team Review sweep)
- Unresolved contradictions: 0

<!-- slug: 135-profile-email-verified-badge -->
