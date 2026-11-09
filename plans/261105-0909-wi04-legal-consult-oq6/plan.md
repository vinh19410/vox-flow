---
title: "Tư vấn luật sư về chuyển audio ra nước ngoài (OQ-6)"
description: "Có câu trả lời bằng văn bản cho 7 câu hỏi pháp lý, để biết việc gì phải xong trước khi mở cho học viên thật và trước khi thu tiền."
status: pending
priority: P1
effort: 1 buổi
issue: 8
branch: vinh19410/vox-flow-ai-8
tags: [docs, critical, advice]
blockedBy: []
blocks: [project:261105-0910-wi17-first-real-students-gate]
created: 2026-11-05
---

# Tư vấn luật sư về chuyển audio ra nước ngoài (OQ-6)

Tracking: #8

Mục 04 trong `docs/roadmap-work-items.md` · Giai đoạn: Nền

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Có câu trả lời bằng văn bản cho 7 câu hỏi pháp lý, để biết việc gì phải xong trước khi mở cho học viên thật và trước khi thu tiền.

## Phụ thuộc
- Phải chờ: Không có (đối với Phase 1: Chuẩn bị hồ sơ câu hỏi)
- Yếu tố ngoài: Buổi tư vấn với luật sư (chặn Phase 2: Ghi câu trả lời và đóng OQ-6)
- Mở khóa: #21 (Mốc học viên thật - phụ thuộc cứng). Cung cấp căn cứ tham chiếu mềm cho #12 (SePay), #15 (Quyền riêng tư - luồng xóa dữ liệu), #23 (Forecast curation - bản quyền đề).
## Constraints
- Không đưa dữ liệu cá nhân của học viên vào tài liệu gửi luật sư.
- Agent không đưa ra kết luận pháp lý.

## Non-goals
- Tự nộp hồ sơ; việc này được giao theo kết quả tư vấn.
- Soạn điều khoản sử dụng.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Chuẩn bị hồ sơ câu hỏi tư vấn luật sư](./phase-01-chuan-bi-ho-so-cau-hoi.md) | Completed |
| 2 | [Phase 2: Ghi kết quả tư vấn luật sư và đóng OQ-6](./phase-02-ghi-ket-qua-va-dong-oq-6.md) | Blocked (external: Buổi tư vấn với luật sư) |
## Acceptance Criteria
- [x] Có hồ sơ câu hỏi tư vấn pháp lý hoàn chỉnh tại `docs/legal/oq-6-tu-van-luat-su.md` với 7 câu hỏi chính và 5 câu hỏi bổ sung (Phase 1).
- [ ] Có biên bản trả lời đủ 7 câu hỏi trong OQ-6 từ luật sư (Phase 2).
- [ ] Có danh sách việc phải làm kèm hạn, gồm hồ sơ chuyển dữ liệu ra nước ngoài nếu cần (Phase 2).
- [ ] OQ-6 trong `docs/roadmap-chamro.md` được đóng (Phase 2).

## Red Team Review

### Session — 2026-11-05
**Reviewers:** Security Adversary (`code-reviewer`), Assumption Destroyer (`code-reviewer`), Supervisor (`kongming`).
**Findings:** 11 total findings analyzed across security, statutory compliance, sequencing, and unstated assumptions.
**Key decisions:**
1. **Tách 2 Phase (Chấp nhận - Critical):** Không gộp việc soạn thảo hồ sơ (agent tự động làm được) với việc ghi câu trả lời của luật sư (phụ thuộc người thật ngoài đời). Phase 1 chuẩn bị hồ sơ và PR ghi `Refs #8`, Phase 2 chờ biên bản tư vấn thực tế mới được đóng #8.
2. **Không kết luận điều khoản luật (Chấp nhận một phần):** Không tự phán quyết số điều của Luật 91/2025/QH15 hay Nghị định 13/2023. Đưa việc xác minh số điều thành câu hỏi bổ sung cho luật sư.
3. **Thêm câu hỏi bổ sung:** Đưa các rủi ro về thời hạn 60 ngày khi thử nghiệm 30 bài mẫu OQ-5, cơ chế xác thực sự đồng ý của cha mẹ đối với học viên dưới 16 tuổi, phân biệt "hiệu chuẩn" vs "huấn luyện AI", và chính sách lưu trữ dữ liệu của bên thứ ba thành mục `## Câu hỏi bổ sung`.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Linear Execution Deadlock do gộp buổi tư vấn vào phase tự động | Critical | Accept | Tách thành Phase 1 (hồ sơ) và Phase 2 (kết quả) |
| 2 | Đối chiếu điều khoản Luật 91/2025 và Nghị định 13/2023 | High | Accept (as question) | Phase 1 (Câu hỏi bổ sung A) |
| 3 | Nguy cơ chạy OQ-5 kích hoạt thời hạn 60 ngày nộp hồ sơ chuyển dữ liệu | High | Accept (as question) | Phase 1 (Câu hỏi bổ sung B) |
| 4 | Cơ chế xác thực đồng ý cha mẹ cho học viên dưới 16 tuổi | High | Accept (as question) | Phase 1 (Câu hỏi bổ sung C) |
| 5 | Phân định pháp lý "Hiệu chuẩn" vs "Huấn luyện AI" | Medium | Accept (as question) | Phase 1 (Câu hỏi bổ sung D) |
| 6 | Kiểm tra chính sách ZDR và khu vực lưu trữ bên thứ ba | High | Accept (as question) | Phase 1 (Câu hỏi bổ sung E và Luồng dữ liệu) |

## Validation Log

### Verification Results
- Kiểm tra 7 câu hỏi gốc: Khớp nguyên văn nội dung OQ-6 từ `docs/roadmap-chamro.md:158-164`.
- Kiểm tra không giả mạo câu trả lời: `grep -c '^Trả lời:' docs/legal/oq-6-tu-van-luat-su.md` đạt kết quả 0.
- Kiểm tra OQ-6 trong roadmap: Trạng thái `- [ ] OQ-6` được giữ mở, không đóng sớm trước buổi tư vấn.
- Kiểm tra danh mục roadmap: Dòng mục 04 tại `docs/roadmap-work-items.md:19` đã dẫn chiếu tới `docs/legal/oq-6-tu-van-luat-su.md` và giữ trạng thái `⏸️`.
- Kiểm tra kiểu mã nguồn: Lệnh `pnpm check-types` thực thi thành công 8/8 gói trong workspace.
### Whole-Plan Consistency Sweep
- Liên kết giữa `plan.md` và 2 file phase (`phase-01-chuan-bi-ho-so-cau-hoi.md`, `phase-02-ghi-ket-qua-va-dong-oq-6.md`) hoàn toàn khớp.
- Thống nhất quy tắc PR: Phase 1 dùng `Refs #8`, Phase 2 dùng `Closes #8`.
- Ma trận phụ thuộc được đồng bộ với `docs/roadmap-work-items.md`.

## Câu hỏi mở
- Đã có luật sư và lịch tư vấn chưa? (Chặn thực thi Phase 2)
<!-- slug: wi04-legal-consult-oq6 -->
