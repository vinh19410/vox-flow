---
phase: 1
title: "Chuẩn bị bài mẫu và điểm chuẩn"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Chuẩn bị bài mẫu và điểm chuẩn

## Goal
Có bộ mẫu hợp lệ và điểm người chấm được khóa trước khi chạy AI.

## Files to Create / Modify
- Create: `scripts/scoring-eval/README.md`
- Create: `scripts/scoring-eval/samples.csv`
- Modify: `.gitignore`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Xác nhận với người sở hữu sản phẩm đã có: 30 bài mẫu có đồng ý bằng văn bản.
  2. Xác nhận với người sở hữu sản phẩm đã có: Tài khoản dùng thử Azure Speech, dịch vụ nhận dạng riêng, SpeechSuper và Anthropic API.
- Success criteria: các điều kiện được xác nhận.
- Verify: `no verification needed` — người sở hữu sản phẩm xác nhận bằng lời điều kiện ở mục Steps.

### Task 1.1 — Tạo manifest không chứa dữ liệu cá nhân.
- Goal: Tạo manifest không chứa dữ liệu cá nhân.
- Target files and symbols: `scripts/scoring-eval/samples.csv`, `.gitignore`
- Steps:
  1. Thêm `scripts/scoring-eval/audio/` và `scripts/scoring-eval/results/` vào `.gitignore`.
  2. Tạo CSV với cột `sample_id,mode,consent_ref,human_band`. Dùng mã ẩn danh, không ghi tên học viên.
  3. Lưu audio ngoài git trong `scripts/scoring-eval/audio/`.
- Success criteria: Audio không thể bị commit.
- Verify: `git check-ignore scripts/scoring-eval/audio/x.wav` thoát với mã 0.

### Task 1.2 — Khóa điểm chấm mù.
- Goal: Khóa điểm chấm mù.
- Target files and symbols: `scripts/scoring-eval/samples.csv`
- Steps:
  1. Người sở hữu sản phẩm điền `human_band` cho cả 30 bài trước khi chạy bất kỳ mô hình nào.
  2. Commit file này trước khi sang phase sau, để lịch sử git chứng minh điểm có trước kết quả AI.
- Success criteria: Đủ 30 dòng có điểm.
- Verify: `awk -F, 'NR>1 && $4!=""' scripts/scoring-eval/samples.csv | wc -l` in `30`.

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
