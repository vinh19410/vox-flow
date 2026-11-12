# Naming Conventions & ID Standards

Quy ước đặt tên thư mục, file và mã định danh (ID) cho hệ thống tài liệu BA trong `docs/`:

## 1. Feature Slug

- Dùng `kebab-case` ASCII chữ thường, đặt theo **tính năng nghiệp vụ góc nhìn người dùng** (ví dụ: `auth-account`, `mock-exam`, `billing`, `score-dispute`), không đặt theo tên module kỹ thuật (`AuthModule`, `UserService`).

## 2. Cấu trúc thư mục chuẩn

- Tài liệu chính thức theo tính năng: `docs/{feature}/`
  - `srs/{feature}-spec.md`, `srs/{feature}-flows.md`, `srs/{feature}-erd.md`, `srs/{feature}-states.md`, `srs/{feature}-userflow.md`
  - `usecases/{feature}-usecase-index.md`, `usecases/uc-{slug}.md`
  - `userstories/{feature}-story-index.md`, `userstories/us-{NNN}.md`
  - `ascii-wireframe/{feature}-wireframe-index.md`, `ascii-wireframe/{flow-slug}.md`
  - `html-wireframe/{feature}-wireframe-html-index.md`, `html-wireframe/{flow-slug}.html`
  - `test/test-strategy.md`
  - `test/checklist/{feature}-checklist-index.md`, `test/checklist/checklist-{scope-slug}.md`
  - `test/testcases/{feature}-testcase-index.md`, `test/testcases/testcases-{scope-slug}.md`
  - `test/api/api-checklist.md`, `test/api/api-tests.md`, `test/api/bruno/`
  - `test/e2e/{feature}-e2e-index.md`, `test/e2e/specs/`
- Tài liệu tái lập từ code (`/code-to-srs`): `docs/_reverse/{feature}/` (tách biệt, không ghi đè `docs/{feature}/`).
- Tài liệu dùng chung toàn dự án: `docs/_product/` (`prd.md`, `roadmap.md`), `docs/_shared/` (`changelog.md`, `definitions.md`, `project-profile.md`, `kg/`).

## 3. Quy tắc ID (Feature-Prefixed)

Mọi mã định danh yêu cầu/kiểm thử đều mang tiền tố `{feature}` để không đụng độ toàn cục và để Knowledge Graph truy vết chính xác:

- Functional Requirement: `FR-{feature}-NNN` (3 chữ số, vd `FR-billing-001`)
- Non-Functional Requirement: `NFR-{feature}-NNN`
- Business Rule: `BR-{feature}-NNN`
- Error Matrix item: `E-{feature}-NNN`
- Success Criteria: `SC-{feature}-NN`
- Test Checklist item: `CHK-{feature}-NNN` (cấp tăng dần từ `next_chk_id`, xóa thì đưa vào `Retired CHK-IDs`, không tái sử dụng, không đánh số lại)
- API Test Case: `TC-NN` (unique liên tục trong bảng `api-tests.md`, truy vết ngược qua cột `Ref: ACL#N` hoặc `FR-...`)

**Bảo toàn ID khi cập nhật:** Khi sửa tài liệu đã tồn tại, giữ nguyên ID cũ, mục thêm mới nối tiếp số `NNN` tiếp theo, không đánh số lại làm gãy liên kết downstream.
