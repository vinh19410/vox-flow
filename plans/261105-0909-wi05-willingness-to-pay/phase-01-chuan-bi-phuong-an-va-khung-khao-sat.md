---
phase: 1
title: "Chuẩn bị phương án kiểm chứng và khung khảo sát"
status: completed
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 1: Chuẩn bị phương án kiểm chứng và khung khảo sát

## Goal
Xây dựng đầy đủ hồ sơ phương án kiểm chứng mức sẵn lòng trả (WTP) tại `docs/research/wtp-validation.md` gồm phương pháp phỏng vấn cam kết (Mom Test), cỡ mẫu, bộ quy tắc ngưỡng giữ giá đề xuất chờ PO phê duyệt, bộ câu hỏi phỏng vấn theo số ngày đến ngày thi, thang đo cam kết (commitment ladder) và mẫu bảng tổng hợp dữ liệu ẩn danh, sẵn sàng bàn giao cho người sở hữu sản phẩm thực hiện khảo sát thực tế.

## Files to Create / Modify
- Create: `docs/research/wtp-validation.md`
- Modify: `docs/roadmap-work-items.md`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: Xác minh mục 05 trong `docs/roadmap-work-items.md` và `docs/roadmap-chamro.md` đang mở và `billing` đang ở trạng thái `Giả định`.
- Target files and symbols: `docs/roadmap-chamro.md` (dòng `billing`), `docs/roadmap-work-items.md` (mục 05).
- Steps:
  1. Kiểm tra dòng `billing` trong `docs/roadmap-chamro.md` có cột Evidence là `Giả định`.
  2. Kiểm tra dòng mục 05 trong `docs/roadmap-work-items.md` tồn tại và trỏ tới issue #9.
- Success criteria: Tiền đề được xác nhận mechanically qua lệnh grep.
- Verify: `grep -F '| `billing` |' docs/roadmap-chamro.md | grep -c 'Giả định'` in `1` và `grep -cF '| 05 |' docs/roadmap-work-items.md` in `1`.

### Task 1.1 — Soạn thảo hồ sơ phương án kiểm chứng và kịch bản phỏng vấn
- Goal: Tạo tài liệu `docs/research/wtp-validation.md` hoàn chỉnh, chuẩn xác 3 nhãn quy định, không chứa placeholder kết luận hay dữ liệu giả lập.
- Target files and symbols: `docs/research/wtp-validation.md`
- Steps:
  1. Tạo thư mục `docs/research/` nếu chưa có.
  2. Tạo 3 dòng chuẩn bắt buộc ở đầu tài liệu:
     - `Phương pháp:`
     - `Cỡ mẫu:`
     - `Ngưỡng giữ giá:`
  3. Ghi rõ `Trạng thái: Đề xuất — chờ PO xác nhận ngưỡng (Gate A)`.
  4. Soạn thảo tiêu chí sàng lọc (Screener) đối tượng mục tiêu:
     - Độ tuổi: Từ đủ 16 tuổi trở lên (bảo đảm tuân thủ Luật Trẻ em và bảo vệ dữ liệu cá nhân theo `docs/legal/oq-6-tu-van-luat-su.md`).
     - Ngày thi: Khớp với giới hạn gói hệ thống — ưu tiên học viên có ngày thi trong vòng 60 ngày (phù hợp trần tối đa 60 ngày của gói 349k theo `docs/_product/prd.md:130`); với học viên có ngày thi từ 61–90 ngày, phân luồng đánh giá gói 30 ngày (249k) hoặc gói lượt (49k).
     - Đã xác định band mục tiêu và có minh chứng đăng ký thi (ảnh phiếu báo/email đã che thông tin số định danh) để phòng chống dữ liệu giả mạo.
     - Đã tự học hoặc chi tiền luyện Speaking trong 6 tháng qua.
     - Loại trừ người quen, bạn bè, người đã biết sản phẩm trước đó.
     - Phân bổ kênh tiếp cận (Facebook group, Zalo group, diễn đàn IELTS) không quá 40%/kênh.
  5. Soạn thảo kịch bản phỏng vấn 1-1 (20–30 phút) theo thứ tự:
     - Khảo sát hành vi chi tiêu quá khứ và chi phí luyện Speaking thực tế (Mom Test: hỏi hành vi thật đã diễn ra, không hỏi giả định).
     - Demo màn hình kết quả thi mẫu: sử dụng bản mockup tĩnh chuẩn xác theo PRD §4.6 và Quyết định D-04 (49k = 3 lượt mở chi tiết; miễn phí = 3 bài/ngày với band tổng + 1 câu nhận xét), tránh dùng giao diện prototype hiện tại đang có câu từ chưa chuẩn.
     - Trình bày đồng thời 4 gói giá (49k, 99k, 249k, 349k) gắn với số ngày đến ngày thi của học viên (nhận diện hiện tượng gói chiếm ưu thế - dominance giữa 349k và 249k).
     - 4 câu hỏi Van Westendorp (quá rẻ / rẻ / đắt / quá đắt) đóng vai trò kiểm tra cảm nhận định tính phụ trợ, không dùng để vẽ đường cong thống kê định lượng trên mẫu N=20.
     - Thang đo cam kết thực tế (Commitment Ladder: vào danh sách chờ mở bán qua liên kết double opt-in, đăng ký trực tiếp slot thử nghiệm beta; loại bỏ việc xin contact bạn bè để tránh vi phạm PII và Nghị định 91/2020; chưa thu tiền cọc khi chưa hoàn tất OQ-6 và SePay).
  6. Xây dựng mẫu bảng tổng hợp dữ liệu ẩn danh (`R01..Rn | khoảng ngày-đến-thi | gói chọn | ý định 1–5 | VW 4 số | mức cam kết | kênh`), chỉ gồm tiêu đề cột trống, không đưa dữ liệu mẫu giả định, tuyệt đối không lưu tên, SĐT hay PII.
  7. Lập điều khoản bảo mật dữ liệu và vòng đời xử lý âm thanh (Audio Data Lifecycle): ghi âm chỉ lưu cục bộ có mã hóa, xóa vĩnh viễn trong vòng 14 ngày sau khi trích xuất dữ liệu bảng, không tải lên cloud drive công cộng, cung cấp thông tin liên hệ rút lại đồng ý/xóa dữ liệu.
  8. Tuyệt đối KHÔNG tạo dòng bắt đầu bằng `Kết luận:` trong Phase 1.
- Success criteria: File được tạo đầy đủ, đúng 3 nhãn định danh chuẩn, không có dòng `Kết luận:`.
- Verify: `grep -cE '^(Phương pháp|Cỡ mẫu|Ngưỡng giữ giá):' docs/research/wtp-validation.md` in `3` và `grep -c '^Kết luận:' docs/research/wtp-validation.md` in `0`.

### Task 1.2 — Cập nhật lộ trình theo dõi hồ sơ kiểm chứng WTP
- Goal: Ghi nhận trạng thái hoàn thành việc lập khung kiểm chứng trong danh mục roadmap công việc, giữ trạng thái phụ thuộc chờ PO duyệt ngưỡng và phỏng vấn học viên thật.
- Target files and symbols: `docs/roadmap-work-items.md` (dòng mục 05).
- Steps:
  1. Cập nhật dòng mục 05 trong `docs/roadmap-work-items.md`: chuyển trạng thái `🟢` sang `⏸️`, ghi chú "Hồ sơ kiểm chứng sẵn sàng tại `docs/research/wtp-validation.md`. Đang chờ PO chốt ngưỡng (Gate A) và phỏng vấn học viên thật để thực hiện Phase 2."
  2. Giữ nguyên biểu tượng trạng thái `⏸️` (hold/chờ phụ thuộc ngoài), không đánh dấu hoàn thành toàn bộ mục 05 khi chưa có kết quả phỏng vấn thật.
- Success criteria: Bảng work items phản ánh chính xác trạng thái sẵn sàng của hồ sơ và phụ thuộc ngoài.
- Verify: `grep 'docs/research/wtp-validation.md' docs/roadmap-work-items.md` in ra dòng chứa mục 05.

## Verification
1. `grep -cE '^(Phương pháp|Cỡ mẫu|Ngưỡng giữ giá):' docs/research/wtp-validation.md` in `3`.
2. `grep -c '^Kết luận:' docs/research/wtp-validation.md` in `0`.
3. `grep -F '| `billing` |' docs/roadmap-chamro.md | grep -c 'Giả định'` in `1`.
4. `grep 'docs/research/wtp-validation.md' docs/roadmap-work-items.md` in ra dòng chứa mục 05.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same failure evidence to the user. Never continue by self-reasoning.
