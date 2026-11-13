---
phase: 2
title: "Phân quyền kết quả"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 2: Phân quyền kết quả

## Goal
`scoring.getResult` trả khoảng tin cậy, và chỉ trả dữ liệu mà người xem có quyền thấy theo D-04. Đo độ chính xác của pipeline chấm không thuộc phase này; việc đó ở #154.

## Files to Create / Modify
- Modify: `packages/api/src/scoring/aggregate.ts`, `packages/api/src/scoring/aggregate.test.ts`
- Modify: `packages/api/src/scoring/types.ts`
- Create: `packages/api/src/entitlements.ts`, `packages/api/src/entitlements.test.ts`
- Modify: `packages/api/src/routers/scoring.ts`, `packages/api/src/routers/scoring.test.ts`

## Tasks & Steps

### Task 2.1 — Khoảng tin cậy từ 3 lượt chấm
- Goal: kết quả có khoảng tin cậy dựa trên dữ liệu thật đã lưu.
- Target files and symbols: `aggregate.ts` (`confidenceRange`), `types.ts` (`ScoringResult.range`), `scoring.ts` (`getResult`)
- Steps:
  1. Viết test trước cho `confidenceRange(overalls: number[]): [number, number]`: trả `[min, max]` của `score_run.overall`, đã làm tròn bước 0.5; một lượt thì hai đầu bằng nhau; mảng rỗng thì ném lỗi.
  2. `getResult` đọc `score_run.overall` của lượt và thêm `range` vào `ScoringResult`. Không sửa bảng, không cần migration.
- Success criteria: test tính toán và test router đều qua.
- Verify: `pnpm --filter @vox-flow/api test src/scoring/aggregate.test.ts src/routers/scoring.test.ts` thoát với mã 0.

### Task 2.2 — Xác định câu yếu nhất ở server
- Goal: một quy tắc duy nhất, dùng chung cho paywall (D-04) và luyện lại (D-05).
- Target files and symbols: `aggregate.ts` (`weakestQuestionKey(criteria, answers)`)
- Steps:
  1. Viết test trước. Quy tắc: câu có nhiều bằng chứng `kind: "minus"` nhất trên cả 4 tiêu chí; hòa thì lấy câu đứng trước theo `partNumber` rồi thứ tự câu; không có bằng chứng `minus` nào thì lấy câu đầu tiên. Trả `null` khi lượt không có câu trả lời.
  2. Hàm thuần, không gọi dịch vụ ngoài.
- Success criteria: test qua, gồm trường hợp hòa và trường hợp không có `minus`.
- Verify: `pnpm --filter @vox-flow/api test src/scoring/aggregate.test.ts` thoát với mã 0.

### Task 2.3 — Paywall ở server theo D-04
- Goal: client miễn phí không nhận dữ liệu bị khóa.
- Target files and symbols: `entitlements.ts` (`getEntitlement`, `canViewDetail`), `scoring.ts` (`getResult`)
- Steps:
  1. Tạo `entitlements.ts`, export `getEntitlement(db, userId): Promise<'free'|'paid'>` và `canViewDetail(db, userId, attemptId): Promise<boolean>`. Chưa có bảng `subscription` thì `getEntitlement` trả `free`; chưa có `detail_unlock` thì `canViewDetail` trả theo `getEntitlement`. #19 sẽ nối hai bảng này vào đây.
  2. `getResult` thêm `locked: boolean` và `weakestQuestionKey`. Khi `canViewDetail` là `false`: giữ `overall`, `range`, `oneLiner`; mỗi tiêu chí chỉ giữ `key` và bằng chứng có `questionKey` bằng câu yếu nhất (kèm `improve` nếu trích từ câu đó); bỏ `band` và `summary` của tiêu chí; `answers` chỉ giữ transcript của câu yếu nhất.
  3. Viết test khẳng định trên chính payload trả về: bản miễn phí không có `band` tiêu chí và không có bằng chứng của câu khác; bản có quyền thì đủ dữ liệu như hiện nay.
- Success criteria: payload miễn phí không chứa dữ liệu trả phí.
- Verify: `pnpm --filter @vox-flow/api test src/entitlements.test.ts src/routers/scoring.test.ts` thoát với mã 0.

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
