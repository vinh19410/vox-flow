# Journal — Lập kế hoạch ElevenLabs TTS & R2 Audio Cache (#138)

- **Ngày**: 2026-11-12
- **Issue**: [#138](https://github.com/vinh19410/vox-flow/issues/138)
- **Nhánh**: `feat/138-elevenlabs-tts-cache`

## Bối cảnh

Giọng giám khảo của Vox Flow ở màn chọn chế độ thi (`VoicePicker`) và trong phòng thi (`useExamSession`) đang phụ thuộc vào `window.speechSynthesis` của trình duyệt, cho chất lượng giọng máy thiếu tự nhiên và không đồng nhất giữa các hệ điều hành. Mục tiêu là chuyển sang tổng hợp giọng nói qua **ElevenLabs TTS** cho 3 nhân vật hiện có (`Emma · uk-f`, `James · us-m`, `Olivia · au-f`) và lưu trữ file MP3 đã sinh trên Cloudflare R2 (`AUDIO_BUCKET`) để tái sử dụng cho mọi lượt học sau, không sinh lại nhiều lần cho cùng một câu hỏi.

## Các quyết định kiến trúc chính

1. **Content-addressed R2 cache không cần thêm bảng D1**: Lưu trực tiếp dưới `tts/v1/<voice>/<sha256(providerVoiceId + ":" + modelId + ":" + normalizedText)>.mp3` trong `AUDIO_BUCKET`. Cách này tự động khử trùng lặp câu hỏi giữa các đề, tự tách namespace khi đổi Voice ID / Model ID, tránh lệch trạng thái DB–R2 và hoàn toàn tách biệt khỏi nhánh dữ liệu cá nhân `users/<userId>/attempts/...` của `DATA_REGISTRY`.
2. **Chỉ nhận tham chiếu chuẩn trên `/api/tts/...`**: Tuyệt đối không nhận chuỗi văn bản tự do từ client để chặn nguy cơ bị rút cạn hạn mức ElevenLabs. Server chỉ phân giải câu tiếng Anh từ 3 nguồn chuẩn: câu chào `VoicePicker`, `MOCK_EXAM_PROMPTS` và `forecast_topic` có `status = "published"`.
3. **Kết hợp Pre-warm nền cho đề mới + Read-through cho kho đề cũ**: Đề mới được `forecastAdmin.publish` tự động sinh sẵn 3 giọng ở hậu trường (`waitUntil`, concurrency = 2, không chặn publish nếu ElevenLabs lỗi); kho 178 đề seed cũ (~1.246 câu) dùng read-through ở lần mở đầu tiên để không đốt trước ~200.000 ký tự cho các đề ít người mở.
4. **Fallback không làm gián đoạn phòng thi**: Client ưu tiên phát MP3 từ `/api/tts/...` (kèm prefetch ở màn giới thiệu `intro`) và tự lùi về `window.speechSynthesis` cho lượt đó nếu tải/phát thất bại, không lưu dữ liệu lỗi vào cache.
