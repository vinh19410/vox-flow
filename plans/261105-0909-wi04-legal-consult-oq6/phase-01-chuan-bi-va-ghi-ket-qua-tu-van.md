---
phase: 1
title: "Chuẩn bị và ghi kết quả tư vấn"
status: pending
priority: P1
effort: ""
dependencies: []
---

# Phase 1: Chuẩn bị và ghi kết quả tư vấn

## Goal
Câu trả lời của luật sư được lưu lại và chuyển thành việc cần làm.

## Files to Create / Modify
- Create: `docs/legal/oq-6-tu-van-luat-su.md`
- Modify: `docs/roadmap-chamro.md`

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Xác nhận với người sở hữu sản phẩm đã có: Buổi tư vấn với luật sư.
- Success criteria: các điều kiện được xác nhận.
- Verify: `no verification needed` — người sở hữu sản phẩm xác nhận bằng lời điều kiện ở mục Steps.

### Task 1.1 — Chuẩn bị hồ sơ câu hỏi.
- Goal: Chuẩn bị hồ sơ câu hỏi.
- Target files and symbols: `docs/legal/oq-6-tu-van-luat-su.md`
- Steps:
  1. Tạo 6 mục `## Câu 1` đến `## Câu 6`, chép nguyên văn 6 câu hỏi của OQ-6.
  2. Thêm mô tả luồng dữ liệu: audio ghi trên trình duyệt, lưu Cloudflare, gửi tới các dịch vụ đang xét theo OQ-5 (Azure Speech, dịch vụ nhận dạng riêng + SpeechSuper, Anthropic). Nếu #7 đã chốt thì ghi đúng cấu hình đã chọn.
  3. Ghi căn cứ: Luật 91/2025/QH15 và Nghị định 356/2025, hiệu lực từ 01/01/2026.
- Success criteria: File có đủ 6 mục câu hỏi.
- Verify: `grep -c '^## Câu ' docs/legal/oq-6-tu-van-luat-su.md` in `6`.

### Task 1.2 — Ghi câu trả lời và đóng OQ-6.
- Goal: Ghi câu trả lời và đóng OQ-6.
- Target files and symbols: `docs/legal/oq-6-tu-van-luat-su.md`, `docs/roadmap-chamro.md`
- Steps:
  1. Sau buổi tư vấn, thêm dòng `Trả lời: ...` dưới từng câu theo lời luật sư. Không tự diễn giải luật thay luật sư.
  2. Thêm mục `## Việc phải làm` với người làm và hạn.
  3. Đánh dấu OQ-6 đã xong trong roadmap.
- Success criteria: Đủ 6 câu trả lời và OQ-6 đã đóng.
- Verify: `grep -c '^Trả lời:' docs/legal/oq-6-tu-van-luat-su.md` in `6` và `grep -c '^- \[x\] OQ-6' docs/roadmap-chamro.md` in `1`.

## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
