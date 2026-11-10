# Review vòng 4: scoring pipeline (`feat/scoring-pipeline-forecast`)

Ngày: 2026-11-10. Reviewer độc lập, chỉ đọc code (không sửa code, không commit).

## Phạm vi

- `git diff afaef5e..56113d8`: commit `c8870ff` (nhãn "Vẫn nộp bài") và `0b830b0` (ticket theo từng câu, abort upload bị thay thế, hàng đợi IDB theo câu, flush chỉ gửi bản mới nhất).
- File: `apps/web/src/features/exam/answer-uploads.ts`, `apps/web/src/features/exam/__tests__/answer-uploads.test.ts`, `apps/web/src/features/scoring/scoring-screen.tsx`, `apps/web/src/features/scoring/__tests__/scoring-screen.test.tsx`.
- Đã đọc thêm các phần liên quan: `storage.ts`, `use-exam-session.ts` (`stopRec`, `retryStep`), `use-scoring-job.ts` (`ensureUploaded`).
- Không tính là finding: thứ tự ghi phía server (#96), #91 đến #94, L-2 đến L-4 của vòng 3.

## Kết luận

**Clean.** Không có finding critical, high hay medium. M-1 và L-1 của vòng 3 đã được sửa đúng. Còn 2 mục Low và 1 ghi chú ngoài phạm vi.

## Kiểm chứng bản sửa M-1

| Bất biến | Kết luận | Bằng chứng |
|---|---|---|
| Flush không gửi hay lưu bản cũ đè lên bản mới | Đúng | `trackAnswerUpload` cấp ticket ngay khi được gọi, tức theo thứ tự thao tác của người dùng, không theo lúc mã hoá xong. `claimAnswer` trả `null` khi đã có ticket lớn hơn. Bản bị thay thế không bao giờ gọi `setFailed(record)` của chính nó: `settleSuperseded` chỉ đánh dấu `newest.record`. Ở flush, `toRetry` bị ghi đè bằng `slot.record` cho mọi câu có slot, nên bản IDB hay bản trong bộ nhớ của bản cũ đều không được gửi. Trước và sau mỗi `postAnswerAudio`, flush đều kiểm tra `isNewest(slot)`. |
| Kết quả của bản cũ không xoá bản mới trên thiết bị | Đúng | Mọi `saveAudioBlob` và `deleteAudioBlob` trong module đều đi qua `serializeStorage`, và kiểm tra `isNewest` ngay lúc chạy chứ không phải lúc xếp hàng. Bản cũ không còn tự xoá trong `postAnswerAudio` (bước xoá đã chuyển sang `settleNewest`). Ở nhánh không có slot (bản từ lần tải trang trước), flush chỉ xoá khi `!answerSlots.has(key)`. |
| Không deadlock trong hàng đợi theo câu | Đúng | Chuỗi có dạng `prev.then(write).catch(() => {})`, nên không bao giờ reject và lỗi không làm tắc hàng. Các `write` chỉ gọi `saveAudioBlob` hoặc `deleteAudioBlob` và không chờ upload hay chính hàng đợi, nên không có vòng chờ. `flushAnswerUploads` chỉ chờ ảnh chụp `inFlight` rồi xếp lệnh xoá vào sau, không có chiều ngược lại. Mục dọn `storageQueues` chỉ xoá khi entry vẫn là `run`, nên đúng. Nếu `indexedDB.open` treo (lỗi Safari cũ) thì cả hàng treo, nhưng trước bản sửa cũng vậy (`await saveAudioBlob` nằm trước fetch), nên đây không phải hồi quy. |
| Gộp abort với timeout | Đúng trên mọi trình duyệt hỗ trợ `AbortController` | **Không dùng `AbortSignal.any`.** `postAnswerAudio` tạo `AbortController` riêng, đặt timeout bằng `setTimeout` và chuyển tiếp signal ngoài qua `addEventListener("abort", ..., { once: true })`. Nếu signal ngoài đã bị abort thì hàm abort ngay. Trong `finally`, timer được huỷ và listener được gỡ. Các API dùng ở đây có từ iOS Safari 12.2 (`AbortController`) và 10.1 (`DOMException` constructor). `abort(reason)` và `signal.reason` có từ Safari 15.4; bản cũ hơn bỏ qua tham số và vẫn abort với `AbortError`. So với trước, đây còn là cải thiện: code cũ chỉ có timeout khi có `AbortSignal.timeout` (Safari 16+), nên trên iOS 15 không có timeout nào. |
| Bản cũ báo thành công muộn | Đúng (phía client) | `settleSuperseded(ok=true)` bật `mustResend` và `setFailed(newest.record)`. `settleNewest` giữ bản mới nhất trong `failedUploads` khi `mustResend`. Flush gửi lại bản mới nhất rồi xoá cờ. Trường hợp server ghi R1 sau R2 mà client không nhận được phản hồi thuộc #96. |

Kịch bản đã lần theo code: R2 xong trước R1 (cả thành công lẫn thất bại); R1 được claim trước nhưng R2 mã hoá xong sau; R2 không ra audio (`null`), khi đó R1 vẫn là câu trả lời; R2 lưu IDB thất bại nên rơi về `memoryStore`; flush bị một lần ghi lại mới huỷ giữa chừng, khi đó câu được báo là chưa upload và `ensureUploaded` chặn nộp bài. Không thấy đường nào làm bản cũ thắng ở phía client.

## Đường ghi âm một lần và luồng không phải forecast

- Ghi âm một lần: claim không có slot cũ, rồi save, post, `settleNewest`. Thành công thì `clearFailed` và xoá IDB (qua hàng đợi), thất bại thì `setFailed`. Hành vi này tương đương code trước bản sửa. Các test cũ trong `answer-uploads.test.ts` vẫn pass.
- Luồng không có `attemptId` (`use-exam-session.ts:249`) vẫn gọi thẳng `saveAudioBlob`, không đi qua module này, nên không đổi.
- `trackAnswerUpload` chỉ có một nơi gọi (`use-exam-session.ts:247`, dùng `void`), nên việc giá trị trả về đổi thành `false` khi bị thay thế không ảnh hưởng UI.
- Nhãn nút: `view.missing > 0 ? "Bỏ qua câu bị lỗi và nộp bài" : "Vẫn nộp bài"`. `missing === 0` chỉ xảy ra khi `storageUnreadable`. Test mới xác nhận nhãn và việc submit.

## Critical

Không có.

## High

Không có.

## Medium

Không có.

## Low

- **L-1. `answerSlots` giữ Blob của *mọi* câu trả lời, không chỉ câu lỗi.** Slot không bao giờ bị xoá, kể cả khi upload đã thành công. Vì vậy mỗi tab giữ Blob của mọi câu trong mọi attempt cho tới khi tải lại trang. Mục "Giới hạn còn lại" ở vòng 3 ghi là "cùng giới hạn như L-2", cách nói này hơi nhẹ: L-2 chỉ nói về bản lỗi, còn ở đây là toàn bộ bản ghi. Với audio opus, một attempt khoảng vài MB, nên vấn đề chỉ đáng kể khi người dùng làm nhiều attempt liên tục trong một tab, nhất là trên iOS Safari. Cách sửa gợi ý: khi `settleNewest` thành công mà `!mustResend` (và cả khi flush thành công), bỏ tham chiếu tới Blob nhưng giữ ticket làm tombstone, để `claimAnswer` vẫn từ chối được bản cũ mã hoá xong muộn. Nếu xoá hẳn slot thì sẽ mở lại lỗi M-1, vì khi đó bản cũ có thể claim được.
- **L-2. Thiếu test cho nhánh timeout 120 s và nhánh signal đã bị abort trước khi fetch.** Logic đơn giản và đã kiểm bằng cách đọc code, nhưng chưa có test với fake timers chứng minh timer bị huỷ và listener được gỡ.

## Ghi chú ngoài phạm vi diff (có từ trước)

- `storage.ts` (từ `45cbc13`) và `hooks/use-recorder.ts:104` dùng `Promise.withResolvers`, vốn chỉ có từ Safari/iOS 17.4. Không có polyfill, và Vite (`^8.3.4`) chỉ hạ cú pháp, không polyfill API. Trên iOS dưới 17.4, `recorder.stop()` có thể ném `TypeError`, và khi đó không có upload nào được tạo. Không liên quan tới bản sửa vòng này. Nên kiểm tra lại mức iOS tối thiểu mà sản phẩm cần hỗ trợ, và nếu cần thì mở issue riêng.

## Gate

Chạy tại `56113d8`, cây sạch:

- `pnpm --filter web test`: 35/35 file, 273/273 test pass, exit 0.
- `pnpm check-types`: 7/7 task pass, exit 0. Kết quả lấy từ cache turbo ("FULL TURBO"), và cache khớp với cây sạch ở `56113d8`.

Chưa kiểm chứng: hành vi abort trên trình duyệt thật (test dùng fetch giả, bỏ qua abort) và độ tương thích iOS mới chỉ kiểm bằng đối chiếu bảng hỗ trợ API, chưa chạy trên thiết bị.

## Việc nên làm

1. (Tuỳ chọn) L-1: bỏ tham chiếu tới Blob trong slot sau khi upload đã được xác nhận, nhưng giữ ticket.
2. (Tuỳ chọn) L-2: thêm test fake timers cho nhánh timeout.
3. Ngoài phạm vi: chốt mức iOS tối thiểu, liên quan tới `Promise.withResolvers`.

## Câu hỏi còn mở

- Sản phẩm có cần hỗ trợ iOS dưới 17.4 không? Câu trả lời quyết định ghi chú về `Promise.withResolvers` có phải là lỗi thật hay không.
