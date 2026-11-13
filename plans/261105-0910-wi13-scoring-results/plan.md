---
title: "Chấm điểm & bằng chứng (`scoring-results`)"
description: "Phần còn lại sau #90/#130: khoảng tin cậy, paywall phía server theo D-04 và hành động North Star luyện lại câu yếu theo D-05."
status: pending
priority: P1
effort: 4d
issue: 17
branch: vinh19410/feat/scoring-results
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
| 1 | [Phase 1: Kiểm tra nền đã có](./phase-01-pipeline-cham.md) | Pending |
| 2 | [Phase 2: Phân quyền kết quả](./phase-02-kiem-tra-do-chinh-xac-va-phan-quyen.md) | Pending |
| 3 | [Phase 3: Nối giao diện và luyện lại câu yếu](./phase-03-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Kết quả có khoảng tin cậy lấy từ 3 lượt chấm trong `score_run`.
- [ ] Payload `scoring.getResult` của người dùng miễn phí chỉ có band tổng, khoảng tin cậy và bằng chứng của 1 câu yếu nhất; không chứa band tiêu chí hay bằng chứng của câu khác.
- [ ] Quyền xem chi tiết chỉ quyết định qua `canViewDetail` ở server.
- [ ] "Luyện ngay" mở lượt luyện đúng câu yếu nhất, lượt đó được chấm qua pipeline hiện hành, và màn kết quả của lượt luyện hiện band trước và sau.
- [ ] Test của pipeline đã có vẫn qua (không hồi quy).

## Câu hỏi mở
- Khi bật paywall ở server mà #19 chưa có cách mua, người dùng Beta mất phần chi tiết đang xem được. Bật ngay, hay đợi #19 xong? Mặc định trong plan: bật ngay, vì D-04 yêu cầu backend không trả dữ liệu bị khóa.
- "Câu yếu nhất" xác định theo quy tắc ở Task 2.2 (câu có nhiều bằng chứng `minus` nhất). Người sở hữu sản phẩm cần xác nhận quy tắc này.
- Chưa có tài liệu BA cho tính năng này; cần chạy `/srs scoring-results` trước khi code không?

<!-- slug: wi13-scoring-results -->
