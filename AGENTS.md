# Vox Flow

Sản phẩm luyện thi IELTS Speaking với giám khảo và chấm điểm bằng AI. Tên chính thức của sản phẩm là "Vox Flow" (trên cả giao diện người dùng và package `@vox-flow/*`) theo quyết định D-01 đã chốt trong PRD.

## Ngôn ngữ giao tiếp

- **Response, summary, completion report, giải thích: TIẾNG VIỆT** (mặc định cho mọi session/agent trong repo này).
- Giữ nguyên tiếng Anh cho: commit message (conventional commits), PR title, code identifier, tên test, thuật ngữ kỹ thuật đã tiếng Anh hoá trong codebase.
- PR body / issue comment / changelog theo precedent tiếng Việt của repo (xem PR #281, #284).

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

### POT (Proof of Test) sau `ak-vibe` / `ak-atoz`

- Sau khi `ak-vibe` hoặc `ak-atoz` chạy xong cho một issue, **bắt buộc** đăng một comment lên issue đó chứa POT. Không có POT thì chưa được coi là xong. Comment POT nêu từng acceptance criteria / Done-means và bằng chứng tương ứng.
- POT không bắt buộc là hình ảnh, nhưng phải đủ để người đọc tự tin công việc đúng yêu cầu mà không phải chạy lại. Chọn dạng hợp với loại việc:
  - **Thay đổi UI:** screenshot (3 viewport, light/dark theo `REVIEW.md`) đính kèm dạng ảnh.
  - **Logic/API/data:** tên lệnh + đoạn output kết quả (test pass, `curl` response, query result) trong khối code.
  - **CI/deploy/infra:** link run, SHA, kết quả smoke check.
  - Luôn kèm: PR/commit SHA và các gate đã chạy (`pnpm check`, `pnpm check-types`, test liên quan, e2e nếu có).
- **Đính kèm ảnh bằng** `gh`**:** `gh` (đang dùng 2.45) không có cờ upload ảnh cho `gh issue comment` (chỉ có `--body`/`--body-file`), và `gh issue comment` không nhận file đính kèm. Quy trình thay thế:
  1. Lưu ảnh vào `plans/reports/` (ví dụ `plans/reports/<issue>-<slug>-<viewport>.png`, theo precedent `542-select-chevron-*.png`), commit + push lên branch.
  2. Nhúng ảnh bằng permalink theo SHA (không dùng tên branch để ảnh không vỡ khi branch bị xoá/squash): `![mô tả](https://github.com/vinh19410/teacher-os/blob/<commit-sha>/plans/reports/<file>.png?raw=true)`. Repo private nên ảnh chỉ hiển thị với người đã đăng nhập có quyền — đủ cho nội bộ.
  3. Đăng comment: `gh issue comment <N> --body-file <file.md>` (dùng `--body-file` để giữ nguyên markdown nhiều dòng).
  4. Mở lại comment (`gh issue view <N> --comments`) kiểm tra link đã đúng SHA và đường dẫn; ảnh phải tồn tại trong commit đó trước khi đăng.
- Không dán secret/token/dữ liệu cá nhân vào ảnh hay log của POT; che hoặc chụp lại bằng dữ liệu seed/e2e.

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
