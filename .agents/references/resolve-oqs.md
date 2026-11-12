# Open Questions Resolution Pass (`resolve-oqs.md`)

Quy trình rà soát và đóng Câu hỏi mở (Open Questions — OQ) sau khi hoàn tất ghi tài liệu:

## 1. Gom danh sách OQ

- **Own OQs:** các mục `- [ ] OQ...` nằm trong chính tài liệu vừa tạo/cập nhật (Mục Open Questions của `spec.md`, `reverse-gaps.md`, `api-checklist.md`...).
- **Inherited OQs** (với `/srs`): các OQ còn mở kế thừa từ tài liệu upstream (`prd.md`, `reverse-gaps.md`, `userflow.md`...) liên quan tới feature hiện tại.

## 2. Tương tác giải quyết (1-by-1 hoặc theo ID)

1. Tóm tắt số lượng OQ đang mở và hỏi user: muốn giải quyết ngay (`Y`), chọn theo mã (`ids`), hay giữ lại để chốt sau (`skip`).
2. Nếu user trả lời từng OQ:
   - Quét ảnh hưởng lan truyền (**cascade scan**) tới các mục FR / BR / NFR / Error Matrix / sơ đồ trong bộ tài liệu vừa viết.
   - Trình bày **L2 diff** cho các thay đổi phát sinh → cập nhật nội dung và đánh dấu `[x]` (kèm quyết định + ngày chốt) cho OQ đã giải quyết.
3. Các OQ chưa chốt giữ nguyên trạng thái `- [ ]` kèm owner/hạn (nếu có) để các bước downstream tiếp tục theo dõi.
