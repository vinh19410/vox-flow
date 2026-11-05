---
phase: 2
title: "Chạy đánh giá và chọn cấu hình"
status: pending
priority: P1
effort: ""
dependencies: [1]
---

# Phase 2: Chạy đánh giá và chọn cấu hình

## Goal
Có số liệu cho 6 cấu hình và một quyết định.

## Files to Create / Modify
- Create: `scripts/scoring-eval/run-eval.ts`
- Create: `scripts/scoring-eval/report.ts`
- Create: `scripts/scoring-eval/report.test.ts`
- Create: `docs/oq-5-scoring-eval.md`
- Modify: `docs/roadmap-chamro.md`

## Tasks & Steps

### Task 2.1 — Chạy 6 cấu hình.
- Goal: Chạy 6 cấu hình.
- Target files and symbols: `scripts/scoring-eval/run-eval.ts`
- Steps:
  1. Hướng A: Azure gộp nhận dạng và chấm phát âm (kèm Prosody). Hướng B: dịch vụ nhận dạng riêng (mặc định Whisper API của OpenAI) kết hợp SpeechSuper `speak.eval.pro`.
  2. Mô hình chấm: ánh xạ tên model Anthropic qua cấu hình (`claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5` hoặc mã API tương đương).
  3. Quy tắc cache: chạy ASR và chấm phát âm 1 lần cho mỗi cặp (bài mẫu, hướng dịch vụ) và lưu cache vào `scripts/scoring-eval/transcripts/`; chỉ lặp lại phần chấm LLM 3 lần độc lập cho mỗi cấu hình để đo độ ổn định mà không lãng phí chi phí ASR.
  4. Bảo vệ dữ liệu & prompt: bọc transcript trong `<candidate_transcript>`, kiểm tra kết quả chấm bằng Zod schema (`overall_band` nằm trong khoảng `[0.0 - 9.0]` với bước nhảy `0.5`). Không âm thầm retry khi lỗi schema để phản ánh đúng độ ổn định.
  5. Ghi log kết quả: mỗi lần chạy ghi đúng 1 dòng JSONL với `status: "ok" | "schema_error" | "api_error"`. Ghi band, số token, giây audio, chi phí VND, `prompt_sha`, `model_id` vào `scripts/scoring-eval/results/<config>.jsonl`.
  6. Lệnh chạy và kiểm tra thử: hỗ trợ cờ `--limit 1 --config <tên>` ghi vào `scripts/scoring-eval/results/smoke/` để chạy thử trước khi chạy toàn bộ. Lệnh chạy thực tế: `varlock run --path scripts/scoring-eval/ -- node --experimental-strip-types scripts/scoring-eval/run-eval.ts`.
- Success criteria: Đủ 540 lượt chấm hợp lệ (30 bài × 6 cấu hình × 3 lần).
- Verify: `node --experimental-strip-types scripts/scoring-eval/report.ts --check` in `540 unique attempts verified`.
### Task 2.2 — Viết báo cáo và chốt OQ-5.
- Goal: Viết báo cáo và chốt OQ-5.
- Target files and symbols: `scripts/scoring-eval/report.ts`, `docs/oq-5-scoring-eval.md`, `docs/roadmap-chamro.md`
- Steps:
  1. Định nghĩa công thức tính toán:
     - **Độ chính xác (% bài lệch trong 0.5 band):** lấy trung vị (median) của 3 lần chấm so với `human_band` (`Math.abs(median - human_band) <= 0.5`). Lần chạy lỗi schema/api tính là lệch. Ngưỡng đạt: ≥ 80% (ít nhất 24/30 bài).
     - **Độ ổn định (% bài có độ chênh 3 lần ≤ 0.5 band):** lấy `max_band - min_band <= 0.5` trong 3 lần chấm của từng bài. Nếu có bất kỳ lần chạy nào lỗi thì bài đó tính là không ổn định. Ngưỡng đạt: ≥ 90% (ít nhất 27/30 bài).
     - **Chi phí đo được:** tính trung bình chi phí thực tế cho các bài `mode=full` làm chi phí Full Test (mục tiêu 8.000đ, trần tối đa 12.000đ), và các bài `mode=part` làm chi phí Part (mục tiêu thông tin 3.000đ).
  2. Quy tắc lựa chọn giữa 6 cấu hình:
     - Lọc các cấu hình vượt qua cả 3 cổng: độ chính xác ≥ 80%, độ ổn định ≥ 90%, và chi phí Full Test ≤ 12.000đ.
     - Nếu có ít nhất 1 cấu hình đạt: chọn cấu hình có chi phí Full Test thấp nhất (nếu bằng nhau thì ưu tiên độ chính xác cao hơn). Chuyển sang Nhánh (a).
     - Nếu không cấu hình nào đạt: nếu có cấu hình đạt cả độ chính xác và độ ổn định nhưng tất cả đều vượt trần 12.000đ thì chuyển sang Nhánh (c); các trường hợp còn lại chuyển sang Nhánh (b).
  3. Xử lý 3 nhánh kết quả:
     - Nhánh (a) Đạt ngưỡng:
       - Ghi vào báo cáo: `Đạt ngưỡng: có`, `Quyết định: <cấu hình đã chọn>`, dòng `Ngày chuyển dữ liệu ra nước ngoài đầu tiên: <YYYY-MM-DD>`.
       - Đánh dấu `- [x] OQ-5` trong `docs/roadmap-chamro.md` và cập nhật trần miễn phí tạm tính 33.000đ/ngày theo chi phí thật.
     - Nhánh (b) Không đạt độ chính xác hoặc độ ổn định:
       - Ghi vào báo cáo: `Đạt ngưỡng: không`, `Quyết định: không chọn — chuyển người sở hữu sản phẩm`, dòng `Chuyển người sở hữu: độ chính xác hoặc độ ổn định dưới ngưỡng`.
       - Giữ `- [ ] OQ-5` trong `docs/roadmap-chamro.md`.
     - Nhánh (c) Đạt độ chính xác nhưng chi phí vượt 12.000đ/Full Test:
       - Ghi vào báo cáo: `Đạt ngưỡng: không`, `Quyết định: không chọn — chuyển người sở hữu sản phẩm`, dòng `Chuyển người sở hữu: chi phí vượt trần 12.000đ`.
       - Giữ `- [ ] OQ-5` trong `docs/roadmap-chamro.md`.
- Success criteria: Báo cáo có quyết định rõ ràng và trạng thái OQ-5 nhất quán với kết quả ngưỡng.
- Verify:
  - Báo cáo luôn có đúng 1 dòng quyết định và 1 dòng đạt ngưỡng:
    `grep -c '^Quyết định:' docs/oq-5-scoring-eval.md` in `1` && `grep -c -E '^Đạt ngưỡng: (có|không)' docs/oq-5-scoring-eval.md` in `1`
  - Nếu đạt ngưỡng (`Đạt ngưỡng: có`): `grep -c '^- \[x\] OQ-5' docs/roadmap-chamro.md` in `1`
  - Nếu không đạt ngưỡng (`Đạt ngưỡng: không`): `grep -c '^- \[ \] OQ-5' docs/roadmap-chamro.md` in `1` && `grep -c '^Chuyển người sở hữu:' docs/oq-5-scoring-eval.md` in `1`

### Task 2.3 — Kiểm thử bộ tính toán và quy tắc quyết định.
- Goal: Kiểm chứng toàn diện logic tính độ chính xác, độ ổn định, chi phí và 3 nhánh quyết định bằng unit test trên dữ liệu giả lập.
- Target files and symbols: `scripts/scoring-eval/report.test.ts`
- Steps:
  1. Viết unit test cho các hàm tính toán trong `report.ts` sử dụng `node:test` và `node:assert`.
  2. Kiểm tra các ca biên: đúng 80% độ chính xác, đúng 90% độ ổn định, xử lý trường hợp lỗi schema, tính trung vị, và kiểm chứng đủ 3 nhánh quyết định (a, b, c).
- Success criteria: Toàn bộ test của bộ tính báo cáo chạy qua mà không phụ thuộc API thật.
- Verify: `node --test --experimental-strip-types scripts/scoring-eval/report.test.ts` thoát với mã 0.
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
