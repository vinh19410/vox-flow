---
phase: 2
title: "Xuất và xóa dữ liệu"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Xuất và xóa dữ liệu

## Goal
Học viên xuất được và xóa được toàn bộ dữ liệu trong 24 giờ.

## Files to Create / Modify
- Modify: `packages/api/src/routers/privacy.ts`
- Create: `packages/api/src/data-registry.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `packages/db/src/schema/consent.ts`
- Create: `apps/server/src/scheduled.ts`

## Tasks & Steps

### Task 2.1 — Tạo danh sách nơi chứa dữ liệu cá nhân.
- Goal: Tạo danh sách nơi chứa dữ liệu cá nhân.
- Target files and symbols: `packages/api/src/data-registry.ts`; test: `packages/api/src/data-registry.test.ts`
- Steps:
  1. Một danh sách duy nhất gồm hàm `export` và `erase` theo `userId` cho mỗi bảng có dữ liệu học viên.
  2. Các tính năng sau như #16, #17 phải thêm bảng của mình vào đây.
  3. Viết test duyệt mọi bảng export từ `@vox-flow/db/schema`. Mỗi bảng phải nằm trong `DATA_REGISTRY` hoặc `NON_PERSONAL_TABLES` kèm lý do; bảng chưa phân loại làm test fail. Test seed một dòng cho mỗi bảng đã đăng ký, gọi `erase`, rồi khẳng định dòng đó hết và dữ liệu người khác còn nguyên. `erase` nhận `{ db, audioBucket }` để xóa cả object R2 (`audioBucket` có sau #16).
- Success criteria: Test phát hiện được bảng bị bỏ sót.
- Verify: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát với mã 0.

### Task 2.2 — Tạo luồng xuất và xóa.
- Goal: Tạo luồng xuất và xóa.
- Target files and symbols: `packages/api/src/routers/privacy.ts` (`exportData`, `requestDeletion`), `packages/db/src/schema/consent.ts` (`deletion_request`), `apps/server/src/scheduled.ts`, `apps/server/src/index.ts`; test: `packages/api/src/routers/privacy.test.ts`
- Steps:
  1. `exportData` trả JSON từ danh sách trên.
  2. `requestDeletion` ghi `deletion_request` (`userId` không có khóa ngoại, `requestedAt`, `dueAt`, `completedAt`). Chạy `pnpm --filter @vox-flow/db db:generate`. Cron mỗi giờ xử lý mọi yêu cầu chưa hoàn tất, không đợi `dueAt`. Khi xong, đặt `userId = NULL` và ghi `completedAt`. Nếu xóa R2 lỗi thì không ghi `completedAt`.
  3. `index.ts` export `{ fetch: app.fetch, scheduled }`, lịch khai bằng `crons: ['0 * * * *']` trong Worker tại `packages/infra/alchemy.run.ts`.
  4. Viết test: sau khi xử lý, không còn dữ liệu của học viên đó nhưng dữ liệu người khác còn nguyên.
- Success criteria: Test xóa qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/privacy.test.ts` và `pnpm check-types` đều thoát với mã 0.

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
