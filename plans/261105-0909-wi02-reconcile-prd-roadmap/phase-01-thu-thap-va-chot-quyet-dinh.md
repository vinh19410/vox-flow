---
phase: 1
title: "Thu thập và chốt quyết định"
status: completed
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

### Task 1.1 — Dựng lại PRD từ Feature Map và trích dẫn PRD.
- Goal: Dựng lại PRD đầy đủ làm cơ sở viết SRS.
- Target files and symbols: `docs/_product/prd.md`
- Steps:
  1. Tạo `docs/_product/prd.md` từ 3 nguồn: cột PRD ở Mục 7, các trích dẫn PRD trong `docs/roadmap-chamro.md`, và Feature Map `plans/reports/advise-261104-0948-chamro-feature-map.md` (21 feature + 6 GAP). Phần chưa có thông tin ghi rõ `chưa có`.
  2. Mọi mục nội dung phải gắn tag xuất xứ: `[PRD-trích]`, `[Feature map F-xx/GAP-xx]`, `[D-xx]` hoặc `[chưa có]`.
  3. Dòng 1 ghi `Nguồn: dựng lại ngày 2026-11-05; không có PRD gốc, người sở hữu xác nhận ngày 2026-11-05`.
  4. Dòng 2 ghi `Nguồn quyết định: docs/product-decisions.md`.
  5. Bổ sung mục phân định ranh giới vai trò (Học viên Google Auth vs Admin quản trị đề forecast OQ-2 / xử lý báo lỗi OQ-4) và mục yêu cầu bảo vệ dữ liệu (liên kết OQ-6 / #8).
- Success criteria: PRD dựng lại có mặt, ghi rõ nguồn ở 2 dòng đầu, có xuất xứ rõ ràng và không tự bịa đặt.
- Verify: `grep -c '^Nguồn: dựng lại' docs/_product/prd.md` in `1` và `grep -c '^Nguồn quyết định:' docs/_product/prd.md` in `1`.

### Task 1.2 — Ghi 12 quyết định và xác nhận với người sở hữu sản phẩm.
- Goal: Ghi 12 quyết định với đầy đủ cơ sở bằng chứng và xác nhận chốt.
- Target files and symbols: `docs/product-decisions.md`
- Steps:
  1. Tạo file với 12 dòng theo đúng thứ tự bảng Mục 7: tên sản phẩm, phạm vi v1, đăng nhập, bằng chứng miễn phí, luyện lại câu yếu, báo band thật, nguồn đề forecast, nhắc luyện, xử lý báo lỗi, đồng ý dữ liệu, chứng từ thanh toán, gói giáo viên.
  2. Pre-fill D-07, D-08, D-09 theo OQ-2, OQ-3, OQ-4 đã chốt trong roadmap ngày 2026-11-05.
  3. Pre-fill D-02, D-03 theo quyết định đã chốt trong feature map ngày 2026-11-04 đã được người dùng xác nhận hướng.
  4. Soạn đề xuất rõ ràng, kèm lý do và căn cứ cho 7 quyết định còn lại (D-01, D-04, D-05, D-06, D-10, D-11, D-12), trong đó D-04 và D-05 liên kết chặt chẽ với nhau.
  5. Trình bày 7 quyết định để người sở hữu sản phẩm xác nhận. Khi xác nhận, chuyển thành `- [x]` kèm `Chốt: <quyết định> (<người>, <ngày>)`.
- Success criteria: Cả 12 quyết định đều có nội dung rõ ràng và được người sở hữu sản phẩm xác nhận (`- [x]`).
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
