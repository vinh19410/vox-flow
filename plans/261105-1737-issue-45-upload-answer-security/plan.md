---
title: "Security: uploadAnswer tin audioKey/mimeType từ client (IDOR audio, XSS)"
description: "Vá lỗ hổng IDOR audio và XSS trong attempt.uploadAnswer, endpoint stream audio và xóa dữ liệu cá nhân."
status: completed
priority: P1
effort: 1d
issue: 45
branch: vinh19410/vox-flow-ai-45
tags: [security, backend, advice]
blockedBy: []
blocks: []
created: 2026-11-05
---

# Security: uploadAnswer tin audioKey/mimeType từ client (IDOR audio, XSS)

Tracking: #45

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Toàn bộ đường dẫn tải lên, phát lại (stream) và xóa file ghi âm câu trả lời đều được bảo vệ chặt chẽ:
1. `attempt.uploadAnswer` (tRPC) không còn cho client tự đặt `audioKey`; server tự xây dựng key theo định dạng chuẩn `users/<userId>/attempts/<attemptId>/<questionKey>.<ext>`.
2. `mimeType` được kiểm tra chặt theo danh sách cho phép (allowlist), loại bỏ hoàn toàn nguy cơ XSS.
3. Endpoint phát audio trả về `X-Content-Type-Options: nosniff`, `Content-Disposition: inline`, `Content-Type` chuẩn trên cả phản hồi 200 và 206 (Range request), đồng thời xác thực tiền tố `audioKey` trước khi lấy từ R2.
4. Quá trình xóa dữ liệu cá nhân (`eraseUserData`) kiểm tra tiền tố `audioKey` trước khi gửi lệnh xóa sang bucket R2.
5. Cung cấp tiện ích và câu lệnh kiểm tra dữ liệu cũ để rà soát các hàng `attempt_answer` bất thường trong cơ sở dữ liệu.

## Phụ thuộc
- Không có phụ thuộc chặn.

## Constraints
- Không sửa tay các migration đã sinh trong `packages/db/src/migrations` hoặc `apps/web/src/routeTree.gen.ts`.
- Không tự động xóa các đối tượng R2 trong kịch bản rà soát dữ liệu cũ vì key bất thường có thể đang trỏ vào audio của nạn nhân.
- Giữ nguyên khả năng phát audio hợp lệ cho học viên và giám khảo (dispute review khi có sự đồng ý).

## Non-goals
- Thay đổi cấu trúc cơ sở dữ liệu bảng `attempt_answer`.
- Viết lại client ghi âm ở frontend (client đã dùng route POST multipart stream).

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Nền tảng bảo mật Audio](./phase-01-nen-tang-bao-mat-audio.md) | Completed |
| 2 | [Phase 2: Vá lỗ hổng endpoint và router](./phase-02-va-lo-hong-endpoint-va-router.md) | Completed |
| 3 | [Phase 3: Kiểm tra dữ liệu cũ và kiểm chứng toàn diện](./phase-03-kiem-tra-du-lieu-cu-va-kiem-chung.md) | Completed |

## Acceptance Criteria
- [x] Test: `uploadAnswer` không cho client chọn `audioKey` ngoài tiền tố của chính attempt (loại bỏ hoàn toàn trường `audioKey` khỏi input).
- [x] Test: `mimeType` ngoài allowlist bị từ chối với lỗi rõ ràng.
- [x] Response audio có `X-Content-Type-Options: nosniff`, `Content-Disposition: inline`, và `Content-Type` thuộc allowlist trên cả 200 và 206.
- [x] Dữ liệu cũ: có hàm và kịch bản SQL kiểm tra hàng `attempt_answer` có `audioKey` sai tiền tố hoặc `mimeType` lạ.
- [x] `pnpm check-types` và các test liên quan đạt 100%.

## Red Team Review
- **Verdict:** GO WITH MANDATORY CONDITIONS (Accepted and propagated into phase specifications)
- **Findings Applied:**
  1. `[SEC-01]` Tránh ReDoS / Regex Injection trong `isValidAudioKey` bằng cách dùng prefix slicing (`key.startsWith(prefix)` + `key.slice(prefix.length)`) thay vì dynamic regex interpolation.
  2. `[SEC-02]` Trong Hono POST audio: từ chối `Content-Type` lạ bằng mã HTTP 415 thay vì âm thầm fallback sang `audio/webm`.
  3. `[SEC-03]` Xử lý an toàn null/undefined đối với `audioKey` trong `isValidAudioKey` để tránh crash vòng lặp xóa `eraseUserData`.
  4. `[FM-01]` Thiết lập `Content-Length` rõ ràng trên cả phản hồi 206 (`range.length`) và 200 (`object.size`) để đảm bảo phát audio ổn định trên iOS/Safari.
  5. `[FM-02]` Tối ưu hóa test case trong `attempt.test.ts` để tránh timeout 5000ms do khởi tạo nhiều instance Miniflare D1 song song.
  6. `[FM-03]` Khai báo tường minh kiểu `db: Database` trong `findSuspiciousAnswers` thay vì kiểu `any`.

### Whole-Plan Consistency Sweep
- Đã đối chiếu toàn bộ các file `plan.md`, `phase-01-nen-tang-bao-mat-audio.md`, `phase-02-va-lo-hong-endpoint-va-router.md`, `phase-03-kiem-tra-du-lieu-cu-va-kiem-chung.md`.
- Mọi điều chỉnh từ Red Team đã được đồng bộ vào các bước thực hiện chi tiết của từng phase.
- Không còn mâu thuẫn hay điều khoản chưa giải quyết giữa các phase.

<!-- slug: issue-45-upload-answer-security -->
