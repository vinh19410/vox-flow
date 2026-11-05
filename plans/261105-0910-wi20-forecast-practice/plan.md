---
title: "Luyện forecast (`forecast-practice`)"
description: "Học viên luyện đúng chủ đề có khả năng gặp trong quý, thấy độ phủ đề và lưu được danh sách ôn, trên dữ liệu đề đã được duyệt."
status: pending
priority: P2
effort: 3d
issue: 24
branch: vinh19410/feat/forecast-practice
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi12-mock-exam, project:261105-0910-wi13-scoring-results, project:261105-0910-wi14-free-quota, project:261105-0910-wi15-billing-qr, project:261105-0910-wi19-forecast-curation]
blocks: []
created: 2026-11-05
---

# Luyện forecast (`forecast-practice`)

Tracking: #24

Mục 20 trong `docs/roadmap-work-items.md` · Giai đoạn: Next · Tính năng: `forecast-practice`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên luyện đúng chủ đề có khả năng gặp trong quý, thấy độ phủ đề và lưu được danh sách ôn, trên dữ liệu đề đã được duyệt.

## Phụ thuộc
- Phải chờ: #16, #17, #18, #19, #23

## Constraints
- "Số thí sinh báo đã gặp" chỉ đếm báo cáo thật.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Công cụ quản trị đề; thuộc #23.
- Gợi ý việc mỗi ngày; thuộc #25.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: API luyện đề](./phase-01-api-luyen-de.md) | Pending |
| 2 | [Phase 2: Nối giao diện](./phase-02-noi-giao-dien.md) | Pending |

## Acceptance Criteria
- [ ] Chỉ hiện đề đã đăng của quý hiện tại.
- [ ] Danh sách ôn được lưu theo tài khoản; bộ lọc và tìm kiếm hoạt động nhất quán.
- [ ] "Luyện ngay" kết nối qua phòng thi thật (`attempt.start`), được chấm và trừ hạn mức đúng (1 điểm cho p1, 2 điểm cho p23).
- [ ] Độ phủ cá nhân tính từ bài luyện thật đã hoàn thành của tài khoản.
- [ ] Phân quyền theo gói kiểm tra ở server: danh mục công khai chỉ trả tóm tắt; làm bài thi và chấm điểm yêu cầu tài khoản và trừ hạn mức/gói.

## Quyết định thiết kế (Đã giải quyết Câu hỏi mở)
- **Danh mục đề (`forecast.list`):** Công khai (`publicProcedure`) cho phép cả khách vãng lai và học viên xem danh sách đề trong quý. Chỉ trả về tóm tắt (ID, tiêu đề, phân loại, tag, số thí sinh báo gặp, quý). Tuyệt đối không trả về trước danh sách câu hỏi chi tiết, gợi ý cue card, hoặc câu trả lời mẫu Band 8.0 trong danh mục để chống lộ đề, cào dữ liệu và thao túng AI chấm điểm.
- **Luyện thi thật (`attempt.start`):** Yêu cầu đăng nhập (`protectedProcedure`). Khi nhận `topicId`, server kiểm tra trạng thái `published` và loại đề (`kind: 'p1'` hoặc `'p23'`), tự động khấu trừ hạn mức (1 điểm cho `p1`, 2 điểm cho `p23`) qua hệ thống quota của #18 hoặc kiểm tra gói active qua #17.

## Red Team Review

### Session — 2026-11-05
**Reviewers:** Security Adversary (`code-reviewer`), Assumption Destroyer (`code-reviewer`), Supervisor (`kongming`).
**Findings:** 12 findings analyzed (3 Critical, 6 High, 3 Medium). Tất cả đã được chấp nhận và cập nhật vào nội dung các phase.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Deadlock Task 1.0 do cả 5 issue phụ thuộc (#16, #17, #18, #19, #23) đều đang OPEN | Critical | Accept | Phase 1 Task 1.0 (Giữ vững Failure Protocol, NO-GO thi công khi chưa xong phụ thuộc) |
| 2 | Khai báo sửa các file schema/router chưa tồn tại (`forecast.ts`, `attempt.ts`) | Critical | Accept | Phase 1 (Xác định rõ ràng quyền sở hữu thuộc #23 và #16, không tạo schema rác) |
| 3 | Đứt gãy kết nối giữa "Luyện ngay" và phòng thi thật `ExamScreen` | Critical | Accept | Phase 2 Task 2.1 (Nối `attempt.start({ topicId })`, mở rộng phạm vi sang `useExamSession`) |
| 4 | Chưa có mô hình lưu trữ nội dung câu hỏi/cue card trong CSDL | High | Accept | Phase 1 Task 1.1 (Quy định hợp đồng dữ liệu cho `forecast_topic` và chi tiết đề thi) |
| 5 | Chưa chốt chính sách gói trả phí vs miễn phí cho forecast | High | Accept | `plan.md` (Giải quyết tại mục Quyết định thiết kế) |
| 6 | Lệch hạn mức khi luyện đề kết hợp Part 2 & 3 (`p23`) | High | Accept | Phase 1 Task 1.2 (Trừ 2 điểm cho `p23`, 1 điểm cho `p1` ở server) |
| 7 | API `forecast.coverage` thiếu liên kết dữ liệu cá nhân theo từng topic | High | Accept | Phase 1 Task 1.1 (Scope theo `userId`, trả danh sách topic đã hoàn thành) |
| 8 | Rò rỉ toàn bộ kho câu hỏi và đáp án mẫu nếu trả full items trên `forecast.list` | High | Accept | Phase 1 Task 1.1 (Chỉ trả catalog tóm tắt, giấu câu hỏi/đáp án mẫu) |
| 9 | Nguy cơ chạy đua (race condition) và thiếu idempotent trên `toggleSaved`/`report` | High | Accept | Phase 1 Task 1.1 (Khóa UNIQUE `(user_id, topic_id)`, dùng `ON CONFLICT DO NOTHING`) |
| 10 | Thiếu đăng ký xóa/xuất dữ liệu cá nhân (`data-registry.ts`) cho `forecast_saved` | High | Accept | Phase 1 Task 1.1 (Bổ sung `export` và `erase` handler, verify qua `data-registry.test.ts`) |
| 11 | Xóa `forecast/data.ts` làm gãy metadata `QUARTER` hiển thị trên giao diện | Medium | Accept | Phase 1 Task 1.1 & Phase 2 (Trả `currentQuarter` qua API) |
| 12 | Thiếu file trong phạm vi Phase 2 (`slice-c.test.tsx`, `builders.ts`, `initial-state.ts`) | Medium | Accept | Phase 2 (Mở rộng danh sách "Files to Create / Modify") |

## Validation Log

### Verification Results
- **Kiểm tra hợp lệ cấu trúc plan:** Lệnh `ak plan validate ./plans/261105-0910-wi20-forecast-practice` đạt kết quả `[OK]`.
- **Kiểm tra phụ thuộc tiên quyết (Task 1.0):** Lệnh `for n in 16 17 18 19 23; do gh issue view $n --json state -q .state; done` in kết quả `OPEN` trên cả 5 issue. Xác nhận trạng thái chờ phụ thuộc theo đúng Failure Protocol.
- **Kiểm tra kiểu dự án:** Lệnh `pnpm check-types` thực thi thành công toàn bộ workspace.

### Whole-Plan Consistency Sweep
- **Nhất quán phụ thuộc:** Danh mục phụ thuộc khớp với `docs/roadmap-work-items.md` Mục 20 (chờ 12, 13, 14, 15, 19).
- **Nhất quán bảo mật và quyền:** Đã đồng bộ giữa `plan.md`, `phase-01` (bảo vệ câu hỏi/đáp án mẫu) và `phase-02` (giao diện nhận metadata tóm tắt).
- **Nhất quán hạn mức:** Đã thống nhất mức trừ quota `p1: 1 điểm`, `p23: 2 điểm` ở server.

<!-- slug: wi20-forecast-practice -->
