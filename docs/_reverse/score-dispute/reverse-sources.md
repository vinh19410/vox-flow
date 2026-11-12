# score-dispute — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/api/src/routers/dispute.ts (dòng 1-170) | code (API) | 2026-11-05 (commit 7d5f31e) | high | OK | Mục 3, 5, 6 (gửi báo lỗi, xem trạng thái, wording lỗi) |
| S2 | packages/api/src/routers/dispute.test.ts (dòng 1-316) | test | 2026-11-05 | high | OK | Mục 3, 5, 6 (xác nhận hành vi bằng test active) |
| S3 | packages/db/src/schema/dispute.ts (dòng 1-51) | code (schema) | 2026-11-05 | high | OK | Mục 8, ERD, States |
| S4 | apps/web/src/features/results/components/report-modal.tsx (dòng 1-161) | code (UI) | 2026-11-05 | high | OK | Mục 10, FR giao diện, wording UI |
| S5 | apps/web/src/features/results/results-screen.tsx (dòng 55-91, 252, 319-345, 427-432) | code (UI) | không rõ | high | OK | Mục 10, điều kiện hiện nút/badge |
| S6 | apps/web/src/features/results/__tests__/report-modal.test.tsx (dòng 1-233) | test | không rõ | high | OK | UI: modal, nút, badge |
| S7 | packages/infra/alchemy.run.ts (dòng 56) + packages/api/src/context.ts (dòng 16) + apps/server/src/context.ts (dòng 26-31) | config/code | không rõ | high | OK | Cờ SCORE_DISPUTE_ENABLED: khai báo, mặc định, cách truyền vào API |
| S8 | packages/api/src/data-registry.ts (dòng 227-235) + packages/api/src/data-registry.test.ts (dòng 110-330) | code + test | không rõ | high | OK | Xuất/xóa dữ liệu cá nhân |
| S9 | apps/server/src/index.ts (dòng 301-344) + packages/api/src/auth-utils.ts (dòng 15-37) + packages/api/src/auth-utils.test.ts (dòng 35-115) | code + test | không rõ | high | OK | Hệ quả của shareConsent lên quyền nghe audio (điểm bàn giao dispute-admin) |
| S10 | packages/db/src/migrations/20261105123206_careful_paladin/migration.sql (dòng 1-20) + packages/db/src/migrations/20261105131332_tranquil_sharon_ventura/migration.sql (dòng 1-6) | migration | 2026-11-05 | high | OK | Cột, index duy nhất một báo lỗi đang hoạt động |
| S11 | apps/web/src/features/history/data.ts (dòng 17-37) + apps/web/src/features/app-state/initial-state.ts (dòng 13) | code (UI) | không rõ | high | OK | Điều kiện tiếp cận nút báo lỗi (isDefaultLatest) |
| S12 | apps/web/src/lib/feature-flags.ts (dòng 1-4) | code | không rõ | high | OK | Xác nhận KHÔNG có cờ web cho dispute |
| S13 | docs/roadmap-work-items.md (dòng 39) + docs/decisions/dispute-scale-up.md (dòng 1-30) + docs/_product/prd.md (dòng 131-132) + docs/product-decisions.md (dòng 13) | docs | 2026-11-05 | medium | OK | Ngữ cảnh nghiệp vụ, trạng thái cờ; KHÔNG dùng để nâng nhãn |
| S14 | packages/api/src/disputes/overdue.ts (dòng 5-65) + apps/server/src/scheduled.ts (dòng 16-52) | code | không rõ | high | OK | Chỉ để nêu điểm bàn giao (cảnh báo 12 giờ trước hạn, thuộc dispute-admin) |
| S15 | packages/api/src/routers/dispute-admin.ts (dòng 1-290) | code | 2026-11-05 (commit 7c93e1a) | high | OK | Chỉ để nêu điểm bàn giao: ai ghi resolved/rejected/resolvedBand/replyText |
| S16 | packages/api/src/index.ts (dòng 15-25) | code | không rõ | high | OK | Yêu cầu đăng nhập (protectedProcedure) |

## Ghi chú nguồn

- Toàn bộ S1-S12, S14-S16 là code/test trong repo (read-only). S13 là tài liệu sản phẩm, chỉ dùng làm ngữ cảnh, không nâng nhãn 🟡 thành ✅.
- Mọi cite dùng đường dẫn repo đầy đủ + số dòng, đã kiểm lại bằng `grep -n`/`sed -n`.
- Không có nguồn nào mâu thuẫn nhau trực tiếp; chênh lệch UI/API xem `reverse-gaps.md` mục 3.
