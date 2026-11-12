# Approval Gate Protocol (L1 / L2 / L3)

Quy tắc cổng phê duyệt bắt buộc trước mọi thao tác ghi/sửa tài liệu BA trong `docs/`:

## 1. An toàn ghi file (Hard Rule)

- **Mọi file chỉ được ghi (`write_file` / `edit_file`) SAU khi user xác nhận đồng ý (`Y`) ở L1.**
- **KHÔNG** ghi file trước rồi hỏi xác nhận sau; **KHÔNG** dùng `git checkout --` hay `rm` làm cơ chế rollback (dễ mất thay đổi chưa commit của user).
- **Subagent read-only về output:** khi dùng `invoke_subagent` để bóc tách dữ liệu, viết nháp hoặc review, subagent chỉ đọc và trả nội dung đề xuất (`proposed content` / `findings`) về main agent; **chỉ main agent mới được ghi file đích** sau khi user duyệt.

## 2. Ba cấp độ phê duyệt

| Cấp | Khi nào dùng | Cách trình bày |
|-----|--------------|----------------|
| **L1 — Plan Preview** | Trước mỗi nhóm `write_file` tạo mới (hoặc batch theo tầng) | Tóm tắt BA-facing (prose hoặc bảng gọn): đường dẫn file sẽ tạo/sửa, số lượng mục chính (FR/BR/Error/TC/CHK...), cảnh báo coverage/marker còn thiếu. Hỏi `Apply? (Y / sửa)`. |
| **L2 — Diff Preview** | Khi cập nhật file đã tồn tại (`update` / `sync` / `supplement`) | Nêu rõ phần thêm/sửa/xóa theo mục hoặc theo ID trước khi dùng `edit_file` / `write_file`. Không ghi đè mù làm mất nội dung đã duyệt. |
| **L3 — Content Iterate** | Khi skill yêu cầu duyệt nháp trực tiếp trong chat (tối đa 3 vòng) | Render bản nháp (hoặc 5–10 mục đại diện) ngay trong chat kèm lựa chọn `Đồng ý / Sửa: <góp ý> / Hủy`. Sau khi chốt mới chuyển sang L1 để ghi file. (Bỏ qua L3 đối với mermaid diagram hoặc chain mode theo quy định riêng của từng skill.) |

## 3. Derived Artifacts

Các file dẫn xuất sinh tự động bởi script/engine (`docs/_shared/kg/graph.json`, `data.js`, `.spec.ts`, `.bru`) đi theo L1 tổng của lần chạy hoặc lệnh tường minh của user, không cần L2 diff từng file dẫn xuất.
