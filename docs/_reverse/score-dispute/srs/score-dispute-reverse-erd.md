---
type: reverse-srs-erd
feature: score-dispute
updated: 2026-11-11
---

# score-dispute — ERD tái lập (reverse)

```mermaid
erDiagram
    USER ||--o{ SCORE_DISPUTE : "gui bao loi"
    ATTEMPT ||--o{ SCORE_DISPUTE : "bi bao loi"

    SCORE_DISPUTE {
        chuoi ma_bao_loi "khoa chinh"
        chuoi ma_bai_thi "bai thi bi bao loi"
        chuoi ma_hoc_vien "nguoi gui"
        chuoi tieu_chi "ALL FC LR GRA PRON"
        chuoi band_ky_vong "5.0 den 8.0"
        chuoi ly_do "tuy chon toi da 1000"
        co dong_y_chia_se "mac dinh khong"
        chuoi trang_thai "open reviewing resolved rejected"
        thoigian han_phan_hoi "gui cong 72 gio"
        thoigian tao_luc "thoi diem gui"
        chuoi band_truoc_do "tuy chon"
        chuoi band_sau_xu_ly "do dispute-admin ghi"
        chuoi noi_dung_tra_loi "do dispute-admin ghi"
        thoigian xu_ly_luc "do dispute-admin ghi"
        thoigian canh_bao_luc "do cron ghi"
        thoigian cap_nhat_luc "do dispute-admin ghi"
    }

    USER {
        chuoi id "tham chieu"
    }

    ATTEMPT {
        chuoi id "tham chieu"
        chuoi trang_thai "phai la submitted de bao loi"
    }
```

## Entity Reference

| Entity | Mô tả nghiệp vụ | Thuộc tính chính | Nguồn | Nhãn |
|--------|-----------------|------------------|-------|------|
| SCORE_DISPUTE (báo lỗi chấm) | Một yêu cầu rà soát điểm của học viên cho một bài thi | tiêu chí, band kỳ vọng, lý do, đồng ý chia sẻ, trạng thái, hạn, thời điểm tạo, band trước đó; (band sau xử lý, trả lời, thời điểm xử lý, cảnh báo, cập nhật: các feature khác ghi) | packages/db/src/schema/dispute.ts:8-47 | ✅ |
| ATTEMPT (bài thi) | Bài thi bị báo lỗi; chỉ bài `submitted` mới được báo lỗi | trạng thái, chủ sở hữu | packages/api/src/routers/dispute.ts:55-60 | ✅ |
| USER (học viên) | Người gửi báo lỗi, bằng chủ bài thi | id | packages/db/src/schema/dispute.ts:18 | ✅ |

## Quan hệ

| Từ | Đến | Bản số | Ý nghĩa | Nguồn | Nhãn |
|----|-----|--------|---------|-------|------|
| ATTEMPT | SCORE_DISPUTE | 1-N (nhưng tối đa 1 hoạt động mỗi bài thi) | Một bài thi có thể có nhiều báo lỗi theo thời gian, chỉ một đang open/reviewing | packages/db/src/schema/dispute.ts:15,44-46 | ✅ |
| USER | SCORE_DISPUTE | 1-N | Người gửi; xóa người dùng xóa báo lỗi (xóa dây chuyền) | packages/db/src/schema/dispute.ts:18 | ✅ |
| ATTEMPT | USER | N-1 | Chủ bài thi phải trùng người gửi (kiểm tra ở nghiệp vụ, không có ràng buộc khóa) | packages/api/src/routers/dispute.ts:48 | ✅ |

## Notes

* Khóa ngoại: xóa bài thi hoặc người dùng thì xóa báo lỗi theo (ON DELETE CASCADE) ✅ [packages/db/src/migrations/20261105123206_careful_paladin/migration.sql:13-14].
* Chỉ mục duy nhất có điều kiện: mỗi bài thi tối đa 1 bản ghi có trạng thái open hoặc reviewing ✅ [packages/db/src/migrations/20261105123206_careful_paladin/migration.sql:20].
* Chỉ mục phụ: theo người dùng, bài thi, trạng thái, hạn ✅ [packages/db/src/schema/dispute.ts:40-43, packages/db/src/migrations/20261105131332_tranquil_sharon_ventura/migration.sql:6].
* Tên thuộc tính ERD dùng tiếng Việt không dấu để mermaid hợp lệ; tên cột DB thật cố ý không đưa vào hình (xem Entity Reference và `_evidence.md`).
* Bảng sau xử lý/quản trị (các cột ghi bởi `dispute-admin`) chỉ nêu tên để thấy bức tranh, thuộc feature khác.
