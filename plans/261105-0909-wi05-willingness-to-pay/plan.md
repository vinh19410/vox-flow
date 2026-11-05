---
title: "Kiểm chứng mức sẵn lòng trả"
description: "Có bằng chứng thật về việc học viên có trả 4 mức giá 49k, 99k, 249k và 349k không, thay cho giả định mà `billing` đang dựa vào."
status: in-progress
priority: P2
effort: 3d
issue: 9
branch: vinh19410/vox-flow-ai-9
tags: [docs, advice]
blockedBy: []
blocks: []
created: 2026-11-05
---

# Kiểm chứng mức sẵn lòng trả

Tracking: #9

Mục 05 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Có bằng chứng thật về việc học viên có trả 4 mức giá 49k, 99k, 249k và 349k không, thay cho giả định mà `billing` đang dựa vào.

## Phụ thuộc
- Phải chờ: Không có (đối với Phase 1: Chuẩn bị phương án kiểm chứng và khung khảo sát)
- Yếu tố ngoài: PO xác nhận bộ ngưỡng giữ giá (Gate A) và thực hiện phỏng vấn học viên thật (Gate B) — chặn Phase 2: Thu thập dữ liệu và kết luận.
- Mở khóa: Cung cấp tham chiếu bằng chứng về giá cho #19 (WI15 - Mua gói & QR `billing`, phụ thuộc mềm).

## Constraints
- Học viên tham gia phỏng vấn phải từ đủ 16 tuổi trở lên (hoặc đủ 18 tuổi nếu chưa có quy trình xác thực đồng ý cha mẹ theo Luật Trẻ em).
- Không lưu tên, số điện thoại hay thông tin định danh cá nhân (PII) của người được hỏi trong repo.
- Vòng đời dữ liệu âm thanh: ghi âm chỉ lưu cục bộ có mã hóa, xóa vĩnh viễn trong 14 ngày sau khi trích xuất bảng ẩn danh, không chia sẻ qua cloud link công cộng.
- Tuyệt đối không tự bịa đặt số liệu khảo sát hay đưa ra kết luận giả lập khi chưa có dữ liệu phỏng vấn thật.
- Ngưỡng giữ giá phải được người sở hữu sản phẩm (PO) phê duyệt trước khi thu thập dữ liệu (Gate A).
- Dữ liệu phỏng vấn phải có ngày thực hiện diễn ra vào hoặc sau ngày chốt ngưỡng Gate A.

## Non-goals
- Đổi giá trong mã nguồn (nếu có điều chỉnh giá, issue #19 áp dụng).
- Thu tiền cọc thật trong quá trình khảo sát khi chưa hoàn tất tư vấn pháp lý OQ-6 (#8) và thiết lập SePay (#12).

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Chuẩn bị phương án kiểm chứng và khung khảo sát](./phase-01-chuan-bi-phuong-an-va-khung-khao-sat.md) | Completed |
| 2 | [Phase 2: Thu thập dữ liệu khảo sát thực tế và kết luận](./phase-02-thu-thap-du-lieu-va-ket-luan.md) | Blocked (external: PO chốt ngưỡng & phỏng vấn học viên thật) |

## Acceptance Criteria
- [x] Có hồ sơ khung kiểm chứng, kịch bản phỏng vấn và bộ ngưỡng đề xuất tại `docs/research/wtp-validation.md` (Phase 1).
- [ ] Có kết quả từ số học viên mục tiêu đã thống nhất trước khi khảo sát (Phase 2).
- [ ] Báo cáo kết luận giữ hay đổi từng mức giá, kèm số liệu (Phase 2).
- [ ] Điểm Evidence của `billing` trong roadmap được cập nhật (Phase 2).
## Red Team Review

### Session — 2026-11-05
**Reviewers:** Security Adversary (`code-reviewer`), Assumption Destroyer (`code-reviewer`), Supervisor (`kongming`).
**Findings:** 11 total findings across compliance, user safety, sample statistics, product alignment, and dependencies (11 accepted, 0 rejected).
**Severity breakdown:** 3 Critical, 6 High, 2 Medium.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Bỏ sót điều kiện tuổi học viên & rủi ro thu thập giọng nói trẻ em dưới 16 tuổi trái luật | Critical | Accept | Phase 1 Task 1.1 Step 4 (Screener: tuổi $\ge 16$) |
| 2 | Thu thập PII bên thứ ba trái phép qua cơ chế "giới thiệu bạn cùng thi" | High | Accept | Phase 1 Task 1.1 Step 5 (Loại bỏ giới thiệu bạn) |
| 3 | Thiếu vòng đời xử lý ghi âm và rủi ro lộ verbal PII ngoài repo | High | Accept | Phase 1 Task 1.1 Step 7 (Mã hóa cục bộ, xóa trong 14 ngày) |
| 4 | Bỏ qua cổng tư vấn pháp lý WI04 (#8) đối với khảo sát thương mại | High | Accept | docs/research/wtp-validation.md (Mục 5.2 cấm AI đám mây, Mục 3 Phần 4 không thu tiền cọc) |
| 5 | Lỗ hổng dữ liệu giả mạo do tuyển dụng tự báo cáo trên group mở | Medium | Accept | Phase 1 Task 1.1 Step 4 (Minh chứng báo thi đã che mã định danh) |
| 6 | Lệch đồng bộ roadmap và sai số học RICE khi cập nhật Evidence | Medium | Accept | Phase 2 Task 2.2 (Cập nhật Confidence 1.0, RICE 10.0, thu hồi ghi chú SSOT) |
| 7 | Thống kê gãy vỡ: Áp dụng Van Westendorp trên N=20 chia 4 mô hình giá bất đối xứng | Critical | Accept | Phase 1 Task 1.1 Step 5 (VW chỉ là kiểm tra định tính phụ trợ) |
| 8 | Khoảng thời gian sàng lọc 90 ngày mâu thuẫn với trần tối đa 60 ngày của gói 349k | High | Accept | Phase 1 Task 1.1 Step 4 (Sàng lọc $\le 60$ ngày; phân luồng cho >60 ngày) |
| 9 | Màn hình demo prototype chứa nội dung sai lệch về quyền lợi gói (49k mọi bài sau) | High | Accept | Phase 1 Task 1.1 Step 5 (Dùng mockup tĩnh chuẩn PRD thay vì demo web prototype) |
| 10 | Đảo ngược phụ thuộc và tạo deadlock nhân tạo với WI15 (`billing-qr`) | Critical | Accept | Plan frontmatter `blocks: []`, gỡ bỏ phụ thuộc cứng đối với code SePay |
| 11 | Thiếu quy trình xử lý khi giả thuyết bị bác bỏ và đứt gãy ủy quyền roadmap | High | Accept | Phase 2 Task 2.2 (Nhánh `Bị bác bỏ (Cần đổi giá)`, chuyển trạng thái `✅`) |

## Validation Log

### Verification Results
- Kiểm tra tiền đề billing: `grep -F '| \`billing\` |' docs/roadmap-chamro.md | grep -c 'Giả định'` in `1` (khớp dòng 55).
- Kiểm tra work item 05: `grep -cF '| 05 |' docs/roadmap-work-items.md` in `1` (khớp dòng 20).
- Kiểm tra định dạng plan: `ak plan validate plans/261105-0909-wi05-willingness-to-pay` in `[OK]`.
- Kiểm tra kiểu mã nguồn: `pnpm check-types --force` thực thi sạch 7/7 gói trong workspace (0 cached, thời gian 1m6s).

### Whole-Plan Consistency Sweep
- Liên kết giữa `plan.md`, `phase-01-chuan-bi-phuong-an-va-khung-khao-sat.md`, và `phase-02-thu-thap-du-lieu-va-ket-luan.md` khớp hoàn toàn về tên file, mục tiêu, và phân định trách nhiệm.
- Gỡ bỏ thành công deadlock nhân tạo với WI15 trong `plan.md` (`blocks: []`).
- Nhánh git trong `plan.md` (`vinh19410/vox-flow-ai-9`) khớp chính xác với git branch hiện tại.
- Thống nhất quy ước: Phase 1 chuẩn bị hồ sơ và PR ghi `Refs #9`, Phase 2 chờ Gate A & Gate B ngoài đời mới ghi `Closes #9`.
## Câu hỏi mở
- PO có xác nhận bộ ngưỡng giữ giá đề xuất (Gate A) trước khi triển khai phỏng vấn không?
- Kênh phân bổ học viên phỏng vấn cụ thể (Facebook, Zalo, trung tâm IELTS) đã sẵn sàng chưa?

<!-- slug: wi05-willingness-to-pay -->
