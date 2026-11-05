---
title: "Rà soát và củng cố plan wi13 (scoring-results) dưới sự giám sát của Kongming"
date: 2026-11-05
summary: "Red team review 3 lăng kính cho plan wi13; Kongming phân xử chấp thuận phòng chống IDOR trong getResult, chống denial-of-wallet trong submit, idempotency queue và xác nhận phụ thuộc thực tế OQ-5 (#7)."
---

# Rà soát và củng cố plan wi13 (scoring-results)

## What happened
Chạy quy trình rà soát phản biện (Red Team Review) với 3 subagent theo 3 lăng kính cho plan `plans/261105-0910-wi13-scoring-results/`:
1. **Security Adversary:** Phát hiện lỗ hổng BOLA/IDOR nghiêm trọng trong `results.getResult` (thiếu kiểm tra quyền sở hữu bài thi trước khi kiểm tra gói trả phí `canViewDetail`), và nguy cơ cạn kiệt ngân sách AI (Denial-of-Wallet) nếu cho phép `attempt.submit` khi chưa có câu trả lời nào.
2. **Failure Mode Analyst:** Phát hiện lỗi dispatch không nguyên tử trong `attempt.submit` có thể làm bài thi kẹt vĩnh viễn ở trạng thái `queued` và không thể gọi lại vì bị chặn bởi `currentAttempt.status !== "in_progress"`.
3. **Assumption Destroyer:** Nêu vấn đề về Task 1.0 (kiểm tra `CLOSED` trên GitHub issue gây deadlock giả với #15, #16 dù PR đã merge) và đề xuất thay Task 2.2 bằng fixture.

Đã chuyển toàn bộ 5 phát hiện sang `Kongming` để lấy ý kiến tư vấn kiến trúc (`--advice`).

## Decision
- **Phân xử của Kongming:**
  - **Chấp thuận SecurityAdversary F1 & F2:** Task 2.1 bắt buộc kiểm tra quyền sở hữu `targetAttempt.userId === ctx.session.user.id` trước `canViewDetail`, trả `FORBIDDEN` không kèm trường điểm. Task 1.2 bắt buộc kiểm tra `attemptAnswer` count > 0 trước khi cập nhật hay gửi queue.
  - **Chấp thuận FailureModeAnalyst F1 & F3:** Áp dụng cơ chế trạng thái `pending_dispatch → queued → scoring → completed | failed`, có unique index trên `attemptId`, cho phép retry gửi queue an toàn nếu lần gửi đầu tiên thất bại. Khai báo kiểu queue và hạ tầng trong `packages/infra/alchemy.run.ts` và env context.
  - **Bác bỏ AssumptionDestroyer F1 đối với #7 và bác bỏ F2:** Khẳng định Issue #7 là phụ thuộc thực tế (chưa có 30 bài mẫu thật, OQ-5 chưa đạt, PR #33/#34 chỉ mới là khung eval scaffolding). Không được hạ ngưỡng hay thay bằng fixture theo quy định `AGENTS.md:35`. Đối với #15 và #16, điều chỉnh Task 1.0 sang kiểm tra trực tiếp PR #39 và #40 đã merge vào `dev` cùng các schema liên quan.
- **Kết luận:** **GO** cho việc hoàn thiện và cập nhật plan; **NO-GO** cho việc tiến hành code implementation tại thời điểm này cho đến khi Issue #7 và tiêu chí OQ-5 được người sở hữu sản phẩm hoàn tất và đánh dấu `[x] OQ-5`.

## Next steps
- Commit và push các file plan và journal theo luồng `ak-git cp`.
- Cập nhật thông tin và nhãn trên Issue #17, ghi rõ trạng thái đang chờ phụ thuộc OQ-5 (#7).
- Đăng bình luận trên Issue #7 về việc giữ lại các file âm thanh 30 bài mẫu để phục vụ Task 2.2 của #17 sau khi OQ-5 đạt.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
