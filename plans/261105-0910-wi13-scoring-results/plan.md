---
title: "Chấm điểm & bằng chứng (`scoring-results`)"
description: "Phần còn lại sau #90/#130: khoảng tin cậy, paywall phía server theo D-04 và hành động North Star luyện lại câu yếu theo D-05."
status: completed
priority: P1
effort: 4d
issue: 17
branch: vinh19410/issue-17
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0910-wi11-privacy-controls, project:261105-0910-wi12-mock-exam]
blocks: [project:261105-0910-wi14-free-quota, project:261105-0910-wi15-billing-qr, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi18-progress-history, project:261105-0910-wi20-forecast-practice, project:261105-0910-wi21-daily-practice, project:261105-0910-wi24-score-dispute]
created: 2026-11-05
updated: 2026-11-13
---

# Chấm điểm & bằng chứng (`scoring-results`)

Tracking: #17

Mục 13 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `scoring-results`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên miễn phí nhận band tổng, khoảng tin cậy và bằng chứng của đúng 1 câu yếu nhất; chi tiết 4 tiêu chí còn lại bị server giữ lại cho tới khi có quyền xem. Từ màn kết quả, học viên luyện lại đúng câu yếu nhất và thấy band trước và sau.

## Hiện trạng (rút gọn phạm vi ngày 2026-11-13)
Pipeline chấm đã chạy thật cho mọi mode qua #90 và #130, nên không làm lại:
- Chấm bất đồng bộ qua Cloudflare Queue, 3 lượt độc lập, trung vị theo tiêu chí, làm tròn IELTS: `packages/api/src/scoring/score-attempt.ts`, `packages/api/src/scoring/aggregate.ts`, bảng `attempt_score` và `score_run` trong `packages/db/src/schema/score.ts`.
- Bằng chứng chỉ giữ trích dẫn nguyên văn (`isVerbatimQuote`).
- Trạng thái lỗi rõ ràng, thử lại không mất bài: `scoring.status`, `scoring.retry` trong `packages/api/src/routers/scoring.ts`.
- Màn chấm và màn kết quả đọc dữ liệu thật (`use-scoring-job.ts`, `use-scored-result.ts`); hai file dữ liệu mô phỏng đã bị xóa.

Phần còn thiếu, cũng là toàn bộ phạm vi của plan này:
- `scoring.getResult` không trả khoảng tin cậy; giao diện ghi "Scored results show a single band" (`results-screen.tsx:254`).
- `scoring.getResult` trả đủ tiêu chí và bằng chứng cho mọi người; giao diện mở khóa cứng `pro = true` (`results-screen.tsx:258-259`). Chưa có `packages/api/src/entitlements.ts`.
- Nút "Luyện lại câu yếu nhất" chỉ đưa về màn chọn đề (`results-screen.tsx:420-422`), chưa luyện đúng câu và chưa so sánh trước và sau.

## Phụ thuộc
- Phải chờ: #15, #16 (đã gỡ #7: OQ-5 chốt dùng pipeline chấm hiện hành, xem `docs/decisions/scoring-self-eval.md`)
- Mở khóa: #18, #19, #21, #22, #24, #25, #28

## Constraints
- Không đổi pipeline chấm. Pipeline chính đã chốt ở OQ-5 (`whisper-1` + 3 lượt `SCORING_MODEL`, trung vị theo tiêu chí). Đo độ sát điểm (≥ 80% lệch ≤ 0.5 band) và độ ổn định 3 lượt (≥ 90%) thuộc vòng lặp tự eval ở #154, không phải cổng nghiệm thu của plan này.
- Paywall theo D-04: backend không gửi dữ liệu bị khóa cho client miễn phí; ẩn trên giao diện không đủ.
- Câu hỏi cho lượt luyện lại lấy từ server (lượt gốc), không nhận `questionText` từ client.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Viết lại pipeline chấm, hàng đợi, retry; đã xong ở #90 và #130.
- Đếm hạn mức; thuộc #18.
- Mua gói, bảng `subscription` và `detail_unlock`; thuộc #19. Plan này chỉ tạo điểm quyết định quyền xem.
- Báo lỗi chấm; thuộc #28.
- Đo độ chính xác của pipeline; thuộc #154.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Kiểm tra nền đã có](./phase-01-pipeline-cham.md) | Completed |
| 2 | [Phase 2: Phân quyền kết quả](./phase-02-kiem-tra-do-chinh-xac-va-phan-quyen.md) | Completed |
| 3 | [Phase 3: Nối giao diện và luyện lại câu yếu](./phase-03-noi-giao-dien.md) | Completed |

## Acceptance Criteria
- [x] Kết quả có khoảng tin cậy lấy từ 3 lượt chấm trong `score_run`.
- [x] Payload `scoring.getResult` của người dùng miễn phí chỉ có band tổng, khoảng tin cậy và bằng chứng của 1 câu yếu nhất; không chứa band tiêu chí hay bằng chứng của câu khác.
- [x] Quyền xem chi tiết chỉ quyết định qua `canViewDetail` ở server.
- [x] "Luyện ngay" mở lượt luyện đúng câu yếu nhất, lượt đó được chấm qua pipeline hiện hành, và màn kết quả của lượt luyện hiện band trước và sau.
- [x] Test của pipeline đã có vẫn qua (không hồi quy).

## Câu hỏi mở (Đã chốt cho Issue #17)
- Bật paywall ở server ngay lập tức theo mặc định D-04 (`canViewDetail` trả `false` tới khi #19 nối bảng `subscription`/`detail_unlock`).
- Quy tắc xác định "câu yếu nhất" khóa theo Task 2.2 (`minus` count nhiều nhất trên 4 tiêu chí -> hòa thì `partNumber` nhỏ hơn rồi thứ tự câu -> không có `minus` thì câu đầu tiên -> `null` nếu không có câu trả lời).
- Kế hoạch rút gọn đã được PO chốt tại PR #157; không cần chạy `/srs` riêng.

## Red Team Review
Rà soát song song bởi `kongming` + 3 góc nhìn (`Security Adversary`, `Assumption Destroyer`, `Failure Mode Analyst`) ngày 2026-11-13:

| Mức độ | Phát hiện | Cách xử lý đã khóa |
|---|---|---|
| CRITICAL | `score_run` trống trên dữ liệu cũ/test seed khiến `confidenceRange([])` throw 500 trong `scoring.getResult` | `confidenceRange([])` vẫn ném lỗi trong `aggregate.ts`; `getResult` lọc giá trị hữu hạn từ `score_run` và fallback về `[snapToHalfBand(score.overall), snapToHalfBand(score.overall)]` khi `score_run` trống |
| CRITICAL | `CriteriaGrid` & `CriterionDetail` gọi `c.band.toFixed(1)` sẽ crash khi server bỏ `band` ở trạng thái `locked: true`, và vùng mask che mất bằng chứng câu yếu nhất | Tách `PublicScoredCriterion` (`band?`, `summary?`) khỏi DB schema `scoredCriterionSchema`; UI nhận `band?: number | null`, hiển thị `"—"` khi null và render card bằng chứng câu yếu nhất rõ nét (không blur/mask) trước `SoftPaywall` |
| CRITICAL | Upload route & `answer-limits` chưa giới hạn `questionKey` cho single-question mock retake (`topicId === null`), dễ bị upload nhầm câu hoặc sai mode Part 2 | Cập nhật `getValidMockQuestionKeys(mode, singleQuestionKey)` fail-closed trong `mock-exam-bank.ts` và truyền `currentAttempt.questionKey` ở `apps/server/src/index.ts`; sửa `useExamSession` hỗ trợ đủ Part 1/2/3 & `cue` |
| CRITICAL | `attempt.start({ retakeOf })` có thể bị parameter mixing (`topicId`/`questionKey`/`mode`), vỡ với câu follow-up `-f`, hoặc bị `useExamSession.getActive()` gọi trùng tạo attempt mới | Cấm truyền `topicId`/`questionKey`/`mode` khi có `retakeOf`; chuẩn hóa hậu tố `-f` bằng `endsWith("-f") ? slice(0, -2) : key` cho forecast và kiểm chứng mock bank; khóa double-click nút "Luyện ngay"; truyền prestarted `attemptId` + verify qua `getActive` để rehydrate |
| CRITICAL | Self-FK trên `attempt.retake_of_attempt_id` có thể kích hoạt SQLite/D1 table recreation | Khai báo `retakeOfAttemptId: text("retake_of_attempt_id")` + index không FK (giống precedent `topic_id`) và xác nhận file SQL do `db:generate` sinh chỉ có `ALTER TABLE` + `CREATE INDEX` |
| IMPORTANT | Dữ liệu before/after (`previousOverall`), `BandRange` tràn `< 4.0`, `improve` quote bọc ngoặc, topic `archived` & parent bị xóa | `scoring.getResult` đọc `previousOverall` kèm điều kiện `userId` sở hữu + `done` (trả `null` nếu parent mất); dùng `cleanQuote(im.from)` trước `isVerbatimQuote`; clamp `BandRange` về `[0, 100]`; `PracticeSessionSchema` hỗ trợ `answer?: string` |
| NOTE | `privacy.exportData` (`data-registry.ts`) hiện export nguyên `criteriaJson` và `transcript` theo quyền GDPR | Ghi nhận ngoài phạm vi #17 (không đụng `data-registry.ts`); PO cân nhắc khi mở billing #19 |

## Validation Log
- **2026-11-13:** Kiểm tra chữ ký file & symbol thực tế trên repo (`aggregate.ts`, `types.ts`, `scoring.ts`, `attempt.ts`, `mock-exam-bank.ts`, `apps/server/src/index.ts`, `results-screen.tsx`, `band-range.tsx`, `use-exam-session.ts`, `store.tsx`, `test/db.ts`); xác nhận mọi dependency Issues (#15, #16, #7) đã `CLOSED` và baseline API/Web tests đang xanh (88 API + 16 Web).

<!-- slug: wi13-scoring-results -->
