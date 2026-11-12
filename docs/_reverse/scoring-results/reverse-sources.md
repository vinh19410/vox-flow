# scoring-results — Danh mục nguồn (provenance)

| ID | Nguồn (file/folder, range dòng) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|--------------------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | packages/api/src/routers/scoring.ts:1-229 (status 58-76, retry 78-177, getResult 179-228) | code (tRPC router) | đọc 2026-11-11 | high | OK | FR-005..011, FR-029..031, E-001..007 |
| S2 | packages/api/src/scoring/score-attempt.ts:1-520 | code (pipeline chấm, lease, xử lý lỗi) | đọc 2026-11-11 | high | OK | FR-012..025, BR-010, BR-011, BR-017..020, E-012..018, E-026, E-031 |
| S3 | packages/api/src/scoring/aggregate.ts:1-74; packages/api/src/scoring/aggregate.test.ts:1-74 | code + test | đọc 2026-11-11 | high | OK | FR-020, BR-001..004 |
| S4 | packages/api/src/scoring/config.ts:1-96; packages/api/src/scoring/config.test.ts:1-44 | code + test | đọc 2026-11-11 | high | OK | BR-005, BR-006, BR-012, BR-019, E-028, E-029 |
| S5 | packages/api/src/scoring/openai-client.ts:1-107; packages/api/src/scoring/openai-client.test.ts:1-120 | code + test | đọc 2026-11-11 | high (test đọc tiêu đề) | OK | NFR-001, FR-018, E-019..022 |
| S6 | packages/api/src/scoring/prompt.ts:1-264; packages/api/src/scoring/prompt.test.ts:1-36 | code + test | đọc 2026-11-11 | high | OK | FR-019, BR-016..018, NFR-006, NFR-008, E-023..025 |
| S7 | packages/api/src/scoring/queue.ts:1-47 | code | đọc 2026-11-11 | high | OK | FR-003, FR-004, FR-026 (khuôn thông điệp) |
| S8 | packages/api/src/scoring/requeue.ts:1-61; packages/api/src/scoring/requeue.test.ts:1-67 | code + test | đọc 2026-11-11 | high | OK | FR-027, BR-011, E-027 |
| S9 | packages/api/src/scoring/retry-limits.ts:1-17; packages/api/src/scoring/retry-limits.test.ts:1-29 | code + test | đọc 2026-11-11 | high (test đọc tiêu đề) | OK | BR-008, NFR-010 |
| S10 | packages/api/src/scoring/types.ts:1-63 | code (hợp đồng dùng chung) | đọc 2026-11-11 | high | OK | FR-006, mục 8 |
| S11 | packages/api/src/scoring/answer-limits.ts:1-57; packages/api/src/scoring/forecast-keys.ts:98; packages/api/src/scoring/mock-exam-bank.ts:73-78 | code (trần số câu / dung lượng) | đọc 2026-11-11 | high (chỉ đọc dòng liên quan của hai file sau) | OK | FR-002, FR-013, BR-015 |
| S12 | apps/server/src/queue.ts:1-78; apps/server/src/queue.test.ts:1-87 | code + test | đọc 2026-11-11 | high | OK | FR-026, BR-012, E-030 |
| S13 | apps/server/src/scheduled.ts:1-55; apps/server/src/scheduled.test.ts:17-60 | code + test | đọc 2026-11-11 | high | OK | FR-027, FR-028 |
| S14 | packages/db/src/schema/score.ts:1-109 | code (schema Drizzle) | đọc 2026-11-11 | high | OK | Mục 8, ERD, states |
| S15 | packages/infra/alchemy.run.ts:1-30, :41-47, :61-62, :75-90 | hạ tầng | đọc 2026-11-11 | high (đọc đoạn) | OK | NFR-002..004, ràng buộc mục 11 |
| S16 | packages/api/src/routers/attempt.ts:215-300 | code (nộp bài, phần liên quan chấm điểm) | đọc 2026-11-11 | high (đọc đoạn; thuộc mock-exam) | OK | FR-001, FR-002, E-008..011 |
| S17 | packages/api/src/routers/scoring.test.ts:1-638 | test | đọc 2026-11-11 | high (đọc 228-505 + tiêu đề toàn file) | OK | FR-001..011, FR-029 |
| S18 | packages/api/src/scoring/score-attempt.test.ts:1-935 | test | đọc 2026-11-11 | high (đọc 350-452 + tiêu đề toàn file) | OK | FR-012..025 |
| S19 | apps/web/src/features/scoring/use-scoring-job.ts:1-337 | code (hook theo dõi chấm) | đọc 2026-11-11 | high | OK | FR-032..038, BR-023, BR-025 |
| S20 | apps/web/src/features/scoring/scoring-screen.tsx:1-305 | code (UI màn chấm) | đọc 2026-11-11 | high | OK | FR-036..040, E-032..040, mục 10 |
| S21 | apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx:1-502; apps/web/src/features/scoring/__tests__/use-scoring-job.test.ts:1-105 | test | đọc 2026-11-11 | high (đọc 55-100, 244-304, 420-502 + tiêu đề) | OK | FR-032..040 |
| S22 | apps/web/src/features/results/results-screen.tsx:1-435 | code (UI màn kết quả) | đọc 2026-11-11 | high | OK | FR-041..051, E-039..045 |
| S23 | apps/web/src/features/results/scored-result.ts:1-46; apps/web/src/features/results/use-scored-result.ts:1-69; apps/web/src/features/results/types.ts:1-70; apps/web/src/features/results/review-data.ts:1-7 | code (ánh xạ kết quả, dữ liệu giả) | đọc 2026-11-11 | high | OK | FR-041, FR-042, FR-044..046, FR-051 |
| S24 | apps/web/src/features/results/components/band-hero.tsx:1-70; criteria-grid.tsx:1-49; criterion-detail.tsx:1-98; review-list.tsx:1-145; soft-paywall.tsx:1-24 (thư mục components cùng cấp) | code (component) | đọc 2026-11-11 | high | OK | FR-044..046, FR-049, FR-051 |
| S25 | apps/web/src/features/results/__tests__/scored-results.test.tsx:1-271; apps/web/src/features/results/__tests__/results-gate.test.tsx:1-18 | test | đọc 2026-11-11 | high (đọc 60-130, 175-271) | OK | FR-041..049 |
| S26 | apps/web/src/lib/feature-flags.ts:1-4; apps/web/src/routes/_proto/scoring.tsx:1-9; apps/web/src/routes/_proto/app/history.$attemptId.tsx:1-13 | cờ + route | đọc 2026-11-11 | high | OK | FR-048, mục 10 |
| S27 | apps/web/src/features/history/data.ts:17-33 | code (resolveAttemptView) | đọc 2026-11-11 | high (đọc đoạn) | OK | FR-041, FR-051 |
| S28 | packages/api/src/data-registry.ts:124-157, :236-243 | code (xuất/xóa dữ liệu người dùng) | đọc 2026-11-11 | high (đọc đoạn; thuộc privacy-controls) | OK | Phụ thuộc mục 11 |

## Ghi chú nguồn

- **Cấp tin cậy:** ✅ = code/test khẳng định · 🔵 = suy đoán có ít nhất 2 chỗ hậu thuẫn · 🟡 = code không nói (cần PO/BA).
- **Env/secret:** chỉ trích tên biến (`OPENAI_API_KEY`, `SCORING_MODEL`, `SCORING_RUNS`, `SCORING_PRICE_INPUT_PER_1M`, `SCORING_PRICE_OUTPUT_PER_1M`, `SCORING_QUEUE_MAX_RETRIES`, `VITE_FEATURE_SCORING`). Không chép giá trị. File dotenv của web bị hook chặn nên KHÔNG đọc: giá trị thực của `VITE_FEATURE_SCORING` chưa kiểm chứng.
- **Không chạy test:** hành vi từ test là ✅ (đọc từ file test), phần "vì sao" luôn 🟡.
- **Ngoài phạm vi:** `report-modal.tsx` và nút "Báo lỗi chấm" (score-dispute); thanh toán/gói (billing); nộp bài, ghi âm, upload (mock-exam, forecast-practice); lịch sử/dashboard (progress-history).
- **Không đọc node_modules.** Số dòng được lấy từ `cat -n` / `grep -n` trên bản làm việc hiện tại của repo.
