# Review Findings Format (`review-format.md`)

Chuẩn định dạng báo cáo kết quả review (cho cả Review mode độc lập lẫn Auto-review Phase G):

## Phân mức độ nghiêm trọng (Severity)

1. **BLOCKING** — Lỗi nghiêm trọng làm sai lệch nghiệp vụ, bịa dữ liệu không có nguồn, đứt gãy truy vết ID/cardinality, hoặc rò rỉ quyết định cài đặt kỹ thuật vào tài liệu nghiệp vụ. Bắt buộc sửa trước khi chốt tài liệu.
2. **WARNING** — Thiếu sót edge case, mức ưu tiên (`P`) hoặc cờ tự động hoá (`Auto`) chưa hợp lý, câu chữ mơ hồ khó kiểm thử, hoặc thiếu đối chiếu mã lỗi.
3. **SUGGESTION** — Đề xuất cải thiện cách diễn đạt, gộp/tách mục cho gọn, hoặc bổ sung kịch bản nâng cao.

## Cấu trúc mỗi Finding

```markdown
- **[SEVERITY]** `[Vị trí / ID]` — Mô tả vấn đề cụ thể (trích dẫn câu gốc hoặc điều khoản mâu thuẫn).
  → *Đề xuất xử lý:* hành động sửa cụ thể.
```

## Quy tắc tổng hợp khi chạy nhiều Reviewer Subagents

- Gộp các phát hiện trùng lặp (deduplicate) trỏ vào cùng một dòng/ID.
- **Escalation:** Nếu từ 2 reviewer độc lập trở lên cùng cảnh báo `WARNING` tại một điểm, nâng mức lên `BLOCKING`.
