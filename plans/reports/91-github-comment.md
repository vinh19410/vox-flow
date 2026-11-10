## Báo Cáo Tư Vấn Kỹ Thuật (Advise Report) — Hardening Giới Hạn Chi Phí Chấm Điểm & Bộ Nhớ Worker

Đã hoàn thành khảo sát codebase, phân tích dữ liệu 178 chủ đề trong DB và phỏng vấn xác nhận yêu cầu kỹ thuật với Chủ sản phẩm cho **Issue #91**.

---

### 1. Phán quyết Kỹ thuật (Verdict)
Đợt hardening này là **bắt buộc và khẩn cấp** trước khi mở rộng người dùng cho tính năng chấm điểm thật. Khảo sát dữ liệu thực tế từ 178 chủ đề trong `seed-forecast.sql` cho thấy:
* **Part 1:** Có đề từ 4 đến **17 câu** (ví dụ: `The area you live in` có 7 câu; `Hometown` có 15 câu; `Studies` có 17 câu).
* **Part 2 & 3:** Gồm 1 cue card + các câu Part 3 phụ, có đề từ 2 đến **14 câu** (64 đề có 7 câu, một số đề có tới 14 câu).
* **Single-question Practice:** Khi luyện 1 câu đơn lẻ, `attempt.questionKey` được thiết lập và chỉ có tối đa 1–2 câu (gồm câu chính và câu follow-up `-f`).

Một trần cố định nhỏ (như 6 câu) sẽ **làm hỏng các đề thi hợp lệ** (trả về lỗi HTTP 400). Đồng thời, nếu không chuyển sang **tải transcription tuần tự**, việc tải song song 14–17 file audio từ R2 vào RAM Worker khi gọi Whisper (`Promise.allSettled`) chắc chắn sẽ gây OOM làm sập Cloudflare Worker (giới hạn cứng 128MB). Hơn nữa, việc thiếu cột `sizeBytes` trong `attempt_answer` khiến việc tính tổng dung lượng toàn bài bị thiếu chính xác khi học viên thu âm lại (upsert).

**Phương án tối ưu đã chốt:**
* **Xác thực số câu theo từng đề thi (Topic-aware Validation) qua Shared Key Helper:**
  * Xây dựng shared helper chuẩn trong `packages/api` để cả Web và Server cùng dùng chung logic sinh `validQuestionKeys` (`${id}-${i}`, `${id}-c`, `${id}-p3-${i}`) cùng các key follow-up (`${id}-f`).
  * **Trường hợp luyện cả đề:** Giới hạn danh sách `questionKey` hợp lệ theo đề thi (`{item.id} ∪ {item.id + "-f"}`), tối đa trần an toàn 18 câu.
  * **Trường hợp luyện 1 câu (`attempt.questionKey` có giá trị):** Thu hẹp danh sách cho phép về `{attempt.questionKey, attempt.questionKey + "-f"}` và giới hạn tối đa 2 câu.
* **Kế toán dung lượng ghi đè (Upsert-aware Accounting) với cột `sizeBytes`:**
  * Thêm cột `sizeBytes` vào `attempt_answer`.
  * Khi upload câu mới hoặc thu âm lại câu cũ: `newTotal = currentTotal - oldAnswerBytes + newBytes`. Trần tổng audio toàn bài là **$\le 35\text{MB}$** (trả về HTTP 413 nếu vượt quá).
* **Bắt buộc tuần tự hoá bước Transcription trong Worker:**
  * Thay `Promise.allSettled` bằng vòng lặp tuần tự: tải 1 file từ R2 $\rightarrow$ Whisper $\rightarrow$ lưu transcript $\rightarrow$ giải phóng buffer. Giữ RAM Worker luôn an toàn $< 30\text{MB}$.
* **Kiểm soát `scoring.retry`:**
  * Giới hạn tối đa **1 lần retry thủ công / bài** (`manualRetries < 1` trong `attempt_score`).
  * Giới hạn tối đa **3 lần retry thủ công / ngày / tài khoản** (theo múi giờ `Asia/Ho_Chi_Minh` qua bảng `scoring_retry_log`).
  * Vô hiệu hóa nút "Thử lại" trên UI và hiển thị hướng dẫn khi hết lượt.

---

### 2. Các bước triển khai khuyến nghị (Recommended Steps)
1. **Shared Key Helper:** Tạo `packages/api/src/scoring/forecast-keys.ts` chứa hàm sinh danh sách `validQuestionKeys` (hỗ trợ cả Part 1, Part 2/3, câu phụ `-f` và single-question practice).
2. **Schema Migration:** Thêm `sizeBytes` vào `attempt_answer`, `manualRetries` vào `attempt_score`, và tạo bảng `scoring_retry_log` (`id, userId, attemptId, createdAt`). Đăng ký vào `packages/api/src/data-registry.ts`.
3. **Upload Route Guard:** Sửa `apps/server/src/index.ts` kiểm tra `questionKey` theo shared helper, đếm số câu hợp lệ, và tính tổng dung lượng upsert-aware $\le 35\text{MB}$. Lưu trường `sizeBytes`.
4. **Submit Procedure Guard:** Sửa `packages/api/src/routers/attempt.ts` (`attempt.submit`) xác thực lại danh sách câu hợp lệ và tổng dung lượng $\le 35\text{MB}$ trước khi chuyển `status = 'submitted'`.
5. **Worker Sequential Transcription:** Sửa `packages/api/src/scoring/score-attempt.ts` thay thế `Promise.allSettled` bằng vòng lặp tuần tự tải R2 $\rightarrow$ transcribe $\rightarrow$ giải phóng buffer.
6. **Retry Procedure Guard:** Sửa `packages/api/src/routers/scoring.ts` (`scoring.retry`) kiểm tra `manualRetries < 1` và `dailyCount < 3`.
7. **Frontend UX:** Cập nhật màn hình chấm điểm trong `apps/web` hiển thị disable nút Retry và thông báo phù hợp khi hết lượt.

---

### 3. Work Checklist (Danh sách công việc bàn giao)
- [ ] **Shared Key Helper:** Tạo `packages/api/src/scoring/forecast-keys.ts` chứa hàm sinh danh sách `validQuestionKeys` (hỗ trợ cả Part 1, Part 2/3, câu phụ `-f` và single-question practice).
- [ ] **DB Schema:** Thêm cột `sizeBytes` vào `attempt_answer`, cột `manualRetries` vào `attempt_score`, và bảng `scoring_retry_log` trong `packages/db/src/schema/attempt.ts`.
- [ ] **Migration & Registry:** Sinh migration với `pnpm --filter @vox-flow/db db:generate`, thêm vào `packages/api/src/data-registry.ts`.
- [ ] **Upload Route Guard:** Sửa `apps/server/src/index.ts` để kiểm tra `questionKey` theo shared helper, đếm số câu $\le$ số câu của topic (trần 18; single-question $\le 2$), và tính tổng dung lượng upsert-aware $\le 35\text{MB}$. Lưu `sizeBytes`.
- [ ] **Submit Procedure Guard:** Sửa `packages/api/src/routers/attempt.ts` để xác thực lại số câu hợp lệ và tổng dung lượng $\le 35\text{MB}$ trước khi submit.
- [ ] **Sequential Transcription:** Sửa `packages/api/src/scoring/score-attempt.ts` chuyển `Promise.allSettled` sang vòng lặp tuần tự giải phóng bộ nhớ.
- [ ] **Retry Rate Limit:** Sửa `packages/api/src/routers/scoring.ts` áp dụng kiểm tra `manualRetries < 1` và `dailyCount < 3`.
- [ ] **Frontend Integration & UI:** Đồng bộ builder với shared helper, cập nhật màn hình chấm điểm trong `apps/web` hiển thị đúng trạng thái disable và thông báo khi hết lượt retry.
- [ ] **Automated Tests:** Bổ sung unit/integration tests cho helper, upload route, score attempt, scoring router và submit attempt.

---

### 4. Handoff Brief (Dành cho `ak-plan` / `ak-cook`)
```text
Objective: Hardening pipeline chấm điểm forecast: giới hạn câu trả lời theo đúng đề thi qua shared key helper (trần an toàn ≤ 18 câu; single-question ≤ 2 câu), tổng audio ≤ 35MB (upsert-aware qua cột sizeBytes), tuần tự hoá transcription trong Cloudflare Worker, và giới hạn scoring.retry tối đa 1 lần/bài & 3 lần/ngày/tài khoản.

Done means:
- Tạo shared helper sinh validQuestionKeys dùng chung giữa server và web, hỗ trợ cả câu gốc, follow-up (-f) và single-question practice.
- Bảng attempt_answer có cột sizeBytes (integer not null default 0).
- Endpoint upload audio (POST /api/attempts/:id/answers/:key/audio) kiểm tra questionKey thuộc danh sách cho phép, số câu không vượt ngưỡng bài (tối đa 2 cho single-question, trần an toàn 18 cho cả đề), và tổng dung lượng sau khi upsert ≤ 35MB (từ chối bằng HTTP 400 hoặc 413).
- attempt.submit kiểm tra lại các câu hợp lệ và tổng dung lượng ≤ 35MB trước khi enqueue.
- scoreAttempt xử lý transcription tuần tự từng file từ R2, giải phóng buffer, giữ RAM worker < 30MB kể cả với đề 14–17 câu.
- scoring.retry kiểm tra manualRetries < 1 và dailyRetries < 3 (theo Asia/Ho_Chi_Minh), ném lỗi rõ ràng khi vượt ngưỡng.
- Schema D1 có cột manualRetries trong attempt_score và bảng scoring_retry_log được đăng ký trong data-registry.ts.
- Frontend apps/web vô hiệu hóa nút Thử lại khi đạt ngưỡng và hiển thị thông báo hướng dẫn.
- Toàn bộ test suite pass, pnpm check-types pass.

Out of scope:
- Không thay đổi prompt hoặc thuật toán chấm 3 lần của GPT-6 Luna.
- Không tích hợp trừ điểm hạn mức free quota (Issue #18) hay paywall/billing.
- Không áp dụng cho Full Mock hay Daily Practice.

Constraints:
- Shared key helper phải là nguồn chân lý duy nhất cho key format của cả Web và Server.
- Cloudflare Worker 128MB RAM limit: bắt buộc tuần tự hoá transcription, không tải song song nhiều audio file từ R2.
- Tính toán tổng dung lượng audio phải upsert-aware khi học viên ghi âm đè câu cũ.
- Múi giờ tính ngày rate limit là Asia/Ho_Chi_Minh.

Stop and ask only if:
- Phát hiện một đề forecast có cấu trúc câu hỏi đặc thù không thể trích xuất questionKey bằng parser hiện tại.
- Lệnh pnpm db:generate gây xung đột migration không thể tự giải quyết an toàn.
```

* Chi tiết đầy đủ xem tại báo cáo: `plans/reports/91-hardening-scoring-limits-advise.md`
* Bản xem trước trực quan workflow: `plans/reports/91-hardening-scoring-limits-preview.html`
