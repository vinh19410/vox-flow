# Re-review: scoring pipeline forecast (sau các fix 615ba76..938a643)

Phạm vi: `git diff dev...feat/scoring-pipeline-forecast`, tập trung các commit fix. Chỉ review, không sửa code.

## Gate đã chạy

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @vox-flow/api test` | 190/190 pass |
| `pnpm --filter server test` | 27/27 pass |
| `pnpm --filter web test` | Lần 1 exit 1 (không giữ được tên test lỗi), 3 lần chạy lại liên tiếp 254/254 pass. Nghi có test flaky. |
| `pnpm check-types` | 7/7 pass |

## Đánh giá từng fix

| Finding | Kết luận | Ghi chú |
|---|---|---|
| M3 lease/claim | Đạt | Claim `queued` hoặc `processing` hết lease, `tries < MAX`. Ghi lỗi có điều kiện `status=processing AND tries=claimed.tries`. `done` ghi khi `status != done`. Sweep chạy song song với consumer an toàn vì update của sweep vẫn kèm `isStale`. Còn một lỗ nhỏ, xem L-A. |
| M2 probe audio một lần | Đạt | Run đầu chạy tuần tự, bị từ chối thì `audioBody = undefined` trước khi các run sau bắt đầu. Ngoài audio rejection, lỗi khác ném ra cả delivery. `audio_used` đúng theo từng run. Phần "bộ nhớ bị chặn" chỉ đúng cho grading, xem L-C. |
| L1 `db.batch` | Đạt | Query builder của drizzle là lazy, nên `markSubmitted` không chạy hai lần. `inserted` lấy từ `.returning()` trong batch. Có tác dụng phụ ở web, xem M-A. |
| H1 server, delay 10s | Đạt | `delaySeconds` ở cả submit và retry. |
| H1 web, chờ upload | Phần lớn đạt | Upload được track từ lúc `recorder.stop()`. Server từ chối upload sau khi submit (`index.ts:126`) nên việc chờ trước submit là đúng hướng. Còn lỗ hiếm, xem L-B. |
| M4 cron split | Đạt | `*/5` chỉ chạy sweep, `0 *` chỉ chạy dispute. Cron lạ chạy cả hai. Test đối chiếu với `alchemy.run.ts`. |
| M4 polling | Đạt | Backoff 2,5s/5s/10s. Sau 10 phút dừng và chuyển sang `slow`. `startedAt` reset khi bấm "Kiểm tra lại", đúng ý đồ. |
| L2, L3, L4, 615ba76 | Đạt | L3 tách message đúng, nhưng nhánh fallback phía sau vẫn hỏng, xem M-A. |

## Findings

### M-A. [Medium] Bấm "Gửi lại" sau khi submit đã thành công nhưng mất response thì kẹt vĩnh viễn ở `submit_error`

- **Vị trí:** `apps/web/src/features/scoring/use-scoring-job.ts:255-260`, `packages/api/src/routers/scoring.ts:77-90`.
- **Kịch bản (mạng di động chập chờn):**
  1. `attempt.submit` commit trên server (attempt `submitted`, score `queued`), nhưng response bị mất.
  2. `scoring.status` để khôi phục cũng lỗi mạng, nên màn hình hiện `submit_error`.
  3. Học viên bấm "Gửi lại". `submit` trả "Attempt is already submitted", code gọi `scoring.retry`.
  4. Score row đang `queued`/`processing`/`done`, không phải `failed`, nên `retry` trả BAD_REQUEST "Only a failed or unscored attempt can be retried".
  5. Hiện "Vẫn chưa gửi được bài". Bấm lại bao nhiêu lần cũng ra cùng kết quả. Học viên không vào được màn polling hay màn kết quả, dù bài đang hoặc đã được chấm.
- **Vì sao nằm trong lần sửa này:** Sau L1 (`db.batch`), một attempt forecast đã `submitted` luôn có score row. Vì vậy trường hợp "đã submit nhưng chưa có score" mà nhánh fallback nhắm tới gần như không còn xảy ra. Nhánh này giờ chỉ thành công khi score đang `failed`. Test `scoring-screen.test.tsx:224` mock `retry` trả `queued`, điều mà server thật không làm được ở trạng thái này, nên test không chứng minh được hành vi.
- **Đề xuất sửa:** Khi gặp "already submitted", gọi `scoring.status` trước:
  - `queued`/`processing`/`done` thì `markSubmitted` rồi chuyển sang `QUEUED` để polling xử lý tiếp.
  - `failed` hoặc `not_scored` mới gọi `scoring.retry`.
  - Sửa test cho `retry` trả BAD_REQUEST khi status là `queued`.

### L-A. [Low] Token của lease là `tries`, nhưng `scoring.retry` reset `tries=0`, nên worker cũ có thể ghi đè claim mới

- **Vị trí:** `packages/api/src/scoring/score-attempt.ts:191-197`, `packages/api/src/routers/scoring.ts:80`.
- **Kịch bản:**
  1. Worker A claim với `tries=1` rồi chạy quá lease.
  2. Row thành `failed` (sweep, hoặc `markScoreFailed` ở lần giao cuối của một message trùng). Học viên bấm "Chấm lại", `tries` về 0.
  3. Worker B claim, `tries` lại thành 1.
  4. A gặp lỗi: điều kiện `processing AND tries=1` khớp, nên A ghi `queued`/`failed` đè lên B. B sau đó vẫn ghi được `done`, nên chỉ hỏng khi B cũng lỗi. Chuỗi điều kiện này rất khó xảy ra.
- **Đề xuất sửa:** Dùng thêm `updatedAt = claimedAt` làm token, hoặc thêm cột `claim_id`, trong điều kiện release.

### L-B. [Low] Flush bỏ qua kết quả `false` của các upload đang chạy. Nếu IndexedDB không giữ được bản ghi, câu đó bị bỏ mà không báo (phần còn lại của H1)

- **Vị trí:** `apps/web/src/features/exam/answer-uploads.ts:109-111`, `storage.ts:54-67, 89-106`.
- **Kịch bản:** Upload đang chạy lỗi mạng. Danh sách cần retry chỉ lấy từ `listPendingUploads`, bỏ qua các trường hợp sau:
  - `put` báo `onsuccess` nhưng transaction abort lúc commit (QuotaExceeded báo ở transaction, không báo ở request). Bản ghi không còn ở đâu cả.
  - `saveAudioBlob` lỗi nên ghi vào `memoryStore`, trong khi `listPendingUploads` mở IDB thành công nên không đọc `memoryStore`.
  - `listPendingUploads` lỗi thì `.catch(() => [])`.

  Kết quả: `failedQuestionKeys=[]`, bài được nộp thiếu câu, `done` là vĩnh viễn.
- **Đề xuất sửa:**
  - Track `questionKey` cùng promise. Upload in-flight trả `false` mà không có trong danh sách pending thì tính là lỗi.
  - Chờ `tx.oncomplete` thay vì `req.onsuccess`.
  - Gộp kết quả từ `memoryStore` vào danh sách pending.
  - Không coi lỗi của `listPendingUploads` là "không có gì".

### L-C. [Low, thuộc phạm vi giới hạn byte/câu đã tách issue] Comment "memory stays bounded" chưa đúng ở bước transcription

- **Vị trí:** `packages/api/src/scoring/score-attempt.ts:265-296`.
- **Vấn đề:** Khi tổng audio vượt 8 MB, `audio.clear()` được gọi. Bước transcription sau đó tải lại mọi file còn thiếu transcript từ R2, song song qua `Promise.allSettled`, nên toàn bộ buffer vẫn nằm trong RAM cùng lúc. File cũng bị đọc hai lần. Chưa có giới hạn số câu nên không chặn được bộ nhớ.
- **Đề xuất sửa:** Transcribe tuần tự hoặc giới hạn concurrency khi vượt ngân sách, và sửa comment. Có thể gộp vào issue giới hạn byte/câu.

### Ghi chú (không phải finding)

- Worker bị kill (OOM, wall limit) khi đang giữ claim: lần giao lại thấy lease còn sống nên trả `skipped` và ack, message mất. Phải chờ lease 12 phút cộng tối đa 5 phút tới sweep. Hệ quả chấp nhận được của lease 12 phút đã chốt, và màn `slow` sau 10 phút xử lý về UX.
- Bản ghi trong IDB của câu bị bỏ qua qua "Bỏ qua câu bị lỗi và nộp bài" không bao giờ bị xoá (upload trả 400 sau khi submit). Chỉ tốn dung lượng thiết bị.

## Kết luận

Không có finding Critical/High. Có 1 Medium (M-A) và 3 Low. Các fix M3, M2, L1, M4 và L2–L4 đúng như mô tả và không gây regression phía server.

## Fixes after re-review

| Finding | Commit | Sửa gì | Test hồi quy |
|---|---|---|---|
| M-A | `8282b90` | Khi "Gửi lại" gặp "already submitted", web gọi `scoring.status` trước. `queued`/`processing`/`done` thì quay lại polling (polling tự chuyển sang kết quả khi `done`). Chỉ `failed`/`not_scored` mới gọi `scoring.retry`. | `scoring-screen.test.tsx` mô phỏng đúng server: submit báo already submitted, `retry` trả BAD_REQUEST trừ khi score `failed`/`not_scored`. 5 case (queued, processing, done, failed, not_scored). 3 case đầu fail trên code cũ. |
| L-A | `c75c69e` | Lệnh release khi lỗi khớp thêm `updatedAt = claimedAt` (claim nào cũng ghi `updatedAt` bằng thời điểm claim), không đổi schema. | `score-attempt.test.ts`: A claim rồi quá lease, `markScoreFailed`, `scoring.retry` thật qua router (tries về 0), B claim lại tới `tries=1`. A lỗi thì trả `skipped`, row giữ nguyên claim của B, B ghi `done`. Fail trên code cũ. |
| L-B | `0585937` | `storage.ts` chờ `tx.oncomplete`, commit bị abort thì giữ bản trong bộ nhớ. `listPendingUploads` gộp cả bản trong bộ nhớ, và ném lỗi khi IDB mở được nhưng đọc lỗi. `answer-uploads.ts` nhớ bản ghi của mọi upload thất bại theo `questionKey` để flush retry cả khi bản trên thiết bị đã mất. Đọc danh sách lỗi thì trả `storageUnreadable: true`, màn chấm điểm không nộp bài và báo rõ. | `storage.test.ts` (dùng IndexedDB giả lập đúng thứ tự `onsuccess` rồi abort lúc commit) và `answer-uploads.test.ts`: commit bị abort, bản thiết bị bị xoá, đọc IDB lỗi, upload sau thành công thì quên lỗi cũ. Thêm case `storageUnreadable` ở `scoring-screen.test.tsx`. |
| Test flaky | `0a29e6b` | `select-setup-route.test.tsx`: test đầu tải chunk route bị code-split (khoảng 600 ms khi máy rảnh) ngay trong cửa sổ 1 giây của `findByRole`, nên fail khi máy bận. Giờ `await router.load()` (và `preloadRoute` cho đích điều hướng) trước khi render. Không nới timeout, không bỏ assertion. | Tái hiện: 8 lần chạy liên tiếp khi máy rảnh đều pass. Chạy web song song với `pnpm --filter @vox-flow/api test` thì 3/3 lần fail đúng test này. Sau khi sửa, cùng điều kiện tải đó pass 3/3. |

Gate sau khi sửa: `pnpm --filter @vox-flow/api test` 191/191, `pnpm --filter server test` 27/27, `pnpm --filter web test` 268/268 ba lần liên tiếp, `pnpm check-types` 7/7.
