# Tư vấn #19: Giới hạn mỗi gói để không lỗ mà học viên vẫn có lợi

> Kết quả phiên `/ak-advise` ngày 2026-11-16. Phần phát biểu lại vấn đề đã được người sở hữu sản phẩm xác nhận. Đây là lời khuyên, chưa phải code.

## Vấn đề, phát biểu lại

Chi phí AI tăng theo **số lượt thi**, gồm Whisper, 3 lượt `gpt-6-luna` và TTS. Việc mở chi tiết gần như không tốn gì, vì bài nào cũng đã được chấm đủ. Hiện tại `reserve()` (`packages/api/src/quota/quota.ts:365`) cho tài khoản `paid` bỏ qua cả hạn mức 3 điểm/ngày lẫn trần hệ thống 33k/ngày. Nghĩa là khi #19 nối gói vào, một người trả phí có thể dùng không giới hạn và làm lỗ cả gói. PRD chỉ hứa "mở chi tiết không giới hạn", chưa có quyết định nào về số lượt thi của gói trả phí.

## Quyết định đã chốt

1. **Mỗi gói có một tổng điểm P, không có trần ngày hay trần tuần.** Học viên tự xếp lịch luyện. Điểm quy đổi giống bảng hiện có: Full Test 3 điểm, mỗi Part 1 điểm, forecast và luyện lại tính như cũ.
2. **Chi phí xấu nhất của một người không vượt khoảng 50% giá gói.** P là cấu hình, không viết cứng trong code.
3. **Gói trả phí không bị trần hệ thống 33k/ngày chặn**, vì P đã giới hạn chi phí rồi.
4. **Mua chồng thì cộng dồn nối đuôi**, tức cộng thêm ngày và cộng thêm điểm. Gói "Đến ngày thi" không kéo quá ngày thi và quá 60 ngày.
5. **Hết P hoặc hết hạn thì học viên quay về mức miễn phí** 3 điểm/ngày, có tính trần hệ thống. Nếu gói chưa hết hạn, học viên vẫn được mở chi tiết.
6. **Hiện rõ con số** trên màn gói và banner, ví dụ "còn 87/120 điểm, hết hạn 15/12". Bỏ chữ "không giới hạn".

| Gói | Giá | Tổng điểm P | Tương đương | Chi phí xấu nhất | Lãi tối thiểu |
|---|---|---|---|---|---|
| Theo lượt | 49k | 3 lượt mở chi tiết, không thêm lượt thi (đúng tiêu chí nghiệm thu) | | ~0 | ~100% |
| Tuần | 99k | **48 điểm** / 7 ngày | 16 Full Test | 48k | ~51% |
| Tháng | 249k | **120 điểm** / 30 ngày | 40 Full Test | 120k | ~52% |
| Đến ngày thi | 349k | **180 điểm**, đến ngày thi (≤ 60 ngày) | 60 Full Test | 180k | ~48% |

## Chi phí một bài lấy từ đâu

Giá đang cấu hình trong GitHub vars: `SCORING_PRICE_INPUT_PER_1M=0.10`, `SCORING_PRICE_OUTPUT_PER_1M=0.50`. Whisper tính $0.006/phút (`plans/261105-0909-wi03-scoring-eval-oq5/reports/research-speech-llm-pricing.md`). Tỷ giá dùng 26.000đ.

| Bài | Ước tính | Phần Whisper |
|---|---|---|
| Full Test trên beta, token đo thật ở #130 (131 giây audio) | ~460đ | ~75% |
| Full Test thật (~11 phút nói) | **~1.950đ**, tức ≈ 650đ/điểm | ~88% |
| Part 1 / Part 2 / Part 3 | ~725đ / ~400đ / ~815đ | |
| Lạm dụng: nói kịch trần `MAX_TOTAL_AUDIO_BYTES` 35MB (~37 phút) | ~6.300đ | |

Tôi lấy **1.000đ/điểm** để tính P, tức chừa khoảng 50% cho retry, TTS chưa cache và câu trả lời dài. Con số này khớp với các hằng số `costVnd` đang có (Full 2.500đ, Part 1.000đ). Ước tính 8.000đ/Full Test trong roadmap cao gấp khoảng 4 lần thực tế.

## Kết luận

Không lỗ được, và không cần giới hạn theo ngày. Khoản lỗ duy nhất đang có là nhánh `bypassed` trong `reserve()`. Chỉ cần thay nhánh đó bằng "trừ vào tổng điểm của gói" thì chi phí của mỗi người trả phí bị chặn cứng ở P × 1.000đ, kể cả khi tài khoản bị chia sẻ hoặc bị dùng dồn trong một ngày. Phần lớn chi phí là Whisper, tính theo phút nói, nên giá token của `gpt-6-luna` gần như không ảnh hưởng. Muốn rẻ hơn thì phải giảm số phút audio, không phải đổi model chấm.

## Nên làm

1. Thêm một bảng số dư gói cho mỗi user: `points_remaining`, `expires_at`, `plan`. Webhook kích hoạt gói sẽ cộng `points_remaining += P`, đặt `expires_at = max(now, expires_at) + số ngày`. Riêng gói thi thì `expires_at` không vượt ngày thi và không vượt now + 60 ngày.
2. Đổi `reserve()`:
   - Nếu gói còn hạn và `points_remaining ≥ điểm cần` thì trừ điểm bằng một câu `UPDATE ... WHERE points_remaining >= ?` có điều kiện, giống cách `buildReserveStatement` đang chặn tranh chấp. Nhánh này không tính trần hệ thống.
   - Nếu không đủ điểm thì đi đúng nhánh miễn phí như hiện tại.
3. Đổi `release()` và hoàn điểm: bài lỗi chấm thì trả điểm về gói nếu lúc giữ chỗ đã trừ từ gói. Áp dụng luật hoàn điểm tối đa 3 lần/ngày như hiện có.
4. Tách `canViewDetail` khỏi số điểm. Gói còn hạn thì mở chi tiết mọi bài, kể cả khi đã hết P. Gói theo lượt thì mở theo `detail_unlock` của từng bài.
5. UI: sửa `apps/web/src/features/billing/data.ts` (bỏ "Không giới hạn lượt chi tiết") và `billing-screen.tsx:35`. Banner hạn mức hiện "còn X/P điểm · hết hạn dd/mm". Khi hết P, báo "đã dùng hết điểm gói, đang dùng mức miễn phí".
6. Bổ sung PRD §4.6 F-18 bằng con số P của từng gói. Ghi quyết định này vào `docs/product-decisions.md`.
7. Hiệu chỉnh P lại sau khoảng 2 tuần có `cost_usd` thật trên beta, trước cổng #21. `cost_usd` hiện chưa tính Whisper, nên phải cộng thêm `duration_ms / 60000 × 0.006` mới ra chi phí thật.

## Không nên làm

- **Đừng giữ nhánh `bypassed: true` cho gói trả phí**, kể cả dưới dạng "tạm thời". Đây chính là đường lỗ.
- **Đừng chia một bài cho cả điểm gói lẫn điểm miễn phí**, ví dụ gói còn 1 điểm mà bài cần 3 điểm. Không đủ thì dùng nhánh miễn phí luôn. Ghép hai nguồn điểm làm luật hoàn điểm phức tạp gấp đôi.
- **Đừng lưu chi phí thực tế (VND) vào số dư gói.** Học viên chỉ cần thấy điểm, chi phí thuộc về sổ sách nội bộ.
- **Đừng thêm trần ngày "cho chắc".** Người sở hữu sản phẩm đã chủ động bỏ, và P vẫn chặn được chi phí.

## Cách rẻ hơn để có cùng kết quả

1. **Đặt trần audio theo chế độ thi**, ví dụ Full ~18 phút, Part 2 ~3 phút, thay vì 35MB chung cho mọi bài. Effort thấp, tác động cao: chi phí lạm dụng của một Full Test giảm từ ~6.300đ xuống ~2.800đ, nên P ở trên vẫn lãi ngay cả với người cố tình nói kéo dài.
2. **Tính Whisper vào `cost_usd`** (một dòng trong `computeCostUsd`). Có số chi phí thật thì hiệu chỉnh P bằng dữ liệu, không phải đoán.

## Lợi ích

- Mỗi người trả phí đều có lãi tối thiểu khoảng 48–52%, tài khoản bị chia sẻ cũng không làm lỗ.
- Người ôn gấp có thể làm 5–10 Full Test trong một ngày trước khi thi mà không bị chặn.
- Gói nào cũng nhiều hơn người dùng miễn phí: miễn phí tối đa 21 điểm/tuần và bị trần hệ thống chặn, trong khi gói tuần có 48 điểm không bị chặn, cộng thêm mở chi tiết.
- Đúng PRD F-01 vì không dùng thông điệp "không giới hạn".

## Đánh đổi

- Bỏ trần ngày nghĩa là một người có thể dùng hết P ngay trong ngày đầu, rồi phần còn lại của gói chỉ còn mở chi tiết và mức miễn phí. Không lỗ, nhưng người đó có thể thấy hụt hẫng. Hiện rõ số điểm còn lại giúp giảm cảm giác này.
- Trải đủ 60 ngày, gói thi chỉ được trung bình 3 điểm/ngày, ngang mức miễn phí. Gói này có giá trị nhờ mở chi tiết và không bị trần hệ thống, chứ không nhờ số lượt.
- Điểm không dùng hết sẽ mất khi gói hết hạn. Cần ghi rõ điều này trên màn mua gói.
- **Khi nào lời khuyên này hết đúng:** khi chi phí đo thật vượt khoảng 1.500đ/điểm, ví dụ đổi sang model chấm đắt hơn hoặc thêm chấm phát âm riêng. Lúc đó chỉ cần sửa giá trị cấu hình P, không phải viết lại code.

## Chưa kiểm chứng

- **Thời lượng nói của một Full Test thật (~11 phút) là giả định.** Bài trên beta chỉ có 131 giây. Kiểm chứng bằng cách query `SUM(attempt_answer.duration_ms)` của các bài `full` sau khi có người dùng thật.
- **Token của một bài thật được ngoại suy** từ bài beta, chưa đo trực tiếp.
- **Phí SePay cho mỗi giao dịch chưa xác minh.** Tôi giả định là thuê bao cố định nên không tính vào biên lãi. Cần xem lại hợp đồng SePay.
- **Chi phí TTS ElevenLabs cho câu hỏi chưa cache chưa đo.** Có cache R2 theo hash nên tôi giả định gần 0 cho mỗi bài.
- **Tỷ giá 26.000đ/USD.**

## Danh sách việc

- [ ] Bảng số dư gói và migration, kèm sao lưu D1 trước khi áp lên môi trường thật.
- [ ] Webhook kích hoạt: cộng P, nối đuôi `expires_at`, giới hạn gói thi theo ngày thi và 60 ngày. Không cộng lần thứ hai khi webhook gọi lại.
- [ ] `reserve()` trừ điểm từ gói một cách nguyên tử, bỏ nhánh `bypassed`. Hết điểm thì dùng nhánh miễn phí.
- [ ] `release()` trả điểm về đúng nguồn đã trừ.
- [ ] `canViewDetail` dựa vào hạn gói hoặc `detail_unlock`.
- [ ] Test: không vượt P khi có 5 yêu cầu đồng thời, hết P thì về mức miễn phí, mua chồng thì cộng dồn, gói thi bị giới hạn theo ngày thi, hoàn điểm về gói.
- [ ] UI gói và banner "còn X/P điểm".
- [ ] Cập nhật PRD F-18 và `docs/product-decisions.md`.
- [ ] (Khuyên làm) Tính Whisper vào `cost_usd`. Đặt trần audio theo chế độ thi.

## Chỉ số thành công

- Có 0 bản ghi giữ chỗ nào của người trả phí bỏ qua cả gói lẫn hạn mức. Test `quota.test.ts` khẳng định điều này.
- Với mỗi gói đã bán, chi phí AI thực tế (`cost_usd` + Whisper) không vượt 50% giá gói. Query hằng tuần trên D1.
- Chi phí trung bình mỗi điểm đo thật nằm trong khoảng 1.000đ trở xuống. Nếu vượt 1.500đ thì giảm P.
- Theo dõi tỷ lệ gói dùng hết P trước khi hết hạn. Nếu trên 30% thì P đang thấp so với nhu cầu, đây là tín hiệu để xem lại giá.

## Brief bàn giao

```text
Objective: Thay nhánh "paid bỏ qua mọi giới hạn" trong reserve() bằng tổng điểm P theo gói, để mỗi gói có lãi tối thiểu ~50% mà học viên tự do luyện tập.
Done means: Gói tuần/tháng/đến ngày thi có P = 48/120/180 điểm (cấu hình được), không có trần ngày; reserve() trừ điểm từ gói một cách nguyên tử và không tính trần hệ thống cho phần này; hết P hoặc hết hạn thì dùng nhánh miễn phí 3 điểm/ngày; release() trả điểm về đúng nguồn; mua chồng thì cộng ngày và cộng điểm (gói thi ≤ ngày thi và ≤ 60 ngày); gói còn hạn thì mở chi tiết mọi bài kể cả khi hết P; gói theo lượt 49k = 3 lượt mở chi tiết, không thêm lượt thi; UI hiện "còn X/P điểm · hết hạn", không còn chữ "không giới hạn"; test đồng thời không vượt P; pnpm check-types và test quota/billing đều pass.
Out of scope: Đổi giá gói; trần theo ngày/tuần; giảm chi phí chấm bằng cách đổi model hoặc bớt số lượt chấm; gói giáo viên; đối soát (#20); nhắc hết hạn (#27); hóa đơn VAT.
Constraints: Không thu tiền thật trước khi #20 xong và #21 đạt; sao lưu D1 trước khi áp migration lên môi trường thật; không sửa tay migration đã sinh; không commit secret.
Stop and ask only if: Chi phí đo thật vượt 1.500đ/điểm; một thay đổi đụng tới quyết định đã chốt trong roadmap-chamro Mục 7; có thao tác không đảo ngược được trên D1 thật.
```
