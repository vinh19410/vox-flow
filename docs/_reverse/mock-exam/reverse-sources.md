# mock-exam — Danh mục nguồn (provenance)

Toàn bộ nguồn là source code + test trong repo `/root/projects/vox-flow` (đọc-only). Không có tài liệu nghiệp vụ gốc cho feature này (`existing_doc: null` trong `docs/_reverse/reverse-plan.json:10`).

| ID | Nguồn (file/folder) | Loại | Ngày (nếu biết) | Confidence | Encoding OK? | Phần feature suy ra từ đây |
|----|---------------------|------|-----------------|------------|--------------|----------------------------|
| S1 | `packages/api/src/routers/attempt.ts` (1-305) | code (tRPC router) | 2026-11-11 (đọc) | high | OK | Khởi tạo lượt thi, cổng pilot, phục hồi lượt thi, nộp bài, AI follow-up (Mục 3, 5, 6, 9) |
| S2 | `packages/api/src/routers/attempt.test.ts` (1-654) | test | 2026-11-11 | high | OK | Boundary/lỗi của start, submit, getFollowUp |
| S3 | `packages/api/src/exam/consent.ts` (1-18) | code | 2026-11-11 | high | OK | Mặc định lưu lịch sử / calibration (BR consent) |
| S4 | `packages/api/src/exam/fallback-data.ts` (1-37) | code (dữ liệu canned) | 2026-11-11 | high | OK | Câu hỏi follow-up dự phòng |
| S5 | `packages/api/src/exam/follow-up.ts` (1-89) | code | 2026-11-11 | high | OK | Sinh follow-up bằng LLM + fallback |
| S6 | `packages/api/src/exam/follow-up.test.ts` (1-86) | test | 2026-11-11 | high | OK | Hành vi fallback / parse follow-up |
| S7 | `packages/api/src/exam/transcribe.ts` (1-109) + `packages/api/src/scoring/openai-client.test.ts` (1-25) | code + test | 2026-11-11 | high | OK | Chép lời (đầu mối bàn giao sang scoring-results) |
| S8 | `packages/api/src/answers.ts` (1-36) + `packages/api/src/answers.test.ts` (1-134) | code + test | 2026-11-11 | high | OK | Upsert bản ghi theo generation |
| S9 | `packages/api/src/audio.ts` (1-268) + `packages/api/src/audio.test.ts` (1-493) | code + test | 2026-11-11 | high | OK | MIME, khóa lưu trữ, tenant isolation, header an toàn, phát audio |
| S10 | `packages/api/src/scoring/mock-exam-bank.ts` (1-132) + `packages/api/src/scoring/mock-exam-bank.test.ts` (1-123) | code + test | 2026-11-11 | high | OK | Ngân hàng đề thi thử, bộ khóa câu hỏi theo mode |
| S11 | `packages/api/src/scoring/answer-limits.ts` (1-57) | code | 2026-11-11 | high | OK | Giới hạn số câu trả lời / lượt thi |
| S12 | `packages/api/src/scoring/forecast-keys.ts` (98) | code | 2026-11-11 | high | OK | Hằng 35 MiB tổng audio |
| S13 | `apps/server/src/index.ts` (1-405) | code (Hono route) | 2026-11-11 | high | OK | Tải audio lên (62-299), tải audio về (301-394) |
| S14 | `apps/server/src/index.test.ts` (1-841) | test | 2026-11-11 | high | OK | Boundary/lỗi của route upload/download |
| S15 | `apps/server/src/index.integration.test.ts` (1-170) | test (D1 thật) | 2026-11-11 | high | OK | Thứ tự generation trên DB thật |
| S16 | `packages/db/src/schema/attempt.ts` (1-60), `packages/db/src/schema/score.ts` (11-33), `packages/db/src/schema/forecast.ts` (6-20) | code (schema) | 2026-11-11 | high | OK | Thực thể Lượt thi, Câu trả lời, điểm hàng đợi, chủ đề dự đoán |
| S17 | `apps/web/src/features/exam/use-exam-session.ts` (1-383) | code (hook) | 2026-11-11 | high | OK | Máy trạng thái phòng thi, timer, ghi âm, bootstrap lượt thi |
| S18 | `apps/web/src/features/exam/answer-uploads.ts` (1-343) | code | 2026-11-11 | high | OK | Theo dõi / retry / flush tải audio |
| S19 | `apps/web/src/features/exam/storage.ts` (1-164) | code | 2026-11-11 | high | OK | Lưu offline IndexedDB + fallback bộ nhớ |
| S20 | `apps/web/src/features/exam/exam-screen.tsx` (1-270) | code (UI) | 2026-11-11 | high | OK | Màn phòng thi, pipeline nộp bài, thoát |
| S21 | `apps/web/src/features/exam/components/*.tsx` (exam-header, cue-card-panel, exam-intro, question-stage, exam-controls, live-transcript, pre-submit-modal, exit-exam-modal) | code (UI) | 2026-11-11 | high | OK | Chi tiết giao diện + wording |
| S22 | `apps/web/src/features/exam/data.ts` (1-83), `apps/web/src/features/exam/types.ts` (1-65) | code | 2026-11-11 | high | OK | Chế độ thi, giọng, ngưỡng số từ, mô tả Part, câu mẫu demo |
| S23 | `apps/web/src/features/select/select-screen.tsx`, `select-setup-screen.tsx`, `components/mode-grid.tsx`, `components/voice-picker.tsx`, `components/pre-exam-card.tsx` | code (UI) | 2026-11-11 | high | OK | Chọn chế độ, giọng, màn trước khi bắt đầu |
| S24 | `apps/web/src/hooks/use-recorder.ts` (1-156), `apps/web/src/lib/speech.ts` (1-43), `apps/web/src/hooks/use-mic-level.ts` | code | 2026-11-11 | high | OK | Ghi âm trình duyệt, TTS giám khảo, mức mic |
| S25 | `apps/web/src/routes/_proto/exam.tsx`, `apps/web/src/routes/_proto/app/select.tsx`, `apps/web/src/routes/_proto/app/select_.setup.tsx`, `apps/web/src/routes/_proto/app/route.tsx`, `apps/web/src/lib/auth-guard.ts` (41-70) | code (route) | 2026-11-11 | high | OK | Route + guard đăng nhập/onboarding |
| S26 | `apps/web/src/features/app-state/store.tsx`, `initial-state.ts`, `use-profile-hydration.ts` | code | 2026-11-11 | high | OK | Lưu mode/voice theo phiên trình duyệt |
| S27 | `apps/web/src/features/exam/__tests__/*.test.ts(x)`, `apps/web/src/features/exam/components/__tests__/*.test.tsx`, `apps/web/src/features/select/__tests__/*.test.tsx` | test | 2026-11-11 | high | OK | Hành vi nộp bài, upload, storage, chọn chế độ |
| S28 | `packages/api/src/scoring/queue.ts` (15, 31-45), `packages/api/src/scoring/prompt.ts` (150-158) | code | 2026-11-11 | high | OK | Đẩy hàng đợi chấm điểm, lọc thẻ phân tách |
| S29 | `packages/infra/alchemy.run.ts` (53-54), `packages/api/src/context.ts` (10-11) | code (config) | 2026-11-11 | high | OK | Biến môi trường cổng pilot |
| S30 | `docs/product-decisions.md` (14) — quyết định D-10 | doc | 2026-11-06 (theo nội dung dòng) | medium | OK | Lý do lưu lịch sử mặc định (đối chiếu consent) |
| S31 | `apps/web/src/features/scoring/use-scoring-job.ts` (94-110) | code | 2026-11-11 | high | OK | Nhận diện lỗi "đã nộp" / BAD_REQUEST ở client |
| S32 | `packages/api/src/auth-utils.ts` (23-37) | code | 2026-11-11 | high | OK | Ai được tải audio |

## Ghi chú nguồn

- Confidence "high" nghĩa là code + test đọc được rõ ràng; **không** có nghĩa là ý đồ nghiệp vụ đã được xác nhận (xem nhãn 🟡 trong spec).
- Không đọc `node_modules`. Không chạy test; hành vi từ test là hành vi test khẳng định, không phải kết quả chạy.
- S30 là nguồn doc duy nhất; nó chỉ cover quyết định D-10 (consent), không mô tả luồng thi.
- Nguồn mâu thuẫn: không phát hiện hai nguồn nói khác nhau trực tiếp; các điểm lệch (tên mode client vs server, comment vs hành vi retry) ghi ở `reverse-gaps.md` mục 3.
