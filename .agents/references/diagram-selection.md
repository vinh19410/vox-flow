# Diagram Selection & Mermaid Syntax Safety (`diagram-selection.md`)

Quy tắc chọn sơ đồ và an toàn cú pháp Mermaid (tương thích GitHub, Obsidian, Antigravity Artifacts và `mermaid-verify.mjs`):

## 1. Loại sơ đồ được dùng theo mục đích

- **Tương tác hệ thống / đối tác (`flows.md`):** `sequenceDiagram` (actor ↔ hệ thống ↔ dịch vụ ngoài, kèm nhánh `alt`/`opt` cho mã lỗi `E-{feature}-NNN`).
- **Luồng bước & rẽ nhánh quyết định (`flows.md` / `userflow.md`):** `flowchart TD` hoặc `flowchart LR`.
- **Mô hình thực thể dữ liệu nghiệp vụ (`erd.md`):** `erDiagram`.
- **Vòng đời trạng thái của thực thể (`states.md`):** `stateDiagram-v2`.

## 2. Mermaid Syntax Safety (Bắt buộc)

Các trình render strict (GitHub, Obsidian, Antigravity) nghiêm ngặt hơn `mmdc` mặc định. Luôn tuân thủ:

1. **Bọc dấu ngoặc kép `"` cho mọi nhãn node/edge có ký tự đặc biệt:**
   - Bất kỳ nhãn `flowchart` nào chứa `( )`, `[ ]`, `{ }`, `/`, `?`, `&`, `+`, `:`, `;`, `<`, `>`, `≥`, `≤`, `=` đều phải bọc ngoặc kép: `A["Kiểm tra điều kiện (≥ 3 lần)"] -->|"Hợp lệ + đủ quyền"| B["Tiếp tục"]`.
   - Không lồng dấu `"` bên trong nhãn đã bọc `"..."` (dùng dấu nháy đơn `'` thay thế).
   - Không dùng thẻ HTML (`<br/>`, `<b>`) trong nhãn.
2. **`sequenceDiagram`:**
   - **CẤM dùng dấu chấm phẩy `;`** trong `Note over`, `alt`, `opt`, hoặc nội dung message (sẽ làm đứt câu lệnh và sinh node rác).
   - Luôn đóng đủ `end` cho mọi khối `alt` / `opt` / `loop` / `par`.
3. **`stateDiagram-v2`:**
   - Giữ nhãn chuyển trạng thái (`transition label` sau dấu `:`) ngắn gọn, không chứa dấu `;` hoặc ký tự điều khiển phức tạp; diễn giải chi tiết đưa ra phần prose bên ngoài sơ đồ.
4. **`erDiagram`:**
   - Tên thực thể không chứa khoảng trắng hay ký tự đặc biệt; kiểu dữ liệu thuộc tính viết gọn một từ (`string`, `int`, `uuid`, `datetime`, `boolean`, `decimal`).

## 3. Kiểm chứng tự động sau khi ghi file

Chạy công cụ kiểm tra cú pháp và lint:

```bash
node .agents/scripts/mermaid-verify.mjs --file <path-to-md>
```
