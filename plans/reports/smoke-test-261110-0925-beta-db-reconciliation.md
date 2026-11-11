# Smoke test beta — đối chiếu phía server

Bổ trợ cho sheet kịch bản smoke test (public, không chứa chi tiết hạ tầng):
https://docs.google.com/spreadsheets/d/1bkU4d9O0kJ2B3dq6bStShfer6Oe3iU3vbb4T22_2uxg/edit

Beta dùng D1 tên `vox-flow-database-prod-*`, tức dữ liệu thật. Chỉ chạy query đọc, chỉ dùng tài khoản test.

## Sau mỗi lượt test

```bash
DB=$(pnpm dlx wrangler d1 list --json | jq -r '.[]|select(.name|startswith("vox-flow-database-prod-"))|.name')
pnpm dlx wrangler d1 execute "$DB" --remote --command "SELECT * FROM attempt ORDER BY rowid DESC LIMIT 2"
pnpm dlx wrangler d1 execute "$DB" --remote --command "SELECT * FROM attempt_answer WHERE attempt_id='<id>'"
pnpm dlx wrangler d1 execute "$DB" --remote --command "SELECT * FROM score_run WHERE attempt_id='<id>'"
```

Tên bảng lấy từ `packages/db/src/migrations`; tên cột `attempt_id` chưa kiểm chứng — chạy `SELECT *` trước nếu lỗi.

Trong lúc test, chạy `pnpm dlx wrangler tail` để bắt lỗi 400/500 ở route upload.

## Đạt khi

- Số dòng `attempt_answer` khớp số câu tester đã trả lời (theo ID dòng trong sheet).
- Mỗi attempt có `score_run` hoàn tất và `attempt_score` cho từng câu.
- Không có 400 trên upload audio trong log quanh giờ tester ghi ở cột Ghi chú.
