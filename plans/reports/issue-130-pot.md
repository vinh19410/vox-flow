# Proof of Test (POT) — #130 mở chấm điểm AI cho tất cả các mode

**PR/commit:** PR #131 (merge `22a3a87` vào `dev`, code commit `2dd9b98`) · **Plan:** `plans/261111-0035-ai-scoring-all-modes/plan.md` · **CI beta:** run [42981978004](https://github.com/vinh19410/vox-flow/actions/runs/42981978004) — **xanh toàn bộ** (Type check, Tests, D1 backup, Alchemy deploy, Smoke test).

## Done-means → bằng chứng

### AC1 — Mọi mode đều ghi `attempt_score` + enqueue; submit 0 câu trả lời bị chặn 400
- Test: `pnpm --filter @vox-flow/api test src/routers/scoring.test.ts` → **32 passed (32)**, gồm `"creates a queued score row and enqueues scoring for mock exam attempts across all modes"` (full/part1/part2/part3, `topicId: null`) và `"rejects a zero-answer submit with 400 before marking submitted"`.
- `pnpm --filter @vox-flow/api test` toàn package → **28 files / 288 passed**.

### AC2 — Chấm bài thi thử bằng văn bản câu hỏi chuẩn, không tin client
- Test: `pnpm --filter @vox-flow/api test src/scoring/score-attempt.test.ts` → **38 passed (38)**, gồm describe `"mock exam scoring (topicId = null)"`: prompt chứa câu gốc + cue card `p2-1` + follow-up `p1-1-f` từ `mock-exam-bank`, tuyệt đối không chứa `"HACKED"` (client `questionText`); key lạ → `"(question unavailable)"` không ném lỗi.
- Khóa nội dung: `pnpm --filter @vox-flow/api test src/scoring/mock-exam-bank.test.ts` → **14 passed (14)** (golden literal 6 mục đề).

### AC3 — Allowlist + trần theo mode (8/4/1/3, mode lạ fail-closed)
- Test: `pnpm --filter server test` → **4 files / 50 passed** (gồm `index.integration.test.ts` trên D1 thật — generation ordering + upsert điều kiện vẫn đúng cho key mock `p1-1`/`p2-1`/`p1-2`/`p1-3`), 3 test mới: key lệch mode → `400 Invalid question key for this attempt`; mode lạ → `400` (fail-closed); 9 dòng legacy + key hợp lệ → `400 Question limit reached`.

### AC4 — `scorable: true` + `attemptStatus` + rescue path + `mode` trong kết quả
- Test: `scoring.test.ts` — `att-full` (`topicId: null`) giờ `scorable: true, attemptStatus: "submitted"`; rescue path tạo `attempt_score (queued, manualRetries: 0)` cho `att-full`; `getResult` trả `mode` khớp `attempt.mode`.

### AC5 — Web hand-off `submitted: true` cho thi thử (giữ guard #109/#119)
- Test: `pnpm --filter web test src/features/exam/__tests__/exam-submit.test.tsx` → pass, gồm 3 test cập nhật kỳ vọng `scoringAttempt = { kind: "attempt", attemptId: "att-mock", submitted: true }` và test mới zero-answer → `PERMANENT_SUBMIT_MESSAGE`, không điều hướng.
- `pnpm --filter web test` toàn suite → **40 files / 334 passed**.

### AC6 — Nhãn mode + card "Chấm điểm ngay"
- Test: `pnpm --filter web test src/features/results/__tests__/scored-results.test.tsx` → **16 passed (16)**: `results-not-scored` chỉ hiện cho `submitted`; `in_progress` giữ card trung lập; eyebrow `Thi thử Full Test / Part 2` khi `topicId === null`, `Luyện đề Forecast` khi có topic.

### AC7 — Parity web ↔ server
- Test: `pnpm --filter web test src/features/exam/__tests__/mock-keys-parity.test.ts` → pass: tập key của `ITEMS` ≡ `buildMockExamStepKeys` cho cả 4 mode; `resolveCanonicalMockQuestionText ≠ null` cho mọi step.

### Gates tổng sau merge (chạy lại tại HEAD làm việc)
```
pnpm --filter @vox-flow/api test   → 28 files / 288 passed
pnpm --filter server test          → 4 files / 50 passed
pnpm --filter web test             → 40 files / 334 passed
pnpm check-types                   → 7/7 tasks successful (turbo, gồm vite build)
```

## Kongming post-PR gate (bắt buộc theo --advice)
Đã chạy sau khi CI beta xanh — **Verdict: Approve**, đăng trên PR #131 và issue #130. Các việc human tiếp theo (beta smoke từng mode, cost check `score_run.cost_usd`, edge cases) nằm trong comment đó.

## Việc còn mở cho human
- Beta smoke 1 lượt/mode (Full, P1, P2, P3, Forecast chủ đề, Forecast 1 câu) → sau đó đóng #130.
- Chấp nhận rủi ro chi phí beta (không quota submit server-side; gate `LAUNCH_OPEN` là khoanh vùng chính) — quota thuộc `#18`.
