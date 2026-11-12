# Project Profile Convention (`project-profile.md`)

Quy ước sử dụng `docs/_shared/project-profile.md` để lưu thông tin dùng chung cấp dự án:

- **Nội dung lưu trữ:** thị trường/ngôn ngữ mục tiêu, quy định tuân thủ/pháp lý áp dụng (GDPR, Nghị định 13, PCI-DSS...), cách gọi người dùng cuối thống nhất, ngưỡng SLA vận hành chung, danh mục thiết bị ưu tiên (`breakpoints`).
- **Cách dùng trong `/srs` và các skill kiểm thử:**
  1. Ở bước đọc upstream, nếu `docs/_shared/project-profile.md` tồn tại thì đọc cùng PRD để áp dụng sẵn vào NFR bảo mật/riêng tư và thuật ngữ giao diện (tránh hỏi lặp).
  2. Nếu chưa tồn tại, kiểm tra thêm `docs/_product/prd.md` và `docs/product-decisions.md`. Khi user chốt thông tin mới mang tính toàn dự án, có thể đề xuất lưu vào `docs/_shared/project-profile.md` qua cổng L1.
