## Báo Cáo Tư Vấn Kỹ Thuật — Hardening export dữ liệu & giới hạn tham số D1 (`data-registry.ts`)

Đã hoàn thành kiểm chứng codebase + docs Cloudflare và phỏng vấn xác nhận yêu cầu với Chủ sản phẩm cho **Issue #92**. Báo cáo đầy đủ: `plans/reports/92-hardening-export-d1-bind-advise.md`.

---

### 1. Phán quyết (Verdict)

Cả hai phát hiện đều **thật, đã kiểm chứng được**, và vấn đề (2) nghiêm trọng hơn vẻ ngoài:

- **Giới hạn bind parameter có thật và thấp:** D1 cho tối đa **100 bind parameters/query** ([docs chính thức](https://developers.cloudflare.com/d1/platform/limits/), cập nhật 2026-10-30). `inArray(scoreRun.attemptId, attemptIds)` vỡ ở lượt attempt thứ 101. Với hạn mức free **3 lượt/ngày** (WI-14), học viên dùng đều vượt mốc này sau ~34 ngày — không phải edge case. Lỗi tồn tại ở **4 chỗ**: `score_run.export` (dòng 128), `score_run.erase` (133), `attempt_answer.export` (166), `attempt_answer.erase` (172).
- **Leak trường vận hành có thật:** `attempt_score` và `score_run` export nguyên row (`model`, `tries`, `lastError`, `costUsd`, `inputTokens/outputTokens`, `payloadJson` — output thô từng run chấm), trong khi schema tự ghi score_run *"Never shown to the learner directly"* và PRD F-21 chỉ cam kết "toàn bộ dữ liệu lịch sử bài làm và bản gỡ băng". Cùng file đã có precedent projection đúng (`session`, `account`, `forecast_report`).
- **Rủi ro kề cận:** trần **50 MB/query result** của D1 hiệu lực từ 2026-11-04 — select-all `payloadJson` có thể chạm trần với học viên dùng nhiều.
- **Thời điểm tốt:** chưa có UI nào gọi `privacy.exportData` trong `apps/web`, đổi shape giờ chưa phá client nào.

**Hai quyết định đã chốt với Chủ sản phẩm:**
1. **Chính sách trường = A:** bỏ `score_run` khỏi export cá nhân; `attempt_score` chỉ export trường kết quả học viên. `score_run` vẫn bị xóa đầy đủ khi erase.
2. **Phạm vi sửa = cả 4 chỗ** IN-list (export + erase), không chỉ export theo đúng chữ issue.

---

### 2. Các bước triển khai khuyến nghị (Recommended Steps)

1. Thay 4 chỗ IN-list bằng **subquery**: `WHERE attempt_id IN (SELECT id FROM attempt WHERE user_id = ?)` — 1 bind param bất kể số attempt, không cần chia batch. Index đã có sẵn: `attempt_userId_idx`, `score_run_attemptId_idx`, `attempt_answer_attemptId_idx`.
2. Projection `attempt_score` export: chỉ `attemptId`, `status`, `overall`, `criteriaJson`, `oneLiner`, `createdAt`, `scoredAt`; bỏ `userId`, `model`, `tries`, `lastError`, `costUsd`, `updatedAt`.
3. `score_run` export trả `[]` + comment kỹ thuật (tham chiếu #92/OQ-6); viết convention 2–3 dòng ở đầu `DATA_REGISTRY` cho bảng kế tiếp (`push_subscription`).
4. Cập nhật `data-registry.test.ts`: fixture **120 attempts**, assert `toSQL().params.length <= 100` cho từng query, assert shape mới, assert `data.score_run` rỗng, assert erase sạch với >100 attempts.
5. Gate: `pnpm --filter web test ../../packages/api/src/data-registry.test.ts` + `pnpm check-types`.

**Đừng làm:** đừng chia batch 100 id (subquery xóa tận gốc, tránh thêm vòng lặp query trên trần 50 subrequests của Workers Free); đừng đưa `score_run` vào `NON_PERSONAL_TABLES` (nó gắn user và bắt buộc erase); đừng thêm cờ config export đầy đủ/rút gọn (YAGNI); đừng viết kết luận pháp lý vào code (phân loại cuối thuộc luật sư, OQ-6 hold).

---

### 3. Đánh đổi chính (Trade-offs)

- Học viên không nhận điểm từng run lẫn payload thô trong file export. Nếu OQ-6 kết luận phải cung cấp mọi dữ liệu phái sinh tự phục vụ, mở lại là một PR nhỏ (thêm projection `score_run`).
- Kênh chính thức cho điểm tranh chấp là `score_dispute`; bằng chứng ensemble xem phía vận hành.
- Path erase được sửa dù đang hold chưa nối router — lỗi đã kiểm chứng, nằm đúng các dòng đang sửa.

### 4. Chưa kiểm chứng (Unverified)

- `inArray(col, subquery)` trên drizzle **1.0.0-rc.5** chưa chạy thử trong session tư vấn (API có từ 0.x); xác nhận bằng check-types + test mới. Phương án thay thế: `innerJoin` (SELECT) / raw `sql` (DELETE).
- Hành vi D1 thật với >100 binds không tái hiện được trên test DB local (giới hạn thuộc lớp API D1); bằng chứng local tốt nhất là assert `params.length`.

---

### 5. Handoff Brief

```text
Objective: Sửa issue #92 — export dữ liệu cá nhân chỉ chứa trường của học viên và mọi query trong data-registry.ts không vượt giới hạn 100 bind parameters của D1.
Done means: (1) attempt_score export trả đúng 7 trường attemptId, status, overall, criteriaJson, oneLiner, createdAt, scoredAt; (2) score_run không còn row nào trong payload export nhưng eraseUserData vẫn xóa đầy đủ bảng này; (3) cả 4 chỗ IN-list dùng subquery theo userId thay vì danh sách id; (4) data-registry.test.ts có fixture >100 attempts, mọi query assert params.length <= 100 qua toSQL(), assert shape export mới và erase sạch; (5) pnpm check-types pass.
Out of scope: migration/đổi schema; đổi semantics erase; sửa các handler bảng khác trong DATA_REGISTRY; kết luận pháp lý (OQ-6); UI export trong apps/web.
Constraints: dùng pnpm (không npm/yarn); không sửa tay file trong packages/db/src/migrations hay routeTree.gen.ts; report/comment tiếng Việt; không deploy hay áp migration lên môi trường thật khi chưa được xác nhận.
Stop and ask only if: (1) test phát hiện subquery trả sai dữ liệu không giải thích được; (2) cần thao tác destructive (deploy, xóa dữ liệu, áp migration); (3) thay đổi lan ra ngoài data-registry.ts và test của nó.
```
