# Feature Bootstrap Rules

Quy tắc khởi tạo hoặc chặn sớm khi một skill được gọi trên tính năng chưa có thư mục / tài liệu upstream:

## Nhóm A — Skill điểm vào (Entry-point skills)

Bao gồm: `/srs` (khi mô tả tính năng mới chưa có PRD), `/code-to-srs` (tái lập từ source code).

- Được phép tạo mới `feature` slug (theo chuẩn `kebab-case` trong `naming-conventions.md`).
- Trước khi tạo thư mục mới dưới `docs/{feature}/` hoặc `docs/_reverse/{feature}/`, phải hiển thị slug đề xuất trong bảng L1 để user xác nhận.

## Nhóm B — Skill phụ thuộc upstream (Downstream skills)

Bao gồm: `/test-checklist`, `/test-cases`, `/playwright-gen`, `/api-checklist`, `/api-test`.

- **KHÔNG** tự bịa tài liệu từ con số 0 nếu thiếu hoàn toàn nguồn nghiệp vụ:
  - `/test-checklist`: yêu cầu `docs/{feature}/` có ít nhất một nguồn nghiệp vụ (SRS, PRD, URD, BRD, use case, screen, hoặc brainstorm). Nếu rỗng hoàn toàn → từ chối chạy và hướng dẫn tạo tài liệu nghiệp vụ trước.
  - `/test-cases`: **HARD GATE** — bắt buộc phải có `docs/{feature}/test/checklist/checklist-{scope-slug}.md` tương ứng. Chưa có → từ chối và hướng dẫn chạy `/test-checklist` trước.
  - `/playwright-gen`: **HARD GATE** — bắt buộc phải có `docs/{feature}/test/testcases/testcases-*.md`. Chưa có → từ chối và hướng dẫn chạy `/test-cases` trước.
  - `/api-test`: ưu tiên đọc `docs/{feature}/test/api/api-checklist.md` (hoặc `integration/api-summary*.md`). Chưa có checklist → cảnh báo rõ (soft gate) và đề xuất chạy `/api-checklist` trước.
