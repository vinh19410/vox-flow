# Báo Cáo Tư Vấn Kỹ Thuật (Advise Report)
## Issue #92: Hardening export dữ liệu attempt_score/score_run và giới hạn tham số D1 trong data-registry

- **Thời gian lập:** 2026-11-10
- **Trạng thái:** Đã xác nhận qua phỏng vấn với Chủ sản phẩm (2 quyết định chốt: chính sách trường export = A; phạm vi sửa = cả 4 chỗ)
- **Tài liệu tham chiếu:** Issue #92, PR #90, `packages/api/src/data-registry.ts`, `packages/db/src/schema/score.ts`, `packages/db/src/schema/attempt.ts`, `docs/_product/prd.md` (F-21, D-10), `docs/roadmap-work-items.md` (WI-11, WI-14), `docs/legal/oq-6-tu-van-luat-su.md`, [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) (cập nhật 2026-10-30)
- **Báo cáo rút gọn đăng lên issue:** `plans/reports/92-github-comment.md`

---

## 1. Phán quyết (Verdict)

Cả hai phát hiện trong issue đều **thật và đã kiểm chứng được**, và vấn đề (2) nghiêm trọng hơn vẻ ngoài của nó:

- **Giới hạn bind parameter là có thật và thấp:** D1 cho tối đa **100 bind parameters/query** (docs chính thức, kiểm tra ngày 2026-11-10). Query `inArray(scoreRun.attemptId, attemptIds)` vỡ ở lượt attempt thứ 101. Với hạn mức miễn phí đã chốt **3 lượt/ngày** (WI-14), một học viên dùng đều vượt mốc này sau **~34 ngày** — đây không phải edge case hiếm mà là người dùng hoạt động bình thường. Cùng lỗi tồn tại ở **4 chỗ**: `score_run.export`, `score_run.erase`, `attempt_answer.export`, `attempt_answer.erase`.
- **Leak trường vận hành là có thật:** `attempt_score` và `score_run` đang export nguyên row — gồm `model`, `tries`, `lastError`, `costUsd`, `inputTokens/outputTokens`, `payloadJson` (toàn bộ output thô của model từng run) — trong khi schema tự ghi chú score_run *"Never shown to the learner directly"*, và PRD F-21 chỉ cam kết tải "toàn bộ dữ liệu lịch sử bài làm và bản gỡ băng". File `data-registry.ts` đã có sẵn precedent projection đúng đắn (`session`, `account`, `forecast_report` đều select trường cụ thể); hai bảng chấm điểm là ngoại lệ lạc loát.
- **Rủi ro kề cận chưa nêu trong issue:** trần **50 MB/query result** của D1 có hiệu lực từ 2026-11-04. Export select-all `payloadJson` của học viên dùng nhiều có thể chạm trần này. Chốt chính sách A (bỏ `score_run` khỏi export) loại bỏ phần lớn rủi ro này luôn.
- **Thời điểm sửa là tối ưu:** chưa có UI nào trong `apps/web` gọi `privacy.exportData` (chỉ `getConsent` được dùng), nên đổi shape export hiện chưa phá client nào. Diff nhỏ (một file source + một file test).

Kết luận: **làm ngay, trong một PR nhỏ**, với hai quyết định đã chốt: (A) bỏ `score_run` khỏi export cá nhân, giữ nguyên erase; (2) sửa cả 4 chỗ IN-list, không chỉ export.

---

## 2. Những việc NÊN LÀM (What you should do)

1. **Thay 4 chỗ IN-list bằng subquery theo userId** trong `packages/api/src/data-registry.ts`:
   - Thêm helper: `userAttemptIdSubquery(db)` trả về `db.select({ id: attempt.id }).from(attempt).where(eq(attempt.userId, userId))`.
   - Thay `inArray(scoreRun.attemptId, attemptIds)` bằng `inArray(scoreRun.attemptId, subquery)` (và tương tự cho `attemptAnswer.attemptId`) ở cả export lẫn erase. SQL sinh ra: `WHERE attempt_id IN (SELECT id FROM attempt WHERE user_id = ?)` — **1 bind param bất kể số attempt**.
   - Drizzle 1.0-rc.5 hỗ trợ subquery trong `inArray` (xem Unverified). Index đã có sẵn để plan tốt: `attempt_userId_idx`, `score_run_attemptId_idx`, `attempt_answer_attemptId_idx`.
2. **Projection `attempt_score` export** chỉ trả trường kết quả của học viên: `attemptId`, `status`, `overall`, `criteriaJson`, `oneLiner`, `createdAt`, `scoredAt`. Bỏ `userId` (dư thừa, đã có trong envelope), `model`, `tries`, `lastError`, `costUsd`, `updatedAt`.
3. **`score_run` khỏi payload export nhưng giữ trong registry:** `export` trả `[]` kèm comment kỹ thuật nêu lý do (bảng phái sinh nội bộ, ensemble chưa qua trung vị; xóa đầy đủ qua erase + FK cascade) và tham chiếu #92 / OQ-6. Đồng thời viết 2–3 dòng convention ở đầu `DATA_REGISTRY`: bảng hướng học viên → export có projection; bảng phái sinh nội bộ → giữ erase, export rỗng — để bảng kế tiếp (`push_subscription` theo quyết định email-push-provider.md) theo đúng khuôn.
4. **Cập nhật `data-registry.test.ts`:**
   - Fixture user1 với **120 attempts** (insert batch một lần).
   - Assert `exportUserData` thành công; với mỗi query builder liên quan, assert `query.toSQL().params.length <= 100` — đây là bằng chứng local được (test DB SQLite local không enforce giới hạn của D1, xem Unverified).
   - Assert shape mới của `attempt_score` (đúng 7 trường, không còn `model`/`costUsd`/`lastError`/`tries`).
   - Assert `data.score_run` rỗng; thay assertion cũ `toHaveLength(2)`.
   - Assert `eraseUserData` xóa sạch `score_run` + `attempt_answer` của user1 với 120 attempts.
5. **Chạy gate:** `pnpm --filter web test ../../packages/api/src/data-registry.test.ts` (đường dẫn tính từ `apps/web`) và `pnpm check-types`.
6. **PR tham chiếu issue #92**, mô tả tiếng Việt theo precedent repo. Ghi chú kỹ thuật trong code, không viết kết luận pháp lý (OQ-6 đang hold).

---

## 3. Những việc KHÔNG NÊN LÀM (What you shouldn't do)

- **Đừng chia batch (chunk 100 id)** dù cách diễn đạt trong issue gợi ý hướng này: subquery xóa tận gốc cả lớp lỗi, không thêm vòng lặp query (Workers Free chỉ có 50 subrequests/invocation), không thêm hằng số thần kỳ. Chunk chỉ cần khi bắt buộc phải IN-list id đã có sẵn ngoài DB — ở đây không có trường hợp đó.
- **Đừng đưa `score_run` vào `NON_PERSONAL_TABLES`:** record đó là tài liệu cho bảng không gắn với user (`forecast_topic`, `forecast_source`, `verification`). `score_run` có quan hệ trực tiếp với học viên (qua `attempt`) và **bắt buộc phải erase** — đưa vào nhầm sẽ phá quyền xóa dữ liệu.
- **Đừng thêm cờ config "export đầy đủ / rút gọn":** YAGNI. Nếu OQ-6 kết luận khác, mở lại projection là một diff nhỏ trong một handler.
- **Đừng viết kết luận pháp lý** ("trường X không phải dữ liệu cá nhân theo luật…") vào comment code hay PR — phân loại cuối thuộc luật sư (OQ-6 hold). Chỉ ghi rationale kỹ thuật/sản phẩm.
- **Đừng sửa `attempt_answer` export fields:** toàn bộ trường của nó là nội dung học viên (questionText, transcript, audioKey, durationMs) — đúng thứ PRD cam kết ("bản gỡ băng"); chỉ đổi cách query.
- **Đừng đụng migration, `routeTree.gen.ts`, hay các handler bảng khác** — phạm vi đã chốt là 2 bảng + 4 query.

---

## 4. Phương án hiệu quả hơn / đơn giản hơn (What could be better)

- Không có đường nào rẻ hơn mà vẫn đạt mục tiêu: tổng công việc là ~40 dòng đổi trong một file + cập nhật test. Bỏ erase khỏi phạm vi (đã bị loại trong phỏng vấn) chỉ tiết kiệm được 2 dòng đổi nhưng để lại lỗi đã biết.
- Nhóm các DELETE của erase vào `db.batch()` (đếm là 1 query cho trần subrequest) là micro-opt không cần thiết: `eraseUserData` chạy 11 query tuần tự trên path hiếm và đang hold — đừng làm.
- Trần 50 MB/query result: sau khi bỏ `payloadJson` khỏi export, trường lớn nhất còn lại là `criteriaJson`/`transcript` — người học thực tế không lại gần 50 MB/query. Chỉ quay lại xem xét phân trang export khi có ca thật.

---

## 5. Lộ trình đề xuất (My take and how to get there)

Làm ngay trong một PR duy nhất: helper subquery → projection `attempt_score` → `score_run` export rỗng + convention comment → test fixture 120 attempts → gate test + check-types → PR `Closes #92`. Không chờ WI-13 (chấm điểm) scale lên, vì export đã live từ WI-11 và bom nổ 100-attempt đã dùng được trong ~5 tuần đối với học viên free dùng đều.

---

## 6. Lợi ích (Benefits)

- File export trả đúng dữ liệu của học viên; không lộ cost/token/model/queue-error — nhất quán với precedent `session`/`account` ngay trong cùng file.
- Export và erase không vỡ theo thời gian sử dụng; path pháp lý quyền xóa dữ liệu không gãy đúng lúc được kích hoạt (OQ-6).
- Giải tỏa luôn rủi ro trần 50 MB/query result (hiệu lực 2026-11-04) phần liên quan đến `payloadJson`.

---

## 7. Đánh đổi (Trade-offs)

- **Học viên không nhận điểm từng run lẫn payload thô của model** trong file export. Điều kiện đảo chiều: nếu kết luận luật sư (OQ-6) yêu cầu cung cấp mọi dữ liệu phái sinh trong cơ chế tự phục vụ — chi phí quay lại là một PR nhỏ (thêm projection cho `score_run`).
- Học viên mất "bằng chứng thô" tự kiểm chứng điểm; kênh chính thức cho điểm tranh chấp là `score_dispute` (bằng chứng ensemble xem phía vận hành khi xử lý dispute).
- Path erase được sửa dù hiện chưa nối router (hold OQ-6) — tốn chút công trên path chưa live, nhưng lỗi đã kiểm chứng và nằm đúng các dòng đang sửa.
- Subquery khó đọc hơn danh sách id một chút — giảm thiểu bằng helper có tên gọi rõ.

---

## 8. Chưa kiểm chứng (Unverified)

- **`inArray(col, subquery)` trên drizzle 1.0.0-rc.5:** API này có từ các bản 0.x; phiên bản rc trong repo chưa chạy thử trong session này. Xác nhận bằng `pnpm check-types` + test mới. Phương án thay thế nếu lỗi: `innerJoin` cho 2 SELECT, raw `sql` template cho 2 DELETE.
- **Hành vi D1 thật với >100 binds không tái hiện được local:** test DB SQLite không enforce giới hạn 100 bind của D1 (giới hạn thuộc lớp API của D1). Con số 100 lấy từ docs chính thức. Bằng chứng local tốt nhất là assert `toSQL().params.length`.
- **Phân bố số attempt/user trong production chưa có dữ liệu** (không query DB thật trong session); giả định ">100 khả thi" dựa trên hạn mức free 3/ngày đã chốt.

---

## 9. Work Checklist, Success Metrics & Handoff Brief

**Work checklist:**

- [ ] Thêm helper subquery attempt-theo-user; thay 4 chỗ IN-list (`score_run` export/erase, `attempt_answer` export/erase)
- [ ] Projection `attempt_score` export theo đúng 7 trường đã chốt
- [ ] `score_run` export trả `[]` + comment kỹ thuật; viết convention 2–3 dòng ở đầu `DATA_REGISTRY`
- [ ] Cập nhật `data-registry.test.ts`: fixture 120 attempts, assert `params.length <= 100`, assert shape mới, assert erase sạch
- [ ] Chạy `pnpm --filter web test ../../packages/api/src/data-registry.test.ts` và `pnpm check-types`
- [ ] PR tham chiếu #92 (tiếng Việt); đăng POT lên issue nếu thực thi qua ak-vibe/ak-atoz

**Success metrics:**

- Test export/erase pass với fixture 120 attempts; mỗi query ≤ 100 bind params (`toSQL().params.length`).
- Export payload không chứa `model`, `costUsd`, `lastError`, `tries`, `payloadJson` (assert trong test).
- `pnpm check-types` pass.

**Handoff brief:**

```text
Objective: Sửa issue #92 — export dữ liệu cá nhân chỉ chứa trường của học viên và mọi query trong data-registry.ts không vượt giới hạn 100 bind parameters của D1.
Done means: (1) attempt_score export trả đúng 7 trường attemptId, status, overall, criteriaJson, oneLiner, createdAt, scoredAt; (2) score_run không còn row nào trong payload export nhưng eraseUserData vẫn xóa đầy đủ bảng này; (3) cả 4 chỗ IN-list dùng subquery theo userId thay vì danh sách id; (4) data-registry.test.ts có fixture >100 attempts, mọi query assert params.length <= 100 qua toSQL(), assert shape export mới và erase sạch; (5) pnpm check-types pass.
Out of scope: migration/đổi schema; đổi semantics erase; sửa các handler bảng khác trong DATA_REGISTRY; kết luận pháp lý (OQ-6); UI export trong apps/web.
Constraints: dùng pnpm (không npm/yarn); không sửa tay file trong packages/db/src/migrations hay routeTree.gen.ts; report/comment tiếng Việt; không deploy hay áp migration lên môi trường thật khi chưa được xác nhận.
Stop and ask only if: (1) test phát hiện subquery trả sai dữ liệu không giải thích được; (2) cần thao tác destructive (deploy, xóa dữ liệu, áp migration); (3) thay đổi lan ra ngoài data-registry.ts và test của nó.
```
