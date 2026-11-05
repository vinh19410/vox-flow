---
phase: 2
title: "Kiểm tra độ chính xác và phân quyền"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Kiểm tra độ chính xác và phân quyền

## Goal
Pipeline thật đạt ngưỡng và paywall kiểm tra ở server.

## Files to Create / Modify
- Create: `packages/api/src/routers/results.ts`
- Modify: `packages/api/src/routers/index.ts`
- Create: `docs/scoring-accuracy.md`
- Create: `packages/api/src/entitlements.ts`

## Tasks & Steps

### Task 2.1 — Tạo API kết quả có phân quyền và bảo vệ quyền sở hữu (chống IDOR).
- Goal: Tạo API kết quả có phân quyền, bảo vệ tuyệt đối dữ liệu bài thi giữa các học viên và che chắn chi tiết sau paywall.
- Target files and symbols: `packages/api/src/routers/results.ts` (`getResult`, `retry`), `packages/api/src/entitlements.ts` (`getEntitlement`, `canViewDetail`); test: `packages/api/src/routers/results.test.ts`
- Steps:
  1. Bắt buộc kiểm tra quyền sở hữu bài thi trong `results.getResult`: truy vấn `attempt` theo `attemptId`. Nếu không tìm thấy, trả `NOT_FOUND`. Nếu `attempt.userId !== ctx.session.user.id`, ném `TRPCError(FORBIDDEN, "You are not authorized to view this result")` ngay lập tức, không trả bất kỳ trường điểm hay dữ liệu nào (chống IDOR/BOLA).
  2. Sau khi xác thực quyền sở hữu: gọi `canViewDetail(db, userId, attemptId)`.
     - Nếu là người dùng miễn phí (`false`): payload chỉ chứa `overallBand`, `confidenceInterval`, và trạng thái chấm; tuyệt đối không trả tiêu chí và bằng chứng.
     - Nếu đã mở khóa hoặc có gói trả phí (`true`): trả đầy đủ 4 tiêu chí và bằng chứng trích dẫn.
  3. Phạm vi bằng chứng miễn phí làm theo quyết định D-04 của #6.
  4. Tạo `packages/api/src/entitlements.ts`, export `getEntitlement(db, userId): Promise<'free'|'paid'>` và `canViewDetail(db, userId, attemptId): Promise<boolean>`. `paid` chỉ gồm gói theo thời gian và chỉ dùng để miễn hạn mức. Chưa có `subscription` thì `getEntitlement` trả `free`; chưa có `detail_unlock` thì `canViewDetail` trả theo `getEntitlement`. `getResult` chỉ quyết định qua `canViewDetail` sau bước kiểm tra quyền sở hữu.
  5. `results.retry` chỉ cho chủ bài (`attempt.userId === ctx.session.user.id`), và chỉ được gọi khi `attempt_score.status === 'failed'`.
  6. Viết test:
     - User B truy cập attempt của User A -> bị chặn với FORBIDDEN, không có trường điểm nào bị rò rỉ.
     - User A (free) đọc bài của mình -> chỉ có điểm tổng và khoảng tin cậy.
     - User A (paid) đọc bài của mình -> có chi tiết 4 tiêu chí và bằng chứng.
- Success criteria: Payload miễn phí không có dữ liệu trả phí, người dùng khác không thể xem trộm kết quả.
- Verify: `pnpm --filter @vox-flow/api test src/routers/results.test.ts` thoát với mã 0.

### Task 2.2 — Đo pipeline thật trên bộ mẫu của #7.
- Goal: Đo pipeline thật trên bộ mẫu để xác nhận độ chính xác theo OQ-5 mà không tự hạ ngưỡng.
- Target files and symbols: `docs/scoring-accuracy.md`, `scripts/scoring-eval/run-prod-eval.ts`
- Steps:
  1. Ràng buộc đầu vào: bộ 30 bài mẫu âm thanh có văn bản đồng ý từ #7 phải được giữ lại cho đến khi Task 2.2 hoàn tất đo đạc.
  2. Viết driver kiểm tra độc lập (`scripts/scoring-eval/run-prod-eval.ts`) chạy qua chính luồng `scoreAttempt` thật để kiểm chứng code thực tế sẽ triển khai (thay vì can thiệp vào `report.ts` của #7).
  3. Ghi kết quả vào `docs/scoring-accuracy.md`, kèm dòng `Đạt ngưỡng: có` hoặc `Đạt ngưỡng: không` (đạt ≥ 80% bài lệch trong 0.5 band và ≥ 90% bài có độ chênh 3 lần ≤ 0.5 band).
- Success criteria: Báo cáo xác nhận đạt chuẩn.
- Verify: `grep -c '^Đạt ngưỡng: có' docs/scoring-accuracy.md` in `1`.
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
