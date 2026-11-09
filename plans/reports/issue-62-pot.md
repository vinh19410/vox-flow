## Proof of Test (POT) — Issue #62

- **PR:** [#63](https://github.com/vinh19410/vox-flow/pull/63)
- **Branch:** `feat/forecast-single-question-practice`
- **Commit SHA:** `7d83555`
- **Isolated Review:** PASS (`IsolatedFinalReview` sub-session)

---

### Bằng chứng nghiệm thu từng tiêu chí (Done-Means Verification)

#### 1. Schema SQLite & Drizzle Migration
- **Thay đổi:** Thêm cột `topic_id`, `question_key` và index `attempt_topicId_idx` vào bảng `attempt` trong `packages/db/src/schema/attempt.ts`.
- **Migration:** Sinh migration `20261109041504_tidy_maestro/migration.sql` bằng `pnpm --filter @vox-flow/db db:generate`.
- **Bằng chứng:**
  ```sql
  ALTER TABLE `attempt` ADD `topic_id` text;--> statement-breakpoint
  ALTER TABLE `attempt` ADD `question_key` text;--> statement-breakpoint
  CREATE INDEX `attempt_topicId_idx` ON `attempt` (`topic_id`);
  ```

#### 2. Router `attempt.start` (Backend Validation & Persistence)
- **Thay đổi:** `packages/api/src/routers/attempt.ts` nhận `topicId` và `questionKey`, xác thực bằng regex `QUESTION_KEY_RE = /^[a-zA-Z0-9_-]+$/`, ràng buộc `.refine` `questionKey` bắt buộc phải đi kèm `topicId`, lưu vào SQLite và tôn trọng cờ `inHistory`.
- **Bằng chứng:** Test suite `packages/api/src/routers/attempt.test.ts` (6/6 pass):
  ```bash
  ✓ attemptRouter > records topicId and questionKey when starting a single-question practice attempt (2581ms)
  ✓ attemptRouter > validates topicId and questionKey: rejects single field or invalid questionKey (2364ms)
  ```

#### 3. Client State & Storage (`practicedQuestions`)
- **Thay đổi:** `AppState` lưu trữ `practicedQuestions: Record<string, QuestionPracticeRecord>`, validate qua `Zod` trong `store.tsx`, hydrate và persist vào `sessionStorage`.
- **Bằng chứng:** Test suite `apps/web/src/features/app-state/__tests__/state-and-data.test.ts`:
  ```bash
  ✓ useAppStateStore & ProtoToast > persists practicedQuestions and rehydrates correctly
  ```

#### 4. Giao diện `TopicDetailModal`
- **Thay đổi:** Từng câu hỏi Part 1 và Part 3 hiển thị Badge Band điểm (màu sắc đối chiếu theo mục tiêu `target` của học viên) và số lần luyện (`{count} lần luyện`). Câu chưa luyện có nút `Luyện câu này` (icon `Mic`), câu đã luyện có nút `Luyện lại` (icon `RotateCcw`). Phần Part 2 Cue Card không có nút chọn lẻ.
- **Bằng chứng:** Test trong `apps/web/src/features/forecast/__tests__/forecast-flow.test.tsx`:
  ```bash
  ✓ Forecast practice flow > displays question history badge and allows starting single-question practice in Part 1 (707ms)
  ```

#### 5. Footer "Luyện cả chủ đề này"
- **Thay đổi:** Nút CTA ở footer modal tiếp tục gọi `start(open)` với toàn bộ câu hỏi của chủ đề.
- **Bằng chứng:** Test case trong `forecast-flow.test.tsx`:
  ```bash
  ✓ Forecast practice flow > starts practice session from a Part 1 topic and navigates to /exam (1251ms)
  ✓ Forecast practice flow > starts practice session from a Part 2 & 3 topic and navigates to /exam (829ms)
  ```

#### 6. Luyện 1 câu Part 3 độc lập (bỏ qua Cue Card)
- **Thay đổi:** Khi chọn câu hỏi Part 3, khởi tạo `items: [item]` với `cue: undefined`, `steps` chỉ có 1 câu Part 3, ghi nhận history mode: `p3` (client) và `part3` (server).
- **Bằng chứng:** Test case trong `forecast-flow.test.tsx`:
  ```bash
  ✓ Forecast practice flow > starts single Part 3 question practice omitting Part 2 cue card (488ms)
  ```

#### 7. ScoringScreen & ResultsScreen
- **Thay đổi:** `ScoringScreen` chỉ cập nhật điểm vào `practicedQuestions[qId]`, không ghi đè `practiced[topicId]`. `ResultsScreen` hiển thị nút `Luyện câu kế tiếp trong chủ đề` và `Quay lại chủ đề` (tự động mở lại modal chủ đề trong `ForecastScreen`). Các nút này gắn liền với phiên luyện vừa hoàn thành, không hiển thị trên các attempt cũ trong Lịch sử và được dọn dẹp khi bấm `Thi lại`.
- **Bằng chứng:** Test case trong `forecast-flow.test.tsx`:
  ```bash
  ✓ Forecast practice flow > updates practicedQuestions and assigns mode p1 or p3 when single question scoring finishes
  ✓ Forecast practice flow > allows navigating to next question from ResultsScreen when practicing single question
  ✓ Forecast practice flow > does not show single-question practice CTA when viewing an arbitrary historical attempt
  ✓ Forecast practice flow > reopens topic modal automatically when returning from ResultsScreen via lastPracticeSession
  ```

#### 8. Minh bạch điểm Mock (OQ-5)
- Hệ thống áp dụng điểm mô phỏng chuẩn `RESULT.overall = 6.5` và 4 tiêu chí nhất quán trong client prototype, không giả lập AI audio chấm thời gian thực khi dịch vụ nhận dạng âm thanh đang chờ thử nghiệm theo roadmap OQ-5.

---

### Kết quả chạy kiểm thử (Gates Output)

```bash
# 1. Typecheck toàn monorepo (8 packages)
pnpm check-types
✓ turbo run check-types -> 7 successful, 7 total (0 errors)

# 2. Test suite toàn monorepo
pnpm test
✓ @vox-flow/api: 16 test files, 115 passed (115/115)
✓ apps/web: 17 test files, 154 passed (154/154)
✓ apps/server: 1 test file, 17 passed (17/17)
Tổng cộng: 286/286 tests passed (100%)
```

---

### Ghi nhận trạng thái chưa kiểm chứng (Unverified Notice)
- **Ảnh chụp giao diện thật (Live UI Screenshots):** Do môi trường Cloudflare Alchemy local emulator (`@vox-flow/infra run dev`) yêu cầu cấu hình Cloudflare runtime chưa khởi động được trong phiên làm việc local, toàn bộ bằng chứng UI được xác thực qua **test harness Vitest và DOM integration tests**. Giao diện thật trên trình duyệt thực tế được ghi nhận là **chưa kiểm chứng trực tiếp bằng screenshot PNG**.
