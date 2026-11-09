---
phase: 1
title: "API báo lỗi"
status: completed
priority: P2
effort: ""
dependencies: []
---

# Phase 1: API báo lỗi

## Goal
Có dữ liệu và luật gửi báo lỗi.

## Files to Create / Modify
- Create: `packages/db/src/schema/dispute.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/routers/dispute.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/infra/alchemy.run.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: Xác nhận môi trường local, các gói monorepo và typecheck đều đạt chuẩn trước khi thay đổi.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy typecheck và kiểm tra schema `attempt` cùng `DATA_REGISTRY` đã sẵn sàng.
  2. Xác nhận cơ sở dữ liệu và vitest sẵn sàng.
- Success criteria: Mã nguồn và test ban đầu qua toàn bộ.
- Verify: `pnpm check-types` thoát với mã 0.

### Task 1.1 — Tạo bảng và router.
- Goal: Tạo bảng `score_dispute` và router `dispute` (`submit`, `get`).
- Target files and symbols: `packages/db/src/schema/dispute.ts` (`scoreDispute`), `packages/api/src/routers/dispute.ts` (`submit`, `get`), `packages/api/src/data-registry.ts`, `packages/infra/alchemy.run.ts`; test: `packages/api/src/routers/dispute.test.ts`, `packages/api/src/data-registry.test.ts`
- Steps:
  1. Tạo bảng `score_dispute` trong `packages/db/src/schema/dispute.ts`:
     - `id`: text primary key
     - `attemptId`: text not null, foreign key cascade tới `attempt.id`
     - `userId`: text not null, foreign key cascade tới `user.id`
     - `targetCriterion`: text not null (enum: `"ALL"`, `"FC"`, `"LR"`, `"GRA"`, `"PRON"`)
     - `expectedBand`: text not null (enum/string: `"5.0"`.."8.0"`)
     - `reason`: text (tùy chọn, tối đa 1000 ký tự)
     - `shareConsent`: integer boolean not null default false
     - `status`: text not null default `"open"` (enum: `"open"`, `"reviewing"`, `"resolved"`, `"rejected"`)
     - `dueAt`: integer timestamp_ms not null (bằng thời điểm gửi cộng 72 giờ: 72 * 60 * 60 * 1000)
     - `createdAt`: integer timestamp_ms not null
     - `updatedAt`: integer timestamp_ms
     - Ràng buộc: index trên `userId`, `attemptId`, `status`.
  2. Export từ `packages/db/src/schema/index.ts` và chạy `pnpm --filter @vox-flow/db db:generate`.
  3. Đăng ký `score_dispute` vào `packages/api/src/data-registry.ts` thuộc nhóm bảng dữ liệu cá nhân (`DATA_REGISTRY`), cài đặt `export` (lấy các bản ghi theo `userId`) và `erase` (xóa bản ghi theo `userId`).
  4. Xây dựng router `dispute` trong `packages/api/src/routers/dispute.ts`:
     - Cờ tính năng: Kiểm tra `env.SCORE_DISPUTE_ENABLED === "true"` (hoặc biến cấu hình tương đương). Khai báo trong `packages/infra/alchemy.run.ts` mặc định tắt (`"false"`).
     - `dispute.submit`:
       - Yêu cầu đăng nhập (`protectedProcedure`).
       - Khi cờ tắt: trả lỗi `TRPCError({ code: "FORBIDDEN", message: "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt" })`.
       - Kiểm tra đầu vào qua Zod schema: `attemptId`, `targetCriterion`, `expectedBand`, `reason`, `shareConsent`.
       - Tra cứu `attempt`: ném `NOT_FOUND` nếu không tồn tại; ném `FORBIDDEN` nếu `attempt.userId !== ctx.user.id`; ném `BAD_REQUEST` nếu `attempt.status !== "submitted"`.
       - Kiểm tra trùng lặp: nếu đã có bản ghi báo lỗi với `status IN ('open', 'reviewing')` cho `attemptId` này, ném `TRPCError({ code: "CONFLICT", message: "Bài thi này đã có báo lỗi đang được xử lý" })`.
       - Tạo bản ghi mới với `dueAt = now + 72 * 60 * 60 * 1000`, `status = 'open'`.
     - `dispute.get`:
       - Yêu cầu đăng nhập (`protectedProcedure`).
       - Nhận `{ attemptId: string }`.
       - Tra cứu `attempt`: ném `NOT_FOUND` nếu không tồn tại; ném `FORBIDDEN` nếu `attempt.userId !== ctx.user.id`.
       - Trả về `{ enabled: boolean, dispute: ScoreDispute | null }`. Nếu chưa có báo lỗi, trả `dispute: null` (không ném lỗi để client hiển thị mượt mà).
  5. Gắn router vào `packages/api/src/routers/index.ts`.
  6. Viết bộ test `packages/api/src/routers/dispute.test.ts`:
     - Bài của người khác bị từ chối (`FORBIDDEN`).
     - Bài chưa nộp (`in_progress` / `abandoned`) bị từ chối (`BAD_REQUEST`).
     - Báo trùng khi đang có báo lỗi mở bị từ chối (`CONFLICT`).
     - `dueAt` tính đúng 72 giờ kể từ thời điểm gửi.
     - `shareConsent` lưu đúng giá trị (mặc định `false`).
     - Nhánh tắt cờ `SCORE_DISPUTE_ENABLED` trả về `FORBIDDEN` trên `submit`.
     - `dispute.get` trả về đúng quyền sở hữu và `null` khi chưa có báo lỗi.
- Success criteria: Test router và data registry đều qua 100%.
- Verify: `pnpm --filter @vox-flow/api test src/routers/dispute.test.ts src/data-registry.test.ts` thoát với mã 0.
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
