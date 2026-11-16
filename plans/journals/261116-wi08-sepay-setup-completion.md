---
title: Hoàn tất WI-08 Thiết lập SePay và chuẩn hóa runbook cho #19, #20
date: 2026-11-16
summary: "Ghi nhận xác nhận thực tế của PO (tài khoản cá nhân, giao dịch thử 10.000 VND ngày 2026-11-16, đóng #8) và gia cố runbook SePay theo 5 điểm Red-Team/Kongming để đóng Issue #12."
---

# Hoàn tất WI-08 Thiết lập SePay và chuẩn hóa runbook cho #19, #20

## What happened
Sau khi PR #37 (`988c131b`) đã merge phần khai báo `SEPAY_WEBHOOK_API_KEY` (`Config.Redacted` tại `packages/infra/alchemy.run.ts:52`, kiểu tại `apps/server/src/env.ts:37`), secret đã được nạp trên GitHub Actions Environment `beta` (`.github/workflows/deploy-beta.yml:83`), và Issue #8 (OQ-6) được PO đóng ngày `2026-11-16`, phiên thực thi cho Issue #12 đã khóa 3 xác nhận thực tế từ PO và chạy thẩm định với `kongming` cùng 2 reviewer Red-Team (`Security Adversary`, `Assumption Destroyer`).

Từ 5 phát hiện hợp nhất (2 Critical, 2 High, 1 Medium), chúng tôi đã cập nhật hoàn chỉnh `docs/runbooks/sepay-setup.md`, đồng bộ `plans/261105-0910-wi08-sepay-setup/plan.md` và `phase-01-tao-tai-khoan-va-luu-cau-hinh.md` sang trạng thái `completed`.

## Decision
- **Tư cách tài khoản thụ hưởng & pháp lý:** Sử dụng tài khoản ngân hàng cá nhân cho giai đoạn Beta/MVP theo quyết định PO khi đóng #8; chưa đăng ký hộ kinh doanh và chưa thu tiền học viên thật cho tới khi #20 hoàn tất và #21 đạt chuẩn.
- **Phân ranh kiểm thử #12 vs #19:** Ghi nhận giao dịch thử `10.000 VND` ngày `2026-11-16` (`Thành công` trên `my.sepay.vn`) tại #12; giữ webhook SePay ở trạng thái tắt (Inactive) cho tới khi #19 triển khai `POST /webhooks/sepay` lên `https://api.vox.vinhtran.io.vn/webhooks/sepay` và nghiệm thu `HTTP 200` + `{"success": true}` để tránh bão retry `404`.
- **Gia cố kỹ thuật bàn giao sang #19 và #20:** Bổ sung hợp đồng phản hồi `HTTP 200/201` + `{"success": true}` (cấm `202`/`204`), `Auto retry = ON`, `skip_if_no_code = OFF`, `bank_mode = single`, Cloudflare WAF allowlist IP SePay, quy tắc VA (`BIDV`/`OCB`/`MSB`/`KienLongBank`) và `SEVQR` (`VietinBank`), cấm lưu `accumulated` thô vào D1, đồng bộ GitHub Environment `beta` khi xoay `SEPAY_WEBHOOK_API_KEY`, và quản trị `SEPAY_API_TOKEN` cho #20.
- **Giữ nguyên `docs/roadmap-work-items.md` ngoài phạm vi PR #12:** File bảng roadmap tổng hợp vừa được cập nhật liên tiếp trên `dev` qua PR #163 (`e4fd772`) và PR #164 (`4012de1`) và không nằm trong phạm vi 4 file hoàn thiện #12; giữ nguyên để tránh xung đột nhánh và chờ đồng bộ icon `✅` cho mục 08 ở lượt cập nhật roadmap tiếp theo sau khi `#12` đóng qua `Closes #12`.

## Next steps
- Thực hiện #19 (`billing`): triển khai route `POST /webhooks/sepay`, sinh VietQR tuân thủ quy tắc ngân hàng trong `docs/runbooks/sepay-setup.md`, khai báo đồng bộ `SEPAY_BANK_ACCOUNT` và `SEPAY_BANK_CODE` vào cả `alchemy.run.ts` lẫn `.github/workflows/deploy-beta.yml`, sau đó bật webhook Active và xác nhận **Test send** trả `HTTP 200` + `{"success": true}`.
- Thực hiện #20 (`payment-reconciliation`): tạo `SEPAY_API_TOKEN` trên SePay, lưu vào GitHub Environment `beta` và đồng bộ `deploy-beta.yml`.
- Rà soát đồng bộ icon `✅` cho mục 08 trong `docs/roadmap-work-items.md` ở lượt cập nhật roadmap kế tiếp.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
