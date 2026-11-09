---
phase: 2
title: "Cập nhật PRD và roadmap"
status: completed
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Cập nhật PRD và roadmap

## Goal
PRD và roadmap phản ánh các quyết định đã chốt.

## Files to Create / Modify
- Modify: `docs/_product/prd.md`
- Modify: `docs/_product/roadmap.md`
- Modify: `docs/roadmap-chamro.md`

## Tasks & Steps

### Task 2.1 — Đưa quyết định vào PRD.
- Goal: Đưa 12 quyết định vào PRD và loại bỏ toàn bộ thông tin trái ngược.
- Target files and symbols: `docs/_product/prd.md`
- Steps:
  1. Với từng D-01 đến D-12, cập nhật mục PRD tương ứng theo quyết định đã chốt.
  2. Đảm bảo dòng 2 là `Nguồn quyết định: docs/product-decisions.md`.
  3. Rà soát loại bỏ các nội dung mâu thuẫn hoặc đã bị thay thế (ví dụ: 5 bài/ngày, link qua email, không có giao diện quản trị, chỉ email).
- Success criteria: PRD trích dẫn file quyết định, chứa đủ 12 tag `D-01` đến `D-12`, không còn nội dung trái ngược.
- Verify:
  - `grep -c 'docs/product-decisions.md' docs/_product/prd.md` in số lớn hơn hoặc bằng `1`.
  - `test $(grep -o 'D-[0-9]\{2\}' docs/_product/prd.md | sort -u | wc -l) -eq 12` thoát 0.
  - `grep -E '5 bài/ngày|link qua email|không có giao diện quản trị|chỉ email' docs/_product/prd.md` thoát mã 1 (không tìm thấy).

### Task 2.2 — Thay roadmap cũ và duy trì tương thích.
- Goal: Thiết lập `docs/_product/roadmap.md` là roadmap chính thức, duy trì Mục 2 và Mục 7 ở `docs/roadmap-chamro.md` để không phá vỡ lệnh kiểm tra của #7, #8, #9.
- Target files and symbols: `docs/_product/roadmap.md`, `docs/roadmap-chamro.md`
- Steps:
  1. Tạo `docs/_product/roadmap.md` với `status: active`, ghi rõ ngày thay thế. Các Mục 1, 3, 4, 5, 6, 8 được cập nhật đầy đủ; Mục 2 và Mục 7 đặt nội dung stub trỏ về `docs/roadmap-chamro.md` để tránh phân mảnh dữ liệu khi #7, #8, #9 còn mở.
  2. Cập nhật `docs/roadmap-chamro.md`: đổi `status: draft` thành `status: superseded-partial`, ghi chú rõ Mục 2 và Mục 7 vẫn là nơi cập nhật cho tới khi các issue #7, #8, #9 đóng.
- Success criteria: `docs/_product/roadmap.md` có `status: active`; các lệnh verify của #7, #8, #9 trên `docs/roadmap-chamro.md` vẫn hoạt động nguyên vẹn.
- Verify:
  - `grep -c '^status: active' docs/_product/roadmap.md` in `1`.
  - `grep -c '^- \[ \] OQ-5' docs/roadmap-chamro.md` in `1`.
  - `grep -c '^- \[ \] OQ-6' docs/roadmap-chamro.md` in `1`.
  - `grep -F '| \`billing\` |' docs/roadmap-chamro.md | grep -c 'Giả định'` in `1`.

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
