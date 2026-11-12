# Changelog / Activity Log Convention (`docs/_shared/changelog.md`)

Quy ước ghi nhận lịch sử cập nhật tài liệu vào `docs/_shared/changelog.md` (nguồn T1 cho `kg-history.mjs`):

## Định dạng bảng 5 cột

Nếu dự án sử dụng `docs/_shared/changelog.md`, mọi dòng nhật ký tuân thủ đúng bảng Markdown 5 cột:

```markdown
| Ngày | Skill | Người | File | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | /srs | @ba | `docs/billing/srs/billing-spec.md` | initial spec 12 FR |
```

## Quy tắc ghi trên Antigravity

- Vì Antigravity không chạy Claude PostToolUse shell hook qua biến môi trường `CLAUDE_SKILL_NAME` / `CLAUDE_CHANGELOG_*`, khi dự án đã có sẵn file `docs/_shared/changelog.md`, agent **chủ động append 1 dòng chuẩn 5 cột** vào cuối bảng sau khi ghi/cập nhật file đích thành công:
  - **Ngày:** `YYYY-MM-DD` (ISO date).
  - **Skill:** tên skill vừa chạy (`/srs`, `/code-to-srs`, `/test-checklist`, `/test-cases`, `/api-checklist`, `/api-test`...).
  - **Người:** `@author` hiện tại.
  - **File:** đường dẫn POSIX tương đối từ repo root, bọc trong dấu backtick `` `docs/...` ``.
  - **Ghi chú:** ngắn gọn `<= 80` ký tự; nếu trong ghi chú có ký tự `|`, phải escape thành `\|`.
- Nếu dự án chưa dùng `docs/_shared/changelog.md`, bỏ qua bước ghi changelog (hoặc chỉ tạo khi user yêu cầu), không làm gián đoạn luồng chính.
