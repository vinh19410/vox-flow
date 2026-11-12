# privacy-controls — Danh mục nguồn (provenance)

Đường dẫn tính từ gốc repo `/root/projects/vox-flow`. Tất cả là source code / test (không có docx/pdf); cột "Loại" ghi `code` / `test` / `md`. Ngày: HEAD nhánh `dev` (2026-11-11).

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/api/src/routers/privacy.ts (1-128) | code | commit 21fc290 | high | OK | FR-001..009, 010, 019, 022; BR-001..009; E-002..004 |
| S2 | packages/api/src/routers/privacy.test.ts (1-176) | test | — | high | OK | Hành vi đồng ý, cô lập, xuất; test active (không có skip/todo) |
| S3 | packages/api/src/data-registry.ts (1-280) | code | — | high | OK | FR-010..018; BR-013..017; E-005, 006, 008 |
| S4 | packages/api/src/data-registry.test.ts (1-679) | test | — | high | OK | FR-011, 012, 014, 017; NFR-001..003 |
| S5 | packages/api/src/exam/consent.ts (1-18) | code | — | high | OK | FR-021; BR-010 |
| S6 | packages/db/src/schema/consent.ts (1-29) | code | — | high | OK | Mục 8; ERD; BR-018 |
| S7 | packages/api/src/routers/attempt.ts (88-110; import dòng 6) | code | — | high | OK | FR-021 (điểm gọi duy nhất của kiểm tra đồng ý thi) |
| S8 | packages/api/src/index.ts (13-30) | code | — | high | OK | FR-022; E-001 |
| S9 | packages/api/src/routers/index.ts (7, 22) | code | — | high | OK | Gắn router privacy vào API |
| S10 | apps/web/src/features/app-state/use-profile-hydration.ts (79-96) | code | — | high | OK | FR-023 |
| S11 | apps/web/src/features/app-state/initial-state.ts (9) + apps/web/src/features/app-state/types.ts (59-63) | code | — | high | OK | FR-024 |
| S12 | apps/web/src/features/select/components/pre-exam-card.tsx (7-42) | code | — | high | OK | FR-025; Mục 10 |
| S13 | apps/web/src/routes/_proto/terms.tsx (55-64) | code | cập nhật "Tháng 11/2026" theo nội dung trang | medium | OK | BR-022 |
| S14 | packages/db/src/schema/attempt.ts (16-17) | code | — | high | OK | BR-011 |
| S15 | packages/api/src/auth-utils.ts (23-35) | code | — | high | OK | BR-019 (tham chiếu score-dispute) |
| S16 | packages/api/src/auth-utils.test.ts (57-91) | test | — | high | OK | BR-019 |
| S17 | packages/api/src/routers/dispute.ts (16, 27-33, 94) | code | — | high | OK | BR-020, 021; E-007 |
| S18 | packages/db/src/schema/dispute.ts (24) | code | — | high | OK | BR-020 |
| S19 | apps/web/src/features/results/components/report-modal.tsx (30, 53, 130-140) | code | — | high | OK | BR-020; Mục 10 |
| S20 | packages/infra/alchemy.run.ts (56, 62) | code | — | high | OK | Cờ SCORE_DISPUTE_ENABLED mặc định "false"; danh sách cron |
| S21 | apps/server/src/scheduled.ts (42-56) | code | — | high | OK | Negative-search xoá tự động 24h |
| S22 | apps/server/src/index.ts (322-345) | code | — | high | OK | Điểm kiểm soát tải ghi âm theo shareConsent (tham chiếu) |
| S23 | apps/web/src/features/__tests__/slice-b.test.tsx (266-268) | test | — | high | OK | FR-025 |
| S24 | docs/product-decisions.md (dòng 14, D-10) | md | 2026-11-06 (theo nội dung) | medium | OK | Đối chiếu — KHÔNG dùng làm fact |
| S26 | packages/api/src/routers/attempt.test.ts (93, 247, 253) | test | — | high | OK | FR-021 (inHistory true) |
| S25 | docs/roadmap-work-items.md (dòng 26) | md | — | medium | OK | Đối chiếu — KHÔNG dùng làm fact |

## Ghi chú nguồn

- **Confidence mỗi nguồn:** high = code/test active; medium = tài liệu mô tả (S24, S25) — chỉ để đối chiếu.
- **Không có `it.skip` / `it.todo`** trong S2 và S4 (đã grep: pattern `it\.skip|it\.todo|describe\.skip|test\.skip` trên hai file).
- **Mâu thuẫn nguồn:** S25 (roadmap) nói đã "nối giao diện ConsentRows, PrivacyScreen" nhưng code (S10, S11, S12 + negative-search) không có; xem `reverse-gaps.md` mục 3.
