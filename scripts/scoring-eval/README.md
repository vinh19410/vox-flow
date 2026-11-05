# Khung Đánh Giá Dịch Vụ Giọng Nói & AI (OQ-5)

Thư mục này chứa bộ công cụ thực nghiệm cho **Work Item 03** (Issue #7), giải quyết câu hỏi mở **OQ-5** trong `docs/roadmap-chamro.md`:
*Lựa chọn tổ hợp nhận dạng giọng nói, chấm phát âm và mô hình chấm điểm tối ưu về độ chính xác (≥ 80% lệch trong 0.5 band), độ ổn định (≥ 90% chênh lệch giữa 3 lần chấm ≤ 0.5 band), và chi phí thực tế (mục tiêu 8.000đ/Full Test, trần tối đa 12.000đ).*

> **Lưu ý kiểm chứng:** Các adapter gọi API nhà cung cấp trong `run-eval.ts` được xây dựng theo đặc tả chuẩn nhưng chưa được kích hoạt với endpoint thực tế do đang chờ 30 bài mẫu có văn bản đồng ý và tài khoản API từ người sở hữu sản phẩm.

---

## 1. Yêu cầu tiên quyết để chạy thực tế

1. **30 tệp âm thanh mẫu:**
   - Đặt tại `scripts/scoring-eval/audio/<sample_id>.wav` (định dạng 16kHz, 16-bit, Mono PCM WAV).
   - Thư mục này đã được cấu hình trong `.gitignore`, không bao giờ được commit lên git.
2. **Khóa điểm chấm mù trong `samples.csv`:**
   - Điền đủ 30 dòng với các cột: `sample_id,mode,consent_ref,human_band`.
   - `human_band` phải là các số từ `0.0` đến `9.0` với bước nhảy `0.5`.
   - Cần commit `samples.csv` vào git **trước khi chạy AI** để chứng minh điểm người chấm có trước kết quả mô hình.
3. **Cấu hình biến môi trường (`.env`):**
   - Tạo file `scripts/scoring-eval/.env` (đã được gitignore tự động) với các khóa:
     ```env
     AZURE_SPEECH_KEY=your_azure_speech_key
     AZURE_SPEECH_REGION=eastus
     OPENAI_API_KEY=your_openai_api_key
     SPEECHSUPER_APP_KEY=your_speechsuper_app_key
     SPEECHSUPER_SECRET_KEY=your_speechsuper_secret_key
     ANTHROPIC_API_KEY=your_anthropic_api_key
     ANTHROPIC_OPUS_MODEL=claude-opus-5-5
     ANTHROPIC_SONNET_MODEL=claude-sonnet-5-5
     ANTHROPIC_HAIKU_MODEL=claude-haiku-5-5
     ```
   - Schema bảo vệ được định nghĩa tại `scripts/scoring-eval/.env.schema` và kiểm tra bởi Varlock.
4. **Xác nhận pháp lý (OQ-6 / Luật 91/2025/QH15):**
   - Đảm bảo văn bản đồng ý của 30 thí sinh cho phép truyền âm thanh đến các nhà cung cấp nước ngoài (Azure, OpenAI, SpeechSuper, Anthropic).
   - Cuộc gọi API đầu tiên gửi audio ra nước ngoài sẽ kích hoạt thời hạn 60 ngày nộp hồ sơ đánh giá chuyển dữ liệu ra nước ngoài (Điều 20).

---

## 2. Các cấu hình đánh giá (6 cấu hình)

| Mã cấu hình | Nhận dạng (ASR) | Chấm phát âm | Mô hình chấm (LLM) |
|-------------|-----------------|--------------|--------------------|
| `azure-haiku` | Azure Speech | Azure Pronunciation (Prosody) | Claude Haiku 5.5 |
| `azure-sonnet` | Azure Speech | Azure Pronunciation (Prosody) | Claude Sonnet 5.5 |
| `azure-opus` | Azure Speech | Azure Pronunciation (Prosody) | Claude Opus 5.5 |
| `speechsuper-haiku` | OpenAI Whisper | SpeechSuper `speak.eval.pro` | Claude Haiku 5.5 |
| `speechsuper-sonnet` | OpenAI Whisper | SpeechSuper `speak.eval.pro` | Claude Sonnet 5.5 |
| `speechsuper-opus` | OpenAI Whisper | SpeechSuper `speak.eval.pro` | Claude Opus 5.5 |

*Quy tắc cache:* ASR và chấm phát âm chỉ chạy 1 lần cho mỗi bài mẫu theo hướng và lưu cache tại `transcripts/`. Phần chấm LLM được lặp lại 3 lần độc lập để đo độ ổn định mà không nhân ba chi phí âm thanh.

---

## 3. Lệnh chạy thực nghiệm

### Chạy thử nghiệm khói (Smoke Test - 1 mẫu)
Trước khi chạy toàn bộ 540 lượt chấm, luôn chạy thử 1 mẫu để kiểm tra kết nối API:
```bash
varlock run --path scripts/scoring-eval/ -- node --experimental-strip-types scripts/scoring-eval/run-eval.ts --limit 1 --config azure-sonnet
```
Kết quả chạy thử được lưu tại `scripts/scoring-eval/results/smoke/`.

### Chạy đánh giá toàn bộ (540 lượt chấm)
Khi đã sẵn sàng:
```bash
varlock run --path scripts/scoring-eval/ -- node --experimental-strip-types scripts/scoring-eval/run-eval.ts
```

### Kiểm tra tính toàn vẹn của kết quả
```bash
node --experimental-strip-types scripts/scoring-eval/report.ts --check
```

### Xuất báo cáo OQ-5
```bash
node --experimental-strip-types scripts/scoring-eval/report.ts
```
Lệnh này sẽ tự động phân tích 3 nhánh:
- **Nhánh (a) Đạt ngưỡng:** Ghi `Đạt ngưỡng: có`, `Quyết định: <cấu hình>`, cập nhật `- [x] OQ-5` trong roadmap và điều chỉnh trần miễn phí ngày.
- **Nhánh (b) Không đạt độ chính xác/ổn định:** Ghi `Đạt ngưỡng: không`, `Quyết định: không chọn — chuyển người sở hữu sản phẩm`, giữ OQ-5 mở.
- **Nhánh (c) Chi phí vượt trần 12.000đ:** Ghi `Đạt ngưỡng: không`, `Quyết định: không chọn — chuyển người sở hữu sản phẩm`, giữ OQ-5 mở.

---

## 4. Chạy Unit Test kiểm chứng thuật toán
Bộ test kiểm tra toàn diện logic tính toán độ chính xác, độ ổn định, chi phí và 3 nhánh quyết định:
```bash
node --test --experimental-strip-types scripts/scoring-eval/report.test.ts
```
