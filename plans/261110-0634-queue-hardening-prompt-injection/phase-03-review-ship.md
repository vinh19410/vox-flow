# Phase 3 — Review độc lập, PR vào `dev`

Sở hữu file: — (không sửa code product; chỉ review, ship, report).

## Failure Protocol
Nếu bất kỳ bước Verify nào không đạt điều kiện đã nêu: DỪNG phase này. Không tự vá, không thử lại mù, không lý lẽ vòng quanh. Spawn subagent `kongming` với: phase + task id, các bước đã chạy, lệnh đúng và output đầy đủ, điều kiện pass mà nó không đạt. Áp dụng hướng dẫn rồi chạy lại Verify. Nếu không spawn được `kongming`: DỪNG và báo người dùng đúng bằng chứng thất bại. Không tự tiếp tục bằng suy đoán.

### Task 3.1 — code review độc lập
- Steps: chạy `ak-code-review --pending --advice`; sửa hết Critical/Important rồi chạy lại Verify của task liên quan trong phase 1–2.
- Success criteria: 0 Critical / 0 Important còn tồn tại.
- Verify: log review ghi rõ verdict + số finding đã xử lý.

### Task 3.2 — ship beta
- Steps:
  1. `ak-ship beta` — PR target `dev`. (Không có migration trong nhánh này → không cần backup D1.)
  2. `ak-review-pr <pr> --fix --reply --advice`; CI terminal xanh.
  3. Label `ready to ship beta` lên issue + PR; bỏ `ready to cook` / `in progress`.
  4. Merge + watch CI đến xanh (ak-vibe `--ship --beta`).
- Success criteria: PR merged, CI target-branch xanh hoặc external blocker được ghi nhận.
- Verify: link PR + run CI xanh trong completion report.

### Task 3.3 — POT trên issue #93
- Steps: comment POT theo AGENTS.md (lệnh + output test, PR/commit SHA, gates đã chạy). Nội dung bắt buộc:
  - C2 đã cân nhắc và bỏ kèm lý do; phương án thay thế (chặn chấm trước khi model chạy) để chủ sản phẩm quyết.
  - Follow-up: web chưa gọi `getFollowUp`; key `-f` chấm bằng placeholder chủ đích; khi nối flow follow-up (feature mới) cần thiết kế persist riêng.
  - Câu hỏi mở: DLQ; lease vs `SCORING_RUNS > 3`; guard "band ≥ 7 cần evidence plus"; `getFollowUp` không rate-limit.
- Success criteria: comment đăng được, đủ bằng chứng cho từng acceptance criteria.
- Verify: `gh issue view 93 --comments` thấy comment POT với link SHA đúng.
