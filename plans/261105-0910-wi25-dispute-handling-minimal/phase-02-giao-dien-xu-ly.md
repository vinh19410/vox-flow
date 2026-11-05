---
phase: 2
title: "Giao diện xử lý"
status: pending
priority: P2
effort: ""
dependencies: [1]
---

# Phase 2: Giao diện xử lý

## Goal
Người sở hữu xử lý được từ đầu đến cuối.

## Files to Create / Modify
- Create: `apps/web/src/routes/admin/disputes.tsx`
- Create: `apps/web/src/features/admin/disputes-screen.tsx`
- Create: `docs/runbooks/score-dispute.md`

## Tasks & Steps

### Task 2.1 — Tạo màn hàng đợi.
- Goal: Tạo màn hàng đợi.
- Target files and symbols: `apps/web/src/features/admin/disputes-screen.tsx`; test: `apps/web/src/features/admin/__tests__/disputes-screen.test.tsx`
- Steps:
  1. Danh sách theo hạn, xem bài, nghe audio nếu được phép, chọn mẫu trả lời, cập nhật band.
  2. Hiện tỷ lệ đúng hạn và số báo lỗi/tuần.
  3. Viết test render và trường hợp không có quyền xem audio.
- Success criteria: Màn hình đủ thao tác.
- Verify: `pnpm --filter web test src/features/admin/__tests__/disputes-screen.test.tsx` và `pnpm check-types` đều thoát với mã 0.

### Task 2.2 — Viết runbook và mẫu trả lời.
- Goal: Viết runbook và mẫu trả lời.
- Target files and symbols: `docs/runbooks/score-dispute.md`
- Steps:
  1. Ghi các mục `## Quy trình`, `## Mẫu trả lời`, `## Khi nào tìm thêm người`: quá 5 báo lỗi/tuần hoặc đúng hạn dưới 90%.
  2. Sau khi hàng đợi chạy, người sở hữu đặt `SCORE_DISPUTE_ENABLED=true` và triển khai lại.
- Success criteria: Đủ 3 mục.
- Verify: `grep -cE '^## (Quy trình|Mẫu trả lời|Khi nào tìm thêm người)' docs/runbooks/score-dispute.md` in `3`.

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
