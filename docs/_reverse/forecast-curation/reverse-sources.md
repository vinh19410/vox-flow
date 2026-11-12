# forecast-curation — Danh mục nguồn (provenance)

Đường dẫn tính từ gốc repo `/root/projects/vox-flow`. Feature là code nội bộ (monorepo), không có tài liệu docx/pdf nên cột "Encoding OK?" luôn OK.

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/api/src/routers/forecast-admin.ts:1-439 | code (router tRPC) | commit 73fe748 (#23), 0337487 (#60) | high | OK | Mục 2, 3, 5, 6, 9, 11 (toàn bộ hành vi API quản trị) |
| S2 | packages/api/src/routers/forecast-admin.test.ts:1-338 | test (vitest, active) | cùng commit | high | OK | Mục 3, 5, 6, 7 (hành vi được test khẳng định) |
| S3 | packages/api/src/forecast/dedupe.ts:1-239 | code (gộp trùng) | cùng commit | high | OK | Mục 3, 5, 9 (thuật toán gộp, bất biến draft) |
| S4 | packages/api/src/forecast/dedupe.test.ts:1-149 | test (vitest, active) | cùng commit | high | OK | Mục 3, 5 (gộp 4 đầu vào thành 2, ép draft, đầu vào rỗng) |
| S5 | packages/api/src/forecast/questions.ts:1-111 và packages/api/src/scoring/forecast-keys.ts:16-128 | code (parser câu hỏi phía học viên/chấm điểm) | commit 0337487 (#60) | high | OK | Mục 1 (Boundary), 9 (điểm bàn giao sang forecast-practice) |
| S6 | packages/api/src/forecast/questions.test.ts:1-116 | test (vitest, active) | cùng commit | high | OK | Mục 1 (xác nhận parser thuộc phía học viên) |
| S7 | apps/web/src/features/admin/forecast-admin-screen.tsx:1-631 | code (React screen) | commit 73fe748 | high | OK | Mục 3, 6, 9, 10 (màn quản trị) |
| S8 | apps/web/src/routes/admin/forecast.tsx:1-29 | code (route guard) | commit 73fe748 | high | OK | Mục 2, 3, 6, 9, 10 |
| S9 | apps/web/src/features/admin/__tests__/forecast-admin-screen.test.tsx:1-187 | test (vitest/RTL, active) | commit 73fe748 | high | OK | Mục 3, 6, 10 |
| S10 | packages/api/src/index.ts:15-45 | code (middleware xác thực / quản trị) | n/a | high | OK | Mục 2, 5, 6 |
| S11 | packages/api/src/auth-utils.ts:1-13 và packages/api/src/auth-utils.test.ts:5-24 | code + test | n/a | high | OK | Mục 5 (so khớp email quản trị) |
| S12 | packages/db/src/schema/forecast.ts:1-89 | code (schema Drizzle) | n/a | high | OK | Mục 8, ERD, States |
| S13 | packages/db/src/migrations/20261105120834_parallel_zzzax/migration.sql:1-42 | migration SQL | 2026-11-05 | high | OK | Mục 8 (xác nhận cột thật, không có CHECK trên status) |
| S14 | docs/runbooks/forecast-update.md:1-62 | tài liệu vận hành | n/a | medium | OK | CHỈ dùng để ghi Conflict ở reverse-gaps (không là nguồn fact) |
| S15 | packages/api/src/routers/forecast.ts:27-133 | code (router phía học viên) | n/a | high | OK | Mục 9 (điểm bàn giao: chỉ topic published hiển thị/báo cáo được) |
| S16 | apps/server/src/context.ts:19-28 | code (nạp biến ADMIN_EMAILS vào ctx) | n/a | high | OK | Mục 11 (phụ thuộc cấu hình quản trị) |
| S17 | packages/api/src/routers/index.ts:5-27 | code (gắn router) | n/a | high | OK | Evidence §1 |
| S18 | packages/db/scripts/seed-forecast.ts:30-36,127 và packages/db/scripts/seed-forecast-prod.sql:70-86 | script seed | n/a | medium | OK | Mục 8 (nơi duy nhất ghi cờ isNew) |
| S19 | docs/roadmap-work-items.md:34 | tài liệu roadmap | n/a | medium | OK | CHỈ dùng cho Conflict (mô tả "dedupe AI") |
| S20 | .github/workflows/deploy-beta.yml:84 | CI workflow | n/a | medium | OK | Mục 11 (tên biến cấu hình ADMIN_EMAILS) |

## Ghi chú nguồn

- **Confidence mỗi nguồn:** high = code/test active đọc trực tiếp · medium = tài liệu/script phụ trợ.
- **Nguồn không đọc được:** file schema biến môi trường của apps/server (hook bảo vệ dữ liệu nhạy cảm chặn, không đọc). Tên biến `ADMIN_EMAILS` được xác nhận qua S16 và S20 thay thế; ý nghĩa/kiểu khai báo trong schema chưa xác nhận (xem OQ-14).
- **Nguồn mâu thuẫn:** S14/S19 mô tả "AI đối sánh ngữ nghĩa"; code S3 chỉ có heuristic token. Ghi ở `reverse-gaps.md` mục 3, không tự chọn bên.
