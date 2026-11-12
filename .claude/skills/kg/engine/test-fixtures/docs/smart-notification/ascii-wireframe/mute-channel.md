# Flow: Mute kênh thông báo‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

> Màn hình thuộc flow này: notification-settings → mute-confirm. Flow tổng xem `../srs/smart-notification-userflow.md` Mục 1.

---

## Screen: notification-settings — Cài đặt kênh thông báo‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

### Wireframe (ASCII)‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

```text
┌────────────────────────────────────┐
│ < Quay lai   Cai dat thong bao     │
├────────────────────────────────────┤
│ [1] Kenh in-app                    │
│     [x] Bat                        │
├────────────────────────────────────┤
│ [2] Kenh email                     │
│     [ ] Bat   (dang mute: con      │
│         12 ngay)                   │
├────────────────────────────────────┤
│ [3]          [ Mute kenh ]         │
└────────────────────────────────────┘
```

### Screen description‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

| # | Items | Control type | Data type | Description |
|---|-------|--------------|-----------|--------------|
| 1 | Toggle kênh in-app | Checkbox | Check | • Bật/tắt (mute) riêng kênh in-app; tắt tối đa 30 ngày liên tục (BR-smart-notification-001).<br>• States: On (mặc định) / Off-muted (hiện dòng phụ "đang mute: còn N ngày"). |
| 2 | Toggle kênh email | Checkbox | Check | • Cùng rule mute 30 ngày như kênh in-app (BR-smart-notification-001); hết hạn hệ thống tự bật lại, không cần thao tác thủ công.<br>• Lưu cấu hình thất bại → thông báo inline dưới toggle: "Không lưu được thay đổi. Vui lòng thử lại." và giữ nguyên trạng thái toggle trước đó (E-smart-notification-002). |
| 3 | Nút Mute kênh | Button | Click | • Bấm khi 1 kênh đang Bật → điều hướng sang màn `mute-confirm` để xác nhận trước khi kích hoạt mute (không tắt ngay tại đây). |‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

---

## Screen: mute-confirm — Xác nhận mute kênh‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

### Wireframe (ASCII)

```text
┌────────────────────────────────────┐
│ Xac nhan mute kenh                 │
├────────────────────────────────────┤
│ [1] Kenh: Email                    │
│                                    │
│ [2] Kenh se tat toi da 30 ngay.    │
│     Sau do he thong tu bat lai,    │
│     khong can thao tac thu cong.   │
├────────────────────────────────────┤
│ [3] [ Huy ]      [ Xac nhan mute ] │
└────────────────────────────────────┘
```

### Screen description

| # | Items | Control type | Data type | Description |
|---|-------|--------------|-----------|--------------|
| 1 | Tên kênh đang mute | Label | ReadOnly | • Hiển thị tên kênh user vừa chọn ở màn `notification-settings` (in-app hoặc email), truyền theo context điều hướng. |
| 2 | Cảnh báo thời hạn mute | Label | ReadOnly | • Nêu rõ rule mute tối đa 30 ngày liên tục và hành vi tự bật lại khi hết hạn (BR-smart-notification-001), để user hiểu đây là tạm thời chứ không tắt vĩnh viễn. |
| 3 | Nút Hủy / Xác nhận mute | Button | Click | • **Hủy** → quay lại `notification-settings`, không thay đổi trạng thái toggle.<br>• **Xác nhận mute** → lưu cấu hình mute (BR-smart-notification-001), quay lại `notification-settings` với toggle kênh chuyển Off-muted.<br>• Lưu thất bại → không điều hướng, hiện lỗi tại đây rồi quay lại `notification-settings` giữ nguyên trạng thái trước đó (E-smart-notification-002). |‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍


<!-- wm:c3e3a8b9c06f46427bf9089e2fdafa48 -->
<sub>Tài liệu thuộc bộ AI4BA BA-Kit — bản quyền hoangphan.blog</sub>
