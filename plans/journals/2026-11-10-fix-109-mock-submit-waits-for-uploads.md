---
title: "Fix #109 mock submit waits for uploads"
date: 2026-11-10
---

# Fix #109 mock submit waits for uploads

## Vấn đề
Nhánh mock trong `exam-screen.tsx` bắn `attempt.submit` fire-and-forget không qua `flushAnswerUploads`: upload đang bay/bù sau finalize bị server 400 (`status !== in_progress`) và mock không có đường flush lại (job null → RecordedState) → câu trả lời mất vĩnh viễn. Server còn đọc snapshot `attempt_answer` khi submit nên flush-trước-submit là thứ tự đúng duy nhất.

## Cách sửa
`ExamScreen.submit()` nhánh mock: `await flushAnswerUploads` → `await attempt.submit` → nav. Chặn nộp khi `failedQuestionKeys > 0`; "Vẫn nộp" chỉ cho `storageUnreadable` đơn thuần (mirror `submitWithoutMissing`). Lỗi submit phân loại: already-submitted = thành công (lost-response), BAD_REQUEST khác = vĩnh viễn, còn lại = mạng + retry. Hai nguyên nhân hủy tách biệt (đóng modal giữa FLUSHING = discard run; giữa SUBMITTING = run sống để nav khi thành công; thoát exam = `exitedRef` chặn mọi nav nền). `PreSubmitModal` nhận busy/error props, khóa "Nói lại" khi busy.

## Bài học
- Red-team (11 findings) bắt được 4 lỗ High mà thiết kế checkpoint-1 không thấy: hard-block storageUnreadable là wedge khi IDB hỏng; cancel-mid-submit nuốt thành công server → wedge; copy predicate keep-in-sync; "Nói lại" còn sống giữa busy tái lập đúng race gốc. Kongming checkpoint #2 kẹt external blocker (hết hạn mức model) → counsel thay bằng planner fresh-context, giữ nguyên vai trò adjudicate.
- Plan TDD red-phase cần "quy tắc ngoại lệ" thay vì công thức số: 2/7 test mới xanh-at-red vì khớp hành vi hiện tại.
- Merge với dev mới nhất (#106 unlock submit 15s, #97 swap Promise.withResolvers cho iOS) ăn mượt; test mới phải dùng helper `promiseWithResolvers` của repo thay vì builtin.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
