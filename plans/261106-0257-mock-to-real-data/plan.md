---
title: "Chuyển 8 nhóm mock data của `_proto` sang dữ liệu thật / API"
description: "Plan umbrella: tự sở hữu phần nền và các khoảng trống chưa có chủ, còn lại truy vết sang các plan WI đã có, để không còn dữ liệu giả lọt vào bản production."
status: pending
priority: P1
effort: 5d
issue: 49
branch: dev
tags: [frontend, backend, api, tech-debt, advice]
blockedBy: []
blocks: []
created: 2026-11-06
---

# Chuyển 8 nhóm mock data sang dữ liệu thật / API

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Giao diện `_proto` không còn hiển thị số liệu, tên, điểm, QR hay lịch sử giả trên bản production. Mỗi nhóm mock hoặc đọc dữ liệu thật từ API, hoặc hiện trạng thái "sắp có" khi tính năng còn bị hold.

## Phạm vi và cách chia việc
Plan này **chỉ tự sở hữu phần nền (phase 1) và 3 khoảng trống chưa có chủ (G1, G2, G3)**. Sáu nhóm còn lại đã có plan WI riêng, nên chỉ được truy vết ở bảng dưới. Không viết lại bước của các WI trong plan này.

### Bảng truy vết 8 nhóm

| # | Nhóm mock | File mock hiện tại | Chủ sở hữu | Trạng thái chặn | Điều kiện để xóa mock |
|---|---|---|---|---|---|
| 1 | Chấm điểm & kết quả | `features/results/data.ts`, `results/review-data.ts`, `scoring/data.ts` | WI13 (#17) `261105-0910-wi13-scoring-results` | Hold WI03 (#7, OQ-5): chưa chọn dịch vụ ASR + AI | Pipeline chấm ghi kết quả vào D1; trong lúc chờ, phase 5 hiện "sắp có" |
| 2 | Đề thi & câu hỏi | `features/exam/data.ts` (`ITEMS`, `MODES`, `PART_INFO`), `use-exam-session.ts` | **Plan này, G1 (phase 2)** | Không bị hold chặn | Phase 2 xong |
| 3 | Lịch sử luyện tập | `features/history/data.ts` (`HISTORY`) | WI18 (#22) `261105-0910-wi18-progress-history` | Chờ WI13 | Phase 1 bỏ nạp `HISTORY` khỏi state; WI18 thêm API và UI thật |
| 4 | Hồ sơ & state toàn cục | `features/app-state/initial-state.ts`, `store.tsx` | WI10 (#14) lo bảng `user_profile`; **plan này, G2 (phase 3)** lo hydrate state | WI07 (#11) cho session thật | Phase 1 + 3 xong |
| 5 | Forecast cho người dùng | `features/forecast/data.ts`, `topics-p1.ts`, `topics-p23.ts` | WI20 (#24) `261105-0910-wi20-forecast-practice` | Phần luyện kèm chấm chờ WI13 | WI20 nối `forecast.listPublished` |
| 6 | Auth `_proto` | `features/auth/auth-screen.tsx` | WI07 (#11) `261105-0910-wi07-google-login` | WI06 (#10) Cloudflare env | WI07 phase 2 |
| 7 | Thanh toán & gói | `features/billing/data.ts`, `fake-qr.tsx`, `payment-panel.tsx` | WI15 (#19), WI16 (#20) | WI08 (#12) SePay, WI13 | Hold: phase 5 ẩn lối vào thanh toán |
| 8 | Mic / giọng / chế độ | `onboarding/components/mic-check.tsx`, `hooks/use-mic-level.ts`, `VOICES`, `MODES` | **Plan này, G3 (phase 4)** cho mic; `MODES` ở phase 2; `VOICES` là cấu hình sản phẩm | Không bị hold chặn | Phase 4 xong |

Ghi chú về `VOICES`: giọng giám khảo hiện dùng Web Speech của trình duyệt (`lib/speech.ts`). PRD chưa chốt danh sách giọng (`[chưa có]`), nên giữ một hằng số cấu hình tĩnh. Đây là cấu hình sản phẩm, không phải nợ mock.

## Quyết định đã chốt (kongming)
- **Câu hỏi thi** nằm trong module tĩnh có kiểu ở `packages/api`, server tra theo `questionKey`. Chưa tạo bảng D1 `question_bank`: chưa có màn quản trị đề thi thử, và migration lên môi trường thật tốn chi phí. Khi cần sửa đề lúc runtime thì chuyển sang D1, giữ nguyên `key`.
- **Không dùng `forecast_topic`** cho đề thi thử, vì bảng đó có vòng đời draft/published/archived theo quý (D-04).
- **Tính năng bị hold**: không giữ mock sau cờ trên bản thật. Cờ tính năng mặc định **tắt**, UI hiện "sắp có" hoặc ẩn lối vào. Mock chỉ còn trong fixture của test và nhánh `import.meta.env.DEV`. Tiền lệ: `SCORE_DISPUTE_ENABLED`.
- `attempt.submit` giữ nguyên (đổi status). Màn kết quả khi cờ chấm điểm tắt hiện "đã lưu, đang chờ chấm".

## Bằng chứng đã kiểm trong mã
- Enum chế độ thi lệch: server `z.enum(["full","part1","part2","part3"])` (`packages/api/src/routers/attempt.ts:14`), còn web `MODES` dùng `"p1"|"p2"|"p3"` (`apps/web/src/features/exam/data.ts:3-8`). Nối thẳng sẽ lỗi zod.
- `uploadAnswer` nhận `questionText` từ client (`attempt.ts:94`), nên server đang tin văn bản câu hỏi do client gửi.
- Cờ dev hiện chỉ có `import.meta.env.DEV` (`routes/_proto/route.tsx:34`).

## Phases

| # | Phase | Chủ sở hữu | Phụ thuộc | Status |
|---|-------|-----------|-----------|--------|
| 1 | [Nền chung: cờ tính năng, bỏ mock khỏi state](./phase-01-nen-chung.md) | Plan này | – | Pending |
| 2 | [G1: Ngân hàng câu hỏi và chế độ thi](./phase-02-ngan-hang-cau-hoi.md) | Plan này | 1 | Pending |
| 3 | [G2: Hydrate state từ session](./phase-03-hydrate-state.md) | Plan này | 1 | Pending |
| 4 | [G3: Mic thật](./phase-04-mic-that.md) | Plan này | 1 | Pending |
| 5 | [Cổng chặn mock cho tính năng bị hold và đối soát](./phase-05-cong-chan-va-doi-soat.md) | Plan này | 1, 2, 3, 4 | Pending |

Thứ tự thực thi: 1 → 2 → 3 → 4 → 5. Sau đó các nhóm thuộc WI chạy theo lịch riêng: WI07 → WI10 → WI18; WI20 nối `listPublished` sớm (chỉ đọc); WI13 và mọi thứ phụ thuộc nó (WI14/15/16/18/20) xếp cuối, bị chặn bởi WI03.

## Constraints
- Dùng `pnpm`. Chạy một file test web: `pnpm --filter web test <đường-dẫn-từ-apps/web>`. Với server: `pnpm --filter @vox-flow/api test <đường-dẫn-từ-packages/api>`. Không dùng `test -- <tên>`.
- Không triển khai, không áp migration lên môi trường thật khi chưa được xác nhận. Plan này không thêm migration.
- Không sửa tay `apps/web/src/routeTree.gen.ts` hay file trong `packages/db/src/migrations`.
- Không đảo các quyết định trong `docs/roadmap-chamro.md` Mục 7.

## Non-goals
- Pipeline chấm điểm, thanh toán SePay, đăng nhập Google, bảng `user_profile`, API lịch sử: thuộc các WI ở bảng trên.
- Bảng D1 cho câu hỏi thi, màn quản trị đề thi thử.
- Transcript thật và follow-up AI thật: cần ASR của WI03; ngoài phạm vi.

## Acceptance Criteria
- [ ] `rg -n "Minh Anh|minhanh@" apps/web/src --glob '!**/*.test.*'` trả về 0 dòng.
- [ ] Mọi `id` của `MODES` ở web parse được bằng input schema của `attempt.start` (test dùng schema dùng chung, không chép enum).
- [ ] `uploadAnswer` với `questionKey` không có trong ngân hàng trả `BAD_REQUEST`, và `questionText` lưu là văn bản của server.
- [ ] Bản production không chứa chuỗi đặc trưng của mock (xem phase 5).
- [ ] `pnpm check-types` và các test đã chạy đều qua.

## Câu hỏi mở
- G3 (mic thật): `mic-check` nằm trong luồng onboarding của WI10. Plan này nhận phần mic và ghi chú vào WI10 (task 4.4) để hai bên không cùng làm.
- WI12 đã `completed` nhưng web vẫn dùng `ITEMS`. Plan này (G1) nhận phần còn lại, kèm ghi chú vào WI12 (task 2.8), thay vì mở lại WI12.
- Cần PO xác nhận: `_proto` sẽ là giao diện thật cho học viên (độ tin cậy: trung bình). Nếu chỉ dùng nội bộ, phase 5 có thể nới thành giữ mock sau `import.meta.env.DEV`.

<!-- slug: mock-to-real-data -->
