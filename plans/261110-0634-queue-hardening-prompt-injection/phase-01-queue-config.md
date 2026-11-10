# Phase 1 — Cấu hình queue một nguồn + maxConcurrency

Sở hữu file: `packages/infra/alchemy.run.ts`, `packages/api/src/scoring/config.ts`, `apps/server/src/queue.ts` + tests.

## Failure Protocol
Nếu bất kỳ bước Verify nào không đạt điều kiện đã nêu: DỪNG phase này. Không tự vá, không thử lại mù, không lý lẽ vòng quanh. Spawn subagent `kongming` với: phase + task id, các bước đã chạy, lệnh đúng và output đầy đủ, điều kiện pass mà nó không đạt. Áp dụng hướng dẫn rồi chạy lại Verify. Nếu không spawn được `kongming`: DỪNG và báo người dùng đúng bằng chứng thất bại. Không tự tiếp tục bằng suy đoán.

### Task 1.1 — server đọc retry budget qua parser chặt (TDD red trước)
- Goal: `isLastDelivery` quyết định theo `ENV.SCORING_QUEUE_MAX_RETRIES`; env rỗng/sai không gây fail sớm; không đọc ENV ở module scope.
- Target files: `packages/api/src/scoring/config.ts`, `packages/api/src/scoring/config.test.ts` (file chưa tồn tại — tạo mới; `readScoringConfig` hiện chưa được test trực tiếp), `apps/server/src/queue.test.ts`, `apps/server/src/queue.ts`.
- Steps:
  1. (red) Test `readScoringQueueMaxRetries`: `"2"` → 2; unset → 3; `""` → 3; `"abc"` → 3; `"-1"` → 3; `"2.5"` → 3; các case sai phải gọi `console.warn` (spy). Chạy → FAIL (chưa có hàm).
  2. Implement `readScoringQueueMaxRetries` trong `packages/api/src/scoring/config.ts` (cạnh `readScoringConfig`; cùng convention parse env, tránh tạo convention thứ hai).
  3. (red) Sửa mock ENV trong `queue.test.ts` (một mock cho cả file): thêm `SCORING_QUEUE_MAX_RETRIES: "2"`; sửa test cũ "marks the score failed..." dùng literal `attempts = 3` (giá trị 2+1, comment ghi rõ env mock "2") thay vì derive từ hằng import; thêm test message `attempts = 3` → ack + `markScoreFailed` và `attempts = 1` → retry. Chạy → FAIL vì `queue.ts` còn hằng cứng 3.
  4. Sửa `queue.ts`: bỏ `export const SCORING_QUEUE_MAX_RETRIES = 3`; trong `handleScoringQueue` tính `const maxRetries = readScoringQueueMaxRetries(ENV)` (import từ `@vox-flow/api/scoring/config`) và dùng cho `isLastDelivery` — đọc lười trong handler, KHÔNG ở module scope (RTAssumption F5).
  5. (green) Chạy lại test.
- Success criteria: parser test pass đủ case; với mock env "2", test cũ (attempts = 3) vẫn pass vì derives literal 2+1, test mới phân biệt attempts 1 vs 3.
- Verify: `pnpm --filter @vox-flow/api test src/scoring/config.test.ts` exits 0 và `pnpm --filter server test src/queue.test.ts` exits 0.

### Task 1.2 — infra: một nguồn + maxConcurrency
- Goal: value retries chỉ nằm ở `alchemy.run.ts` và không thể bị override; consumer có `maxConcurrency`.
- Target files: `packages/infra/alchemy.run.ts`.
- Steps:
  1. Thêm const đầu file: `const SCORING_QUEUE_MAX_RETRIES = 3;` và `const SCORING_QUEUE_MAX_CONCURRENCY = 2;`. Comment invariant đúng (RTFailure F1): thời lượng pipeline phụ thuộc `SCORING_RUNS` (1–7; mặc định 3 ≈ 10 phút); lease 12 phút chỉ an toàn với runs ≤ 3 — runs > 3 có thể vượt lease → sweep thu hồi claim worker đang sống, nhân bản message; maxConcurrency chỉ cắt backlog, không sửa lease.
  2. Consumer: `settings.maxRetries: SCORING_QUEUE_MAX_RETRIES`, thêm `maxConcurrency: SCORING_QUEUE_MAX_CONCURRENCY` (mặc định không đặt = autoscale tới 250 invocation song song).
  3. Env server: `SCORING_QUEUE_MAX_RETRIES: Config.succeed(String(SCORING_QUEUE_MAX_RETRIES))` — `Config.succeed` chặn override từ deploy-env, bảo đảm server luôn == const infra (RTFailure F6).
  4. Thay 2 comment "must match" (`alchemy.run.ts:63`, `queue.ts:14`) bằng comment "nguồn duy nhất là alchemy.run.ts, server đọc qua env binding".
- Success criteria: không còn literal `maxRetries: 3` trong consumer; env binding có trường mới (type tự sinh qua `InferEnv`, không cần codegen tay).
- Verify: `pnpm check-types` exits 0; `grep -rn "must match" packages/infra/alchemy.run.ts apps/server/src/queue.ts` không còn kết quả.
