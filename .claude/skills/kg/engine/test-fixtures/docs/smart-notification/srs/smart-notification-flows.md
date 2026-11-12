---
type: srs-flows
feature: smart-notification
updated: 2026-07-16
---

# Smart Notification — Flows‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

## Flow: Xem thông báo‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍
__Trigger__: Người dùng mở màn Danh sách thông báo
__Related UC__: [[../usecases/uc-view-notifications.md]]
__Related FR__: FR-smart-notification-001, FR-smart-notification-002, FR-smart-notification-005
__Related E__: E-smart-notification-001‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Backend

    User->>FE: Mở màn Danh sách thông báo
    FE->>BE: GET danh sách thông báo
    BE-->>FE: Trả danh sách + badge số chưa đọc
    FE-->>User: Hiển thị danh sách thông báo

    User->>FE: Chạm vào 1 thông báo
    FE->>BE: Đánh dấu đã đọc

    opt Tải danh sách thất bại
        BE-->>FE: Lỗi tải dữ liệu
        FE-->>User: Báo lỗi E-smart-notification-001
    end
```

## Flow: Mute kênh‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍
__Trigger__: Người dùng bấm icon cài đặt từ màn Danh sách thông báo
__Related UC__: [[../usecases/uc-mute-channel.md]]
__Related FR__: FR-smart-notification-003
__Related E__: E-smart-notification-002‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Backend

    User->>FE: Bấm icon cài đặt
    FE-->>User: Hiển thị màn Cài đặt kênh
    User->>FE: Bấm Mute kênh
    FE-->>User: Hiển thị màn Xác nhận mute
    User->>FE: Xác nhận mute
    FE->>BE: Lưu trạng thái mute kênh

    alt Lưu thành công
        BE-->>FE: Xác nhận đã mute
        FE-->>User: Báo kênh đã tắt thông báo
    else Lưu thất bại
        BE-->>FE: Lỗi lưu mute
        FE-->>User: Báo lỗi E-smart-notification-002
    end
```


<!-- wm:c3e3a8b9c06f46427bf9089e2fdafa48 -->
<sub>Tài liệu thuộc bộ AI4BA BA-Kit — bản quyền ai4ba.com</sub>
