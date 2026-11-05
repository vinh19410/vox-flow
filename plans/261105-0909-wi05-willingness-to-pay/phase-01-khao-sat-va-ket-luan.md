---
phase: 1
title: "Khảo sát và kết luận"
status: pending
priority: P2
effort: ""
dependencies: []
---

# Phase 1: Khảo sát và kết luận

## Goal
Có kết luận về giá dựa trên phản hồi thật.

## Files to Create / Modify
- Create: `docs/research/wtp-validation.md`
- Modify: `docs/roadmap-chamro.md`

## Tasks & Steps

### Task 1.1 — Thống nhất cách kiểm chứng trước khi thu dữ liệu.
- Goal: Thống nhất cách kiểm chứng trước khi thu dữ liệu.
- Target files and symbols: `docs/research/wtp-validation.md`
- Steps:
  1. Ghi `Phương pháp:`, `Cỡ mẫu:` và `Ngưỡng giữ giá:`. Đề xuất: phỏng vấn người đang ôn IELTS và hỏi cam kết cụ thể, không chỉ hỏi ý kiến.
  2. Người sở hữu sản phẩm xác nhận ngưỡng trước khi bắt đầu, để không chỉnh ngưỡng theo kết quả.
- Success criteria: Ba trường đều có giá trị.
- Verify: `grep -cE '^(Phương pháp|Cỡ mẫu|Ngưỡng giữ giá):' docs/research/wtp-validation.md` in `3`.

### Task 1.2 — Ghi kết quả và cập nhật roadmap.
- Goal: Ghi kết quả và cập nhật roadmap.
- Target files and symbols: `docs/research/wtp-validation.md`, `docs/roadmap-chamro.md`
- Steps:
  1. Ghi số liệu ẩn danh theo từng gói.
  2. Thêm dòng `Kết luận: ...` nêu giữ hay đổi từng mức giá.
  3. Sửa cột Evidence của dòng `billing` trong bảng Mục 2.
- Success criteria: Có kết luận và Evidence của `billing` không còn là `Giả định`.
- Verify: `grep -c '^Kết luận:' docs/research/wtp-validation.md` in `1` và `grep -F '| `billing` |' docs/roadmap-chamro.md | grep -c 'Giả định'` in `0`.

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
