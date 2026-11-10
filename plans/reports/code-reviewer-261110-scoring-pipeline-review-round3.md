# Review vòng 3: scoring pipeline (`feat/scoring-pipeline-forecast`)

Ngày: 2026-11-10. Reviewer độc lập, chỉ đọc (không sửa code).

## Phạm vi

- Trọng tâm: `git diff 80fa361..afaef5e` (commit `8282b90`, `c75c69e`, `0585937`, `0a29e6b`, `afaef5e`), sửa các finding trong `plans/reports/code-reviewer-261110-scoring-pipeline-rereview.md` (mục "Fixes after re-review").
- Kiểm tra nhanh toàn nhánh: `git diff dev...feat/scoring-pipeline-forecast` (63 file, khoảng 8k dòng, phần lớn đã qua 2 vòng review).
- Không tính là finding (đã chốt/đang theo dõi): chỉ chấm attempt có `topicId`; không paywall; 3 run ẩn; fallback text-only; lease 12 phút; nút bỏ qua do người dùng chủ động; #91, #92, #93, #94.

## Kết luận

Không còn finding critical/high. Còn **1 finding Medium** (M-1 bên dưới), nên vòng này **chưa "clean"**. Bốn bản sửa của vòng trước đều đúng và đủ với kịch bản mà chúng nhắm tới.

## Kiểm chứng từng bản sửa

| Finding cũ | Commit | Kết luận | Bằng chứng |
|---|---|---|---|
| M-A: "Gửi lại" gặp already submitted | `8282b90` | Đúng | `use-scoring-job.ts` `sendSubmit`: hỏi `scoring.status` trước, chỉ gọi `scoring.retry` khi `scorable && (failed \| not_scored)`. Khớp với server `routers/scoring.ts:55-96`: `retry` chỉ nhận row `failed` hoặc không có row (rescue path đòi `attempt.status === "submitted"`, luôn đúng sau lỗi already submitted). Các trạng thái còn lại vào `QUEUED`, rồi polling xử lý `done`, `not_scorable`, `failed`. Test mô phỏng server đủ 5 trạng thái. |
| L-A: ghi lỗi gắn đúng claim | `c75c69e` | Đúng | `score-attempt.ts:187-202` khớp thêm `updatedAt = claimedAt`. Cột `updated_at` là `timestamp_ms`, claim ghi đúng `claimedAt` (dòng 151), và `runPipeline` không ghi `attemptScore.updatedAt` giữa chừng (chỉ ghi ở bước `done`, dòng ~414). Vì vậy so khớp chính xác giữ được và worker còn sống không mất quyền release. `requeueStaleScores` và `scoring.retry` đều đổi `updatedAt`, nên worker cũ không thể khớp. Test chạy `scoring.retry` thật qua router. |
| L-B: tính toàn vẹn upload | `0585937` | Đúng với kịch bản đã nêu, nhưng có hồi quy (M-1) | `storage.ts`: `saveAudioBlob`/`deleteAudioBlob` chờ `tx.oncomplete`. Commit abort thì dùng bản trong bộ nhớ. `listPendingUploads` gộp IDB với bộ nhớ (bộ nhớ thắng) và ném lỗi khi đọc IDB lỗi. `answer-uploads.ts` nhớ upload lỗi theo `questionKey`, và `flushAnswerUploads` trả `storageUnreadable`. `ensureUploaded` chặn nộp bài khi `storageUnreadable`. Fake IDB mô phỏng đúng thứ tự (`onsuccess` của request chạy trước, abort lúc commit). |
| Thông báo `storageUnreadable` | `0585937` | Đúng | `scoring-screen.tsx`: khi `missing === 0` thì hiện thông báo riêng. Test mới xác nhận không gọi submit. |
| Test router flaky | `0a29e6b` | Đúng | `await router.load()` và `preloadRoute` trước khi render. Không nới timeout, không bỏ assertion. |

## Critical

Không có.

## High

Không có.

## Medium

### M-1. Upload cũ thất bại sau khi bản ghi lại đã lên server: flush gửi đè bản cũ lên bản mới

`apps/web/src/features/exam/answer-uploads.ts` (`rememberOutcome`, `trackAnswerUpload`, `flushAnswerUploads`).

Người dùng ghi lại được một câu từ màn review (`use-exam-session.ts` `retryStep`, nối vào `exam-screen.tsx:127` `onRetry`). Cùng một `questionKey` vì thế có thể có hai upload chạy song song. `rememberOutcome` không phân biệt bản nào mới hơn:

1. R1 (lần ghi đầu của q1) đang upload, mạng chập chờn (timeout tới 120 s).
2. Người dùng ghi lại q1, được R2. R2 upload thành công: `deleteAudioBlob` xoá bản trên thiết bị, `rememberOutcome(ok)` xoá q1 khỏi `failedUploads`.
3. Sau đó R1 thất bại: `rememberOutcome({ record: R1, ok: false })` đưa **R1** vào `failedUploads[q1]`.
4. Lúc nộp, `flushAnswerUploads` gửi lại R1. Server (`apps/server/src/index.ts:130-167`, cùng audio key theo `questionKey`, ghi đè) thay câu trả lời mới bằng câu cũ, và bài được chấm trên câu cũ mà không ai biết.

Trước commit `0585937`, bước 3 không để lại gì (R2 đã xoá bản trên thiết bị, R1 lỗi thì không lưu lại), nên đây là **hồi quy do bản sửa gây ra**. Ở bước 4, flush đi tiếp vì upload "thành công", nên không có cảnh báo nào cho người dùng. Hậu quả: điểm sai một cách im lặng. Mất dữ liệu thì không, vì R2 vẫn còn trong R2 storage cho tới khi bị ghi đè.

(Biến thể có từ trước, ngoài phạm vi bản sửa: R1 *thành công* sau R2 cũng ghi đè R2, vì server lấy bản ghi sau cùng. Cùng cách sửa sẽ xử lý được nếu bỏ qua upload đã bị thay thế.)

Cách sửa gợi ý: gắn số thế hệ cho mỗi `(attemptId, questionKey)`.

```ts
const latestGen = new Map<string, number>(); // key: `${attemptId}::${questionKey}`
// trackAnswerUpload: sau khi await recording -> const gen = bump(key)
// rememberOutcome: if (gen !== latestGen.get(key)) return;   // bản đã bị thay thế
// postAnswerAudio của bản cũ: có thể bỏ qua/abort nếu gen đã cũ trước khi fetch
```

Test hồi quy: `trackAnswerUpload(q1, R1)` với fetch bị chặn bằng promise, `trackAnswerUpload(q1, R2)` thành công, sau đó cho R1 lỗi rồi gọi `flushAnswerUploads`. Kỳ vọng không có fetch nào mang blob của R1.

## Low

- **L-1.** Khi `storageUnreadable` (`missing === 0`), nút phụ vẫn ghi "Bỏ qua câu bị lỗi và nộp bài", trong khi không biết câu nào lỗi. Chữ hơi lệch ngữ cảnh. Hành vi vẫn đúng vì người dùng chủ động bấm.
- **L-2.** Khi người dùng bấm "Bỏ qua…" để nộp, `failedUploads` và `memoryStore` vẫn giữ Blob của attempt đó cho tới khi tải lại trang. Bộ nhớ có giới hạn (theo số câu của một attempt) và được giải phóng khi reload.
- **L-3.** Ở nhánh already submitted với trạng thái `failed`, nếu tab khác đã retry trước (`scoring.retry` trả BAD_REQUEST), người dùng thấy "Vẫn chưa gửi được bài" dù bài đã vào hàng đợi. Rất hiếm, và bấm lại sẽ tự hồi phục (lần sau `status` trả `queued`).
- **L-4 (có từ trước).** `openDatabase()` mở một kết nối IDB mới cho mỗi lệnh gọi và không đóng. Không ảnh hưởng đúng/sai, chỉ lãng phí tài nguyên.

## Kiểm tra nhanh toàn nhánh (`dev...HEAD`)

Đã đọc lại các đường quan trọng: claim/lease/release trong `score-attempt.ts`, `requeue.ts`, consumer `apps/server/src/queue.ts`, `routers/scoring.ts` (owner check ở cả `status`, `retry`, `getResult`; không trả lỗi nội bộ hay run cho người học), luồng submit/poll ở web. Không thấy critical/high mới ngoài các mục đã chốt hoặc đang theo dõi.

## Gate

Chạy tại `afaef5e`, lần lượt từng lệnh:

- `pnpm --filter @vox-flow/api test`: 191/191 pass (21 file)
- `pnpm --filter server test`: 27/27 pass (3 file)
- `pnpm --filter web test`: 268/268 pass (35 file)
- `pnpm check-types`: 7/7 task pass. Kết quả này lấy từ cache turbo ("FULL TURBO"), mà cache khớp với cây đang sạch ở `afaef5e`.

Chưa kiểm chứng: M-1 mới chỉ được chứng minh bằng cách lần theo code, chưa chạy test tái hiện vì repo chỉ được đọc trong vòng review này.

## Việc nên làm

1. Sửa M-1 (thế hệ theo từng câu trong `answer-uploads.ts`) và thêm test hồi quy như trên.
2. (Tuỳ chọn) L-1: đổi chữ nút phụ khi `missing === 0`.

## Câu hỏi còn mở

Không có.

## Fixes after round 3

| Finding | Commit | Cách sửa |
|---|---|---|
| M-1 | `0b830b0` | `answer-uploads.ts`: mỗi bản ghi nhận một số thứ tự (ticket) lúc `trackAnswerUpload` được gọi, nên thứ tự đúng theo thao tác người dùng kể cả khi bản cũ mã hoá xong muộn. Mỗi `(attemptId, questionKey)` chỉ giữ bản mới nhất (`answerSlots`). Bản mới huỷ fetch của bản cũ (`AbortController`, gộp với timeout 120 s). Kết quả của bản cũ không ghi vào `failedUploads` và không xoá/ghi bản trên thiết bị. Các lệnh ghi/xoá IDB theo từng câu chạy tuần tự và kiểm tra lại "còn là bản mới nhất" lúc chạy. Flush chỉ gửi bản mới nhất của trang. Nếu bản cũ vẫn báo thành công muộn (server đã nhận trước khi huỷ), bản mới nhất được đưa vào `failedUploads` để flush gửi lại, nên lần ghi cuối cùng của client lên server luôn là bản mới nhất. |
| L-1 | `c8870ff` | `scoring-screen.tsx`: khi `missing === 0` (không đọc được bộ nhớ thiết bị) nút phụ ghi "Vẫn nộp bài". |

Test hồi quy (`answer-uploads.test.ts`, nhóm "when an answer is recorded again while its first upload is still running"): R1 bị chặn, R2 thành công, R1 lỗi muộn, flush không gửi blob R1 và không còn bản chờ; R1 thành công muộn thì flush gửi lại đúng blob R2 (một lần) và lần flush sau không gửi gì; R1 bị thay trước khi sẵn sàng thì không được upload hay lưu; R2 lỗi thì bản giữ lại trên thiết bị là R2. Ba test đầu fail trên code trước bản sửa.

Giới hạn còn lại: nếu server đã nhận xong R1 nhưng ghi chậm hơn R2 *và* phản hồi của R1 không về được client (huỷ sau khi gửi xong), client không biết để gửi lại R2. Trường hợp này cần thứ tự phía server (ví dụ số phiên bản theo câu), ngoài phạm vi bản sửa. `answerSlots` giữ Blob bản mới nhất mỗi câu tới khi tải lại trang (cùng giới hạn như L-2).

Gate sau bản sửa: `pnpm --filter web test` 2 lần liên tiếp, 273/273 pass (35 file) cả hai lần; `pnpm --filter @vox-flow/api test` 191/191; `pnpm --filter server test` 27/27; `pnpm check-types` 7/7 task, exit 0.
