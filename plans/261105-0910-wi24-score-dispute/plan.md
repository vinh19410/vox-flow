---
title: "Báo lỗi chấm (`score-dispute`)"
description: "Học viên có quyền phản biện điểm: gửi báo lỗi kèm audio và transcript, khi đã đồng ý chia sẻ, và theo dõi được trạng thái."
status: completed
priority: P2
effort: 2d
issue: 28
branch: vinh19410/feat/score-dispute
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi11-privacy-controls, project:261105-0910-wi13-scoring-results]
blocks: [project:261105-0910-wi25-dispute-handling-minimal]
created: 2026-11-05
---

# Báo lỗi chấm (`score-dispute`)

Tracking: #28

Mục 24 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `score-dispute`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên có quyền phản biện điểm: gửi báo lỗi kèm audio và transcript, khi đã đồng ý chia sẻ, và theo dõi được trạng thái.

## Phụ thuộc
- Phải chờ: #15, #17
- Mở khóa: #29

## Constraints
- Không ra mắt riêng trước #29: bật cho học viên chỉ khi có người xử lý.
- Theo OQ-4: giữ cam kết 72 giờ.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Hàng đợi xử lý; thuộc #29.
- Dùng dữ liệu báo lỗi để hiệu chuẩn; thuộc #30.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: API báo lỗi](./phase-01-api-bao-loi.md) | Completed |
| 2 | [Phase 2: Nối giao diện](./phase-02-noi-giao-dien.md) | Completed |

## Acceptance Criteria
- [x] Gửi báo lỗi được từ màn kết quả, kèm lý do, tiêu chí và band kỳ vọng.
- [x] Audio và transcript chỉ đính kèm khi học viên đồng ý rõ (`shareConsent = true`) cho lần báo đó (mặc định tắt).
- [x] Mỗi bài chỉ có một báo lỗi đang mở (`status IN ('open', 'reviewing')`).
- [x] Hiện cam kết phản hồi trong 72 giờ (`dueAt = createdAt + 72h`) và trạng thái trên màn kết quả.
- [x] Chỉ chủ bài (`attempt.userId === ctx.user.id`) và bài đã nộp (`attempt.status === 'submitted'`) mới được báo lỗi.
- [x] `score_dispute` được đăng ký vào `DATA_REGISTRY` hỗ trợ xuất và xóa dữ liệu cá nhân theo GDPR/NĐ 13.
- [x] `SCORE_DISPUTE_ENABLED` mặc định tắt; khi tắt thì router trả `FORBIDDEN` và giao diện ẩn nút báo lỗi. Không ra mắt trước #29.

## Red Team Review

### Session — 2026-11-05
**Findings:** 7 (7 accepted, 0 rejected)
**Severity breakdown:** 1 Critical, 5 High, 1 Medium
**Reviewers:** Security Adversary, Assumption Destroyer
**Advisory Supervisor:** Kongming (Autonomous Advisor)

| # | Finding | Reviewer | Severity | Disposition | Applied To |
|---|---------|----------|----------|-------------|------------|
| 1 | Bế tắc cơ học ở Task 1.0 vì #15 và #17 đang mở trên GitHub | AssumptionDestroyer | Critical | Accept | Phase 1 (Task 1.0) |
| 2 | Bỏ sót `userId`, `targetCriterion`, `expectedBand` trong schema `score_dispute` | SecurityAdversary | High | Accept | Phase 1 (Task 1.1) |
| 3 | Thiếu kiểm tra sở hữu (IDOR) trên `dispute.get` và vòng đời `attempt.status === 'submitted'` trên `dispute.submit` | SecurityAdversary / AssumptionDestroyer | High | Accept | Phase 1 (Task 1.1) |
| 4 | Race condition TOCTOU khi gửi trùng báo lỗi đồng thời | SecurityAdversary / AssumptionDestroyer | High | Accept | Phase 1 (Task 1.1) |
| 5 | Cờ `SCORE_DISPUTE_ENABLED` chỉ ở server khiến client không biết trạng thái | SecurityAdversary / AssumptionDestroyer | High | Accept | Phase 1 (Task 1.1) & Phase 2 (Task 2.1) |
| 6 | `score_dispute` thiếu `userId` gây lỗi xóa dữ liệu trong `DATA_REGISTRY` | AssumptionDestroyer / SecurityAdversary | High | Accept | Phase 1 (Task 1.1) |
| 7 | Modal kết quả dùng sai mốc 48 giờ, copy hiệu chuẩn sai lệch, thiếu prop `attemptId` | SecurityAdversary / AssumptionDestroyer | Medium | Accept | Phase 2 (Task 2.1) |

### Whole-Plan Consistency Sweep
- **Giải quyết bế tắc Task 1.0:** Chuyển sang kiểm tra sẵn sàng cục bộ (`pnpm check-types` và schema `attempt` từ #16/WI-12, `DATA_REGISTRY` từ #15/WI-11).
- **Hoàn thiện schema `score_dispute`:** Bổ sung `id`, `attemptId` (FK cascade), `userId` (FK cascade), `targetCriterion`, `expectedBand`, `reason`, `shareConsent`, `status`, `dueAt`, `createdAt`, `updatedAt`.
- **Bảo mật & Phân quyền:** `protectedProcedure` cho cả `submit` và `get`. Kiểm tra `attempt.userId === ctx.user.id`, `attempt.status === 'submitted'`. Kiểm tra trùng lặp báo lỗi đang mở.
- **Đăng ký dữ liệu cá nhân:** Khai báo `score_dispute` trong `DATA_REGISTRY` với handler `export` và `erase` theo `userId`. Bổ sung `data-registry.test.ts` vào verify.
- **Đồng bộ giao diện:** `ReportModalProps` nhận `attemptId`, sửa cam kết 72 giờ, loại bỏ câu chữ "hiệu chuẩn hệ thống", ẩn nút báo lỗi khi cờ tắt hoặc khi xem kết quả mẫu / bài chưa lưu (`isDefaultLatest`). Hiển thị huy hiệu trạng thái và thời gian cam kết 72h.

## Validation Log

### Verification Results
- Claims checked: 14
- Verified: 14 | Failed: 0 | Unverified: 0
- Tier: Standard
- Status: Validated & Ready for implementation
## Câu hỏi mở
- Có giới hạn số báo lỗi mỗi học viên để tránh lạm dụng không?

<!-- slug: wi24-score-dispute -->
