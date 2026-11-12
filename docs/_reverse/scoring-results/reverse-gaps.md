# Gaps & OQ — scoring-results

> Trạng thái: `draft`. OQ = câu hỏi cho Product Owner/BA (code không nói). Mọi OQ đều là 🟡: code không trả lời được "vì sao / cho ai / mục tiêu".

## 1. OQ (câu hỏi mở)

* [ ] OQ-1: **Mô hình và số lần chấm.** Code đặt mặc định mô hình `gpt-6-luna` (packages/api/src/scoring/config.ts:1) và 3 lần chấm độc lập lấy trung vị (packages/api/src/scoring/config.ts:2). *(Hỏi: PO/Kỹ thuật AI)* — Mô hình này có phải mô hình thật ở production? Vì sao chọn 3 lần (độ ổn định hay chi phí)? Ai được đổi `SCORING_RUNS`? Tham chiếu FR-017, BR-005, BR-006.
* [ ] OQ-2: **Hạn mức thử lại.** Code cho 1 lần thử lại mỗi bài và 3 lần mỗi người mỗi ngày giờ Việt Nam (packages/api/src/routers/scoring.ts:73, packages/api/src/routers/scoring.ts:119). *(Hỏi: PO)* — Lý do nghiệp vụ (chi phí AI, chống lạm dụng?), có nới cho gói trả phí không, có báo "còn mấy lượt" cho học viên không (hiện chỉ biết khi đã hết). Tham chiếu BR-007, BR-008.
* [ ] OQ-3: **Cờ `VITE_FEATURE_SCORING`.** Code chỉ bật khi biến build đúng bằng chuỗi "true" (apps/web/src/lib/feature-flags.ts:2); file dotenv của web bị hook chặn nên giá trị thật chưa biết. *(Hỏi: PO/DevOps)* — Production đang bật hay tắt? Kế hoạch gỡ cờ? Nếu tắt, bài chưa có điểm nhìn thấy "Tính năng chấm điểm AI sắp ra mắt" trong khi hệ thống chấm thật đã chạy nền (xem C-3). Tham chiếu FR-048.
* [ ] OQ-4: **Soft paywall.** Kết quả chấm thật luôn mở hoàn toàn (comment "Beta: every scored result is fully unlocked", apps/web/src/features/results/results-screen.tsx:258). *(Hỏi: PO/Billing)* — Khi nào hết Beta và bắt đầu che? Cái gì miễn phí (thẻ band tổng ghi "Miễn phí") và cái gì trả phí? Giá "49.000đ" và "kích hoạt tự động trong vài giây" còn hiệu lực không (reverse-plan ghi billing chỉ có giao diện, chưa thấy backend)? Tham chiếu FR-049.
* [ ] OQ-5: **Thành phần prototype trên trang kết quả.** Điểm mặc định 6.5, khoảng tin cậy 6.0–7.0, ba giá trị "Chấm 3 lần độc lập", câu "Chênh lệch giữa các lần: 0.5 — trong ngưỡng ổn định.", phát lại ghi âm giả lập, bảng đánh dấu lỗi (ngữ pháp/từ vựng/phát âm). *(Hỏi: PO/Thiết kế)* — Giữ làm mục tiêu sản phẩm (khoảng tin cậy, đánh dấu lỗi trên câu) hay bỏ? Kết quả chấm thật hiện cố ý ẩn các thành phần này. Tham chiếu FR-051, SC-03.
* [ ] OQ-6: **Nhánh "không chấm được" (`not_scorable`).** Máy chủ luôn trả cờ chấm được bằng true (packages/api/src/routers/scoring.ts:67, packages/api/src/routers/scoring.ts:172; packages/api/src/scoring/types.ts:34 ghi "kept for web backward compatibility") nhưng web vẫn có nhánh và chữ cho nhánh này ("Bài thi đã được ghi nhận!", "Tính năng chấm điểm AI sắp ra mắt"). *(Hỏi: Kỹ thuật)* — Giữ làm dự phòng lệch phiên bản hay xóa? Tham chiếu FR-039.
* [ ] OQ-7: **Thử lại ở màn kết quả không tôn trọng cờ được phép thử lại.** Màn tiến trình vô hiệu nút khi hết lượt và đổi mã lỗi hạn mức thành câu thân thiện; màn kết quả (bài `failed`) luôn cho bấm và mọi lỗi (kể cả hết lượt) rơi vào câu chung "Chưa gửi được yêu cầu chấm lại. Vui lòng thử lại sau ít phút." *(Hỏi: PO/UX)* — Cố ý hay sót? Tham chiếu FR-043, E-039, E-044.
* [ ] OQ-8: **Ba bước tiến trình tĩnh.** "Chuyển giọng nói thành chữ / Chấm 4 tiêu chí / Tổng hợp kết quả" không gắn với trạng thái thật (không đánh dấu bước hiện tại). *(Hỏi: UX)* — Chỉ minh họa hay dự định gắn tiến độ thật? Tham chiếu FR-040.
* [ ] OQ-9: **Mục tiêu thời gian và tỷ lệ thành công.** Code không nêu thời gian chấm mong muốn hay tỷ lệ thành công. Ngưỡng "chậm" 10 phút, chu kỳ hỏi 2,5/5/10 giây và 3 lần lỗi liên tiếp là hằng số giao diện không có lý do đi kèm. *(Hỏi: PO)* — Mục tiêu (SLO) cho học viên là gì? Tham chiếu SC-01, SC-02, NFR-001.
* [ ] OQ-10: **Lease so với thời lượng pipeline.** Comment hạ tầng nói ước lượng 10 phút cho 3 lần chấm là "unmeasured estimate" và `SCORING_RUNS` lớn hơn 3 có thể vượt lease 12 phút, khiến bộ quét giành bài của worker còn sống (nhân đôi chi phí); cấu hình vẫn cho đến 7 (packages/infra/alchemy.run.ts:14-21; packages/api/src/scoring/config.ts:3). *(Hỏi: Kỹ thuật)* — Có đo lại? Có nên chặn cứng giá trị lớn hơn 3? Tham chiếu NFR-002.
* [ ] OQ-11: **Dữ liệu vận hành lần chấm và chi phí.** Mỗi lần chấm lưu JSON thô, token, chi phí nhưng không có màn/API nào đọc ra (negative-search bên dưới); thông điệp lỗi được lưu "cho vận hành" mà chưa có nơi xem. *(Hỏi: PO/Vận hành)* — Ai dùng các dữ liệu này, bằng công cụ nào? Thời hạn lưu? Tham chiếu SC-04, NFR-011.
* [ ] OQ-12: **Thông báo khi chấm xong.** Không tìm thấy email/push khi điểm sẵn sàng; học viên phải giữ trang hoặc vào lịch sử (negative-search). *(Hỏi: PO)* — Có cần thông báo, nhất là khi chấm quá 10 phút?
* [ ] OQ-13: **Thông điệp cho học viên khi nộp vượt trần hoặc khi định dạng âm thanh không hỗ trợ.** Máy chủ trả "ANSWER_COUNT_EXCEEDED"/"TOTAL_AUDIO_LIMIT_EXCEEDED" khi nộp, nhưng web chỉ xử lý riêng lỗi "đã nộp"; lỗi khác hiện lỗi nộp chung. Với định dạng âm thanh không hỗ trợ khi chấm (`Unsupported audio type for grading`) bài thử lại 3 lần rồi `failed` mà học viên không biết nguyên nhân. *(Hỏi: UX/PO)* — Có muốn nêu rõ nguyên nhân? Tham chiếu E-009, E-025.
* [ ] OQ-14: **Bài nộp ít câu hơn kỳ vọng.** Code chỉ chặn 0 câu và vượt trần; không có số câu tối thiểu. Bài chỉ có 1 trong 8 câu vẫn được chấm đủ 4 tiêu chí và ra band tổng. *(Hỏi: PO)* — Có cần ngưỡng tối thiểu hoặc cảnh báo "kết quả chỉ dựa trên n câu"? Tham chiếu FR-002, FR-044.
* [ ] OQ-15: **Số lần xử lý (3) và số lần giao hàng đợi.** Với `maxRetries` = 3, thông điệp có thể được giao tối đa 4 lần; lần giao thứ 4 (nếu tới) bị bỏ qua vì bài đã `failed`. Hai hằng số độc lập nhau. Test consumer dùng giá trị 2 (apps/server/src/queue.test.ts:9) nên không khẳng định tổ hợp thực tế. *(Hỏi: Kỹ thuật)* — Cố ý? Tham chiếu BR-010, BR-012.
* [ ] OQ-16: **Khối "Luyện lại câu yếu nhất".** Nút "Luyện ngay" chỉ đưa về màn chọn đề; không có logic chọn câu yếu nhất (apps/web/src/features/results/results-screen.tsx:410-425). *(Hỏi: PO)* — Tính năng dự kiến hay chữ giữ chỗ? Tham chiếu FR-050.
* [ ] OQ-17: **Nội dung đại diện lệch band hiển thị.** Mỗi tiêu chí hiển thị band trung vị, nhưng tóm tắt/bằng chứng lấy từ MỘT lần gần trung vị nhất, nên bằng chứng có thể phản ánh lần có band khác band hiển thị. *(Hỏi: PO)* — Chấp nhận được? Tham chiếu FR-021.
* [ ] OQ-18: **Kiểm soát chất lượng nội dung chấm.** Prompt yêu cầu tiếng Việt cho nhận xét và tiếng Anh cho trích dẫn; code không kiểm tra ngôn ngữ đầu ra, không có bước so sánh điểm AI với giám khảo thật. *(Hỏi: PO/Chất lượng)* — Có cơ chế đánh giá độ chính xác (tham chiếu docs/tech-debt về "30-sample scoring eval" chưa được đọc trong lượt này)?
* [ ] OQ-19: **Dữ liệu lần chấm không nằm trong bản xuất dữ liệu cá nhân.** Hàm xuất của feature privacy-controls trả rỗng cho lần chấm (packages/api/src/data-registry.ts:146-151), chỉ xóa; bản ghi chấm chỉ xuất một phần cột. Comment trong code nói đây là quyết định về dữ liệu vận hành. *(Hỏi: PO/Pháp lý)* — Cố ý và còn đúng? Tham chiếu mục 11 (privacy-controls).

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|-----|-------|--------|-------|
| Giá trị thật các biến môi trường chấm điểm | Chỉ biết tên biến và mặc định; giá trị triển khai không được chép | Không chặn | DevOps |
| Giá trị `VITE_FEATURE_SCORING` | File dotenv của web bị chặn đọc (OQ-3) | Chặn quyết định hành vi giao diện | PO/DevOps |
| Số khóa câu hỏi mỗi chế độ thi thử (8/4/1/3 lấy từ comment) | Chưa đếm ngân hàng câu hỏi thi thử | Không chặn | Kỹ thuật |
| Kiểm thử hạ tầng thật (Queue, cron) | Test chỉ dùng mock | Không chặn | Kỹ thuật |
| Đối chiếu tài liệu sản phẩm (PRD, product-decisions) | Chưa đối chiếu `docs/_product/prd.md` và `docs/product-decisions.md` | Không chặn | BA |
| Phạm vi đọc test | Đọc tiêu đề toàn bộ test và nội dung các đoạn trích ở reverse-sources.md; chưa đọc hết thân test | Không chặn | — |
| report-modal.tsx và test | Thuộc score-dispute, không đọc | Không chặn | — |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm (ID) | Nguồn A nói | Nguồn B nói | Ghi chú (đề xuất giải quyết, chưa duyệt) |
|----|---------|---------|----------------------------------|
| C-1 | Comment cột band tổng: "Median overall band, rounded to the nearest 0.5" (packages/db/src/schema/score.ts:23) | Code: band tổng là làm tròn IELTS của trung bình 4 trung vị tiêu chí, quy tắc 0.25/0.75, không phải trung vị của band tổng (packages/api/src/scoring/aggregate.ts:61-65; packages/api/src/scoring/score-attempt.ts:463) | Theo code (packages/api/src/scoring/aggregate.test.ts:60-69 xác nhận). Comment schema lỗi thời. |
| C-2 | Comment schema "The row is created when a scorable attempt is submitted" (packages/db/src/schema/score.ts:8-9) và comment hạ tầng "Forecast-practice scoring jobs" (packages/infra/alchemy.run.ts:30) | Code: mọi bài có câu trả lời đều được chấm, cả thi thử (packages/api/src/routers/attempt.ts:280-296; packages/api/src/routers/scoring.ts:88-91 nhắc "all-modes cutover") | Theo code. Comment lỗi thời. |
| C-3 | Web dùng `FEATURES.scoring` để hiện "sắp ra mắt" cho bài chưa có điểm (apps/web/src/features/results/results-screen.tsx:223) | Backend đã chấm thật mọi bài nộp; test cờ tắt vẫn hiển thị kết quả thật (apps/web/src/features/results/__tests__/scored-results.test.tsx:91-139) | Cờ chỉ còn tác dụng cho nhánh dự phòng. Cần PO xác nhận (OQ-3). |
| C-4 | Doc hook theo dõi chấm: "Drives a forecast practice attempt" (apps/web/src/features/scoring/use-scoring-job.ts:124) | Hook xử lý mọi bài đã nộp, cả thi thử (packages/api/src/routers/scoring.ts:88-91) | Theo code. |
| C-5 | Chữ mặc định thẻ band: "Điểm số và khoảng tin cậy được tính toán từ các lượt chấm độc lập." (apps/web/src/features/results/components/band-hero.tsx:22) | Kết quả thật cố ý không có khoảng tin cậy hay lượt chấm (apps/web/src/features/results/scored-result.ts:14; apps/web/src/features/results/results-screen.tsx:254-256) | Chữ mặc định chỉ hiện khi không truyền nhận xét; kết quả thật luôn truyền nhận xét (có thể chuỗi rỗng, khi đó bị ẩn). Cần xác nhận có dùng không (🟡). |

## 4. Inferred assumptions (suy đoán về lý do/ý định — hạ về 🟡 sau audit độc lập, cần Product Owner xác nhận)

* *Đường cứu không tính hạn mức vì khôi phục trạng thái bị mất, không phải thêm lượt chấm* — suy từ comment (packages/api/src/routers/scoring.ts:88-92) + test "rescues a submitted mock attempt without a score row, exempt from retry quotas" (packages/api/src/routers/scoring.test.ts:177) + comment bảng nhật ký "Rescue-path re-enqueues never write here" (packages/db/src/schema/score.ts:85). 🟡
* *Trễ 10 giây khi xếp hàng nhằm chờ các tệp ghi âm đang tải lên kịp lưu* — comment (packages/api/src/scoring/queue.ts:10-14) + comment khóa chặn trần (packages/api/src/routers/attempt.ts:237-240) + việc chạy lại bộ chặn khi chấm (packages/api/src/scoring/score-attempt.ts:258-259). 🟡
* *Giới hạn song song 2 và mỗi lô 1 thông điệp để kiểm soát chi phí và giới hạn tốc độ của một khóa dịch vụ* — comment (packages/infra/alchemy.run.ts:14-18) + cấu hình (packages/infra/alchemy.run.ts:85-87). 🟡
* *Bằng chứng phải trích nguyên văn nhằm ngăn AI bịa trích dẫn* — quy tắc prompt (packages/api/src/scoring/prompt.ts:170) + bộ lọc (packages/api/src/scoring/prompt.ts:94-97). 🟡
* *Ngân sách âm thanh 8 MiB để bảo vệ bộ nhớ worker* — comment (packages/api/src/scoring/score-attempt.ts:45-49) + nạp tuần tự có đếm byte (packages/api/src/scoring/score-attempt.ts:322-335). 🟡
* *Soft paywall đã dựng sẵn nhưng chủ động tắt cho kết quả chấm thật trong Beta* — comment (apps/web/src/features/results/results-screen.tsx:258) + test "no paywall" (apps/web/src/features/results/__tests__/scored-results.test.tsx:95). 🟡

<details>
<summary>Negative-search (pattern + phạm vi đã grep)</summary>

| Điều tìm | Pattern | Phạm vi | Kết quả |
|----------|---------|---------|---------|
| Nơi đọc lần chấm / lỗi / chi phí cho người vận hành | `scoreRun\|score_run\|lastError\|last_error` | packages, apps (trừ test, migrations, node_modules) | Chỉ schema, router scoring (chỉ ghi, không trả `lastError` ra), `packages/api/src/data-registry.ts` (xuất/xóa người dùng), requeue, score-attempt, prompt. Không có màn/API quản trị đọc ra. |
| Thông báo khi chấm xong | `notify\|sendEmail\|email.*scor\|push.*scor` (không phân biệt hoa thường) | packages/api/src/scoring, apps/server/src | Không có kết quả. |
| Thủ tục quản trị chấm điểm | đọc toàn bộ packages/api/src/routers/scoring.ts | 3 thủ tục: status, retry, getResult | Không có thủ tục admin. |
| Nơi dùng ba bước tiến trình | `SCORING_STEPS` | apps/web/src | Chỉ định nghĩa và render trong scoring-screen.tsx (dòng 18 và 287). |
| Logic "câu yếu nhất" | `weakest\|yếu nhất` | apps/web/src (trừ test) | Chỉ chữ ở results-screen.tsx:414 và profile-screen.tsx:398; không có logic chọn câu. |
| Giá trị cờ `VITE_FEATURE_SCORING` | `VITE_FEATURE_SCORING` | repo (trừ node_modules) | Chỉ feature-flags.ts và tài liệu plans; file dotenv web bị chặn đọc. |
| Nơi nào trả cờ chấm được = false (nghi nhánh not_scorable của web là mã chết) | `scorable: false` | packages, apps (trừ test, node_modules) | Không có kết quả; chỉ có hai chỗ đặt `scorable: true` (packages/api/src/routers/scoring.ts:68, packages/api/src/routers/scoring.ts:173). |
| Test bị bỏ qua | `it.skip\|it.todo\|describe.skip\|xit(` | packages/api/src/scoring, packages/api/src/routers/scoring.test.ts, apps/server/src/*.test.ts, apps/web/src/features/scoring, apps/web/src/features/results | Không có. |
| Cờ `SCORE_DISPUTE_ENABLED` | `SCORE_DISPUTE_ENABLED` | packages, apps | Có ở packages/infra/alchemy.run.ts, packages/api/src/context.ts, packages/api/src/routers/dispute.ts — thuộc feature score-dispute, ngoài scope. |

</details>
