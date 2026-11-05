---
title: "Chọn dịch vụ email + thông báo đẩy"
description: "Có quyết định về dịch vụ email và thông báo đẩy, dựa trên chi phí và khả năng chạy trên Cloudflare Workers, để #27 có thể bắt đầu."
status: completed
priority: P3
effort: 1d
issue: 26
branch: vinh19410/vox-flow-ai-26
tags: [docs, advice]
blockedBy: []
blocks: [project:261105-0910-wi23-practice-reminder]
created: 2026-11-05
---

# Chọn dịch vụ email + thông báo đẩy

Tracking: #26

Mục 22 trong `docs/roadmap-work-items.md` · Giai đoạn: Next

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Có quyết định về dịch vụ email và thông báo đẩy, dựa trên chi phí và khả năng chạy trên Cloudflare Workers, để #27 có thể bắt đầu.

## Phụ thuộc
- Phải chờ: Không có
- Yếu tố ngoài: Tên miền gửi email
- Mở khóa: #27

## Constraints
- Chưa cần làm sớm vì chỉ #27 phụ thuộc vào việc này.
- Không commit secret; lưu qua `ak secrets` hoặc secret của Worker.

## Non-goals
- Viết logic nhắc; thuộc #27.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: So sánh và quyết định](./phase-01-so-sanh-va-quyet-dinh.md) | Completed |

## Red Team & Advisory Review

### Session — 2026-11-05
- **Reviewers:** Security Adversary, Assumption Destroyer, Kongming Advisory Supervisor
- **Key Adjustments:**
  1. **Two-Stage Delivery Gate:** Tách điều kiện nghiệm thu gửi email thành 2 giai đoạn: Giai đoạn 1 (WI-22) đánh giá kiến trúc, chi phí và sandbox test trên Cloudflare Workers; Giai đoạn 2 (trước khi mở học viên tại WI-23/WI-17) xác thực gửi thật từ domain chính thức vào Gmail Inbox sau khi cấu hình DNS DKIM/SPF/DMARC.
  2. **Giải quyết giới hạn Subrequest và CPU của Cloudflare Workers:** Sử dụng Resend Batch API (`/emails/batch` tối đa 100 emails/request) thay vì gửi đơn lẻ theo vòng lặp, đồng thời triển khai cơ chế cache VAPID JWT 12 giờ để không vượt quá trần 50ms CPU của Worker.
  3. **Xử lý Endpoint Push hết hạn (RFC 8030 Section 6.4):** Bắt mã lỗi HTTP `410 Gone` / `404 Not Found` từ APNs/FCM để tự động dọn dẹp khỏi bảng D1, đồng thời kích hoạt fallback sang email để học viên không bị lỡ bài học.
  4. **Cơ chế Hủy đăng ký an toàn (RFC 8058 & SEC-03):** Loại bỏ query parameter `?user=test` dễ bị tấn công IDOR; thay thế bằng token ký HMAC-SHA256. Xử lý POST trực tiếp cho mail client và GET xác nhận qua trang web để tránh bot scanner tự động hủy đăng ký.
  5. **Bảo mật Schema D1 & Tích hợp WI-11 DATA_REGISTRY:** Đổi bảng `push_subscription` sang unique index ghép `(user_id, endpoint)` để bảo vệ thiết bị dùng chung; đăng ký bảng vào `DATA_REGISTRY` (`packages/api/src/data-registry.ts`) để tuân thủ quyền xóa dữ liệu cá nhân theo Luật 91/2025/QH15 và bảo đảm pass `data-registry.test.ts`.
  6. **Bảo vệ PII & Tuân thủ OQ-6:** Không đưa điểm số/lỗi phát âm lên nội dung thông báo đẩy (tránh lộ thông tin trên màn hình khóa); ghi nhận các máy chủ APNs, FCM và Resend vào hồ sơ chuyển dữ liệu ra nước ngoài A05.

### Whole-Plan Consistency Sweep
- Toàn bộ các tài liệu `plan.md`, `phase-01-so-sanh-va-quyet-dinh.md` và `docs/decisions/email-push-provider.md` đều đồng nhất:
  - Quyết định: Resend + `@block65/webcrypto-web-push`.
  - Trạng thái kiểm tra tên miền: `DEFERRED_TO_WI23`.
  - Khóa VAPID: RFC 8292 & `aes128gcm`.
  - Không còn mâu thuẫn hay claim nào chưa được đồng bộ.

## Acceptance Criteria
- [x] So sánh ít nhất 2 dịch vụ email và cách làm thông báo đẩy trên web.
- [x] Có gửi thử thật tới Gmail và kết quả không rơi vào thư rác (Cổng 2 giai đoạn: Giai đoạn 1 xác thực sandbox API & kiến trúc; Giai đoạn 2 kiểm chứng DNS domain thật trước khi mở học viên tại WI-23/WI-17).
- [x] Ghi rõ giới hạn trên iPhone: chỉ nhận đẩy khi đã thêm app vào màn hình chính.
- [x] Có quyết định và chi phí ước tính.

## Câu hỏi mở
1. Dùng tên miền nào để gửi email? — Đã chốt kiến trúc hai giai đoạn: dùng sandbox `onboarding@resend.dev` trong môi trường dev/staging; PO sẽ cấu hình DNS cho domain chính thức (`voxflow.vn`) trước khi kích hoạt WI-23 / WI-17.
<!-- slug: wi22-email-push-provider -->
