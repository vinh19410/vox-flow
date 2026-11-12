---
type: reverse-srs-flows
feature: dispute-admin
updated: 2026-11-11
---

# dispute-admin — Flows tái lập (reverse)

> Chỉ vẽ bước có trong code (nguồn ở chú thích). Bước suy đoán gắn 🔵/🟡. status: draft, CHƯA duyệt.

## Flow: Vào màn quản trị và xem hàng đợi + số liệu

### Sequence — Vào màn quản trị và xem hàng đợi + số liệu

```mermaid
sequenceDiagram
    actor A as Admin
    participant W as Màn hình web
    participant S as Hệ thống API
    participant D as CSDL D1
    A->>W: Mở trang quản trị báo lỗi
    W->>S: Lấy phiên đăng nhập
    alt Chưa đăng nhập
        W-->>A: Chuyển tới trang đăng nhập (E-001)
    else Đã đăng nhập
        W->>S: Kiểm tra quyền admin
        alt Email không nằm trong danh sách admin
            S-->>W: FORBIDDEN "Admin access required" (E-002)
            W-->>A: Chuyển về trang tổng quan học viên
        else Là admin
            W-->>A: Hiện màn hình
            W->>S: Tải số liệu
            S->>D: Đọc toàn bộ ca
            D-->>S: Danh sách ca
            S-->>W: 6 số liệu
            W->>S: Tải hàng đợi theo bộ lọc (mặc định Chờ xử lý)
            S->>D: Đọc ca nối người dùng, sắp theo hạn tăng dần
            D-->>S: Các dòng
            S-->>W: Ca kèm cờ sắp quá hạn và quá hạn
            alt Tải số liệu hoặc hàng đợi lỗi
                W-->>A: Màn "Truy cập bị từ chối" (E-015)
            else Thành công
                W-->>A: Thẻ số liệu và danh sách ca
            end
        end
    end
    Note over W: Mọi lỗi tải đều bị coi là từ chối truy cập 🟡 OQ-15
```

### Activity — Vào màn quản trị và xem hàng đợi + số liệu

```mermaid
flowchart TD
    A["Mở trang quản trị báo lỗi"] --> B{"Có phiên đăng nhập?"}
    B -->|Không| E1["Chuyển tới trang đăng nhập"]
    B -->|Có| C{"Email nằm trong danh sách admin?"}
    C -->|Không| E2["Chuyển về trang tổng quan, lỗi FORBIDDEN"]
    C -->|Có| D["Tải số liệu: đọc toàn bộ ca, không phân trang"]
    D --> F["Tải hàng đợi: lọc mặc định Chờ xử lý gồm open và reviewing"]
    F --> G{"Tải thành công?"}
    G -->|Không| E3["Hiện Truy cập bị từ chối"]
    G -->|Có| H["Sắp theo hạn tăng dần, gắn cờ sắp quá hạn (dưới 12 giờ hoặc đã cảnh báo) và quá hạn"]
    H --> I["Hiện thẻ số liệu và danh sách ca"]
```

## Flow: Xem chi tiết ca và nghe audio theo đồng ý

### Sequence — Xem chi tiết ca và nghe audio theo đồng ý

```mermaid
sequenceDiagram
    actor A as Admin
    participant W as Hộp thoại web
    participant S as Hệ thống API
    participant H as Cổng tải audio
    participant D as CSDL D1
    participant R as Kho R2
    A->>W: Bấm Xử lý khiếu nại hoặc Xem chi tiết
    W->>S: Lấy chi tiết ca theo mã
    S->>D: Đọc ca nối người dùng
    alt Không có ca
        S-->>W: NOT_FOUND "Không tìm thấy hồ sơ khiếu nại" (E-003)
        W-->>A: Khung lỗi ở thân trang
    else Có ca
        S->>D: Đọc bài thi và các câu trả lời theo thứ tự
        D-->>S: Bài thi và câu trả lời
        S-->>W: Ca, bài thi, câu trả lời kèm cờ nghe và đường dẫn audio
        alt Học viên không đồng ý chia sẻ
            W-->>A: Nhãn Không được phép nghe và thông báo khóa audio
        else Học viên đồng ý
            W-->>A: Nhãn Được phép nghe và trình phát từng câu
            A->>H: Phát audio một câu
            alt Chưa đăng nhập
                H-->>A: 401 Unauthorized (E-010)
            else Đã đăng nhập
                H->>D: Đọc bài thi, rồi ca mới nhất của bài nếu không phải chủ bài
                alt Không phải chủ, không phải admin hoặc không có đồng ý
                    H-->>A: 403 Forbidden (E-011)
                else Được phép
                    H->>R: Lấy tệp theo khóa audio
                    alt Kho chưa cấu hình
                        H-->>A: 503 Storage unavailable (E-014)
                    else Không có tệp
                        H-->>A: 404 Audio not found (E-013)
                    else Có tệp
                        H-->>A: Luồng audio
                    end
                end
            end
        end
    end
    Note over H: Quyền nghe không xét trạng thái ca 🟡 OQ-8
```

### Activity — Xem chi tiết ca và nghe audio theo đồng ý

```mermaid
flowchart TD
    A["Admin mở một ca"] --> B{"Ca tồn tại?"}
    B -->|Không| E1["NOT_FOUND Không tìm thấy hồ sơ khiếu nại"]
    B -->|Có| C["Đọc bài thi và câu trả lời, sắp theo thứ tự câu"]
    C --> D{"Học viên đồng ý chia sẻ?"}
    D -->|Không| E2["audioPlayable sai, đường dẫn rỗng, hiện thông báo khóa audio"]
    D -->|Có| F["Cấp đường dẫn audio cho từng câu"]
    F --> G["Trình duyệt gọi cổng tải audio"]
    G --> H{"Đã đăng nhập?"}
    H -->|Không| E3["401 Unauthorized"]
    H -->|Có| I{"Chủ bài, hoặc admin và đồng ý đúng bằng có?"}
    I -->|Không| E4["403 Forbidden"]
    I -->|Có| J{"Khóa audio đúng tiền tố người dùng và bài?"}
    J -->|Không| E4
    J -->|Có| K{"Kho có tệp?"}
    K -->|Không| E5["404 Audio not found"]
    K -->|Có| L["Phát audio, hỗ trợ Range"]
```

## Flow: Giải quyết hoặc từ chối ca kèm phản hồi

### Sequence — Giải quyết hoặc từ chối ca kèm phản hồi

```mermaid
sequenceDiagram
    actor A as Admin
    participant W as Hộp thoại web
    participant S as Hệ thống API
    participant D as CSDL D1
    A->>W: Chọn quyết định, band mới, mẫu trả lời, sửa phản hồi
    Note over W: Mặc định: chấp nhận, band mới bằng band kỳ vọng, mẫu Chấp nhận nâng band
    A->>W: Bấm Xác nhận và Hoàn tất
    alt Phản hồi rỗng
        W-->>A: Nút bị khóa (E-008)
    else Có phản hồi
        W->>S: Gửi quyết định, band mới chỉ khi chấp nhận
        S->>D: Đọc ca theo mã
        alt Không có ca
            S-->>W: NOT_FOUND "Không tìm thấy hồ sơ khiếu nại" (E-004)
        else Ca đã chấp nhận hoặc từ chối
            S-->>W: BAD_REQUEST "Báo lỗi này đã được xử lý trước đó" (E-005)
        else Chấp nhận nhưng thiếu band
            S-->>W: BAD_REQUEST "Vui lòng chọn band điểm cập nhật khi chấp nhận khiếu nại" (E-006)
        else Hợp lệ
            S->>D: Cập nhật có điều kiện: chỉ khi ca còn open hoặc reviewing
            alt 0 dòng bị ảnh hưởng
                S-->>W: CONFLICT "Báo lỗi này đã được xử lý bởi người khác" (E-007)
            else Cập nhật được
                D-->>S: Ca sau cập nhật
                S-->>W: success và ca
                W->>S: Tải lại số liệu và hàng đợi
                W-->>A: Đóng hộp thoại, danh sách mới
            end
        end
    end
    Note over S: Không ghi vào điểm bài thi, không gửi thông báo 🟡 OQ-2 OQ-3
```

### Activity — Giải quyết hoặc từ chối ca kèm phản hồi

```mermaid
flowchart TD
    A["Admin chọn quyết định và soạn phản hồi"] --> B{"Phản hồi rỗng sau khi bỏ khoảng trắng?"}
    B -->|Có| E1["Nút xác nhận bị khóa"]
    B -->|Không| C{"Ca tồn tại?"}
    C -->|Không| E2["NOT_FOUND"]
    C -->|Có| D{"Trạng thái là resolved hoặc rejected?"}
    D -->|Có| E3["BAD_REQUEST đã được xử lý trước đó"]
    D -->|Không| F{"Quyết định là chấp nhận và thiếu band?"}
    F -->|Có| E4["BAD_REQUEST vui lòng chọn band"]
    F -->|Không| G["Ghi: trạng thái, band mới (trống nếu từ chối), band cũ, phản hồi, thời điểm xử lý"]
    G --> H{"Còn ca ở open hoặc reviewing lúc ghi?"}
    H -->|Không| E5["CONFLICT đã được xử lý bởi người khác"]
    H -->|Có| I["Trả success, đóng hộp thoại, tải lại danh sách"]
```

## Flow: Cảnh báo sắp quá hạn bằng tác vụ định kỳ mỗi giờ

### Sequence — Cảnh báo sắp quá hạn bằng tác vụ định kỳ mỗi giờ

```mermaid
sequenceDiagram
    participant C as Lịch cron nền tảng
    participant H as Bộ xử lý lịch
    participant J as Tác vụ cảnh báo
    participant D as CSDL D1
    C->>H: Kích hoạt lịch giờ hoặc lịch 5 phút hoặc thủ công
    alt Lịch 5 phút
        H->>H: Chỉ quét chấm điểm, không kiểm tra cảnh báo
    else Lịch giờ hoặc lịch lạ
        H->>J: Kiểm tra ca sắp quá hạn
        J->>D: Tìm ca open hoặc reviewing, chưa cảnh báo, chưa có thời điểm xử lý, hạn không muộn hơn bây giờ cộng 12 giờ
        alt Không có ca
            J-->>H: warnedCount 0
        else Có ca
            J->>D: Cập nhật có điều kiện warnedAt rỗng, đặt warnedAt và updatedAt
            D-->>J: Các mã ca vừa đánh dấu
            J-->>H: warnedCount và danh sách mã
        end
        H->>H: Ghi log số ca đã cảnh báo
        alt Tác vụ lỗi
            H->>H: Ghi log lỗi, không ném tiếp (E-018)
        end
        opt Lịch lạ (không phải lịch giờ)
            H->>H: Chạy thêm quét chấm điểm
        end
    end
    Note over J: Chỉ ghi dấu cảnh báo, không gửi thông báo 🟡 OQ-3
```

### Activity — Cảnh báo sắp quá hạn bằng tác vụ định kỳ mỗi giờ

```mermaid
flowchart TD
    A["Cron kích hoạt"] --> B{"Cron là lịch 5 phút?"}
    B -->|Có| E1["Chỉ quét chấm điểm, bỏ qua cảnh báo"]
    B -->|Không| C["Tính mốc = bây giờ cộng 12 giờ"]
    C --> D["Tìm ca: open hoặc reviewing, warnedAt rỗng, resolvedAt rỗng, dueAt nhỏ hơn hoặc bằng mốc"]
    D --> F{"Có ca?"}
    F -->|Không| G["Ghi log warned 0"]
    F -->|Có| H["Cập nhật có điều kiện warnedAt vẫn rỗng"]
    H --> I["Ghi log số ca đã cảnh báo"]
    G --> J{"Cron khác lịch giờ?"}
    I --> J
    J -->|Có| K["Chạy thêm quét chấm điểm"]
    J -->|Không| L["Kết thúc"]
    D -.->|Lỗi| M["Ghi log lỗi và tiếp tục"]
    M --> J
```
