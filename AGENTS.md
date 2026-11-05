# Vox Flow

Sản phẩm luyện thi IELTS Speaking với giám khảo và chấm điểm bằng AI. Tên chính thức của sản phẩm là "Vox Flow" (trên cả giao diện người dùng và package `@vox-flow/*`) theo quyết định D-01 đã chốt trong PRD.

## Lệnh

Dùng `pnpm`, không dùng `npm` hay `yarn`. Xem cài đặt và các script khác trong `README.md`.

- Kiểm tra kiểu: `pnpm check-types`. Ở `apps/web`, lệnh này chạy cả `vite build`.
- Chạy một file test: `pnpm --filter web test <đường-dẫn-từ-apps/web>`.
  - Không dùng `test -- <tên>`: vitest bỏ qua bộ lọc này, chạy toàn bộ và vẫn thoát 0 kể cả khi test đích không tồn tại.
  - Không lọc bằng một phần tên, vì có thể khớp nhầm file khác.
- Sinh migration: `pnpm --filter @vox-flow/db db:generate`. Lệnh gốc `pnpm db:generate` lỗi khi không có terminal tương tác.
- Triển khai: `pnpm --filter @vox-flow/infra run deploy`. Không dùng `pnpm deploy`, vì đó là lệnh dựng sẵn của pnpm.

## **Luồng ak-plan → ak-git cp**

- Khi skill `ak-plan` hoàn tất (plan đã được duyệt/chốt), **luôn gọi tiếp skill** `ak-git cp` để commit và push các file đã tạo ra trong session (plan, journal, các file liên quan).
- Không tự viết lệnh git thủ công thay cho `ak-git cp` trừ khi skill đó lỗi.

## Không được làm

- Không triển khai, không chạy `destroy` và không áp migration lên môi trường thật khi chưa được xác nhận. Sao lưu D1 trước khi áp migration.
- Không sửa tay các migration đã sinh trong `packages/db/src/migrations` hoặc `apps/web/src/routeTree.gen.ts`.
- Không đảo các quyết định đã chốt trong `docs/roadmap-chamro.md`, Mục 7. Nếu thấy cần đổi, nêu lý do và hỏi người sở hữu sản phẩm.

## GitHub issue

- Mọi GitHub issue tạo mới phải được thêm vào project https://github.com/users/vinh19410/projects/15 ngay khi tạo. Dùng `gh issue create --project "<tên project>"` hoặc `gh project item-add 15 --owner vinh19410 --url <url-issue>`. Lệnh sau cần quyền `project` (`gh auth refresh -s project`) nếu chưa có.

## Tài liệu sản phẩm

- Tài liệu sản phẩm chính thức: PRD tại `docs/_product/prd.md` và roadmap tại `docs/_product/roadmap.md` (dựng lại từ trích dẫn và Feature Map, các nội dung chưa có nguồn ghi rõ `[chưa có]`). 12 quyết định thống nhất ghi tại `docs/product-decisions.md`.
- Thứ tự công việc và phụ thuộc: `docs/roadmap-work-items.md`. Plan của từng mục nằm trong `plans/`.
- Khi thực thi plan, nếu một Verify không đạt thì dừng theo Failure Protocol trong phase, không tự sửa cho qua.

## GitHub Issues

Luôn gắn label `ai-handle` khi tạo GitHub issue, ví dụ `gh issue create --label ai-handle ...`.

## Khi cần hỏi

Nếu bạn cần hỏi tôi điều gì đó, vui lòng sử dụng công cụ AskUserQuestion cùng với các thông tin thực tế ngắn gọn và sự đánh đổi để hỗ trợ quá trình ra quyết định.

## Trước khi báo xong

1. Chạy file test của phần vừa sửa theo cách ở trên.
2. Chạy `pnpm check-types`.
3. Nêu rõ phần nào chưa kiểm chứng được. Không xóa test hay nới khẳng định để cho qua.
