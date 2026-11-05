---
title: "Bảo mật route upload audio (`audio-upload-security`)"
description: "Khắc phục lỗ hổng kiểm tra Content-Length (10MB limit), Content-Type fallback và xác thực miền giá trị query parameters cho route upload audio."
status: completed
priority: P1
effort: 1d
issue: 46
branch: vinh19410/vox-flow-ai-46
tags: [security, backend, critical, advice]
created: 2026-11-05
---

# Bảo mật route upload audio (`audio-upload-security`)

Tracking: #46

Issue bảo mật: `Security: giới hạn 10MB và content-type của route upload audio bị qua mặt`

> **Handover Contract (`--advice`):** Plan này tuân thủ hợp đồng bàn giao cho executor models. Mỗi task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh cơ học được. Mỗi phase mang Failure Protocol riêng; dừng lại khi Verify không đạt và báo cáo/tham vấn `kongming` là hành vi bắt buộc.

## Outcome
Route `POST /api/attempts/:attemptId/answers/:questionKey/audio` được gia cố toàn diện:
1. Từ chối request thiếu `content-length` (411), `content-length` sai định dạng (400), vượt 10MB (413), hoặc payload rỗng/0 byte (400).
2. Kiểm tra `content-type` theo allowlist (`audio/webm`, `audio/mp4`, `audio/ogg`, `audio/wav`, `audio/mpeg`), loại bỏ tham số như `;codecs=opus`; trả 415 khi thiếu hoặc không hợp lệ, tuyệt đối không ngầm fallback về `audio/webm`.
3. Kiểm tra miền giá trị cho các query parameters bằng Zod: `part` (1-3), `order` (0-100), `durationMs` (0-3,600,000), `questionText` (tối đa 2000 ký tự); trả 400 khi vi phạm.
4. Ánh xạ phần mở rộng file chính xác theo mime type (`webm`, `mp4`, `ogg`, `wav`, `mp3`).
5. Bộ unit tests tự động bao phủ đầy đủ các trường hợp mã lỗi HTTP và luồng thành công.

## Constraints
- Giữ nguyên hợp đồng tương thích với frontend `apps/web/src/features/exam/use-exam-session.ts` (client gửi blob audio có content-length, content-type hợp lệ và 4 query parameters).
- Không buffer toàn bộ stream nhị phân vào bộ nhớ (không dùng `arrayBuffer()` gây cạn kiệt RAM worker).
- Thực hiện kiểm tra định dạng và validation trước khi truy vấn cơ sở dữ liệu để tối ưu hiệu năng và ngăn ngừa thăm dò.

## Non-goals
- Thay đổi logic chấm điểm hay tRPC procedures khác.
- Thay đổi cơ chế xác thực Better Auth.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Gia cố bảo mật route upload audio và kiểm thử tự động](./phase-01-bao-mat-route-upload-audio.md) | Completed |

## Acceptance Criteria
- [x] Test: request không có `content-length` trả về mã lỗi 411; `content-length` không phải số nguyên dương trả về 400; `content-length` = 0 trả về 400; vượt 10MB trả về 413.
- [x] Test: `content-type` thiếu hoặc nằm ngoài allowlist trả về 415.
- [x] Test: query parameter `part`, `order`, `durationMs` ngoài miền giá trị hoặc `questionText` vượt 2000 ký tự trả về 400.
- [x] Test: upload hợp lệ với `audio/webm;codecs=opus` được xử lý thành công, stream tới bucket R2 và ghi nhận vào D1.
- [x] `pnpm check-types` toàn bộ workspace thoát mã 0.
- [x] Unit tests của `apps/server` chạy thành công thoát mã 0.

## Red Team Review

### Session — 2026-11-05
**Findings:** 5 (3 accepted, 2 rejected)
**Severity breakdown:** 3 Critical, 2 High

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Zod schema query parsing requires Zod 4 pattern with numeric default | Critical | Accept | Phase 1 Task 1.1 |
| 2 | Vitest Node environment incompatibility with `cloudflare:workers` protocol | Critical | Accept | Phase 1 Task 1.0 |
| 3 | Add `X-Content-Type-Options: nosniff` on audio serving route to prevent MIME-sniffing | High | Accept | Phase 1 Task 1.3 |
| 4 | Streaming TransformStream byte meter on raw body | Critical | Reject | R2 requires known length up front; runtime enforces Content-Length |
| 5 | Binary magic bytes inspection for all audio payloads | High | Reject | Out of scope; streaming audio parser in Worker exceeds CPU budget |

### Whole-Plan Consistency Sweep
- Đồng bộ Zod query schema type `number` xuyên suốt phase 1.
- Thêm mock và alias `cloudflare:workers` cho Vitest runner trong `apps/server`.
- Bổ sung bảo vệ `X-Content-Type-Options: nosniff` cho route GET audio.
- Không còn mâu thuẫn hay giả định chưa được kiểm chứng.

<!-- slug: audio-upload-security -->
