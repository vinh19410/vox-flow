---
type: reverse-srs-flows
feature: billing
updated: 2026-11-11
---

# billing — Flows tái lập (reverse)

## Flow: Chọn gói và thanh toán QR mô phỏng (hoặc thông báo sắp ra mắt)

### Sequence — Chọn gói và thanh toán

```mermaid
sequenceDiagram
    actor A as Người học
    participant S as Màn Gói và thanh toán
    participant P as Bảng thanh toán
    participant X as Ngân hàng/SePay (CHƯA nối, thay bằng nút giả lập)
    A->>S: Bấm thẻ gói
    S->>P: Mở cửa sổ thanh toán cho gói đã chọn
    alt Cờ billing tắt (mặc định) E-billing-001
        P-->>A: Cổng thanh toán sắp ra mắt + nút Đóng
        A->>P: Bấm Đóng
        P-->>S: Đóng cửa sổ
    else Cờ billing bật
        P-->>A: Quét mã để thanh toán + QR giả + Gói/Số tiền/Nội dung CK + đếm ngược từ 10:00
        A->>P: Bấm Đã chuyển khoản (nút Prototype)
        Note over X: Không có kết nối thật. Nút giả lập webhook ngân hàng
        P-->>A: Đã nhận tiền, đang kích hoạt
        Note over P: Chờ 1200 ms
        P->>S: Ghi gói đang dùng (mã, tên, hiệu lực) vào trạng thái phiên
        P-->>A: Toast Đã kích hoạt gói + màn thành công
        A->>P: Bấm Xem chi tiết 4 tiêu chí
        P-->>S: Đóng cửa sổ (không điều hướng)
    end
    Note over P: 🟡 Đồng hồ về 0:00 không có hành vi (E-billing-002)
```

### Activity — Chọn gói và thanh toán

```mermaid
flowchart TD
    A["Bấm thẻ gói"] --> B["Mở cửa sổ thanh toán"]
    B --> C{"Cờ billing bật?"}
    C -->|"Tắt (mặc định)"| D["Hiện: Cổng thanh toán sắp ra mắt"]
    D --> E["Bấm Đóng"]
    C -->|"Bật"| F["Hiện QR giả, nội dung CK, đếm ngược 600 giây"]
    F --> G{"Người dùng chọn gì?"}
    G -->|"Đổi gói"| H["Đóng bảng, hủy kích hoạt đang chờ"]
    G -->|"Bấm Đã chuyển khoản"| I["Trạng thái nhận tiền, nút bị khóa"]
    I --> J["Chờ 1200 ms"]
    J --> K["Ghi gói đang dùng + toast Đã kích hoạt gói"]
    K --> L["Màn thành công, Hiệu lực theo loại gói"]
    L --> M["Bấm Xem chi tiết 4 tiêu chí: chỉ đóng cửa sổ"]
    F --> N["🟡 Đồng hồ về 0:00: không có hành vi"]
```

## Flow: Mở khóa từ màn kết quả qua paywall

### Sequence — Paywall từ kết quả

```mermaid
sequenceDiagram
    actor A as Người học
    participant R as Màn kết quả
    participant W as Cửa sổ paywall
    participant P as Bảng thanh toán
    R->>R: Kiểm tra mở khóa (kết quả chấm thật luôn mở khóa, và màn kết quả chưa chấm thật chỉ có khi cờ scoring bật)
    alt Kết quả không phải chấm thật và chưa có gói
        R-->>A: Hiện Mở khóa từ 49.000đ
        A->>W: Bấm nút
        alt Đã có gói và chưa chọn gói
            W-->>A: Không hiện gì
        else Chưa có gói
            W-->>A: Mở khóa chi tiết + 4 lợi ích + 4 gói dạng gọn
            A->>P: Chọn gói
            P-->>A: Luồng thanh toán như flow 1 (cổng tắt thì sắp ra mắt)
            opt Người dùng đổi trang
                W-->>A: Paywall tự đóng
            end
        end
    else Đã mở khóa
        R-->>A: Không hiện paywall
    end
```

### Activity — Paywall từ kết quả

```mermaid
flowchart TD
    A["Mở màn kết quả"] --> B{"Kết quả chấm thật?"}
    B -->|"Có"| C["Đã mở khóa, không hiện paywall"]
    B -->|"Không"| D{"Đã có gói?"}
    D -->|"Có"| C
    D -->|"Chưa"| E["Hiện dải Mở khóa từ 49.000đ"]
    E --> F["Bấm: mở cửa sổ paywall"]
    F --> G["Chọn gói dạng gọn"]
    G --> H["Bảng thanh toán như flow 1"]
    F --> I["Đổi trang: paywall tự đóng"]
```

## Flow: Về gói miễn phí và xem hóa đơn

### Sequence — Về gói miễn phí

```mermaid
sequenceDiagram
    actor A as Người học
    participant S as Màn Gói và thanh toán
    A->>S: Mở trang Gói và thanh toán
    alt Đang có gói
        S-->>A: Tên gói, Đang hoạt động, Hiệu lực đến, nút Về gói miễn phí, 1 dòng hóa đơn
        opt Bấm tải hóa đơn
            S-->>A: Toast Đã tải hóa đơn PDF (không có tệp) 🟡
        end
        A->>S: Bấm Về gói miễn phí
        S-->>A: Xóa gói + toast Đã chuyển về gói Miễn phí (prototype)
    else Chưa có gói
        S-->>A: Miễn phí, Band tổng không giới hạn, trạng thái rỗng Chưa có hóa đơn nào
    end
    Note over S: Không xác nhận, không hoàn tiền, không có gọi mạng
```

### Activity — Về gói miễn phí

```mermaid
flowchart TD
    A["Mở trang Gói và thanh toán"] --> B{"Đang có gói?"}
    B -->|"Có"| C["Hiện gói, hiệu lực, 1 dòng hóa đơn tính tại chỗ"]
    C --> D{"Hành động"}
    D -->|"Tải hóa đơn"| E["Toast Đã tải hóa đơn PDF"]
    D -->|"Về gói miễn phí"| F["Xóa gói + toast prototype"]
    F --> G["Hiện Miễn phí + Chưa có hóa đơn nào"]
    B -->|"Chưa"| G
```
