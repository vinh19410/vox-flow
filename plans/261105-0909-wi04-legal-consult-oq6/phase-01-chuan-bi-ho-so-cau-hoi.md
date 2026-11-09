---
phase: 1
title: "Chuẩn bị hồ sơ câu hỏi tư vấn luật sư"
status: completed
priority: P1
effort: "1 buổi"
dependencies: []
---

# Phase 1: Chuẩn bị hồ sơ câu hỏi tư vấn luật sư

## Goal
Xây dựng đầy đủ hồ sơ câu hỏi tư vấn pháp lý và bản mô tả luồng dữ liệu kỹ thuật tại `docs/legal/oq-6-tu-van-luat-su.md`, sẵn sàng bàn giao cho người sở hữu sản phẩm làm việc với luật sư trước khi mở hệ thống cho học viên thật.

## Files to Create / Modify
- Create: `docs/legal/oq-6-tu-van-luat-su.md`
- Modify: `docs/roadmap-work-items.md`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: Xác minh tiền đề tài liệu OQ-6 trong roadmap đang mở và đầy đủ 7 câu hỏi gốc.
- Target files and symbols: `docs/roadmap-chamro.md` (mục OQ-6).
- Steps:
  1. Kiểm tra dòng OQ-6 trong `docs/roadmap-chamro.md` có trạng thái chưa hoàn thành (`- [ ] OQ-6`).
  2. Xác nhận 7 câu hỏi gốc đã có sẵn để làm nguồn chuẩn hóa vào hồ sơ.
- Success criteria: Tiền đề được xác nhận mechanically qua lệnh grep.
- Verify: `grep -c '^- \[ \] OQ-6' docs/roadmap-chamro.md` in `1`.

### Task 1.1 — Soạn thảo hồ sơ câu hỏi và luồng dữ liệu kỹ thuật
- Goal: Tạo tài liệu hồ sơ tư vấn pháp lý hoàn chỉnh không chứa placeholder kết luận hay câu trả lời giả lập.
- Target files and symbols: `docs/legal/oq-6-tu-van-luat-su.md`
- Steps:
  1. Tạo thư mục `docs/legal/` nếu chưa có.
  2. Tạo 7 mục `## Câu 1` đến `## Câu 7`, chép nguyên văn 7 câu hỏi gốc của OQ-6 từ `docs/roadmap-chamro.md`.
  3. Thêm mục `## Câu hỏi bổ sung` với các tiểu mục:
     - `### Bổ sung A: Đối chiếu điều khoản chuyển dữ liệu ra nước ngoài và trẻ em giữa Luật 91/2025/QH15, Nghị định 356/2025 và Nghị định 13/2023/NĐ-CP`.
     - `### Bổ sung B: Thử nghiệm 30 bài mẫu có đồng ý bằng văn bản (OQ-5) có kích hoạt thời hạn 60 ngày nộp hồ sơ không?`
     - `### Bổ sung C: Thẩm quyền và cơ chế xác thực sự đồng ý của cha mẹ/người giám hộ đối với học viên dưới 16 tuổi (Điều 20 NĐ 13 / Luật Trẻ em)`.
     - `### Bổ sung D: Phân định pháp lý giữa "Hiệu chuẩn chấm điểm" (Calibration) và "Huấn luyện AI" (AI Training) đối với dữ liệu giọng nói`.
     - `### Bổ sung E: Điều khoản lưu giữ dữ liệu (Zero Data Retention - ZDR), khu vực máy chủ xử lý và thỏa thuận xử lý dữ liệu (DPA) với bên thứ ba (Azure, SpeechSuper, Anthropic)`.
  4. Thêm mục `## Luồng dữ liệu và các bên xử lý` mô tả chi tiết:
     - Trình duyệt học viên thu âm giọng nói (MediaRecorder, Opus/WAV).
     - Gửi qua TLS 1.3 về Cloudflare backend / Cloudflare Workers.
     - Lưu trữ audio: Cloudflare R2 bucket (dự kiến, cần luật sư tư vấn khu vực lưu).
     - Gửi audio/transcript sang dịch vụ bên thứ ba: Azure Speech / SpeechSuper / Anthropic (theo OQ-5, chưa chốt).
     - Rủi ro thông tin cá nhân nói (verbal PII) trong bài thi IELTS Speaking Part 1.
  5. Thêm mục `## Căn cứ pháp lý cần luật sư xác nhận` ghi nhận cách hiểu hiện tại của dự án để luật sư hiệu đính, tuyệt đối không đưa ra khẳng định kết luận pháp lý của agent.
  6. Thêm mục `## Ma trận phân công đầu việc sau tư vấn` gắn từng câu hỏi với work item thụ hưởng:
     - Câu 1 -> WI08 (`sepay-setup` - Hộ kinh doanh vs Cá nhân).
     - Câu 2, 4, 5 -> WI17 (`first-real-students-gate` - Cổng học viên thật) và WI11.
     - Câu 3 -> Hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài (A05).
     - Câu 6 -> WI19 (`forecast-curation` - Rủi ro bản quyền nguồn web).
     - Câu 7, Bổ sung D -> WI11 (`privacy-controls` - Quyền xóa dữ liệu và công tắc hiệu chuẩn).
  7. Tuyệt đối KHÔNG tạo dòng `Trả lời:` để bảo đảm không giả mạo kết quả tư vấn trước khi buổi họp diễn ra.
- Success criteria: File được tạo đầy đủ, đúng 7 câu hỏi chính, không có dòng `Trả lời:`.
- Verify: `grep -c '^## Câu [1-7]$' docs/legal/oq-6-tu-van-luat-su.md` in `7` và `grep -c '^Trả lời:' docs/legal/oq-6-tu-van-luat-su.md` in `0`.

### Task 1.2 — Cập nhật lộ trình theo dõi hồ sơ câu hỏi
- Goal: Ghi nhận trạng thái hoàn thành việc lập hồ sơ câu hỏi trong danh mục roadmap công việc, giữ trạng thái phụ thuộc chờ tư vấn.
- Target files and symbols: `docs/roadmap-work-items.md` (dòng mục 04).
- Steps:
  1. Cập nhật dòng mục 04 trong `docs/roadmap-work-items.md`: ghi chú "Hồ sơ câu hỏi sẵn sàng tại `docs/legal/oq-6-tu-van-luat-su.md`. Đang chờ buổi tư vấn luật sư để thực hiện Phase 2."
  2. Giữ nguyên biểu tượng trạng thái `⏸️` (hold/chờ phụ thuộc ngoài), không đánh dấu hoàn thành toàn bộ mục 04 khi chưa có kết quả tư vấn.
- Success criteria: Bảng work items phản ánh chính xác trạng thái sẵn sàng của hồ sơ.
- Verify: `grep 'docs/legal/oq-6-tu-van-luat-su.md' docs/roadmap-work-items.md` in ra dòng chứa mục 04.

## Verification
1. `grep -c '^## Câu [1-7]$' docs/legal/oq-6-tu-van-luat-su.md` in `7`.
2. `grep -c '^Trả lời:' docs/legal/oq-6-tu-van-luat-su.md` in `0`.
3. `grep -c '^- \[ \] OQ-6' docs/roadmap-chamro.md` in `1`.
4. `grep 'docs/legal/oq-6-tu-van-luat-su.md' docs/roadmap-work-items.md` in ra dòng chứa mục 04.

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
