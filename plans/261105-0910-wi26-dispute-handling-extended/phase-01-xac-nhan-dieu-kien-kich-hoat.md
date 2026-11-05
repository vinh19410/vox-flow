---
phase: 1
title: "Xác nhận điều kiện kích hoạt"
status: halted
priority: P3
effort: ""
dependencies: []
---

# Phase 1: Xác nhận điều kiện kích hoạt

## Goal
Có số liệu cho thấy cần mở rộng.

## Files to Create / Modify
- Create: `docs/decisions/dispute-scale-up.md`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
  3. Xác nhận với người sở hữu sản phẩm đã có: Đạt điều kiện kích hoạt: quá 5 báo lỗi/tuần hoặc đúng hạn dưới 90%.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 29; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Ghi số liệu và quyết định.
- Goal: Ghi số liệu và quyết định.
- Target files and symbols: `docs/decisions/dispute-scale-up.md`
- Steps:
  1. Lấy số liệu từ `dispute-admin.metrics` của #29.
  2. Ghi `Báo lỗi/tuần:`, `Tỷ lệ đúng hạn:` và `Quyết định mở rộng: có` hoặc `không`.
  3. Nếu chưa đạt điều kiện, dừng plan ở đây.
- Success criteria: Có quyết định mở rộng.
- Verify: `grep -c '^Quyết định mở rộng: có' docs/decisions/dispute-scale-up.md` in `1`.

> **Kết quả thực thi (2026-11-05):**
> - Task 1.0: Verify pass (Issue #29 `CLOSED`). Chưa đạt điều kiện kích hoạt (>5 báo lỗi/tuần hoặc đúng hạn <90%).
> - Task 1.1: Đã tạo `docs/decisions/dispute-scale-up.md` với `Báo lỗi/tuần: chưa có dữ liệu thật (cờ mặc định false tại alchemy.run.ts:29, chưa kiểm tra giá trị đã triển khai)`, `Tỷ lệ đúng hạn: chưa có dữ liệu thật`, `Quyết định mở rộng: không`.
> - Theo Step 3: Dừng plan tại đây, không tiếp tục sang Phase 2.
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
