---
phase: 2
title: "Chạy đánh giá và chọn cấu hình"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Chạy đánh giá và chọn cấu hình

## Goal
Có số liệu cho 6 cấu hình và một quyết định.

## Files to Create / Modify
- Create: `scripts/scoring-eval/run-eval.ts`
- Create: `scripts/scoring-eval/report.ts`
- Create: `docs/oq-5-scoring-eval.md`
- Modify: `docs/roadmap-chamro.md`

## Tasks & Steps

### Task 2.1 — Chạy 6 cấu hình.
- Goal: Chạy 6 cấu hình.
- Target files and symbols: `scripts/scoring-eval/run-eval.ts`
- Steps:
  1. Hướng A: Azure gộp nhận dạng và chấm phát âm. Hướng B: dịch vụ nhận dạng riêng kết hợp SpeechSuper.
  2. Mô hình chấm: `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`.
  3. Mỗi bài chấm 3 lần độc lập. Ghi band, số token, giây audio và chi phí VND từng lần vào `scripts/scoring-eval/results/<config>.jsonl`.
  4. Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.
- Success criteria: Đủ 540 lượt chấm (30 × 6 × 3).
- Verify: `cat scripts/scoring-eval/results/*.jsonl | wc -l` in `540`.

### Task 2.2 — Viết báo cáo và chốt OQ-5.
- Goal: Viết báo cáo và chốt OQ-5.
- Target files and symbols: `scripts/scoring-eval/report.ts`, `docs/oq-5-scoring-eval.md`, `docs/roadmap-chamro.md`
- Steps:
  1. Script tính từng cấu hình: % bài lệch trong 0.5 band (ngưỡng ≥ 80%), % bài có độ chênh 3 lần ≤ 0.5 band (ngưỡng ≥ 90%), chi phí Full Test (mục tiêu 8.000đ, dừng xem lại nếu vượt 12.000đ) và Part (mục tiêu 3.000đ).
  2. Ghi bảng vào báo cáo và dòng `Quyết định: <cấu hình>`.
  3. Đánh dấu OQ-5 đã xong, cập nhật trần miễn phí tạm tính 33.000đ/ngày theo chi phí thật.
  4. Ghi dòng `Đạt ngưỡng: có` hoặc `Đạt ngưỡng: không`. Nếu `không`, hoặc chi phí vượt 12.000đ/Full Test: không đánh dấu OQ-5, không đóng issue, chuyển cho người sở hữu sản phẩm.
- Success criteria: Báo cáo có quyết định và OQ-5 đã đóng.
- Verify: `grep -c '^Quyết định:' docs/oq-5-scoring-eval.md` in `1` và `grep -c '^- \[x\] OQ-5' docs/roadmap-chamro.md` in `1`. Đồng thời `grep -c '^Đạt ngưỡng: có' docs/oq-5-scoring-eval.md` in `1`.

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
