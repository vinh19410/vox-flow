---
title: "Hạn mức miễn phí (`free-quota`)"
description: "Chi phí chấm của gói miễn phí nằm trong tầm kiểm soát: mỗi học viên 3 điểm/ngày, có trần toàn hệ thống, và học viên luôn thấy số điểm còn lại."
status: completed
priority: P1
effort: 2d
issue: 18
branch: vinh19410/plan-14-h-n-m-c-mi-n-ph-free-quota
tags: [backend, frontend, advice]
blockedBy: [project:261105-0910-wi13-scoring-results]
blocks: [project:261105-0910-wi17-first-real-students-gate, project:261105-0910-wi20-forecast-practice]
created: 2026-11-05
updated: 2026-11-14
---

# Hạn mức miễn phí (`free-quota`)

Tracking: #18

Mục 14 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `free-quota`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Chi phí chấm của gói miễn phí nằm trong tầm kiểm soát: mỗi học viên 3 điểm/ngày, có trần toàn hệ thống, và học viên luôn thấy số điểm còn lại.

## Phụ thuộc
- Phải chờ: #17 (`CLOSED`)
- Mở khóa: #21, #24

## Constraints
- 3 điểm/ngày và trần toàn hệ thống đã chốt ở OQ-1.
- Sao lưu D1 trước khi áp migration lên môi trường thật.

## Non-goals
- Trang quản trị trần; đổi bằng biến môi trường (`FREE_DAILY_BUDGET_VND`).
- Sửa lời hứa ở landing; thuộc #13.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Ghi nhận hạn mức ở server](./phase-01-ghi-nhan-han-muc-o-server.md) | Completed |
| 2 | [Phase 2: Hiển thị điểm còn lại](./phase-02-hien-thi-diem-con-lai.md) | Completed |

## Acceptance Criteria
- [x] Full Test trừ 3 điểm, mỗi Part trừ 1 điểm, tối đa 3 điểm/ngày (không cộng dồn qua ngày).
- [x] Điểm đặt lại lúc 00:00 theo giờ Việt Nam (`Asia/Ho_Chi_Minh`, `UTC+7`).
- [x] Hết trần toàn hệ thống (`FREE_DAILY_BUDGET_VND`) thì học viên miễn phí chờ hôm sau; học viên trả phí (`entitlement === "paid"`) không bị chặn; người chỉ mua gói lẻ "Theo lượt" vẫn là `"free"` nên chịu cả hai giới hạn.
- [x] Hai yêu cầu đồng thời không thể vượt hạn mức (cả 3 điểm cá nhân lẫn trần hệ thống).
- [x] Học viên thấy điểm còn lại, số điểm từng chế độ, giờ đặt lại và thông báo trung tính khi chạm trần hệ thống trước khi bắt đầu.

## Quyết định đã chốt (PO Validation 2026-11-14)

- **A1 — Bảng quy đổi điểm & chi phí ước tính trên tất cả chế độ & D-05 North Star (`retakeOf`):**
  - Mock: `full = 3 điểm / 2.500đ`, `part1 | part2 | part3 = 1 điểm / 1.000đ`.
  - Forecast cả chủ đề: `Part 1 = 1 điểm / 3.000đ`, `Part 2&3 = 2 điểm / 4.500đ` (suy từ `topic.part` phía server, không tin `input.mode` từ client).
  - Forecast câu lẻ (`topicId + questionKey`): `1 điểm / 1.000đ`.
  - Luyện lại câu yếu nhất (`retakeOf`): **`0 điểm` cá nhân cho lần retake đầu tiên của bài gốc** (`sourceAttempt.retakeOfAttemptId === null` và chưa có reservation retake `active` nào cho bài gốc đó), **`1 điểm` từ lần retake thứ 2 hoặc retake-of-retake**; luôn tính `1.000đ` vào `FREE_DAILY_BUDGET_VND`.
- **A2 — Không cộng dồn, hoàn điểm khi `failed` & đặt chỗ lại khi `scoring.retry`:**
  - Không cộng dồn điểm qua ngày; đặt lại `00:00` giờ Việt Nam (`Asia/Ho_Chi_Minh`, `UTC+7`).
  - Tự động hoàn điểm cá nhân (`status = 'released'`) khi `attempt_score` chuyển sang `failed` (cả 3 nhánh: `scoreAttempt` terminal catch, `markScoreFailed`, `requeueStaleScores`), **tối đa 3 lần hoàn điểm/học viên/ngày VN**, và giữ nguyên chi phí trong `sunk_cost_vnd` khi đã gọi AI ngoài (`tries > 0`). Worker trễ về đích `done` sẽ thu hồi lại hoàn điểm (`reclaimOnLateDone`).
  - `scoring.retry`: nhánh chấm lại thủ công (`existing` row `failed`) đặt chỗ lại điểm + ngân sách ngày hiện tại cho user `"free"`; nhánh cứu hộ (`!existing` trên bài đã `submitted`) miễn trừ hạn mức.
- **A3 — Trần ngân sách ngày & TTL giữ chỗ `in_progress`:**
  - Giữ `FREE_DAILY_BUDGET_VND = 33000` mặc định (theo P90 COGS #130). Parse chặt: chuỗi rỗng/undefined -> `33000`, số nguyên `^\d+$` -> giá trị nguyên (hỗ trợ `"0"` để khoá trần), sai định dạng/âm -> fail-closed `0`.
  - Bài `in_progress` chưa nộp quá **30 phút** (`1_800_000 ms`) tự nhả giữ chỗ ngân sách toàn cục (không hoàn điểm cá nhân để chống giữ chỗ ảo). Nếu sau 30 phút (hoặc qua ngày VN) học viên mới bấm nộp, `attempt.submit` kiểm tra & gia hạn giữ chỗ ngân sách nguyên tử trước khi chuyển `submitted`.

## Red Team Review

Đợt rà soát bởi 2 subagent (`Red Team Assumption Destroyer` & `Red Team Security Adversary`) + rà soát nhất quán toàn plan: 10 phát hiện đã được PO phê duyệt và tích hợp:

1. **Nguyên tử `reserve + attempt.insert` trong `db.batch`:** Không tách riêng insert `attempt` sau khi `reserve`, tránh tạo bài `in_progress` "mồ côi" khi vượt hạn mức hoặc làm kẹt `attempt.getActive`.
2. **Sửa tên router/symbol thật:** Codebase dùng `scoring.retry` (`packages/api/src/routers/scoring.ts`), không có `routers/results.ts`; hàm thời gian VN tái sử dụng quy ước `startOfVietnamDayMs` (`packages/api/src/scoring/retry-limits.ts`).
3. **Bao phủ đủ cả 3 đường chuyển `failed` + late-`done`:** `scoreAttempt` terminal catch, `markScoreFailed` (queue dead-letter), `requeueStaleScores` (timeout cron), và `reclaimOnLateDone` trong `runPipeline`.
4. **Suy giá từ `topic.part` phía server:** Ngăn giả mạo `mode: "part1"` cho đề Forecast Part 2&3.
5. **Bảo vệ D-05 North Star `retakeOf` nhưng chặn lạm dụng:** Lần retake đầu tiên của bài gốc là 0 điểm (nhưng vẫn chịu trần ngân sách 1.000đ); lần thứ 2 hoặc retake dây chuyền tốn 1 điểm.
6. **Chống rút kiệt ngân sách bằng `failed` lặp (`tries > 0`) & giới hạn 3 lần hoàn/ngày:** Giữ `sunk_cost_vnd` trong trần ngày khi đã gọi AI; trần 3 lần hoàn/ngày chống farm lỗi cố ý.
7. **Không tạo FK từ `quota_reservation.attempt_id` -> `attempt.id` + anonymize `user_id` trong `eraseUserData`:** Cho phép `reserve` chạy trước trong `db.batch` khi `PRAGMA foreign_keys = ON`, và xoá tài khoản không làm mất dấu kế toán ngân sách trong ngày.
8. **Không lộ số VND nội bộ qua tRPC:** `quota.status` chỉ trả boolean `globalCapReached` và `globalRemainingCanAfford.*`, tuyệt đối không trả VND.
9. **TTL giữ chỗ 30 phút cho `in_progress` + re-check ở `attempt.submit`:** Chống giữ chỗ ngân sách bằng tab bỏ dở mà không hoàn điểm ảo.
10. **Tương thích test frontend & luồng offline:** `useQuotaStatus()` an toàn khi thiếu `QueryClientProvider` hoặc khi `slice-b.test.tsx` mock `useQuery` trả mảng; `useExamSession` chặn riêng `QUOTA_EXCEEDED`/`GLOBAL_CAP_REACHED` thành màn hình báo hạn mức thay vì rơi vào `local_only`.

## Validation Log

### Session 1 — 2026-11-14
- **Q1 (Bảng điểm & retakeOf):** PO chọn phương án khuyến nghị — Mock Full `3đ`, Part `1đ`, Forecast P1 `1đ`, Forecast P2&3 `2đ`, câu lẻ `1đ`, lần retake đầu bài gốc `0đ` (luôn tính `1.000đ` trần hệ thống), retake thứ 2+ `1đ`.
- **Q2 (Hoàn điểm khi `failed` & `scoring.retry`):** PO chọn phương án khuyến nghị — Hoàn điểm cá nhân tối đa `3 lần/ngày`, giữ `sunk_cost_vnd` khi `tries > 0`, `scoring.retry` đặt chỗ lại (cứu hộ `!existing` miễn trừ), đặt lại `00:00` giờ VN không cộng dồn.
- **Q3 (`FREE_DAILY_BUDGET_VND` & TTL `in_progress`):** PO chọn phương án khuyến nghị — Giữ `33000` mặc định, P90 COGS #130, nhả giữ chỗ ngân sách toàn cục sau `30 phút` chưa nộp và kiểm tra lại ở `attempt.submit`.
- **Q4 (Áp dụng 10 phát hiện Red Team):** PO phê duyệt cập nhật plan và triển khai `/ak-vibe --ship --beta --advice`.

<!-- slug: wi14-free-quota -->
