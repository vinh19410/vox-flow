---
title: "Chấm điểm & bằng chứng (`scoring-results`)"
description: "Mọi lượt thi được chấm thật 3 lần độc lập, lấy trung vị và có khoảng tin cậy; học viên xem band tổng miễn phí, còn chi tiết 4 tiêu chí kèm bằng chứng nằm sau paywall."
status: pending
priority: P1
effort: 6d
issue: 17
branch: vinh19410/feat/scoring-results
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0909-wi03-scoring-eval-oq5, project:261105-0910-wi11-privacy-controls, project:261105-0910-wi12-mock-exam]
blocks: [project:261105-0910-wi14-free-quota, project:261105-0910-wi15-billing-qr, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi18-progress-history, project:261105-0910-wi20-forecast-practice, project:261105-0910-wi21-daily-practice, project:261105-0910-wi24-score-dispute]
created: 2026-11-05
---

# Chấm điểm & bằng chứng (`scoring-results`)

Tracking: #17

Mục 13 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `scoring-results`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Mọi lượt thi được chấm thật 3 lần độc lập, lấy trung vị và có khoảng tin cậy; học viên xem band tổng miễn phí, còn chi tiết 4 tiêu chí kèm bằng chứng nằm sau paywall.

## Phụ thuộc
- Phải chờ: #7, #15, #16
- Mở khóa: #18, #19, #21, #22, #24, #25, #28

## Constraints
- Chấm 3 lần áp dụng cho mọi lượt, kể cả gói miễn phí.
- Ngưỡng đạt theo OQ-5, không tự hạ.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Đếm hạn mức; thuộc #18.
- Luyện lại câu yếu, trừ khi #6 (D-05) đưa vào đây.
- Báo lỗi chấm; thuộc #28.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Pipeline chấm](./phase-01-pipeline-cham.md) | Pending |
| 2 | [Phase 2: Kiểm tra độ chính xác và phân quyền](./phase-02-kiem-tra-do-chinh-xac-va-phan-quyen.md) | Pending |
| 3 | [Phase 3: Nối giao diện](./phase-03-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Mọi lượt chấm 3 lần độc lập, lấy trung vị, có khoảng tin cậy.
- [ ] Bằng chứng trích đúng câu học viên đã nói.
- [ ] Phân quyền paywall kiểm tra ở server, không chỉ ẩn trên giao diện.
- [ ] Chấm lỗi có trạng thái rõ ràng, thử lại được và không mất bài.
- [ ] Trên bộ mẫu của #7 đạt ≥ 80% bài lệch trong 0.5 band và ≥ 90% bài có độ chênh 3 lần ≤ 0.5 band.

## Câu hỏi mở
- Chưa có tài liệu BA cho tính năng này; cần chạy `/srs scoring-results` trước khi code không?
- Nếu pipeline thật không đạt ngưỡng dù #7 đạt thì xử lý thế nào? -> Quyết định: Người sở hữu sản phẩm quyết định; theo quy định `AGENTS.md:35`, nếu Verify không đạt thì dừng, tuyệt đối không tự hạ ngưỡng.

## Red Team Review

### Session — 2026-11-05 (Advisory Supervision with Kongming)
**Findings:** 5 (3 accepted, 1 partially accepted, 1 rejected)  
**Severity breakdown:** 4 Critical, 1 High

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | BOLA/IDOR in `results.getResult` exposes all student scores & evidence without ownership guard | Critical | Accept | Phase 2 (Task 2.1) |
| 2 | Denial-of-wallet / budget drain via unvalidated `attempt.submit` with 0 answers | High | Accept | Phase 1 (Task 1.2) |
| 3 | Non-atomic queue dispatch and retry locking in `attempt.submit` leaves attempts stuck in `queued` | Critical | Accept | Phase 1 (Task 1.2) |
| 4 | Task 1.0 dependency check deadlocks on issue state (`CLOSED`) despite merged PRs | Critical | Accept (#15, #16); Reject (#7) | Phase 1 (Task 1.0) |
| 5 | Replacing Task 2.2 30-sample benchmark with fixtures/mocks violates OQ-5 non-negotiable threshold | Critical | Reject | Phase 2 (Task 2.2) |

### Adjudication Rationale
- **Finding 1 (SecurityAdversary F1):** Bắt buộc kiểm tra `targetAttempt.userId === ctx.session.user.id` trước khi đánh giá `canViewDetail`. Trả `FORBIDDEN` / `NOT_FOUND` không kèm bất kỳ trường điểm nào.
- **Finding 2 (SecurityAdversary F2):** `attempt.submit` bắt buộc đếm số câu trả lời trong `attemptAnswer`, nếu = 0 trả `BAD_REQUEST` trước khi cập nhật trạng thái hay gửi queue.
- **Finding 3 (FailureModeAnalyst F1):** Sử dụng trạng thái `pending_dispatch` và ràng buộc duy nhất trên `attempt_score.attemptId`. Nếu `queue.send` lỗi, giữ `pending_dispatch` cho phép gọi lại thử lại an toàn.
- **Finding 4 (AssumptionDestroyer F1):** PR #39 và PR #40 đã merge vào `dev`, schema đã có trong repo nên việc kiểm tra code/PR là chính xác cho #15 và #16. Tuy nhiên đối với #7, PR #33/#34 chỉ mới là khung đánh giá (scaffolding), chưa có lượt chấm thật và OQ-5 vẫn chưa đạt. Do đó #7 là phụ thuộc thực tế, bắt buộc phải chờ OQ-5 đạt (`[x] OQ-5`) và issue #7 đóng.
- **Finding 5 (AssumptionDestroyer F2):** Giữ nguyên đo đạc thực tế trên 30 bài mẫu của #7 với ngưỡng `Đạt ngưỡng: có`, tuân thủ quy tắc D-01/OQ-5 và `AGENTS.md:35`. Bổ sung driver độc lập `run-prod-eval.ts` và ràng buộc giữ lại file âm thanh.

## Validation Log

### Verification Results
- **Tier:** Standard (Fact Checker + Contract Verifier)
- **Claims checked:** 10
- **Verified:** 8 | **Failed:** 0 | **Unverified:** 2 (phụ thuộc vào kết quả benchmark OQ-5 của #7 và âm thanh bài mẫu)
- **Key Verified Symbols:**
  - `packages/db/src/schema/attempt.ts`: `attempt`, `attemptAnswer` (tồn tại và đã merge vào `dev`)
  - `packages/db/src/schema/consent.ts`: `consentEvent` (tồn tại và đã merge vào `dev`)
  - `packages/api/src/routers/attempt.ts`: `attemptRouter`, `submit` (tồn tại)
  - `apps/server/src/index.ts`: entrypoint Worker server (tồn tại)
  - `packages/infra/alchemy.run.ts`: cấu hình hạ tầng Cloudflare (tồn tại)

### Whole-Plan Consistency Sweep
- **Files reread:** `plan.md`, `phase-01-pipeline-cham.md`, `phase-02-kiem-tra-do-chinh-xac-va-phan-quyen.md`, `phase-03-noi-giao-dien.md`
- **Decision deltas checked:** 5
- **Reconciled stale references:** Reconciled Task 1.0 gates, `attempt.submit` validation & idempotency, `results.getResult` ownership assertion, Queue infra declarations.
- **Unresolved contradictions:** 0
- **Advisory Council Verdict (Kongming):** GO for plan revision; NO-GO for implementation until Issue #7 and OQ-5 dependency conditions are satisfied.

<!-- slug: wi13-scoring-results -->
