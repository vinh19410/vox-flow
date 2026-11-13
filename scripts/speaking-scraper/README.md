# Speaking Sample Scraper (TD-01)

Công cụ local bằng Python dùng **Scrapling** (chỉ dùng HTTP `Fetcher` và `Selector`) để thu thập các bài mẫu IELTS Speaking công khai phục vụ thử nghiệm pipeline chấm điểm và đo chi phí trong phạm vi **TD-01 mục 2** ([docs/tech-debt.md](../../docs/tech-debt.md)).

## Mục đích & Phạm vi

- **Mục đích:** Thu thập nhanh một tập nhỏ bài nói tiếng Anh công khai có kèm band tham khảo (từ HuggingFace dataset `Amanafif554/IELTS-Dataset-WAV-and-Trasnscription` và `engnovate.com`) để kiểm thử kỹ thuật pipeline nhận dạng/chấm điểm và ước lượng chi phí thực tế.
- **Giới hạn quan trọng:**
  - Dữ liệu công khai **chỉ dùng cho thử nghiệm kỹ thuật và chi phí**, **không đủ điều kiện để đóng OQ-5** (vẫn cần 30 bài mẫu thật của học viên Việt có văn bản đồng ý và điểm giám khảo độc lập theo bước 3 của TD-01).
  - Công cụ **từ chối ghi đè** `scripts/scoring-eval/samples.csv` (bảo vệ manifest chính thức của OQ-5). Khi xuất dữ liệu cho `scoring-eval`, luôn xuất ra `scripts/scoring-eval/samples.public.csv`.
  - Tuân thủ `robots.txt` cho mọi origin trước khi fetch, giữ khoảng trễ lịch sự giữa các request, và **không** sử dụng trình duyệt headless hay truy cập các trang bị chặn.

## Yêu cầu môi trường

- `python3 >= 3.11`
- `ffmpeg` (cần thiết khi dùng `--export-scoring-eval` để chuẩn hóa âm thanh về `16kHz`, `16-bit`, `mono` PCM WAV)

## Cài đặt local

Tạo virtualenv riêng trong thư mục `scripts/speaking-scraper/.venv` và cài ở chế độ editable:

```bash
python3 -m venv scripts/speaking-scraper/.venv
scripts/speaking-scraper/.venv/bin/pip install --upgrade pip
scripts/speaking-scraper/.venv/bin/pip install -e "scripts/speaking-scraper[dev]"
```

> **Lưu ý:** **KHÔNG** cần chạy `scrapling install` (không tải Playwright hay Chromium binary), vì công cụ này chỉ dùng HTTP `Fetcher` và `Selector`.

## Ví dụ sử dụng CLI

Thu thập mẫu từ cả hai nguồn (mỗi nguồn tối đa 5 bài) và lưu JSON:

```bash
scripts/speaking-scraper/.venv/bin/python scripts/speaking-scraper/scraper.py \
  --source all \
  --limit 5 \
  --output-json raw-data/speaking-samples-public.json
```

Thu thập riêng từ `engnovate` hoặc `hf-ielts-wav` và xuất WAV + CSV dùng thử cho `scoring-eval`:

```bash
scripts/speaking-scraper/.venv/bin/python scripts/speaking-scraper/scraper.py \
  --source hf-ielts-wav \
  --limit 3 \
  --output-json raw-data/speaking-samples-public.json \
  --export-scoring-eval \
  --audio-dir scripts/scoring-eval/audio \
  --csv-path scripts/scoring-eval/samples.public.csv \
  --max-audio-seconds 60
```

Các tùy chọn CLI chính:

- `--source`: `all` | `hf-ielts-wav` | `engnovate` (mặc định: `all`)
- `--limit`: số lượng mẫu tối đa cho **mỗi nguồn** được bật (mặc định: `10`)
- `--no-stratify`: tắt chia tầng đều theo `overall_band` cho nguồn `hf-ielts-wav`
- `--output-json`: đường dẫn file JSON đầu ra (mặc định: `raw-data/speaking-samples-public.json`)
- `--export-scoring-eval`: tải âm thanh, chuyển đổi sang WAV 16kHz mono 16-bit PCM và ghi CSV manifest
- `--audio-dir`: thư mục lưu file `.wav` (mặc định: `scripts/scoring-eval/audio`)
- `--csv-path`: đường dẫn CSV manifest đầu ra (mặc định: `scripts/scoring-eval/samples.public.csv`; từ chối nếu tên file là `samples.csv`)
- `--max-audio-seconds`: cắt tối đa N giây đầu khi convert bằng `ffmpeg` (tùy chọn)
- `--overwrite`: ghi đè file `.wav` đã tồn tại thay vì tái sử dụng

## Cấu trúc file đầu ra

1. **JSON (`raw-data/speaking-samples-public.json`):** Đối tượng `{ "meta": { "generated_at", "sources", "count" }, "samples": [...] }`, trong đó mỗi phần tử là một `SpeakingSample` với các trường:
   - `sample_id` (`^[a-zA-Z0-9_-]+$`), `source` (`hf-ielts-wav` | `engnovate`), `source_url`
   - `mode` (`full` | `part`), `part` (`1` | `2` | `3` | `null`), `topic`, `question`, `transcript`
   - `overall_band` (bội số `0.5` từ `0.0` đến `9.0`), `criteria`, `feedback`
   - `audio_url`, `local_audio_path`, `scraped_at` (ISO-8601 UTC)
2. **WAV (`scripts/scoring-eval/audio/<sample_id>.wav`):** Định dạng `PCM signed 16-bit little-endian`, `16000 Hz`, `1 channel (mono)`.
3. **CSV (`scripts/scoring-eval/samples.public.csv`):** Tương thích với `parseSamplesCsv` trong `scripts/scoring-eval/report.ts`:
   ```csv
   sample_id,mode,consent_ref,human_band
   hf_ielts_001,full,public_benchmark_td01,6.5
   ```

## Chạy unit test (offline)

```bash
scripts/speaking-scraper/.venv/bin/pytest -v scripts/speaking-scraper/test_scraper.py
```
