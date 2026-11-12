---
type: reverse-srs-erd
feature: dispute-admin
updated: 2026-11-11
---

# dispute-admin — ERD tái lập (reverse)

```mermaid
erDiagram
    NGUOI_DUNG ||--o{ CA_KHIEU_NAI : "gui"
    BAI_THI ||--o{ CA_KHIEU_NAI : "bi khieu nai"
    BAI_THI ||--o{ CAU_TRA_LOI : "gom"

    NGUOI_DUNG {
        chuoi id "ma nguoi dung"
        chuoi ten "ten hien thi trong hang doi"
        chuoi email "email, doi chieu danh sach admin"
    }

    BAI_THI {
        chuoi id "ma bai thi"
        chuoi che_do "che do lam bai"
        chuoi trang_thai "trang thai bai thi"
        thoi_diem bat_dau "gio bat dau"
        thoi_diem nop "gio nop"
    }

    CAU_TRA_LOI {
        chuoi id "ma cau tra loi"
        chuoi khoa_cau_hoi "khoa cau hoi"
        chuoi noi_dung_cau_hoi "noi dung cau hoi"
        so phan_thi "phan thi"
        so thu_tu "thu tu cau"
        so thoi_luong_ms "thoi luong ghi am"
        chuoi loai_tep "loai tep audio"
        chuoi transcript "van ban nhan dien, KHONG tra cho admin"
    }

    CA_KHIEU_NAI {
        chuoi id "ma ca"
        chuoi tieu_chi "ALL FC LR GRA PRON"
        chuoi band_ky_vong "band hoc vien mong muon"
        chuoi ly_do "ly do, co the trong"
        boolean dong_y_chia_se "dong y cho admin nghe audio"
        chuoi trang_thai "open reviewing resolved rejected"
        thoi_diem han_xu_ly "han giai quyet"
        chuoi band_cu "band truoc khi xu ly"
        chuoi band_moi "band sau khi chap nhan"
        chuoi phan_hoi "noi dung tra loi hoc vien"
        thoi_diem xu_ly_luc "thoi diem xu ly"
        thoi_diem canh_bao_luc "thoi diem danh dau sap qua han"
        thoi_diem tao_luc "thoi diem tao"
    }
```

## Entity Reference

| Entity | Mô tả nghiệp vụ | Thuộc tính chính | Nguồn | Nhãn |
|--------|-----------------|------------------|-------|------|
| CA_KHIEU_NAI (score_dispute) | Một báo lỗi chấm điểm của học viên cho một bài thi, admin xử lý | tiêu chí (ALL/FC/LR/GRA/PRON), band kỳ vọng, lý do, đồng ý chia sẻ (mặc định không), trạng thái (mặc định open), hạn xử lý, band cũ, band mới, phản hồi, thời điểm xử lý/cảnh báo/tạo/sửa | S14:7-38, S15 | ✅ |
| BAI_THI (attempt) | Bài thi bị báo lỗi; admin đọc chế độ, trạng thái, giờ bắt đầu/nộp | chế độ, trạng thái, bắt đầu, nộp | S1:183-193 | ✅ |
| CAU_TRA_LOI (attempt_answer) | Câu trả lời ghi âm của bài thi, nguồn audio | khóa câu hỏi, nội dung, phần thi, thứ tự, thời lượng, loại tệp, transcript | S22:32-57, S1:195-208 | ✅ |
| NGUOI_DUNG (user) | Học viên; chỉ tên và email được đọc | tên, email | S1:112-113, S1:128 | ✅ |

## Quan hệ

| Từ | Đến | Bản số | Ý nghĩa | Nguồn | Nhãn |
|----|-----|--------|---------|-------|------|
| NGUOI_DUNG | CA_KHIEU_NAI | 1 - N | Một học viên có nhiều ca; xóa người dùng xóa dây chuyền ca | S14:16-18 | ✅ |
| BAI_THI | CA_KHIEU_NAI | 1 - N (tối đa 1 ca đang open/reviewing cùng lúc) | Một bài có thể bị báo lỗi nhiều lần theo thời gian nhưng chỉ một ca đang xử lý; xóa bài xóa dây chuyền ca | S14:13-15, S14:44-46 | ✅ |
| BAI_THI | CAU_TRA_LOI | 1 - N | Bài gồm nhiều câu trả lời; xóa bài xóa dây chuyền | S22:34-37 | ✅ |
| CA_KHIEU_NAI | NGUOI_DUNG | N - 1 qua nối trái | Nếu người dùng không còn thì tên/email trống trong hàng đợi | S1:128 | ✅ |

## Notes

* Tên thuộc tính trong sơ đồ là tên nghiệp vụ không dấu; cột DB thật nằm ở S14 và migration S15 (không đưa vào đây để giữ ở mức nghiệp vụ).
* Không có thực thể "admin": quyền admin xác định bằng danh sách email trong cấu hình, không lưu ở DB. ✅ [S8:1-13]
* Không có thực thể "người xử lý" hay "log hành động": ca không lưu admin nào xử lý (OQ-5). ✅ [S14:7-38]
* Điểm chính thức của bài thi (bảng chấm điểm) không được mô hình vì feature này không đọc/ghi (OQ-2).
