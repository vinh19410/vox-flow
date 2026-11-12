---
type: reverse-srs-flows
feature: privacy-controls
updated: 2026-11-11
---

# privacy-controls — Flows tái lập (reverse)

Chỉ vẽ bước CÓ trong code. Cite dạng `S#:line` theo `../reverse-sources.md`. Các flow 1 và 3 chưa có UI gọi (🟡 OQ-1).

## Flow: Ghi nhận / rút lại đồng ý

Nguồn: S1:37-57, S1:88-122; S2:82-124. Không có màn hình gọi (🟡, OQ-1).

### Sequence — Ghi nhận / rút lại đồng ý

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant S as Hệ thống
    participant DB as Cơ sở dữ liệu
    HV->>S: Gửi lựa chọn đồng ý (từng loại hoặc gộp)
    alt Không có phiên đăng nhập
        S-->>HV: Lỗi UNAUTHORIZED Authentication required
    else Gộp nhưng không có trường nào đúng/sai
        S-->>HV: Lỗi đầu vào At least one consent setting must be provided
    else Hợp lệ dạng từng loại
        S->>DB: Thêm 1 sự kiện (kind, granted, policyVersion mặc định v1)
        S-->>HV: success true
    else Hợp lệ dạng gộp
        opt save là boolean
            S->>DB: Thêm sự kiện loại save
        end
        opt calibration hoặc train là boolean
            S->>DB: Thêm sự kiện loại calibration, ưu tiên calibration hơn train
        end
        S-->>HV: success true
    end
    Note over S: Không có UI gọi luồng này, chỉ có test 🟡
```

### Activity — Ghi nhận / rút lại đồng ý

```mermaid
flowchart TD
    A["Nhận lựa chọn đồng ý"] --> B{"Có phiên đăng nhập?"}
    B -->|Không| E1["UNAUTHORIZED: Authentication required"]
    B -->|Có| C{"Dạng đầu vào: từng loại (kind, granted) hay gộp (save, calibration, train)?"}
    C -->|"Từng loại"| D["Thêm 1 sự kiện, policyVersion mặc định v1"]
    C -->|"Gộp"| F{"Có ít nhất 1 trường boolean?"}
    F -->|Không| E2["Lỗi: At least one consent setting (save, calibration, or train) must be provided"]
    F -->|Có| G{"save là boolean?"}
    G -->|Có| H["Thêm sự kiện save"]
    G -->|Không| I{"calibration hoặc train là boolean?"}
    H --> I
    I -->|Có| J["Thêm sự kiện calibration, giá trị calibration ưu tiên hơn train"]
    I -->|Không| K["Kết thúc"]
    J --> K
    D --> K
    K --> L["Trả success true"]
```

## Flow: Đọc trạng thái đồng ý và nạp lên web

Nguồn: S1:60-86; S10:79-96; S11:9.

### Sequence — Đọc trạng thái đồng ý và nạp lên web

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Ứng dụng web
    participant S as Hệ thống API
    participant DB as Cơ sở dữ liệu
    HV->>W: Đăng nhập và mở ứng dụng
    W->>S: Nạp hồ sơ
    S-->>W: Hồ sơ
    W->>S: Đọc trạng thái đồng ý
    alt Lỗi mạng hoặc server
        S-->>W: Lỗi
        Note over W: Bỏ qua lỗi, giữ mặc định save true, calibration false, train false
    else Thành công
        S->>DB: Lấy sự kiện save mới nhất
        S->>DB: Lấy sự kiện calibration mới nhất
        S-->>W: save, calibration, train bằng calibration, hasAnswered
        W->>W: Lưu vào trạng thái consent
    end
    Note over W: Không có nơi nào đọc trạng thái consent sau đó 🔵 N6
```

### Activity — Đọc trạng thái đồng ý và nạp lên web

```mermaid
flowchart TD
    A["Sau khi nạp hồ sơ"] --> B["Gọi đọc đồng ý"]
    B --> C{"Gọi thành công?"}
    C -->|Không| X["Bỏ qua, giữ mặc định web: save true, calibration false, train false"]
    C -->|Có| D["Lấy sự kiện save mới nhất (limit 1)"]
    D --> E["Lấy sự kiện calibration mới nhất (limit 1)"]
    E --> F["save = granted của sự kiện, mặc định false"]
    F --> G["train = calibration"]
    G --> H{"Có sự kiện save nào?"}
    H -->|Có| I["hasAnswered true"]
    H -->|Không| J["hasAnswered false"]
    I --> K["Web lưu consent vào state"]
    J --> K
```

## Flow: Xuất dữ liệu cá nhân

Nguồn: S1:124-127; S3:47-266; S4:527-582. Không có màn hình gọi (🟡).

### Sequence — Xuất dữ liệu cá nhân

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant S as Hệ thống
    participant DB as Cơ sở dữ liệu
    HV->>S: Yêu cầu xuất dữ liệu cá nhân
    alt Không có phiên đăng nhập
        S-->>HV: Lỗi UNAUTHORIZED Authentication required
    else Có phiên
        loop 12 bảng trong danh mục
            S->>DB: Lấy dữ liệu của học viên (lọc theo userId hoặc truy vấn con theo bài thi)
            DB-->>S: Các dòng của bảng
        end
        Note over S: Điểm chấm chỉ 7 trường, dữ liệu chạy chấm trả danh sách rỗng
        Note over S: Tài khoản chỉ 4 trường, phiên gồm ipAddress và userAgent
        S-->>HV: exportedAt, userId, data theo từng bảng
    end
    Note over S: Không có UI hay cách tải về file 🟡 OQ-11
```

### Activity — Xuất dữ liệu cá nhân

```mermaid
flowchart TD
    A["Yêu cầu xuất"] --> B{"Có phiên đăng nhập?"}
    B -->|Không| E["UNAUTHORIZED: Authentication required"]
    B -->|Có| C["Lấy userId từ phiên (không nhận userId từ client)"]
    C --> D["Duyệt 12 bảng cá nhân tuần tự"]
    D --> F{"Bảng là score_run?"}
    F -->|Có| G["Trả danh sách rỗng"]
    F -->|Không| H["Chạy hàm xuất của bảng, trường theo whitelist nếu có"]
    G --> I["Gom vào data theo tên bảng"]
    H --> I
    I --> J["Trả exportedAt (ISO), userId, data"]
```

## Flow: Bắt đầu bài thi (xác nhận ghi âm, lưu vô điều kiện)

Nguồn: S12:28-38; S5:8-17; S7:88-110; S1:9-35 (hàm kiểm tra không được gọi).

### Sequence — Bắt đầu bài thi

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Ứng dụng web
    participant S as Hệ thống API
    participant DB as Cơ sở dữ liệu
    HV->>W: Bấm Đồng ý ghi âm và bắt đầu
    Note over W: Chuyển sang màn thi, không ghi sự kiện đồng ý
    W->>S: Bắt đầu bài thi
    S->>S: Lấy kết quả đồng ý thi: luôn inHistory true, calibrationGranted false
    Note over S: Không đọc sự kiện đồng ý nào, hàm chặn khi chưa đồng ý không được gọi 🟡
    S->>DB: Tạo bài thi với inHistory true, calibrationGranted false
    S-->>W: attemptId, inHistory true, calibrationGranted false
```

### Activity — Bắt đầu bài thi

```mermaid
flowchart TD
    A["Học viên bấm nút Đồng ý ghi âm và bắt đầu"] --> B["Web xoá phiên luyện, bỏ cờ chờ nộp, chuyển sang màn thi"]
    B --> C["Gọi bắt đầu bài thi"]
    C --> D["Lấy kết quả đồng ý thi"]
    D --> E["inHistory = true, calibrationGranted = false (không phụ thuộc đồng ý)"]
    E --> F["Tạo bài thi"]
    F --> G["Trả kết quả"]
    D -.->|"không được gọi"| H["FORBIDDEN: Consent required: user has not completed consent step (chỉ trong test)"]
```

## Flow: Xoá toàn bộ dữ liệu cá nhân (có file ghi âm)

Nguồn: S3:163-204, S3:268-280; S4:110, S4:583-679. Không có điểm kích hoạt (🟡 OQ-3).

### Sequence — Xoá dữ liệu cá nhân

```mermaid
sequenceDiagram
    actor VH as Bên kích hoạt chưa xác định
    participant S as Hệ thống
    participant R2 as Kho ghi âm R2
    participant DB as Cơ sở dữ liệu
    VH->>S: Yêu cầu xoá dữ liệu học viên
    loop Mỗi bảng khác user, theo thứ tự danh mục
        alt Bảng bài thi
            loop Mỗi bài thi của học viên
                S->>R2: Liệt kê file dưới users/userId/attempts/attemptId/
                R2-->>S: Trang đối tượng và con trỏ
                S->>R2: Xoá từng file, thử lại 1 lần nếu lỗi
                alt Trang cắt mà không có con trỏ
                    S-->>VH: Lỗi Erasure stalled for prefix
                else Còn file chưa xoá được
                    S-->>VH: Lỗi Erasure left N audio object(s) undeleted
                end
            end
            S->>DB: Xoá các dòng bài thi
        else Bảng khác
            S->>DB: Xoá các dòng của học viên
        end
    end
    S->>DB: Xoá bảng user sau cùng
    Note over VH,S: Không có caller sản xuất và không có tác vụ tự động 24 giờ 🟡
```

### Activity — Xoá dữ liệu cá nhân

```mermaid
flowchart TD
    A["Bắt đầu xoá cho 1 học viên"] --> B["Lặp các bảng khác user theo thứ tự danh mục"]
    B --> C{"Bảng là bài thi?"}
    C -->|Không| D["Xoá dòng của học viên (khóa userId hoặc truy vấn con)"]
    C -->|Có| E["Với mỗi bài thi: liệt kê R2 theo tiền tố, trang tối đa 1000 đối tượng"]
    E --> F["Xoá từng file, thử lại 1 lần nếu lỗi"]
    F --> G{"Trang cắt nhưng không có con trỏ?"}
    G -->|Có| X1["Throw: Erasure stalled for prefix, giữ dòng bài thi"]
    G -->|Không| H{"Còn trang tiếp?"}
    H -->|Có| E
    H -->|Không| I{"Còn file chưa xoá được?"}
    I -->|Có| X2["Throw: Erasure left N audio object(s) undeleted, giữ dòng bài thi"]
    I -->|Không| J["Xoá dòng bài thi"]
    D --> K["Bảng tiếp theo"]
    J --> K
    K --> L{"Hết bảng khác user?"}
    L -->|Không| B
    L -->|Có| M["Xoá bảng user sau cùng"]
```
