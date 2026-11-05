---
phase: 1
title: "Thu thập và chốt quyết định"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Thu thập và chốt quyết định

## Goal
Mọi điểm lệch có một quyết định do người sở hữu sản phẩm xác nhận.

## Files to Create / Modify
- Create: `docs/product-decisions.md`
- Read: `docs/roadmap-chamro.md` (Mục 7)

## Tasks & Steps

### Task 1.1 — Dựng lại PRD vì không có bản gốc.
- Goal: Dựng lại PRD vì không có bản gốc.
- Target files and symbols: `docs/_product/prd.md`, `docs/_product/roadmap.md`
- Steps:
  1. Tạo `docs/_product/prd.md` từ cột PRD ở Mục 7 và các trích dẫn PRD trong `docs/roadmap-chamro.md`. Không thêm nội dung ngoài hai nguồn đó; phần còn thiếu ghi là `chưa có`.
  2. Dòng đầu ghi `Nguồn: dựng lại ngày <ngày>; không có PRD gốc, người sở hữu xác nhận ngày 2026-11-05`.
- Success criteria: PRD dựng lại có mặt và ghi rõ nguồn.
- Verify: `grep -c '^Nguồn: dựng lại' docs/_product/prd.md` in `1`.

### Task 1.2 — Ghi 12 quyết định.
- Goal: Ghi 12 quyết định.
- Target files and symbols: `docs/product-decisions.md`
- Steps:
  1. Tạo file với 12 dòng, mỗi dòng dạng `- [ ] D-01: <nội dung> — Feature map: ... | PRD: ... | Đề xuất: ...` theo đúng thứ tự bảng Mục 7: tên sản phẩm, phạm vi v1, đăng nhập, bằng chứng miễn phí, luyện lại câu yếu, báo band thật, nguồn đề forecast, nhắc luyện, xử lý báo lỗi, đồng ý dữ liệu, chứng từ thanh toán, gói giáo viên.
  2. Đưa từng dòng cho người sở hữu sản phẩm chốt. Khi chốt, đổi thành `- [x]` và thêm `Chốt: <quyết định> (<người>, <ngày>)`.
- Success criteria: Không còn dòng `- [ ]`.
- Verify: `grep -c '^- \[x\] D-' docs/product-decisions.md` in `12`.

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
