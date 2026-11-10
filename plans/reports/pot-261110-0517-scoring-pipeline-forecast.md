# POT: Scoring pipeline (beta) cho luyện forecast (#90)

Môi trường: beta thật, https://vox.vinhtran.io.vn. Tài khoản test là `th.vinh102+pot@…`, tạo riêng cho POT. Micro giả của Chromium phát một câu tiếng Anh dài khoảng 11 giây cho mọi câu hỏi. Topic là **Tiredness** (Part 1, 4 câu). Bài đã chấm: `a4862703-fd76-43a0-8171-1015f12cdc11`.

**Code:**
- PR #95, merge commit `87b0275`.
- PR #98 (`60a5a5b`) chuyển deploy sang runner `ubuntu-latest`, vì runner self-hosted đang offline.

**Deploy:**
- Run [42760874498](https://github.com/vinh19410/vox-flow/actions/runs/42760874498): xanh. D1 đã được sao lưu thành artifact `d1-backup-60a5a5b…` (300 KB) trước khi áp migration. `scoring-queue` và consumer đã được tạo. Smoke: API trả OK, 178 đề.
- Run [42762054057](https://github.com/vinh19410/vox-flow/actions/runs/42762054057): deploy lại sau khi thêm secret `OPENAI_API_KEY` vào env `beta` (`[server/OPENAI_API_KEY] update`).

## Done means → bằng chứng

| # | Done means | Bằng chứng | Kết quả |
|---|---|---|---|
| 1 | Nộp lượt forecast → queued → chấm bất đồng bộ: whisper + gpt-6-luna × 3, trung vị, band bước 0.5, lưu run và token, gọi trùng không nhân bản, hết lượt thử thì `failed` | Dữ liệu export của chính tài khoản test, xem khối bên dưới | ✅ |
| 2 | Màn chấm theo dõi trạng thái thật, xong thì sang kết quả; lỗi có nút chấm lại, không mất bài | Ảnh bước 06 và 07; nhánh lỗi gặp thật ở lần chạy đầu (mục "Sự cố") | ✅ |
| 3 | Kết quả đọc từ API: band tổng, 4 tiêu chí, bằng chứng nguyên văn; không có khoảng tin cậy hay số lần chấm; không paywall; chỉ chủ bài xem được | Ảnh bước 07, 08, 09; `scoring.status` trả 401 khi chưa đăng nhập; test ownership trong `routers/scoring.test.ts` | ✅ |
| 4 | Các mode khác giữ màn "đã ghi nhận" | Test `scoring-screen.test.tsx` và `exam-submit.test.tsx` (nhánh mock exam) | ✅ (unit test) |
| 5 | Test và `check-types` pass, review độc lập sạch, PR merge, deploy xanh | Xem mục "Gate" | ✅ |
| 6 | POT trên beta: chọn đề → làm bài → đang chấm → kết quả, 3 viewport | Bảng ảnh bên dưới | ✅ (chỉ giao diện sáng, xem ghi chú) |

### Dữ liệu chấm thật (`privacy.exportData` của tài khoản test)

```
attempt_score: {"id":"a4862703-…","status":"done","tries":1,"err":null,"overall":4.5}
score_run (3 lần độc lập):
  run 0: fc 3.5 lr 4 gra 5 p 4  overall 4   model gpt-6-luna audioUsed false tokens 996/2244
  run 1: fc 2.5 lr 4 gra 5 p 5  overall 4   model gpt-6-luna audioUsed false tokens 996/2273
  run 2: fc 4   lr 4 gra 5 p 5  overall 4.5 model gpt-6-luna audioUsed false tokens 996/2264
Trung vị: FC 3.5 · LR 4.0 · GRA 5.0 · P 5.0 → trung bình 4.375 → làm tròn IELTS 4.5 (khớp màn kết quả)
attempt_answer: 4 câu audio/webm (13–16s), transcript whisper lưu đủ 4 câu
Thời gian: nộp → có kết quả khoảng 70 giây
```

Band thấp là đúng với dữ liệu: micro giả phát một câu về căn hộ cho mọi câu hỏi về "Tiredness", nên câu trả lời lạc đề. Model đã nhận ra điều này trong nhận xét tổng.

## Ảnh chụp: luồng đầy đủ

| Bước | Mobile 375 | Tablet 768 | Desktop 1440 |
|---|---|---|---|
| 1. Chọn đề (tìm "Tiredness") | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-01-chon-de-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-01-chon-de-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-01-chon-de-desktop.png?raw=true) |
| 2. Chi tiết đề → "Luyện chủ đề này" | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-02-chi-tiet-de-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-02-chi-tiet-de-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-02-chi-tiet-de-desktop.png?raw=true) |
| 3. Vào phòng thi | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-03-vao-phong-thi-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-03-vao-phong-thi-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-03-vao-phong-thi-desktop.png?raw=true) |
| 4. Đang ghi âm câu 1 | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-04-dang-ghi-am-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-04-dang-ghi-am-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-04-dang-ghi-am-desktop.png?raw=true) |
| 5. Kiểm tra trước khi nộp | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-05-kiem-tra-truoc-khi-nop-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-05-kiem-tra-truoc-khi-nop-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-05-kiem-tra-truoc-khi-nop-desktop.png?raw=true) |
| 6. Đang chấm (trạng thái thật) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-06-dang-cham-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-06-dang-cham-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-06-dang-cham-desktop.png?raw=true) |
| 7. Kết quả: band tổng + 4 tiêu chí | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-07-ket-qua-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-07-ket-qua-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-07-ket-qua-desktop.png?raw=true) |
| 8. Bằng chứng theo tiêu chí | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-08-bang-chung-tieu-chi-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-08-bang-chung-tieu-chi-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-08-bang-chung-tieu-chi-desktop.png?raw=true) |
| 9. Xem lại từng câu (transcript thật) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-09-xem-lai-tung-cau-mobile.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-09-xem-lai-tung-cau-tablet.png?raw=true) | ![](https://github.com/vinh19410/vox-flow/blob/d5124405033e2918489939428de26a8f910920c9/plans/reports/90-scoring-09-xem-lai-tung-cau-desktop.png?raw=true) |

## Sự cố trong lúc POT và cách xử lý

1. **Runner self-hosted offline.** Run deploy `42759255574` kẹt ở queued. Chủ repo chuyển repo sang public và yêu cầu dùng runner của GitHub. Run cũ đã bị huỷ (chưa thực thi bước nào), và PR #98 đổi sang `ubuntu-latest`.
2. **Env beta thiếu secret `OPENAI_API_KEY`.** Bài POT đầu tiên (`a22e77d0-…`) đi đủ luồng: queue nhận việc 3 lần rồi ghi `failed` với lỗi `Scoring unavailable: OPENAI_API_KEY is not configured`, và màn chấm hiện "Chấm điểm chưa thành công" kèm nút "Chấm lại". Như vậy nhánh lỗi đã được kiểm chứng trên môi trường thật. Chủ repo đã thêm secret, deploy lại, và bài thứ hai chấm thành công.

## Gate

- `pnpm --filter @vox-flow/api test`: 191/191
- `pnpm --filter server test`: 27/27
- `pnpm --filter web test`: 273/273 (chạy nhiều lần liên tiếp đều pass)
- `pnpm check-types`: 7/7
- CI deploy chạy lại `check-types` và toàn bộ test: xanh
- Review độc lập 4 vòng, vòng 4 kết luận clean. Báo cáo ở `plans/reports/code-reviewer-261110-scoring-pipeline-*.md`.

## Ghi chú và giới hạn

- **`gpt-6-luna` chỉ nhận text.** API từ chối mọi khối audio, kể cả wav, nên `audioUsed=false`. Điểm Pronunciation là ước lượng từ transcript, và nhận xét trên màn kết quả cũng nói rõ điều này.
- **Không có giao diện tối.** Layout `_proto` luôn ép giao diện sáng (`routes/_proto/route.tsx`), nên POT chỉ có giao diện sáng.
- **Ảnh full-page trên mobile** có thanh điều hướng dưới (fixed) đè lên giữa ảnh. Đây là hiện tượng của cách chụp full-page, không phải lỗi bố cục.
- **Lỗi có từ trước** lộ ra khi chụp, đã tách issue: #99 (thẻ "Luyện lại câu yếu nhất" vỡ bố cục ở 375px).
- **Theo dõi riêng:** #91 (giới hạn chi phí), #92 (export/D1), #93 (cấu hình queue và prompt injection), #94 (bản ghi trước khi có attemptId), #96 (thứ tự upload phía server), #97 (`Promise.withResolvers` trên iOS dưới 17.4).
