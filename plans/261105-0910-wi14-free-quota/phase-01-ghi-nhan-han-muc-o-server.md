---
phase: 1
title: "Ghi nhận hạn mức ở server"
status: completed
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Ghi nhận hạn mức ở server

## Goal
Việc trừ điểm cá nhân, giữ chỗ ngân sách toàn hệ thống và hoàn/thu hồi điểm diễn ra nguyên tử ở server, kể cả khi có nhiều yêu cầu đồng thời.

## Files to Create / Modify
- Create: `packages/db/src/schema/quota.ts`
- Modify: `packages/db/src/schema/index.ts`
- Generate: `packages/db/src/migrations/*` (via `pnpm --filter @vox-flow/db db:generate`)
- Create: `packages/api/src/quota/quota.ts`
- Create: `packages/api/src/quota/quota.test.ts`
- Create: `packages/api/src/routers/quota.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `packages/api/src/context.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/api/src/data-registry.test.ts`
- Modify: `packages/api/src/routers/attempt.ts`
- Modify: `packages/api/src/routers/attempt.test.ts`
- Modify: `packages/api/src/routers/scoring.ts`
- Modify: `packages/api/src/routers/scoring.test.ts`
- Modify: `packages/api/src/scoring/score-attempt.ts`
- Modify: `packages/api/src/scoring/score-attempt.test.ts`
- Modify: `packages/api/src/scoring/requeue.ts`
- Modify: `packages/api/src/scoring/requeue.test.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `.github/workflows/deploy-beta.yml`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc.
- Success criteria: Issue `#17` ở trạng thái `CLOSED`.
- Verify: `gh issue view 17 --json state -q .state` in `CLOSED`.

### Task 1.1 — Schema `quota_reservation`, migration & `DATA_REGISTRY` (`--tdd`)
- Goal: Tạo bảng sổ cái `quota_reservation`, sinh migration chuẩn, đăng ký quyền riêng tư vào `DATA_REGISTRY` sao cho không vượt trần 100 bind params và không làm mất dấu ngân sách ngày khi xoá tài khoản.
- Target files and symbols:
  - `packages/db/src/schema/quota.ts` (`quotaReservation`)
  - `packages/db/src/schema/index.ts`
  - `packages/db/src/migrations/*`
  - `packages/api/src/data-registry.ts` (`DATA_REGISTRY.quota_reservation`)
  - `packages/api/src/data-registry.test.ts`
- Steps:
  1. Tạo `quotaReservation` với các cột: `attemptId` (PK, không FK tới `attempt.id`), `reservationId`, `userId` (nullable, FK `user.id` `onDelete: "set null"`), `vnDay`, `points`, `costVnd`, `sunkCostVnd`, `refundCount`, `retakeOfAttemptId`, `status` (`"active" | "released"`), `createdAt`, `updatedAt` cùng 3 index.
  2. Export `./quota` từ `packages/db/src/schema/index.ts`.
  3. Chạy `pnpm --filter @vox-flow/db db:generate` và kiểm tra file SQL sinh ra chỉ tạo bảng và index cộng thêm.
  4. Đăng ký `quota_reservation` trong `DATA_REGISTRY` trước `attempt`: `export` chỉ trả `{ attemptId, vnDay, points, status, createdAt }`; `erase` xoá các dòng ngày cũ hoặc `in_progress` hết hạn/`abandoned` có `sunk_cost_vnd = 0`, và ẩn danh (`user_id = NULL`, `retake_of_attempt_id = NULL`) các dòng ngày hôm nay để giữ chính xác kế toán ngân sách.
  5. Bổ sung test trong `packages/api/src/data-registry.test.ts` kiểm tra phân tách người dùng, ẩn danh ngày hôm nay, không lộ `costVnd` và trần bind parameters `<= 100`.
- Success criteria: Schema phân loại đầy đủ và toàn bộ `data-registry.test.ts` pass.
- Verify: `pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát với mã 0.

### Task 1.2 — Viết logic hạn mức cốt lõi (`--tdd`)
- Goal: Hiện thực logic tính ngày Việt Nam, quy đổi điểm/chi phí VND, giữ chỗ nguyên tử đồng thời, hoàn điểm tối đa 3 lần/ngày giữ `sunkCostVnd`, thu hồi khi worker trễ `done`, và nhả giữ chỗ `in_progress` sau 30 phút.
- Target files and symbols:
  - `packages/api/src/quota/quota.ts` (`vnDay`, `nextVietnamMidnightMs`, `pointsFor`, `costVndFor`, `parseFreeDailyBudgetVnd`, `buildReserveStatement`, `reserve`, `refreshStaleHoldOnSubmit`, `release`, `reclaimOnLateDone`, `getQuotaStatus`, `UNSUBMITTED_HOLD_TTL_MS`, `QUOTA_EXCEEDED`, `GLOBAL_CAP_REACHED`)
  - `packages/api/src/quota/quota.test.ts`
- Steps:
  1. Viết test trong `quota.test.ts` trước: ranh giới `23:59:59.999` vs `00:00:00.000` VN; `parseFreeDailyBudgetVnd` với rỗng/`"0"`/âm/chữ; quy đổi điểm & chi phí cả Mock/Forecast/câu lẻ/retake; 5 request đồng thời (`Promise.all`) cùng 1 user không vượt 3 điểm; 4 request đồng thời nhiều user không vượt `FREE_DAILY_BUDGET_VND`; nhánh `paid` bỏ qua giới hạn vs `free` (bao gồm mua gói lẻ "Theo lượt"); nhả giữ chỗ ngân sách `in_progress` sau 30 phút; `release` lũy đẳng, giữ `sunkCostVnd` khi `retainBudget: true`, chặn hoàn quá 3 lần/ngày, hoàn qua nửa đêm VN; `reclaimOnLateDone`.
  2. Hiện thực `packages/api/src/quota/quota.ts` theo thiết kế câu lệnh SQL điều kiện D1 dùng chung predicate cho `usedPoints` và `spentVnd`.
- Success criteria: Mọi test case ranh giới ngày, đồng thời, trần hệ thống, retake, TTL 30p và hoàn/thu hồi đều pass.
- Verify: `pnpm --filter @vox-flow/api test src/quota/quota.test.ts` thoát với mã 0.

### Task 1.3 — Gắn hạn mức vào router, chấm điểm, hạ tầng & deploy Beta (`--tdd`)
- Goal: Gắn `reserve`/`release`/`reclaim` vào `attempt.start`, `attempt.submit`, `scoring.retry`, 3 đường chuyển `failed` và `runPipeline` `done`; mở endpoint `quota.status` và cấu hình `FREE_DAILY_BUDGET_VND`.
- Target files and symbols:
  - `packages/api/src/context.ts` (`ApiEnv.FREE_DAILY_BUDGET_VND`, `Context.getEntitlement`)
  - `packages/api/src/routers/quota.ts` (`quotaRouter.status`), `packages/api/src/routers/index.ts`
  - `packages/api/src/routers/attempt.ts` (`start`, `submit`)
  - `packages/api/src/routers/scoring.ts` (`retry`)
  - `packages/api/src/scoring/score-attempt.ts` (`markScoreFailed`, `scoreAttempt`, `runPipeline`)
  - `packages/api/src/scoring/requeue.ts` (`requeueStaleScores`)
  - `packages/infra/alchemy.run.ts`, `.github/workflows/deploy-beta.yml`
- Steps:
  1. Bổ sung `FREE_DAILY_BUDGET_VND` vào `context.ts`, `alchemy.run.ts` (mặc định `"33000"`) và `deploy-beta.yml`.
  2. Tạo `quotaRouter.status` và gắn vào `appRouter`; kiểm tra không trả bất kỳ trường VND nào.
  3. Trong `attempt.start`: dùng `ctx.db.batch` gồm `[reserveStmt, insertAttemptIfReservedStmt]` cho user `"free"` (trước hết không tạo row R2 `saveLinkedPrompt` nếu batch chưa thành công); hỗ trợ 1st root retake `0đ` (thử `0đ` trước, nếu đã có active retake cho bài gốc thì fallback `1đ`); trả lỗi `TOO_MANY_REQUESTS` với message `QUOTA_EXCEEDED` hoặc `GLOBAL_CAP_REACHED`.
  4. Trong `attempt.submit`: nếu `quota_reservation` đang `active` nhưng quá 30 phút hoặc thuộc ngày VN cũ, kiểm tra & gia hạn nguyên tử theo ngân sách/điểm hôm nay trong cùng `db.batch`.
  5. Trong `scoring.retry`: giữ nhánh cứu hộ `!existing` miễn hạn mức; nhánh thủ công (`existing` `failed`) đặt chỗ lại vào ngày VN hiện tại nếu `released` hoặc ngày cũ, trả lỗi `QUOTA_EXCEEDED` / `GLOBAL_CAP_REACHED` khi không đủ.
  6. Gọi `release(db, attemptId, { retainBudget: tries > 0, now })` ở 3 chỗ: `scoreAttempt` terminal catch, `markScoreFailed` (khi cập nhật sang `failed`), `requeueStaleScores` (khi timeout thành `failed`); gọi `reclaimOnLateDone` trong `runPipeline` khi thắng `done`.
  7. Viết test trong `attempt.test.ts`, `scoring.test.ts`, `score-attempt.test.ts`, `requeue.test.ts`.
- Success criteria: Toàn bộ test `@vox-flow/api` và `server` pass, không có lượt thi `in_progress` mồ côi khi bị chặn.
- Verify: `pnpm --filter @vox-flow/api test && pnpm --filter server test` thoát với mã 0.

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu, sau đó chạy checkpoint `kongming` trước khi chuyển sang Phase 2.

## Failure Protocol
Nếu bất kỳ lệnh Verify nào thất bại: DỪNG NGAY (không tự ý sửa mò hoặc xóa/nới lỏng test), ghi lại lệnh + output lỗi và gọi `kongming` để phân tích nguyên nhân gốc trước khi sửa.
