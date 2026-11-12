---
type: reverse-srs-flows
feature: progress-history
updated: 2026-11-11
---

# progress-history — Flows tái lập (reverse)

> Lưu ý: ở production danh sách lượt thi luôn rỗng (OQ-1). Các nhánh "có dữ liệu" mô tả hành vi UI khi được cấp dữ liệu, được xác nhận bằng test với dữ liệu giả lập.

## Flow: Xem Trang chủ (Dashboard)

### Sequence — Xem Trang chủ

```mermaid
sequenceDiagram
    actor H as Học viên
    participant W as Web (khu ứng dụng)
    participant P as Hồ sơ (máy chủ)
    H->>W: Mở Trang chủ
    W->>P: Đọc hồ sơ (mục tiêu, ngày thi)
    alt Lỗi mạng hoặc máy chủ
        P-->>W: Lỗi
        Note over W: Không báo lỗi, giữ mục tiêu và ngày thi hiện có, thử lại sau (E-009)
    else Có hồ sơ
        P-->>W: targetBand, examDate
    else Chưa có hồ sơ
        P-->>W: Rỗng
        Note over W: Đặt mục tiêu 7.0 và không có ngày thi
    end
    alt Danh sách lượt thi rỗng
        W-->>H: Trạng thái trống + nút Thi thử bài đầu tiên (E-001)
    else Có lượt thi
        Note over W: Tính band ước lượng từ 4 lượt cuối, làm tròn 0.5
        W-->>H: Thẻ sẵn sàng, đếm ngược, việc hôm nay, bài gần nhất
    end
    Note over W: 🟡 Danh sách lượt thi không có nguồn nạp (OQ-1) nên nhánh có lượt thi chỉ chạy trong test
```

### Activity — Xem Trang chủ

```mermaid
flowchart TD
    A["Vào Trang chủ"] --> B["Nạp mục tiêu và ngày thi từ hồ sơ"]
    B --> C{"Danh sách lượt thi rỗng?"}
    C -->|"Rỗng - thực tế hiện tại"| D["Hiện trạng thái trống và nút Thi thử bài đầu tiên"]
    C -->|"Có ít nhất 1 lượt"| E["Lấy tối đa 4 lượt cuối, tính trung bình"]
    E --> F["Làm tròn 0.5 thành band ước lượng"]
    F --> G{"Mục tiêu lớn hơn ước lượng?"}
    G -->|"Có"| H["Hiện còn thiếu = mục tiêu trừ ước lượng"]
    G -->|"Không"| I["Hiện đã đạt"]
    H --> J{"Có ngày thi?"}
    I --> J
    J -->|"Có"| K["Hiện số ngày còn lại, tối thiểu 0"]
    J -->|"Không"| L["Hiện ô chọn ngày thi"]
    K --> M["Hiện việc hôm nay (luôn trống) và bài gần nhất"]
    L --> M
```

## Flow: Xem Lịch sử và lọc theo chế độ

### Sequence — Xem Lịch sử

```mermaid
sequenceDiagram
    actor H as Học viên
    participant W as Web (màn Lịch sử)
    H->>W: Mở Lịch sử bài làm
    W->>W: Lọc mặc định Tất cả từ danh sách lượt thi trong state
    alt Danh sách lọc rỗng
        W-->>H: Biểu đồ trống "Chưa có bài nào cho bộ lọc này." (E-002)
        opt Danh sách gốc cũng rỗng
            W-->>H: Thẻ "Chưa có lịch sử làm bài" + Thi thử ngay (E-003)
        end
    else Có lượt
        W-->>H: Biểu đồ band + khoảng tin cậy + đường mục tiêu, danh sách mới nhất trước
    end
    H->>W: Chọn chế độ Part 2
    W-->>H: Biểu đồ và danh sách chỉ gồm lượt Part 2
    Note over W: 🟡 Dữ liệu lượt chỉ có trong test (OQ-1)
```

### Activity — Xem Lịch sử

```mermaid
flowchart TD
    A["Vào Lịch sử"] --> B["Lọc = Tất cả"]
    B --> C["Chọn chế độ: Tất cả, Full Test, Part 1, Part 2, Part 3"]
    C --> D{"Danh sách sau lọc có lượt?"}
    D -->|"Không"| E["Biểu đồ: Chưa có bài nào cho bộ lọc này"]
    E --> F{"Danh sách gốc rỗng?"}
    F -->|"Có"| G["Thẻ Chưa có lịch sử làm bài + nút Thi thử ngay"]
    F -->|"Không"| H["Không hiện danh sách"]
    D -->|"Có"| I["Vẽ biểu đồ: trục 4.5 đến 8, đường mục tiêu nét đứt"]
    I --> J["Đảo ngược danh sách, lượt đầu gắn Mới nhất"]
```

## Flow: Mở chi tiết một lượt thi

### Sequence — Mở chi tiết lượt

```mermaid
sequenceDiagram
    actor H as Học viên
    participant W as Web
    participant S as Máy chủ chấm điểm
    H->>W: Bấm một lượt ở danh sách hoặc thẻ bài gần nhất
    W->>W: Điều hướng tới trang chi tiết theo mã lượt
    W->>W: Xét mã latest, rồi lượt chưa lưu, rồi danh sách
    alt Mã là latest
        W-->>H: Kết quả mặc định của prototype (không tải máy chủ)
    else Khác latest, không khớp lượt trong state, không có kết quả truyền sẵn
        W->>S: Đọc trạng thái chấm và kết quả theo mã lượt
        alt Không tồn tại hoặc không thuộc tài khoản
            S-->>W: NOT_FOUND hoặc FORBIDDEN
            W-->>H: Không tìm thấy bài thi hoặc Bạn không có quyền xem bài thi này (E-006, E-007)
        else Lỗi mạng
            S-->>W: Lỗi
            W-->>H: Không tải được kết quả, nút Tải lại (E-008)
        else Đã chấm xong
            S-->>W: Kết quả
            W-->>H: Chi tiết kết quả
        end
    end
    Note over W,S: 🔵 Chi tiết thuộc feature chấm điểm, ở đây chỉ nêu điểm vào
```

### Activity — Mở chi tiết lượt

```mermaid
flowchart TD
    A["Bấm một lượt"] --> B["Vào trang chi tiết với mã lượt"]
    B --> C{"Mã là latest?"}
    C -->|"Có"| D["Hiện kết quả mặc định, không tải máy chủ"]
    C -->|"Không"| E{"Mã khớp lượt chưa lưu hoặc danh sách?"}
    E -->|"Khớp"| F["Dùng lượt trong state, không tải máy chủ"]
    E -->|"Không khớp - luôn xảy ra khi danh sách rỗng"| G["Tải trạng thái và kết quả từ máy chủ"]
    G --> H{"Kết quả tải?"}
    H -->|"NOT_FOUND hoặc FORBIDDEN"| I["Báo không tìm thấy hoặc không có quyền (E-006, E-007)"]
    H -->|"Lỗi mạng"| J["Không tải được kết quả, Tải lại (E-008)"]
    H -->|"Thành công"| K["Hiện chi tiết hoặc trạng thái chấm"]
```

## Flow: Nhập ngày thi từ thẻ đếm ngược

### Sequence — Nhập ngày thi

```mermaid
sequenceDiagram
    actor H as Học viên
    participant W as Web (thẻ đếm ngược)
    participant P as Hồ sơ (máy chủ)
    H->>W: Chọn ngày ở ô ngày (khi chưa có ngày thi)
    W->>W: Cập nhật ngày thi trong state, rỗng thì null
    W-->>H: Hiện số ngày còn lại và ngày dd/mm/yyyy
    Note over W,P: 🔵 Không gọi lưu hồ sơ, lần nạp hồ sơ sau có thể ghi đè (OQ-6)
    opt Học viên lưu ở màn Hồ sơ
        H->>P: Lưu mục tiêu và ngày thi
        P-->>H: Hồ sơ đã cập nhật
    end
```

### Activity — Nhập ngày thi

```mermaid
flowchart TD
    A["Thẻ đếm ngược không có ngày thi"] --> B["Học viên chọn ngày"]
    B --> C{"Giá trị ô ngày rỗng?"}
    C -->|"Rỗng"| D["Đặt ngày thi null, giữ ô nhập"]
    C -->|"Có giá trị"| E["Đặt ngày thi trong state"]
    E --> F["Tính số ngày: max 0, làm tròn lên"]
    F --> G["Hiện số ngày và nhịp luyện 1 bài mỗi ngày"]
    G --> H["Không lưu máy chủ - 🟡 OQ-6"]
```
