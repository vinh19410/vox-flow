---
phase: 2
title: "Giao diện quản trị"
status: completed
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

### Task 2.1 — Tạo màn quản trị và bảo vệ tuyến đường.
- Goal: Người sở hữu duyệt, sửa, xuất bản và lưu trữ đề từ giao diện; tuyến đường được bảo vệ.
- Target files and symbols: `apps/web/src/routes/admin/forecast.tsx`, `apps/web/src/features/admin/forecast-admin-screen.tsx`; test: `apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx`
- Steps:
  1. Tạo tuyến đường `apps/web/src/routes/admin/forecast.tsx` có kiểm tra quyền truy cập (chỉ cho phép khi người dùng là admin, chuyển hướng hoặc hiển thị thông báo từ chối nếu không có quyền).
  2. Màn hình `forecast-admin-screen.tsx`: danh sách nháp theo quý, cho phép sửa câu hỏi, duyệt (publish), lưu trữ (archive). Hiển thị nguồn và đường dẫn an toàn (`rel="noopener noreferrer"`).
  3. Viết test render với trạng thái nháp và đã đăng.
  4. Chạy `pnpm check-types` để sinh lại `apps/web/src/routeTree.gen.ts` tự động qua Vite (không sửa tay file này theo AGENTS.md).
- Success criteria: Duyệt được từ giao diện và routeTree tự động cập nhật hợp lệ.
- Verify: `pnpm --filter web test src/features/admin/__tests__/forecast-admin-screen.test.tsx && pnpm check-types` thoát với mã 0.
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
