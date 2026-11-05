---
phase: 2
title: "Giao diện quản trị"
status: pending
priority: P2
effort: ""
dependencies: [1]
---

# Phase 2: Giao diện quản trị

## Goal
Người sở hữu duyệt được đề.

## Files to Create / Modify
- Create: `apps/web/src/routes/admin/forecast.tsx`
- Create: `apps/web/src/features/admin/forecast-admin-screen.tsx`
- Create: `docs/runbooks/forecast-update.md`

## Tasks & Steps

### Task 2.1 — Tạo màn quản trị.
- Goal: Tạo màn quản trị.
- Target files and symbols: `apps/web/src/features/admin/forecast-admin-screen.tsx`; test: `apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx`
- Steps:
  1. Danh sách nháp theo quý, sửa, duyệt, lưu trữ. Hiện nguồn và đường dẫn.
  2. Viết test render với trạng thái nháp và đã đăng.
- Success criteria: Duyệt được từ giao diện.
- Verify: `pnpm --filter web test src/features/admin/__tests__/forecast-admin-screen.test.tsx` và `pnpm check-types` đều thoát với mã 0.

### Task 2.2 — Viết quy trình mỗi quý.
- Goal: Viết quy trình mỗi quý.
- Target files and symbols: `docs/runbooks/forecast-update.md`
- Steps:
  1. Ghi lịch cập nhật, các bước, và kết luận của luật sư về rủi ro bản quyền nguồn web theo #8.
- Success criteria: Runbook có đủ các mục.
- Verify: `grep -cE '^## (Lịch|Các bước|Bản quyền)' docs/runbooks/forecast-update.md` in `3`.

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
