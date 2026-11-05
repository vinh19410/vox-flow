---
title: "Xử lý báo lỗi bản mở rộng (GAP-03)"
description: "Khi lượng báo lỗi vượt sức một người, có thể thêm giám khảo mà vẫn giữ cam kết 72 giờ, và báo lỗi trở thành nguồn dữ liệu để chỉnh chấm điểm."
status: paused
priority: P3
effort: 5d
issue: 30
branch: vinh19410/feat/dispute-handling-extended
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi25-dispute-handling-minimal]
blocks: []
created: 2026-11-05
---

# Xử lý báo lỗi bản mở rộng (GAP-03)

Tracking: #30

Mục 26 trong `docs/roadmap-work-items.md` · Giai đoạn: Later · Tính năng: `score-dispute (GAP-03)`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Khi lượng báo lỗi vượt sức một người, có thể thêm giám khảo mà vẫn giữ cam kết 72 giờ, và báo lỗi trở thành nguồn dữ liệu để chỉnh chấm điểm.

## Phụ thuộc
- Phải chờ: #29
- Yếu tố ngoài: Đạt điều kiện kích hoạt: quá 5 báo lỗi/tuần hoặc đúng hạn dưới 90%

## Constraints
- Không làm trước khi đạt điều kiện kích hoạt.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Tự động chấm lại bằng AI khi có báo lỗi.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Xác nhận điều kiện kích hoạt](./phase-01-xac-nhan-dieu-kien-kich-hoat.md) | Halted (Dừng tại Task 1.1 theo Failure Protocol - Quyết định: Chưa mở rộng) |
| 2 | [Phase 2: Vai trò giám khảo và hiệu chuẩn](./phase-02-vai-tro-giam-khao-va-hieu-chuan.md) | Blocked (Chờ đạt điều kiện kích hoạt) |

## Trạng thái thực thi (Execution Log)
- **2026-11-05:**
  - Task 1.0 ĐẠT: Issue #29 đã `CLOSED` và merge vào `dev`.
  - Task 1.1 ĐÃ GHI: Lập `docs/decisions/dispute-scale-up.md` với `Báo lỗi/tuần: chưa có dữ liệu thật (cờ mặc định false tại alchemy.run.ts:29, chưa kiểm tra giá trị đã triển khai)`, `Tỷ lệ đúng hạn: chưa có dữ liệu thật`, `Quyết định mở rộng: không`.
  - Theo Task 1.1 bước 3 và Failure Protocol: Dừng plan tại đây, không triển khai Phase 2 khi chưa có tải thật từ người dùng.
## Acceptance Criteria
- [ ] Chỉ bắt đầu khi đạt điều kiện kích hoạt: quá 5 báo lỗi/tuần hoặc đúng hạn dưới 90%.
- [ ] Có vai trò giám khảo với quyền hẹp hơn người sở hữu, và phân công được.
- [ ] Chỉ dữ liệu của học viên đã đồng ý hiệu chuẩn mới vào bộ hiệu chuẩn.
- [ ] Có báo cáo % báo lỗi được phản hồi trong 72 giờ.

## Câu hỏi mở
- Giám khảo được tuyển và trả công thế nào?
- Giám khảo có được nghe audio không, và điều này cần ghi gì trong điều khoản?

<!-- slug: wi26-dispute-handling-extended -->
