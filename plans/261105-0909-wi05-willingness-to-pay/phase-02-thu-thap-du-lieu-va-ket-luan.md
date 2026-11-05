---
phase: 2
title: "Thu thập dữ liệu khảo sát thực tế và kết luận"
status: blocked
priority: P2
effort: "2.5d"
dependencies: ["phase-01"]
external_blocker: "PO xác nhận ngưỡng (Gate A) và phỏng vấn học viên IELTS thật (Gate B)"
---

# Phase 2: Thu thập dữ liệu khảo sát thực tế và kết luận

## Goal
Sau khi Người sở hữu sản phẩm (PO) phê duyệt quy tắc ngưỡng (Gate A) và hoàn thành các cuộc phỏng vấn học viên IELTS thật (Gate B), ghi nhận dữ liệu tổng hợp ẩn danh vào `docs/research/wtp-validation.md`, đưa ra kết luận chính thức về việc giữ hay đổi 4 mức giá, và cập nhật cột Evidence của `billing` trong roadmap để hoàn thành kiểm chứng.

## Files to Create / Modify
- Modify: `docs/research/wtp-validation.md`
- Modify: `docs/roadmap-chamro.md`
- Modify: `docs/roadmap-work-items.md`
- Modify: `docs/_product/roadmap.md`

## External Dependency Gate
Phase này bị CHẶN cho đến khi hoàn thành hai sự kiện ngoài đời thực theo đúng thứ tự:
1. **Gate A (Chốt ngưỡng):** Comment trên GitHub issue #9 từ tài khoản `@vinh19410` bắt đầu bằng `Đã chốt ngưỡng:` kèm ngày tháng và xác nhận bộ ngưỡng giữ/đổi giá.
2. **Gate B (Dữ liệu phỏng vấn thật):** PO cung cấp bảng dữ liệu ẩn danh thu thập từ các cuộc phỏng vấn học viên thật, trong đó mọi ngày phỏng vấn đều phải diễn ra vào hoặc sau ngày chốt ngưỡng Gate A (ngăn chặn việc nắn chỉnh ngưỡng sau khi đã biết kết quả).

Agent KHÔNG được tự ý thực thi phase này hay bịa số liệu/kết luận nếu chưa thỏa mãn cả Gate A và Gate B.

## Tasks & Steps

### Task 2.0 — Kiểm tra cổng phụ thuộc Gate A và Gate B
- Goal: Đảm bảo có xác nhận ngưỡng từ PO và dữ liệu phỏng vấn thật trước khi ghi nhận kết quả.
- Target files and symbols: GitHub issue #9 và bảng dữ liệu do PO cung cấp.
- Steps:
  1. Kiểm tra comment xác nhận của `@vinh19410` trên issue #9: `gh issue view 9 --json comments --jq '.comments[] | select(.author.login=="vinh19410") | .createdAt + " " + .body' | grep 'Đã chốt ngưỡng:'`.
  2. Xác minh dữ liệu phỏng vấn do PO cung cấp có ngày thực hiện >= ngày chốt ngưỡng Gate A.
  3. Nếu chưa thỏa mãn, DỪNG LẠI và thông báo "Chờ phụ thuộc ngoài: PO chốt ngưỡng (Gate A) và phỏng vấn học viên thật (Gate B)". Không coi đây là lỗi kỹ thuật.
- Verify: `gh issue view 9 --json comments --jq '.comments[] | select(.author.login=="vinh19410") | .body' | grep -c 'Đã chốt ngưỡng:'` in ít nhất `1`.

### Task 2.1 — Ghi nhận kết quả khảo sát và kết luận từng mức giá
- Goal: Cập nhật dữ liệu tổng hợp ẩn danh và dòng kết luận chính thức vào `docs/research/wtp-validation.md`.
- Target files and symbols: `docs/research/wtp-validation.md`
- Steps:
  1. Điền bảng dữ liệu ẩn danh theo từng gói (ít nhất 20 học viên mục tiêu, không chứa PII).
  2. Phân tích tỷ lệ cam kết và kết quả Van Westendorp theo từng gói gắn với khoảng ngày đến thi.
  3. Thêm dòng `Kết luận: ...` nêu rõ quyết định giữ hay đổi từng mức giá trong 4 mức (49k, 99k, 249k, 349k) dựa trên so sánh số liệu thực tế với ngưỡng Gate A.
- Success criteria: Bảng số liệu được điền và có đúng một dòng bắt đầu bằng `Kết luận:`.
- Verify: `grep -c '^Kết luận:' docs/research/wtp-validation.md` in `1`.

### Task 2.2 — Cập nhật roadmap và hoàn tất work item 05
- Goal: Cập nhật Evidence của `billing` trong roadmap và chuyển trạng thái mục 05 sang hoàn thành.
- Target files and symbols: `docs/roadmap-chamro.md`, `docs/roadmap-work-items.md`, `docs/_product/roadmap.md`
- Steps:
  1. Xử lý kết quả kiểm chứng:
     - Nếu đạt ngưỡng giữ giá: Cập nhật cột Evidence của dòng `billing` trong `docs/roadmap-chamro.md` (Mục 2) từ `Giả định` sang `Đã kiểm chứng`, nâng Confidence từ `0.8` lên `1.0`, tính lại Điểm RICE thành `10.0`.
     - Nếu không đạt ngưỡng giữ giá: Cập nhật cột Evidence thành `Bị bác bỏ (Cần đổi giá)`, kích hoạt việc PO đánh giá lại các mức giá mới và chuyển tiếp sang WI15 / Issue #19.
  2. Cập nhật `docs/roadmap-work-items.md`: chuyển trạng thái mục 05 từ `⏸️` sang duy nhất `✅` (hoàn thành), ghi chú kết quả WTP đã được xác lập.
  3. Cập nhật `docs/_product/roadmap.md`: cập nhật/thu hồi ghi chú chuyển tiếp Single Source of Truth tại dòng 55-56 khi issue #9 hoàn thành.
  4. Đóng issue #9 sau khi PR của Phase 2 được duyệt và merge.
- Success criteria: Dòng `billing` không còn là giả định, điểm RICE được cập nhật chuẩn xác, mục 05 chuyển trạng thái `✅`.
- Verify: `grep -F '| `billing` |' docs/roadmap-chamro.md | grep -c 'Giả định'` in `0` và `grep '| 05 |' docs/roadmap-work-items.md | grep -c '✅'` in `1`.
## Verification
1. `grep -c '^Kết luận:' docs/research/wtp-validation.md` in `1`.
2. `grep -F '| `billing` |' docs/roadmap-chamro.md | grep -c 'Giả định'` in `0`.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Nếu thiếu xác nhận ngưỡng hoặc dữ liệu từ học viên thật, đây là trạng thái CHỜ PHỤ THUỘC NGOÀI, không phải lỗi kỹ thuật. Không tự tạo số liệu hay kết luận giả lập để vượt qua kiểm tra. Báo cáo rõ trạng thái cho người sở hữu sản phẩm.
