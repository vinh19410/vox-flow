# Knowledge Graph Usage Rules (`kg-usage.md`)

Quy tắc bắt buộc cho mọi skill tiêu thụ Knowledge Graph (`.agents/skills/kg/engine/`):

## Quy tắc vàng: Graph CHỌN, Prose KẾT LUẬN

- Knowledge Graph (`kg-query.mjs`) chỉ dùng để **khoanh vùng file cần đọc (shortlist)**, **đếm cấu trúc**, và **kiểm tra liên kết/độ phủ cơ học** (`explore`, `impact`, `coverage`, `facts`, `trace`, `neighbors`).
- **Mọi kết luận về nội dung nghiệp vụ, điều kiện, wording lỗi, side-effect, hay mâu thuẫn BẮT BUỘC phải dựa trên việc đọc trực tiếp (`read_file`) nội dung prose của file nguồn.** Tuyệt đối không suy diễn nội dung từ tóm tắt/facts của graph.

## 3 nghĩa vụ bắt buộc khi gọi `kg-query.mjs`

1. **Chạy lại với `--all` khi bị cắt (`cap`):** Nếu kết quả trả về có dòng `⚠ còn N mục — chạy với --all`, bắt buộc chạy lại lệnh kèm `--all` để lấy trọn vẹn danh sách trước khi đọc file.
2. **Đọc mục `### Phải Read tay (ngoài graph)`:** Luôn kiểm tra dòng `Độ phủ:` và đọc toàn bộ các file liệt kê trong mục `Phải Read tay` (những file graph không parse được hoặc nằm ngoài phạm vi parser).
3. **Fallback khi `KG-ERROR` (exit code 2) hoặc chưa có graph:** Nếu lệnh lỗi hoặc dự án chưa có `docs/_shared/kg/graph.json` và không build được, quay về quét/đọc trực tiếp thư mục `docs/` bằng công cụ tìm kiếm/đọc file, không dừng luồng và không đoán từ kết quả dở dang.

## Đường dẫn lệnh chuẩn trên Antigravity

```bash
node .agents/skills/kg/engine/kg-build.mjs [--verify] [--quiet]
node .agents/skills/kg/engine/kg-query.mjs <subcommand> [args] [--all]
```
