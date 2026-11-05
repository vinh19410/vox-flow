---
title: Tạo plan và issue cho mục 02-26 của roadmap
date: 2026-11-05
summary: "Tạo 25 plan --advice và issue #6-#30; rà soát trước khi đăng đã phát hiện và sửa 15 nhóm lỗi."
---

# Tạo plan và issue cho mục 02-26 của roadmap

## What happened
Tạo 25 plan trong `plans/261105-09*-wiNN-*/` và issue #6 đến #30 cho mục 02-26 của `docs/roadmap-work-items.md`, rồi điền số issue vào cột GitHub issue của bảng.

Kongming rà soát trước khi đăng và báo 15 nhóm lỗi. Nghiêm trọng nhất:
- `pnpm --filter <pkg> test -- <tên>` thành `vitest run -- <tên>`, chạy toàn bộ test và thoát 0 kể cả khi test đích chưa tồn tại. 50 lệnh Verify không có tác dụng; đã đổi sang đường dẫn file chính xác.
- `pnpm db:generate` lỗi khi không có TTY, và drizzle-kit 1.0.0-rc.5 tạo `<timestamp>/migration.sql`, nên Verify dạng `migrations/*.sql` không thể qua.
- Plan thiếu đường mở paywall sau khi thanh toán, học viên trả phí vẫn bị chặn 3 điểm/ngày, và luồng xóa dữ liệu bỏ sót các bảng liên kết qua `attemptId`.

Trước đó mình cũng tự thêm nhầm phụ thuộc cứng 19 -> 16, trái với bảng; đã bỏ.

## Decision
- Giữ nguyên cột "Phải chờ" của bảng. Phụ thuộc thực tế mà bảng chưa ghi (19 cần 06, 07, 11; 20 cần 14) được kiểm tra trong plan và nêu thành câu hỏi mở.
- Thêm các cờ `LAUNCH_OPEN` và `SCORE_DISPUTE_ENABLED`, để cổng mở cho học viên không chỉ nằm trên giấy.
- Chưa gắn nhãn `ready to review`: nhãn chưa có trong repo, và chưa chạy phỏng vấn xác thực từng plan.

## Next steps
- `docs/_product` không có trong repo, lịch sử git hay trên máy này, nên mục 02 (#6) cần người sở hữu quyết định tìm lại hay dựng lại PRD. #14 và #15 đang chờ mục này.
- Commit plan và thay đổi bảng; link plan trong issue chỉ mở được sau khi commit.
- Chốt số lượt của gói "Theo lượt" và mốc xóa 24 giờ khi tắt lưu.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
