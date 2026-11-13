# Nợ kỹ thuật

Các việc đã biết là cần làm nhưng tạm hoãn có chủ đích. Mỗi mục ghi rõ hệ quả khi chưa trả và điều kiện bắt buộc phải trả.

| # | Ngày ghi | Hạng mục | Issue | Người chịu trách nhiệm | Trạng thái |
|---|---|---|---|---|---|
| TD-01 | 2026-11-11 | Bộ 30 bài mẫu đánh giá chấm điểm (OQ-5) | [#7](https://github.com/vinh19410/vox-flow/issues/7) (đã đóng) → [#154](https://github.com/vinh19410/vox-flow/issues/154) | Người sở hữu sản phẩm | Đã chuyển hướng (tự eval nội bộ) |

## TD-01: Bộ 30 bài mẫu đánh giá chấm điểm (OQ-5)

**Nợ gì:** #7 ban đầu yêu cầu 30 bài nói ngoài có văn bản đồng ý và điểm chuẩn đáng tin để đo độ chính xác của AI chấm trước khi làm `#17`. Khung đánh giá offline đã có trên `dev` (`scripts/scoring-eval/`, PR #33).

**Quyết định chuyển hướng (2026-11-13):** Người sở hữu sản phẩm (`vinh19410`) quyết định đóng `#7` (`not planned` cho phương án thử 30 bài mẫu ngoài × 6 cấu hình nhà cung cấp), chốt pipeline hiện hành (`packages/api/src/scoring/`: OpenAI `whisper-1` + 3 lượt `gpt-6-luna` lấy trung vị, đã triển khai và nghiệm thu Beta ở `#90` & `#130`) làm thuật toán chấm điểm chính, đồng thời **gỡ cổng chặn cứng 30 bài mẫu ngoài** trước `#17`, `#18`, `#19`, `#20`, `#21`.

**Rủi ro thực tế vẫn được theo dõi:**
- Ngưỡng độ sát điểm `≥ 80% bài lệch trong 0.5 band` so với giám khảo thật hiện chưa có số đo thực nghiệm trên Beta (mọi điểm trên Beta hiện mới kiểm chứng ổn định kỹ thuật).
- Trên Beta (`plans/reports/130-beta-pot.md`), `gpt-6-luna` từ chối `input_audio` nên `18/18` lượt chạy đều có `audio_used = 0`, khiến tiêu chí Pronunciation (`P`) đang ước lượng gián tiếp qua transcript.
- `cost_usd` trên Beta đang là `null` do chưa cấu hình `SCORING_PRICE_INPUT_PER_1M` / `SCORING_PRICE_OUTPUT_PER_1M` và chưa cộng phí Whisper STT.

**Hướng giải quyết tiếp theo (`#154` & `docs/decisions/scoring-self-eval.md`):**
1. **Tầng 1 (100% bài thật):** Tự kiểm định nội tại từ `score_run` & `attempt_score` (độ ổn định 3 lượt `<= 0.5 band`, tỷ lệ trích dẫn bị lọc rỗng, unit cost).
2. **Tầng 2 (Active Learning):** Khai thác nhãn phản biện `score_dispute` do PO/giám khảo duyệt sau khi mở đủ dải `resolvedBand` (`0.0..9.0`) và chuẩn hóa snapshot `previous_band`.
3. **Tầng 3 (Ground Truth):** Đối chiếu điểm thi thật từ `real-band-report` (`D-06`) sau ngày thi.
4. **Offline Shadow Replay Gate:** Tái sử dụng `scripts/scoring-eval/` trên Golden Benchmark Cohort nội bộ để đánh giá và hiệu chuẩn dần thuật toán chấm.
