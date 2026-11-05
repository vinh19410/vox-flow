---
phase: 1
title: "Pipeline chấm"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Pipeline chấm

## Goal
Bài nộp được chấm bất đồng bộ và lưu kết quả.

## Files to Create / Modify
- Create: `packages/db/src/schema/score.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/scoring/score-attempt.ts`
- Create: `packages/api/src/scoring/aggregate.ts`
- Modify: `packages/api/src/index.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `packages/infra/alchemy.run.ts`
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/api/src/routers/attempt.ts`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Kiểm tra PR #39 (Refs #15) và PR #40 (Refs #16) đã merge vào `dev`, và các schema `attempt`, `attemptAnswer`, `consent` đã có trong repo.
  2. Kiểm tra Issue #7 đã đóng và tiêu chí OQ-5 đã đạt: `docs/roadmap-chamro.md` có `- [x] OQ-5` và issue #7 ở trạng thái `CLOSED`.
  3. Nếu bất kỳ điều kiện nào chưa đạt, dừng lại và báo người giao việc theo Failure Protocol. Đây là chờ phụ thuộc (đặc biệt là OQ-5 chốt cấu hình và chi phí), không phải lỗi cần sửa.
- Success criteria: các điều kiện phụ thuộc được xác nhận trọn vẹn.
- Verify: `gh pr view 39 --json state,baseRefName -q '.state+" "+.baseRefName' | grep -Fx 'MERGED dev' && gh pr view 40 --json state,baseRefName -q '.state+" "+.baseRefName' | grep -Fx 'MERGED dev' && test -f packages/db/src/schema/attempt.ts && test -f packages/db/src/schema/consent.ts && gh issue view 7 --json state -q .state | grep -Fx 'CLOSED' && grep -c '^- \[x\] OQ-5' docs/roadmap-chamro.md | grep -Fx '1'`

### Task 1.1 — Viết phần tính kết quả.
- Goal: Viết phần tính kết quả.
- Target files and symbols: `packages/api/src/scoring/aggregate.ts` (`medianBand`, `confidenceRange`); test: `packages/api/src/scoring/aggregate.test.ts`
- Steps:
  1. Viết test trước: trung vị của 3 lần, làm tròn theo bước 0.5, độ chênh và khoảng tin cậy.
  2. Viết hàm thuần, không gọi dịch vụ ngoài.
- Success criteria: Test tính toán qua.
- Verify: `pnpm --filter @vox-flow/api test src/scoring/aggregate.test.ts` thoát với mã 0.

### Task 1.2 — Viết phần chấm và lưu kết quả.
- Goal: Viết phần chấm và lưu kết quả bất đồng bộ, chống gian lận/tốn chi phí và đảm bảo gửi queue an toàn.
- Target files and symbols: `packages/api/src/scoring/score-attempt.ts`, `packages/db/src/schema/score.ts`, `packages/api/src/routers/attempt.ts`, `packages/infra/alchemy.run.ts`, `apps/server/src/index.ts`; tests: `packages/api/src/routers/attempt.test.ts`, `packages/api/src/scoring/score-attempt.test.ts`
- Steps:
  1. Tạo bảng `attempt_score` (id, attemptId unique index, status: `pending_dispatch` | `queued` | `scoring` | `completed` | `failed`, overallBand, confidenceInterval, costVnd, errorReason) và `score_run` (id, attemptScoreId, runIndex unique key, criteriaScores, evidenceQuote, rawResponse).
  2. Sửa `attempt.submit`:
     a. Kiểm tra quyền sở hữu (`currentAttempt.userId === ctx.session.user.id`).
     b. Kiểm tra số câu trả lời: đếm `attemptAnswer` thuộc `attemptId`. Nếu = 0, từ chối với `BAD_REQUEST` ("Attempt has no answers to score") trước khi thay đổi trạng thái hay gửi queue (chống Denial-of-Wallet).
     c. Chuyển trạng thái nguyên tử: thực hiện trong một lệnh `db.batch` gồm:
        - `UPDATE attempt SET status='submitted', submitted_at=? WHERE id=? AND status='in_progress'`
        - `INSERT INTO attempt_score(id, attempt_id, status) VALUES (?, ?, 'pending_dispatch') ON CONFLICT(attempt_id) DO NOTHING`
        Chỉ tiến hành gửi queue nếu row `attempt` thực sự được cập nhật thành công (chống race condition khi có 2 request submit đồng thời).
     d. Gửi queue: gọi `queue.send({ attemptId })`. Nếu thành công, cập nhật `attempt_score.status = 'queued'`. Nếu gửi lỗi, giữ `pending_dispatch` để client gọi lại thử lại an toàn.
     e. Xử lý gọi lại `submit`: nếu `attempt_score.status === 'pending_dispatch'` thì gửi lại queue; nếu `queued`, `scoring`, hoặc `completed` thì trả về trạng thái hiện tại và không gửi lặp (thay thế lỗi BAD_REQUEST cũ).
  3. Cấu hình Queue hạ tầng:
     a. Khai báo Queue trong `packages/infra/alchemy.run.ts`.
     b. Khai báo kiểu `Queue<ScoreAttemptMessage>` trong server env context (`packages/api/src/index.ts`).
     c. Export queue consumer trong `apps/server/src/index.ts`.
  4. Consumer xử lý message: 3 lần chấm độc lập theo cấu hình chiến thắng của #7. Lưu chi phí mỗi lượt. Ghi `score_run` với unique key `(attemptScoreId, runIndex)` để idempotent khi message retry. Khi cả 3 lần hoàn tất, gọi `aggregate` cập nhật `attempt_score.status='completed'`. Nếu lỗi quá số lần thử, chuyển `failed`.
  5. Đăng ký bảng vào `data-registry.ts`.
- Success criteria: Test router và test chấm với client giả lập đều qua, gồm bài rỗng bị từ chối, gửi queue lỗi thử lại được, race condition được chặn, và gọi trùng lặp an toàn.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts && pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` thoát với mã 0.

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
