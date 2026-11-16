---
title: "Thiết lập SePay"
description: "Tài khoản SePay và tài khoản nhận tiền sẵn sàng, khóa webhook được lưu an toàn và cách vận hành được ghi lại, để #19 có thể nhận tiền thật."
status: completed
priority: P1
effort: 1d
issue: 12
branch: vinh19410/plan-08-thi-t-l-p-sepay
tags: [infra, advice]
blockedBy: []
blocks: [project:261105-0910-wi15-billing-qr, project:261105-0910-wi16-payment-reconciliation]
created: 2026-11-05
---

# Thiết lập SePay

Tracking: #12

Mục 08 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Tài khoản SePay và tài khoản nhận tiền sẵn sàng, khóa webhook được lưu an toàn và cách vận hành được ghi lại, để #19 có thể nhận tiền thật.

## Phụ thuộc
- Phải chờ: #8 (đã `CLOSED` ngày `2026-11-16` theo quyết định PO)
- Yếu tố ngoài: Tài khoản ngân hàng nhận tiền và đăng ký SePay (PO xác nhận hoàn tất ngày `2026-11-16`)
- Mở khóa: #19, #20

## Constraints
- Không commit secret; lưu qua `ak secrets`, GitHub Actions Environment `beta` (`SEPAY_WEBHOOK_API_KEY`) và secret của Cloudflare Worker.
- Chưa nhận tiền của học viên thật cho tới khi #20 xong và #21 đạt.
- Dùng tài khoản cá nhân cho giai đoạn Beta/MVP theo quyết định PO khi đóng #8 ngày `2026-11-16`; xem xét lại khi mở vận hành thương mại chính thức.

## Non-goals
- Viết webhook và tạo QR; thuộc #19.
- Đối soát; thuộc #20.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Tạo tài khoản và lưu cấu hình](./phase-01-tao-tai-khoan-va-luu-cau-hinh.md) | Completed |

## Acceptance Criteria
- [x] Tài khoản SePay đã liên kết tài khoản nhận tiền (PO xác nhận đăng ký SePay và liên kết tài khoản ngân hàng cá nhân ngày `2026-11-16`).
- [x] Có khóa webhook trong secret của Worker, không có trong git (`SEPAY_WEBHOOK_API_KEY` dùng `Config.Redacted` tại `packages/infra/alchemy.run.ts:52`, kiểu tại `apps/server/src/env.ts:37`, secret lưu trong GitHub Environment `beta` và triển khai qua `.github/workflows/deploy-beta.yml:83`).
- [x] Một giao dịch thử xuất hiện trên SePay và được ghi lại trong runbook (giao dịch `10.000 VND` ngày `2026-11-16`, trạng thái `Thành công` trên `my.sepay.vn`, ghi tại `docs/runbooks/sepay-setup.md`; kiểm tra webhook `HTTP 200` + `{"success": true}` của `/webhooks/sepay` nghiệm thu ở #19).
- [x] Có ghi nhận về việc có cần đăng ký hộ kinh doanh theo quyết định PO sau khi đóng #8 (`docs/runbooks/sepay-setup.md:3`: sử dụng tài khoản cá nhân cho Beta/MVP, chưa đăng ký hộ kinh doanh).

## Câu hỏi mở
- Tài khoản nhận tiền đứng tên cá nhân hay hộ kinh doanh? — **Đã chốt (`2026-11-16`):** sử dụng tài khoản cá nhân cho giai đoạn Beta/MVP (chưa thu tiền học viên thật trước cổng #21).

## Validation Log

### Session — 2026-11-16
- **Câu hỏi đã xác nhận với PO:** 3 câu hỏi (hiện trạng tài khoản SePay cá nhân, giao dịch thử `10.000 VND` ngày `2026-11-16`, và phương án đóng Issue #12 qua `Closes #12` để mở khóa #19/#20).
- **Quyết định chính:** Dùng tài khoản cá nhân cho Beta/MVP sau khi PO đóng #8 không qua tư vấn luật sư; ghi nhận giao dịch thử `10.000 VND` xuất hiện `Thành công` trên SePay (E2E webhook HTTP 200 của `/webhooks/sepay` thuộc #19); giữ nguyên `docs/roadmap-work-items.md` ngoài phạm vi 4 file của gói hoàn thiện #12 (file này vừa được PR #163 và PR #164 cập nhật trên `dev`, tránh sửa trùng làm phát sinh xung đột và chờ đồng bộ icon `✅` ở lượt cập nhật roadmap kế tiếp).
- **Thay đổi lan tỏa:** Cập nhật `docs/runbooks/sepay-setup.md` và Phase 1 (`phase-01-tao-tai-khoan-va-luu-cau-hinh.md`, gắn marker `Validation & Red-Team Session 1 (2026-11-16)`).
- **Consistency Sweep:** `Failed: 0` — tất cả kiểm tra văn bản, tham chiếu đường dẫn (`packages/infra/alchemy.run.ts`, `apps/server/src/env.ts`, `.github/workflows/deploy-beta.yml`) và rà soát phụ thuộc #19/#20/#21 đều khớp.

## Red Team Review

### Session — 2026-11-16
**Findings:** 5 phát hiện đã khử trùng lặp (5 accepted theo quyết định PO, 0 rejected)
**Severity breakdown:** 2 Critical, 2 High, 1 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Đồng bộ secret `SEPAY_WEBHOOK_API_KEY` với GitHub Environment `beta` (`deploy-beta.yml`) và chuẩn hóa lệnh xoay khóa (`ALCHEMY_STAGE=prod` + sao lưu D1; bỏ hướng dẫn webhook song song) | Critical | Accept | Phase 1, `docs/runbooks/sepay-setup.md` |
| 2 | Gỡ deadlock kiểm thử webhook trước #19, ghi rõ URL `api.vox.vinhtran.io.vn/webhooks/sepay`, hợp đồng `HTTP 200/201 + {"success": true}`, và siết `Verify` chặn placeholder | Critical | Accept | Phase 1, `docs/runbooks/sepay-setup.md` |
| 3 | Bổ sung cấu hình SePay bắt buộc (`Auto retry = ON`, `skip_if_no_code = OFF`, `bank_mode = single`), Cloudflare WAF allowlist IP SePay, `timingSafeEqual` và đối chiếu `accountNumber` | High | Accept | `docs/runbooks/sepay-setup.md` |
| 4 | Bổ sung quy tắc tương thích ngân hàng cho #19 (VA cho BIDV/OCB/MSB/KienLongBank, `SEVQR` cho VietinBank) và cô lập dữ liệu cá nhân (không lưu `accumulated` thô vào D1) | High | Accept | `docs/runbooks/sepay-setup.md` |
| 5 | Bổ sung quy trình tạo/xoay `SEPAY_API_TOKEN` cho #20 và nhắc đồng bộ biến SePay mới vào `.github/workflows/deploy-beta.yml` | Medium | Accept | Phase 1, `docs/runbooks/sepay-setup.md` |

<!-- slug: wi08-sepay-setup -->
