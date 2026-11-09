---
title: "Quyền riêng tư (`privacy-controls`)"
description: "Học viên tự quyết dữ liệu giọng nói bằng 2 công tắc đồng ý, và xem, xuất, xóa được toàn bộ dữ liệu, với cam kết xóa trong 24 giờ."
status: completed
priority: P1
effort: 3d
issue: 15
branch: vinh19410/feat/privacy-controls
tags: [backend, frontend, critical, advice]
blockedBy: [project:261105-0909-wi02-reconcile-prd-roadmap, project:261105-0910-wi10-onboarding]
blocks: [project:261105-0910-wi12-mock-exam, project:261105-0910-wi13-scoring-results, project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi18-progress-history, project:261105-0910-wi19-forecast-curation, project:261105-0910-wi24-score-dispute]
created: 2026-11-05
---

# Quyền riêng tư (`privacy-controls`)

Tracking: #15

Mục 11 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `privacy-controls`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên tự quyết dữ liệu giọng nói bằng 2 công tắc đồng ý, và xem, xuất, xóa được toàn bộ dữ liệu, với cam kết xóa trong 24 giờ.

## Phụ thuộc
- Phải chờ: #6, #14
- Mở khóa: #16, #17, #21, #22, #23, #28

## Constraints
- Công tắc huấn luyện/hiệu chuẩn luôn tắt mặc định và tách riêng công tắc lưu bài.
- Sao lưu D1 trước khi áp migration lên môi trường thật.
- Luồng học viên chủ động xóa dữ liệu (F-21) đang hold theo quyết định ngày 2026-11-05, chờ câu trả lời của luật sư ở #8.

## Non-goals
- Viết chính sách quyền riêng tư pháp lý; phụ thuộc #8.
- Tự xóa bài khi học viên tắt công tắc lưu; đã bỏ theo quyết định của người sở hữu ngày 2026-11-05.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Lưu đồng ý có lịch sử](./phase-01-luu-dong-y-co-lich-su.md) | Completed |
| 2 | [Phase 2: Xuất và xóa dữ liệu](./phase-02-xuat-va-xoa-du-lieu.md) | Completed |
| 3 | [Phase 3: Nối giao diện](./phase-03-noi-giao-dien.md) | Completed |

## Acceptance Criteria
- [x] Hai công tắc lưu riêng, công tắc huấn luyện/hiệu chuẩn mặc định tắt, mỗi lần đổi đều có lịch sử.
- [x] Xuất được toàn bộ dữ liệu của học viên thành một file.
- [ ] Yêu cầu xóa hoàn tất trong 24 giờ, kể cả dữ liệu ở bảng và kho lưu trữ về sau (tạm hoãn theo OQ-6 Câu 7).
- [x] Không ghi âm được khi chưa có bản ghi đồng ý.

## Câu hỏi mở
- Sau khi xóa có giữ dòng ẩn danh để đối soát thanh toán không? Việc này cần đối chiếu với trả lời của luật sư.
- Work items ghi có đủ bộ tài liệu nháp, nhưng không có PRD gốc (người sở hữu xác nhận ngày 2026-11-05) và SRS, brainstorm cũng không có trong repo, nên phải viết lại phạm vi trong plan trước khi code. PRD được dựng lại ở #6.
- Có giữ luồng chủ động xóa dữ liệu (F-21) và mốc 24 giờ không? Đang hold, chờ luật sư trả lời ở #8.

<!-- slug: wi11-privacy-controls -->
