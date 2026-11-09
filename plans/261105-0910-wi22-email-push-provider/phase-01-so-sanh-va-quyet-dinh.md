---
phase: 1
title: "So sánh và quyết định"
status: completed
priority: P3
effort: ""
dependencies: []
---

# Phase 1: So sánh và quyết định

## Goal
Có quyết định dựa trên thử nghiệm.

## Files to Create / Modify
- Create: `docs/decisions/email-push-provider.md`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: Xác nhận trạng thái tên miền và thiết lập cổng kiểm tra hai giai đoạn (Two-Stage Delivery Gate).
- Target files and symbols: `docs/decisions/email-push-provider.md`
- Steps:
  1. Xác nhận chiến lược hai giai đoạn: Giai đoạn 1 (WI-22) đánh giá kiến trúc, chi phí và sandbox test trên Cloudflare Workers; Giai đoạn 2 (WI-23 / WI-17) kích hoạt gửi thật từ domain chính thức vào Gmail Inbox sau khi cấu hình DNS DKIM/SPF/DMARC.
  2. Ghi nhận trạng thái `Domain Status: DEFERRED_TO_WI23` trong tài liệu quyết định.
- Success criteria: Có trạng thái kiểm tra hai giai đoạn rõ ràng trong tài liệu.
- Verify: `grep -q 'Domain Status: DEFERRED_TO_WI23' docs/decisions/email-push-provider.md`

### Task 1.1 — Lập bảng so sánh và phân tích kiến trúc
- Goal: Lập bảng so sánh đa chiều giữa các nhà cung cấp email và thư viện Web Push trên Cloudflare Workers.
- Target files and symbols: `docs/decisions/email-push-provider.md`
- Steps:
  1. So sánh 3 nhà cung cấp email: Resend, Postmark, SendGrid theo: runtime Workers (`fetch`), giá ở mức 10k và 50k email/tháng, deliverability Gmail, tiếng Việt UTF-8, và xử lý hủy đăng ký RFC 8058.
  2. So sánh thư viện Web Push: `@block65/webcrypto-web-push` vs `web-push` theo kích thước bundle, tương thích WebCrypto native và chuẩn RFC 8292 VAPID.
  3. Làm rõ các rào cản kỹ thuật trên Apple iOS / iPhone: Yêu cầu iOS 16.4+, bắt buộc cài PWA ra Màn hình chính (`display: standalone`), yêu cầu cử chỉ tương tác (User Gesture), Badging API và kịch bản fallback tự động sang email.
  4. Dùng bảng giá và tài liệu hiện hành, ghi đường dẫn nguồn và ngày tra cứu (2026-11-05).
- Success criteria: Đầy đủ các mục so sánh email, thông báo đẩy, chi phí và giới hạn iOS.
- Verify: `test $(grep -cE '^## (So sánh email|Thông báo đẩy|Chi phí|Giới hạn Apple iOS)' docs/decisions/email-push-provider.md) -ge 4 && grep -q '@block65/webcrypto-web-push' docs/decisions/email-push-provider.md && grep -q 'RFC 8292' docs/decisions/email-push-provider.md`

### Task 1.2 — Kiểm chứng kỹ thuật, kịch bản gửi thử và chốt quyết định
- Goal: Hoàn thiện kịch bản kiểm thử, cơ chế chống IDOR, tối ưu subrequest và ghi nhận quyết định chính thức.
- Target files and symbols: `docs/decisions/email-push-provider.md`
- Steps:
  1. Cung cấp mã nguồn kiểm thử qua Resend REST API native `fetch` và Resend Batch API (`/emails/batch` gửi tối đa 100 emails trong 1 subrequest).
  2. Bổ sung cơ chế bảo mật cho liên kết hủy đăng ký: Mã hóa HMAC-SHA256 chống IDOR / CSRF và bảo vệ chống scanner email tự động hủy đăng ký theo SEC-03.
  3. Đề xuất Drizzle schema `push_subscription` có unique index ghép `(user_id, endpoint)` và kế hoạch đăng ký vào `DATA_REGISTRY` (`packages/api/src/data-registry.ts`) tuân thủ bảo vệ dữ liệu cá nhân theo WI-11 / D-10.
  4. Thêm dòng quyết định chính thức: `Quyết định: Resend (Dịch vụ Email) kết hợp @block65/webcrypto-web-push (Web Push) trên nền tảng Cloudflare Workers.`
- Success criteria: Có đầy đủ kịch bản kiểm chứng và dòng quyết định chuẩn.
- Verify: `grep -c '^Quyết định:' docs/decisions/email-push-provider.md` in `1` && `grep -q 'Architecture Status: VERIFIED' docs/decisions/email-push-provider.md`
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
