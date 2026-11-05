---
phase: 1
title: "API luyện đề"
status: pending
priority: P2
effort: ""
dependencies: []
---

# Phase 1: API luyện đề

## Goal
Học viên đọc được đề và lưu tiến độ.

## Files to Create / Modify
- Create: `packages/api/src/routers/forecast.ts`
- Modify: `packages/api/src/routers/index.ts`
- Modify: `packages/db/src/schema/forecast.ts` (kế thừa bảng `forecast_topic` từ #23, thêm `forecast_saved` và `forecast_report`)
- Modify: `packages/api/src/routers/attempt.ts` (kế thừa từ #16)
- Modify: `packages/api/src/data-registry.ts`
- Modify: `packages/db/src/schema/attempt.ts` (kế thừa từ #16)

## Tasks & Steps

### Task 1.0 — Kiểm tra điều kiện bắt đầu
- Goal: mọi điều kiện cần có đều đã sẵn sàng trước khi đụng tới code hay tài liệu.
- Target files and symbols: không sửa file.
- Steps:
  1. Chạy lệnh trong Verify.
  2. Nếu có dòng khác `CLOSED`, dừng lại và báo người giao việc. Đây là chờ phụ thuộc, không phải lỗi cần sửa.
- Success criteria: các điều kiện được xác nhận.
- Verify: `for n in 16 17 18 19 23; do gh issue view $n --json state -q .state; done` in `CLOSED` trên mọi dòng.

### Task 1.1 — Tạo router `forecast`.
- Goal: Tạo router `forecast` an toàn, chống lộ đề và tuân thủ đăng ký dữ liệu cá nhân.
- Target files and symbols: `packages/api/src/routers/forecast.ts` (`list`, `toggleSaved`, `coverage`, `report`), `packages/api/src/data-registry.ts`, `packages/db/src/schema/forecast.ts`; test: `packages/api/src/routers/forecast.test.ts`, `packages/api/src/data-registry.test.ts`
- Steps:
  1. `list`: Thủ tục công khai (`publicProcedure`), lọc `where(and(eq(forecastTopic.status, 'published'), eq(forecastTopic.quarter, currentQuarter)))`. Trả về metadata của quý (`currentQuarter: { label, range, updated }`) thay thế `data.ts`. Chỉ trả catalog tóm tắt (`id`, `title`, `kind`, `category`, `tag`, `reports`, `lastSeen`), không trả nội dung câu hỏi chi tiết, gợi ý cue card hay câu trả lời mẫu Band 8.0 trong danh mục để chống lộ đề và scrape.
  2. `coverage`: Thủ tục được bảo vệ (`protectedProcedure`), lọc nghiêm ngặt theo `where(and(eq(attempt.userId, ctx.session.user.id), eq(attempt.status, 'completed'), isNotNull(attempt.topicId)))`. Tính `COUNT(DISTINCT attempt.topicId)` phân tách theo `kind: 'p1'` và `'p23'`. Trả về cả danh sách `practicedTopicIds` kèm điểm cao nhất để client hiển thị badge chính xác.
  3. `toggleSaved`: Thủ tục được bảo vệ (`protectedProcedure`), thao tác trên bảng `forecast_saved` với ràng buộc duy nhất `UNIQUE(user_id, topic_id)`. Xử lý lưu/hủy lưu một cách idempotent (sử dụng `ON CONFLICT DO NOTHING` / `DELETE`).
  4. `report`: Thủ tục được bảo vệ (`protectedProcedure`), ghi nhận báo cáo vào bảng `forecast_report` với ràng buộc duy nhất `UNIQUE(user_id, topic_id)` để chống spam hoặc thao túng số liệu; cập nhật số lượng báo cáo thật `reports`.
  5. Thêm định nghĩa bảng `forecast_saved` và `forecast_report` vào schema, chạy `pnpm --filter @vox-flow/db db:generate`.
  6. Đăng ký đầy đủ `forecast_saved` và `forecast_report` vào `packages/api/src/data-registry.ts` với đầy đủ handler `export` (trích xuất danh sách topic đã lưu của user) và `erase` (xóa bản ghi khi có yêu cầu xóa tài khoản) theo đúng hợp đồng `TablePersonalDataHandler`.
  7. Viết test: `forecast.test.ts` (không thấy đề nháp/quý cũ, không lộ full items, lưu đề và tính coverage chuẩn) và `data-registry.test.ts`.
- Success criteria: Test router và test data-registry đều qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/forecast.test.ts && pnpm --filter @vox-flow/api test src/data-registry.test.ts` thoát với mã 0.

### Task 1.2 — Cho lượt thi nhận chủ đề và trừ hạn mức chính xác.
- Goal: Cho lượt thi nhận chủ đề qua `attempt.start`, xác thực quyền và trừ hạn mức đúng loại đề.
- Target files and symbols: `packages/api/src/routers/attempt.ts` (`start`), `packages/db/src/schema/attempt.ts`; test: `packages/api/src/routers/attempt.test.ts`
- Steps:
  1. Thêm cột `attempt.topicId` và tham số đầu vào `topicId`.
  2. Nếu có `topicId`: server kiểm tra đề tồn tại và có `status: 'published'`. Truy xuất loại đề (`kind: 'p1'` hoặc `'p23'`) từ CSDL thay vì tin cậy tham số từ client.
  3. Khấu trừ hạn mức chuẩn xác qua pipeline của #18 / kiểm tra gói của #17: đề `p1` trừ 1 điểm, đề kết hợp `p23` trừ 2 điểm. Nếu người dùng không đủ hạn mức hoặc gói, trả lỗi `QUOTA_EXCEEDED`.
  4. Lượt luyện đi qua `attempt.start`, lưu liên kết `topicId` thật, không gọi `reserve` trực tiếp, và đi qua pipeline chấm của #17.
- Success criteria: Test lượt luyện và khấu trừ hạn mức qua.
- Verify: `pnpm --filter @vox-flow/api test src/routers/attempt.test.ts` thoát với mã 0.
## Verification
Mọi Verify trong phase này đều đạt đúng điều kiện đã nêu.

## Failure Protocol
If any Verify step does not meet its stated pass condition, STOP this phase.
Do not improvise a fix, retry blindly, or reason around the failure.
Spawn the `kongming` subagent for next-step counsel and pass:
- the phase and task id,
- what you attempted (the steps you ran),
- the exact command and its full output,
- the pass condition it failed to meet.
Apply kongming's guidance, then re-run the Verify step.
If `kongming` cannot be spawned in this environment, STOP and report the same
failure evidence to the user. Never continue by self-reasoning.
