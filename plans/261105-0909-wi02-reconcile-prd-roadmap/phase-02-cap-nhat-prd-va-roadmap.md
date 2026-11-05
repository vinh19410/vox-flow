---
phase: 2
title: "Cập nhật PRD và roadmap"
status: pending
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
- Goal: Đưa quyết định vào PRD.
- Target files and symbols: `docs/_product/prd.md`
- Steps:
  1. Với từng D-01 đến D-12, sửa mục PRD tương ứng theo quyết định.
  2. Thêm dòng `Nguồn quyết định: docs/product-decisions.md` ở đầu PRD.
- Success criteria: PRD trích dẫn file quyết định.
- Verify: `grep -c 'docs/product-decisions.md' docs/_product/prd.md` in số lớn hơn hoặc bằng `1`.

### Task 2.2 — Thay roadmap cũ.
- Goal: Thay roadmap cũ.
- Target files and symbols: `docs/_product/roadmap.md`, `docs/roadmap-chamro.md`
- Steps:
  1. Chép nội dung sang `docs/_product/roadmap.md`, rồi thay thân `docs/roadmap-chamro.md` bằng dòng trỏ tới đó nhưng giữ nguyên Mục 2 và Mục 7 tới khi các issue #7, #8, #9 đóng; trong thời gian đó `docs/roadmap-chamro.md` vẫn là nơi cập nhật hai mục này.
  2. Đổi `status: draft` thành `status: active` và ghi ngày thay thế ở frontmatter.
- Success criteria: Roadmap mới có `status: active`.
- Verify: `grep -c '^status: active' docs/_product/roadmap.md` in `1`.

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
