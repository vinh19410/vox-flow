# BA Conventions

Quy ước chung cho mọi skill BA-Kit khi chạy trên Antigravity:

## 1. Author Resolution (`@author`)

- Khi ghi dòng vào `docs/_shared/changelog.md`, lấy định danh người dùng hiện tại (từ git config `user.name` / ngữ cảnh dự án, ví dụ `@vinh19410` hoặc `@ba`).
- **KHÔNG** đưa trường `author` vào YAML frontmatter của tài liệu nghiệp vụ (tránh nhiễu diff khi nhiều người cùng sửa).

## 2. No-Re-Ask (Không hỏi lặp)

- **Đọc upstream trước khi hỏi:** luôn đọc hết tài liệu nguồn có sẵn (`prd.md`, `spec.md`, `test-strategy.md`, `project-profile.md`...) và tự trích xuất thông tin trước; chỉ hỏi user những chỗ thực sự còn khuyết hoặc mâu thuẫn.
- Thông tin đã chốt trong cùng phiên làm việc (ví dụ `primary_device`, ngôn ngữ, phạm vi tầng) phải truyền tiếp xuống các bước sau, không hỏi lại.

## 3. IT-BA Framing (Ngôn ngữ nghiệp vụ)

- Tài liệu BA (`spec.md`, `usecases/`, `test-checklist`, `api-checklist`...) viết dưới góc nhìn **hành vi nghiệp vụ quan sát được** (actor làm gì, hệ thống phản hồi gì, quy tắc kinh doanh nào áp dụng).
- **KHÔNG** đưa chi tiết cài đặt kỹ thuật (tên hàm, tên bảng vật lý, ORM, SDK, thuật toán hash, cấu trúc thư mục code) vào nội dung yêu cầu; các địa chỉ kỹ thuật (`file:line`, endpoint) chỉ đặt ở cột `Nguồn` / `_evidence.md` để truy vết.

## 4. Ngôn ngữ & Typography tiếng Việt

- Mặc định **Vietnamese-first** cho toàn bộ phần diễn giải, mô tả, câu hỏi và báo cáo.
- **Giữ nguyên không dịch:** nhãn nút/trường thực tế trên UI (`Submit`, `Email`, `Đăng nhập`), mã định danh (`FR-...`, `CHK-...`), HTTP method/path/field/error-code.

## 5. L1 Prose / Table Preview

- Trình bày L1 ngắn gọn, dễ đọc cho BA/PO, nêu rõ giá trị nghiệp vụ và các điểm cần lưu ý (OQ, TBD, cảnh báo coverage) trước khi ghi file.
