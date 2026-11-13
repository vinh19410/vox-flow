---
title: Plan 135 profile emailVerified badge
date: 2026-11-13
summary: "Locked TDD handover plan for conditional emailVerified badge on /app/profile (#135)."
---

# Plan 135 profile emailVerified badge

## What happened
- Investigated issue #135 (`apps/web/src/features/profile/profile-screen.tsx:253-255`) and confirmed `<Badge tone="good">Đã xác thực</Badge>` was statically rendered regardless of `session?.user?.emailVerified`.
- Aligned with decision D-03 (`docs/product-decisions.md:7`) and Kongming counsel: hide the badge rather than showing "Chưa xác thực" (avoiding dead-end UX since MVP has no email verification flow).
- Red-team review (Security Adversary) caught that checking `email` (`session?.user?.email || s.email`) could attach the verified badge to client fallback `s.email`; updated condition to `Boolean(sessionEmail && session?.user?.emailVerified === true)` with `sessionEmail = session?.user?.email?.trim() ?? ""`.

## Decision
- Show `<Badge tone="good">Đã xác thực</Badge>` only when `session?.user?.email?.trim()` is non-empty and `session?.user?.emailVerified === true`.

## Next steps
- Commit and push plan + journal via `ak-git cp`, update issue #135, then execute `/ak-fix --auto --advice`.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
