---
title: "Scoring pipeline (beta) cho luyện forecast"
status: in-progress
issue: 90
branch: feat/scoring-pipeline-forecast
related: [17, 24]
created: 2026-11-10
---

# Scoring pipeline (beta) cho luyện forecast

Tracking: #90. Liên quan #17 (phần eval/paywall nằm ngoài phạm vi), #24.

## Outcome
Lượt luyện forecast được chấm thật bằng `gpt-6-luna` (3 lần độc lập, lấy trung vị, không hiển thị cho học viên) và màn kết quả hiển thị band tổng, 4 tiêu chí và bằng chứng trích nguyên văn.

## Quyết định
- Eval #7 tạm bỏ qua theo yêu cầu người sở hữu sản phẩm; không có ngưỡng độ chính xác trong lần này.
- Không paywall: mọi người dùng beta xem đủ 4 tiêu chí và bằng chứng.
- 3 lần chấm chạy ngầm; giao diện không hiện khoảng tin cậy hay số lần chấm.
- Chỉ lượt có `topicId` (luyện forecast) được chấm; mode khác giữ màn "đã ghi nhận".
- Xử lý bất đồng bộ qua Cloudflare Queue, vì whisper cộng 3 lượt LLM vượt giới hạn của `waitUntil`.
- Model và số lần chấm cấu hình qua env `SCORING_MODEL` (mặc định `gpt-6-luna`) và `SCORING_RUNS` (mặc định 3).
- Gửi audio + transcript; nếu model từ chối audio thì lùi về chỉ transcript và ghi `audio_used=false`.
- Bằng chứng chỉ giữ câu trích khớp nguyên văn với transcript.

## Contract (đã commit, không đổi tên hay kiểu)
- Schema: `packages/db/src/schema/score.ts` (`attempt_score`, `score_run`), cột `attempt_answer.transcript`. Migration `20261110031204_curved_selene`.
- Kiểu dùng chung: `packages/api/src/scoring/types.ts`.
- Router: `scoring.status`, `scoring.retry`, `scoring.getResult` trong `packages/api/src/routers/scoring.ts`.

## Phases
| # | Phase | Sở hữu file | Status |
|---|-------|-------------|--------|
| 1 | Backend: pipeline, queue, router | `packages/api/**`, `packages/infra/**`, `apps/server/**` | Pending |
| 2 | Frontend: màn chấm và màn kết quả | `apps/web/**` | Pending |
| 3 | Review độc lập, PR vào `dev`, merge, deploy | — | Pending |
| 4 | POT trên beta | `plans/reports/**` | Pending |

## Acceptance Criteria
- [ ] Nộp lượt forecast tạo `attempt_score=queued`; queue chuyển giọng nói thành chữ, chấm 3 lần, lấy trung vị 4 tiêu chí và band tổng (bước 0.5), lưu `score_run` và chi phí; gọi trùng không tạo thêm kết quả; hết số lần thử thì `failed`.
- [ ] Màn chấm theo dõi trạng thái thật; lỗi có nút chấm lại, không mất bài.
- [ ] Màn kết quả đọc `scoring.getResult`; không hiện khoảng tin cậy; không paywall; chỉ chủ bài đọc được.
- [ ] Mode khác giữ màn "đã ghi nhận".
- [ ] Test liên quan và `pnpm check-types` pass; review độc lập sạch; deploy-beta xanh.
- [ ] POT trên beta đăng lên #90.
