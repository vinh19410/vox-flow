# Feature Map — ChấmRõ (IELTS Speaking AI)

Nguồn: prototype `github.com/vinh19410/vox-flow-prototype` (12 màn S01–S25, toàn bộ dùng dữ liệu mô phỏng).
Ngày: 2026-11-04. Trạng thái: bản đề xuất đã được người dùng xác nhận hướng; chưa đưa vào `docs/_product/prd.md`.

## Quyết định đã chốt
- Phạm vi: lõi bám prototype + nhóm khoảng trống (GAP) gắn nhãn riêng.
- F-13 đến F-15 (forecast, gợi ý độ phủ, nhịp luyện) thuộc MVP.
- Chấm 3 lần, lấy trung vị, áp dụng cho mọi lượt, kể cả gói miễn phí.
- Chỉ đăng nhập Google ở MVP.
- Có hạn mức lượt miễn phí theo ngày (con số chưa chốt, xem Open Question).
- Đề forecast cập nhật qua công cụ admin + tự động hóa.
- Nhắc luyện qua cả email và thông báo đẩy.
- Gói "Đến ngày thi" tối đa 60 ngày, hiển thị trong phần điều kiện gói.

## Feature Map

Độ chín: **UI-only** (chỉ giao diện) · **mock có logic** (có xử lý trên dữ liệu mẫu) · **mô phỏng** (kết quả giả lập) · **thật** (chạy thật trong prototype).

| Epic | ID | Feature | Nguồn | Độ chín | Đề xuất |
|---|---|---|---|---|---|
| Thu hút & vào app | F-01 | Landing giới thiệu giá trị | S01 | UI-only | MVP |
| | F-02 | Đăng ký/đăng nhập Google (chỉ Google) | S02 | UI-only | MVP |
| | F-03 | Onboarding: band mục tiêu + ngày thi | S03 | mock có logic | MVP |
| | F-04 | Kiểm tra micro 5 giây | S04 | thật (mic) | MVP |
| | F-05 | Hai công tắc đồng ý dữ liệu (lưu bài / huấn luyện AI, mặc định tắt huấn luyện) | S05 | mock có logic | MVP |
| Thi thử | F-06 | Chọn bài: Full / Part 1 / Part 2 / Part 3 + giọng giám khảo | S07 | mock có logic | MVP |
| | F-07 | Phòng thi: câu hỏi nối tiếp, cue card 1 phút chuẩn bị, ghi chú nháp | S08–S10 | mock có logic | MVP |
| | F-08 | Cảnh báo câu trả lời quá ngắn trước khi nộp | S10 | mock có logic | MVP |
| Chấm điểm | F-09 | Chấm 3 lần độc lập, lấy trung vị, khoảng tin cậy (mọi gói) | S11 | mô phỏng | MVP |
| | F-10 | Band tổng miễn phí, có hạn mức theo ngày | S12 | mô phỏng | MVP |
| | F-11 | Chi tiết 4 tiêu chí + bằng chứng trích câu nói (khóa sau paywall) | S13–S14 | mô phỏng | MVP |
| | F-12 | Báo lỗi chấm (gửi kèm audio + transcript) | S15 | UI-only | MVP |
| Luyện tập | F-13 | Đề forecast theo quý: lọc, tìm, lưu danh sách ôn | S07b | mock có logic | MVP |
| | F-14 | Gợi ý độ phủ đề và "luyện ngay" | S07b | mock có logic | MVP |
| | F-15 | Việc hôm nay, chuỗi ngày, nhịp luyện theo ngày thi | S06 | mock có logic | MVP |
| Theo dõi tiến độ | F-16 | Dashboard: band ước lượng, điểm mạnh / cần cải thiện | S06 | mock có logic | MVP |
| | F-17 | Lịch sử bài làm + biểu đồ band theo thời gian | S19 | mock có logic | MVP |
| Doanh thu | F-18 | 4 gói: Theo lượt 49k · 7 ngày 99k · 30 ngày 249k · Đến ngày thi 349k (tối đa 60 ngày) | S22 | UI-only | MVP |
| | F-19 | Thanh toán QR tự kích hoạt | S23 | mô phỏng (webhook giả) | MVP |
| | F-20 | Quản lý gói và hóa đơn | S24 | UI-only | MVP |
| Dữ liệu cá nhân | F-21 | Xem, xuất, xóa toàn bộ dữ liệu | S25 | UI-only | MVP |

## Khoảng trống (chưa có trong prototype, sản phẩm thật cần)

| ID | Khoảng trống | Lý do cần | Đề xuất |
|---|---|---|---|
| GAP-01 | Ghi âm và chấm điểm thật | Prototype chỉ mô phỏng; đây là rủi ro lớn nhất của sản phẩm | MVP |
| GAP-02 | Đối soát thanh toán, xử lý tiền về sai/trễ | F-19 hiện chỉ có nút giả lập webhook | MVP |
| GAP-03 | Quy trình giám khảo xử lý báo lỗi chấm | F-12 chỉ gửi báo, chưa có người xử lý | Later |
| GAP-04 | Công cụ admin + tự động hóa cập nhật đề forecast mỗi quý | F-13 cần nguồn đề mới | MVP |
| GAP-05 | Nhắc luyện và hết hạn gói qua email + thông báo đẩy | F-15 cần kênh nhắc | MVP |
| GAP-06 | Quản lý hạn mức lượt miễn phí (đếm, reset mỗi ngày, hiển thị còn lại) | Phát sinh từ F-10 | MVP |

## Ràng buộc nghiệp vụ cần giữ
- Hạn mức lượt miễn phí làm thay đổi lời hứa "Band tổng không giới hạn" (Billing) và "band tổng cho mọi lượt" (Landing): cần sửa wording hai chỗ này.
- Huấn luyện AI luôn tắt mặc định; lưu bài và huấn luyện là hai công tắc tách riêng.
- Gói "Đến ngày thi" hết hạn tự dừng, không tự gia hạn.
- Chấm 3 lần cho mọi lượt làm chi phí chấm của gói miễn phí gấp 3 lần chấm một lần.

## Tư vấn hạn mức lượt miễn phí (chưa chốt)
Đề xuất **3 điểm mỗi ngày**: Full Test = 3 điểm, mỗi Part riêng = 1 điểm (tức 1 Full Test hoặc tối đa 3 lượt Part). Khớp với nhịp "1 bài/ngày" ở Dashboard và tránh lách bằng cách chia nhỏ bài. Phương án đơn giản hơn là 1 lượt mỗi ngày bất kể mode, nhưng người dùng sẽ chỉ chọn Part 1. Con số chưa có chi phí chấm thật làm cơ sở; điều chỉnh sau khi chạy thử GAP-01.

## Open Question
1. Hạn mức lượt miễn phí chốt bao nhiêu (3 điểm/ngày, 1 lượt/ngày, hay số khác)?
2. Người dùng chính của công tắc admin đề forecast là ai (người sở hữu sản phẩm, đội nội dung, hay cộng tác viên)?
3. Tần suất tối đa mỗi ngày của nhắc luyện (email và thông báo đẩy)?

## Chưa kiểm chứng
- Mã màn S13–S15 và S19–S25 suy ra từ sơ đồ màn trong `src/App.tsx`; vị trí chính xác của F-11, F-12 trong `Results.tsx` chưa soi kỹ từng dòng.
- Trạng thái lỗi (mic bị từ chối, mất mạng khi chấm) chưa xác nhận có trong prototype hay không.
- Phân MVP/Later là suy luận, chưa dựa trên dữ liệu người dùng.

## Bước tiếp
Chạy `/prd` ở vault BA `/root/projects/vox-flow` để đưa Feature Map vào `docs/_product/prd.md`, sau đó `/roadmap`, rồi `/srs` cho từng feature MVP.
