# dispute-admin — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | `packages/api/src/routers/dispute-admin.ts` (1-337) | code (API router) | 2026-11-11 (đọc) | high | OK | FR hàng đợi/chi tiết/giải quyết/số liệu, BR, Error, Mục 8 |
| S2 | `packages/api/src/routers/dispute-admin.test.ts` (1-275) | test | 2026-11-11 | high | OK | boundary/hành vi đã có test (sắp xếp, audio theo đồng ý, giải quyết, đã xử lý, metrics) |
| S3 | `packages/api/src/disputes/overdue.ts` (1-65) | code (job cảnh báo) | 2026-11-11 | high | OK | FR cảnh báo sắp quá hạn, ngưỡng 12 giờ, idempotent |
| S4 | `packages/api/src/disputes/overdue.test.ts` (1-137) | test | 2026-11-11 | high | OK | biên đúng 12 giờ, không cảnh báo lần hai, loại ca đã xử lý |
| S5 | `apps/server/src/scheduled.ts` (1-55) | code (cron handler) | 2026-11-11 | high | OK | lịch chạy, cô lập lỗi, định tuyến theo cron |
| S6 | `apps/server/src/scheduled.test.ts` (1-61) | test | 2026-11-11 | high | OK | định tuyến cron, khớp cron với hạ tầng |
| S7 | `apps/server/src/index.ts` (301-390) | code (HTTP route tải audio) | 2026-11-11 | high | OK | cổng tải audio theo quyền, wording 401/403/404/503 |
| S8 | `packages/api/src/auth-utils.ts` (1-37) | code | 2026-11-11 | high | OK | quy tắc admin theo email, quy tắc truy cập audio |
| S9 | `packages/api/src/auth-utils.test.ts` (4-114) | test | 2026-11-11 | high | OK | biên so khớp email, truy cập audio |
| S10 | `packages/api/src/index.ts` (15-45) | code (middleware) | 2026-11-11 | high | OK | guard đăng nhập + guard admin, wording lỗi |
| S11 | `apps/web/src/features/admin/disputes-screen.tsx` (1-651) | code (UI) | 2026-11-11 | high | OK | Mục 10 Screens, FR giao diện, mẫu trả lời, wording UI |
| S12 | `apps/web/src/routes/admin/disputes.tsx` (1-29) | code (route) | 2026-11-11 | high | OK | guard route, chuyển hướng |
| S13 | `apps/web/src/features/admin/__tests__/disputes-screen.test.tsx` (1-205) | test | 2026-11-11 | high | OK | hành vi UI đã có test |
| S14 | `packages/db/src/schema/dispute.ts` (1-51) | code (schema) | 2026-11-11 | high | OK | Mục 8, ERD, state, unique index |
| S15 | `packages/db/src/migrations/20261105123206_careful_paladin/migration.sql`, `packages/db/src/migrations/20261105131332_tranquil_sharon_ventura/migration.sql` | migration | 2026-11-05 (theo tên thư mục) | high | OK | cột thực tế trong DB, unique index một phần, index dueAt |
| S16 | `packages/infra/alchemy.run.ts` (52, 56, 61-62) | code (hạ tầng) | 2026-11-11 | high | OK | tên biến ADMIN_EMAILS, SCORE_DISPUTE_ENABLED, danh sách cron |
| S17 | `packages/api/src/routers/dispute.ts` (23-131) | code (phía học viên, chỉ để nêu điểm bàn giao) | 2026-11-11 | high | OK | nguồn phát sinh ca (hạn 72 giờ, cờ bật tính năng, ràng buộc 1 ca đang xử lý/bài) |
| S18 | `apps/web/src/features/results/results-screen.tsx` (319-340) | code (UI học viên, điểm bàn giao) | 2026-11-11 | high | OK | học viên thấy gì sau khi ca xử lý xong |
| S19 | `packages/api/src/audio.ts` (94-160) | code | 2026-11-11 | high | OK | wording 403/404 của luồng audio, khóa audio theo tenant |
| S20 | `packages/api/src/data-registry.ts` (227-234) | code | 2026-11-11 | high | OK | xuất/xóa dữ liệu ca theo người dùng |
| S22 | `packages/db/src/schema/attempt.ts` (32-57) | code (schema) | 2026-11-11 | high | OK | cột transcript tồn tại nhưng không được trả cho admin; cột audio |
| S21 | `docs/runbooks/score-dispute.md` (1-65) | runbook (tài liệu) | không ghi | medium | OK | CHỈ để đối chiếu Conflict; không dùng làm fact |

## Ghi chú nguồn

- **Confidence mỗi nguồn:** high = code/test đọc trực tiếp; medium = runbook (tài liệu vận hành, không phải code).
- Không có nguồn nào bị mojibake.
- Runbook S21 mâu thuẫn một số điểm với code (xem `reverse-gaps.md` mục 3 Conflicts). Fact trong spec lấy từ code, KHÔNG từ runbook.
- Không chạy test; hành vi "từ test" là hành vi mà test khẳng định, chưa xác nhận bằng chạy thật.
