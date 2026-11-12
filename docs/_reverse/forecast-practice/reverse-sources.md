# forecast-practice — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder, range dòng) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|--------------------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/api/src/routers/forecast.ts:1-136 (danh sách đã đăng 28-85, báo gặp 87-135) | code (tRPC router) | đọc 2026-11-11 | high | OK | FR-001..006, FR-025, BR-001, BR-004..007, BR-014..017, E-001..004 |
| S2 | packages/api/src/routers/forecast.test.ts:1-159 | test (vitest, DB thật in-memory) | đọc 2026-11-11 | high | OK | FR-001..003, FR-005, FR-006, FR-025, BR-004, Conflict C4 |
| S3 | packages/api/src/forecast/questions.ts:1-111 (chuẩn hóa danh sách 34-63) ; packages/api/src/forecast/questions.test.ts:1-116 | code + test | đọc 2026-11-11 | high | OK | FR-006, BR-004..006, BR-012, E-014 |
| S4 | packages/api/src/scoring/forecast-keys.ts:1-128 ; packages/api/src/scoring/forecast-keys.test.ts:12-160 | code + test | đọc 2026-11-11 | high | OK | FR-031, BR-008, BR-010..013 |
| S5 | packages/db/src/schema/forecast.ts:1-89 ; packages/db/src/migrations/20261105120834_parallel_zzzax/migration.sql:1-37 (bảng báo gặp) | code (schema D1) | đọc 2026-11-11 | high | OK | Mục 8, ERD, BR-014, BR-018 |
| S6 | apps/web/src/features/forecast/forecast-screen.tsx:1-288 | code (màn web) | đọc 2026-11-11 | high | OK | FR-002..004, FR-008..013, FR-016, FR-019..022, BR-019, BR-024..026, E-005..009 |
| S7 | apps/web/src/features/forecast/builders.ts:1-105 | code (ánh xạ API sang màn) | đọc 2026-11-11 | high | OK | FR-007, BR-002, BR-003, BR-008..010, BR-039 |
| S8 | apps/web/src/features/forecast/data.ts:1-13 ; apps/web/src/features/forecast/types.ts:1-22 | code (hằng số quý, kiểu) | đọc 2026-11-11 | high | OK | FR-008, BR-020, OQ-6 |
| S9 | apps/web/src/features/forecast/components/forecast-toolbar.tsx:1-49 ; topic-card.tsx:1-55 ; topic-detail-modal.tsx:1-136 ; coverage-banner.tsx:1-48 (cùng thư mục apps/web/src/features/forecast/components/) | code (component) | đọc 2026-11-11 | high | OK | FR-009..018, BR-027, Mục 10 |
| S10 | apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx:1-473 | test (web, mock API) | đọc 2026-11-11 | high | OK | FR-021..024, FR-026, FR-027 |
| S11 | apps/web/src/features/forecast/__tests__/keys-parity.test.ts:1-105 | test (đối chiếu seed SQL với luật khóa) | đọc 2026-11-11 | high | OK | FR-031, BR-013 |
| S12 | apps/web/src/features/__tests__/slice-b.test.tsx:140-235 ; apps/web/src/features/__tests__/slice-c.test.tsx:304-330 ; apps/web/src/features/app-state/__tests__/state-and-data.test.ts:44-100 | test (web) | đọc 2026-11-11 | high | OK | FR-008..016, BR-002, BR-020 |
| S13 | apps/web/src/routes/_proto/app/forecast.tsx:1-7 ; apps/web/src/routes/_proto/app/route.tsx:1-17 ; apps/web/src/lib/auth-guard.ts:24-70 | code (route + guard) | đọc 2026-11-11 | high | OK | FR-028, BR-021, Actor |
| S14 | apps/web/src/features/app-state/store.tsx:1-150 ; initial-state.ts:1-24 ; types.ts:55-110 ; use-profile-hydration.ts:60-90 (cùng thư mục apps/web/src/features/app-state/) | code (state phía trình duyệt) | đọc 2026-11-11 | high | OK | FR-016..018, BR-022, BR-023, NFR-006 |
| S15 | apps/web/src/lib/feature-flags.ts:1-4 | code (cờ tính năng) | đọc 2026-11-11 | high | OK | N4 (không có cờ riêng) |
| S16 | packages/api/src/index.ts:13-40 | code (guard đăng nhập/quản trị) | đọc 2026-11-11 | high | OK | E-001, NFR-002 |
| S17 | packages/api/src/routers/attempt.ts:23-125 | code (mở lượt thi có chủ đề) | đọc 2026-11-11 | high | OK | FR-023, BR-031, BR-032, E-010..013 |
| S18 | apps/web/src/features/exam/use-exam-session.ts:75-175 ; apps/web/src/features/exam/exam-screen.tsx:131-139,179-184 | code (phòng thi phía web) | đọc 2026-11-11 | high | OK | FR-023, FR-024, BR-030, BR-033, BR-034 |
| S19 | apps/web/src/features/results/results-screen.tsx:255-300,340-370 ; apps/web/src/features/scoring/scoring-screen.tsx:25-40 | code (kết quả + chấm phía web) | đọc 2026-11-11 | high | OK | FR-026, FR-027, BR-035, BR-037, BR-038 |
| S20 | packages/api/src/routers/forecast-admin.ts:210-325 ; packages/api/src/routers/forecast-admin.test.ts:219-295 | code + test (phía quản trị, chỉ bàn giao) | đọc 2026-11-11 | high | OK | BR-001, BR-007, BR-015, BR-017, States |
| S21 | packages/api/src/data-registry.ts:106-123,250-253 | code (xuất/xóa dữ liệu người dùng) | đọc 2026-11-11 | high | OK | FR-030, NFR-004 |
| S22 | apps/web/src/layouts/nav-items.ts:39-46 ; apps/web/src/features/dashboard/components/today-tasks.tsx:18-28 | code (điều hướng) | đọc 2026-11-11 | high | OK | FR-029 |
| S23 | docs/roadmap-work-items.md:35 ; docs/_product/roadmap.md:40,79 ; plans/261105-0910-wi20-forecast-practice/plan.md:1-50 | tài liệu (chỉ đối chiếu Conflict, không dùng làm fact) | 2026-11-05 (plan) | medium | OK | Mục 0.3, Conflict C1, C3, SC-01 |
| S24 | packages/api/src/test/db.ts:77-106 ; packages/db/scripts/seed-forecast-prod.sql (178 dòng INSERT chủ đề, quý 2026-Q3) | code + dữ liệu seed | đọc 2026-11-11 | high | OK | Mục 11, OQ-5 |
| S25 | packages/api/src/scoring/answer-limits.ts:1-36 (TOPIC_ANSWER_CAP = 18 ở dòng 5, trần ở dòng 32) | code (giới hạn số câu trả lời của lượt thi chủ đề) | đọc 2026-11-11 | high | OK | FR-031, BR-013, Mục 11 |

## Ghi chú nguồn

- **Confidence:** S23 là tài liệu kế hoạch/lộ trình, chỉ để đối chiếu; mọi fact trong spec lấy từ code/test. Plan có status `pending` và các ô tiêu chí chưa tick.
- **Phạm vi:** feature là phía học viên. Phía quản trị (biên soạn, đăng, lưu trữ chủ đề) thuộc feature `forecast-curation`, chỉ nêu điểm bàn giao (S20).
- **Phần mock-exam / scoring-results:** chỉ đọc đoạn liên quan đến chủ đề forecast (S17, S18, S19); luật nghiệp vụ của hai feature đó nằm ở spec riêng.
- **Mâu thuẫn / lỗi thời:** xem Conflict trong `reverse-gaps.md`.
