---
type: reverse-srs-flows
feature: forecast-practice
updated: 2026-11-11
---

# forecast-practice — Flows tái lập (reverse)

> Nguồn và nhãn theo `../forecast-practice-reverse-spec.md`. Chỉ vẽ bước có trong code. Bước suy đoán ghi chú 🔵/🟡.

## Flow: F1 Xem, lọc và tìm chủ đề

### Sequence — F1 Xem, lọc và tìm chủ đề

```mermaid
sequenceDiagram
    actor H as Học viên
    participant W as Màn forecast (web)
    participant A as API danh sách đã đăng
    participant D as Cơ sở dữ liệu
    H->>W: Mở /app/forecast (đã đăng nhập, đã onboarding)
    W->>A: Xin chủ đề đã đăng, quý 2026-Q3
    A->>D: Đọc chủ đề đã đăng của quý, mới tạo trước
    D-->>A: Danh sách chủ đề
    alt Không có chủ đề
        A-->>W: Danh sách rỗng
        W-->>H: Trạng thái rỗng E-009 (câu chung của bộ lọc)
    else Có chủ đề
        A->>D: Đếm học viên khác nhau đã báo gặp theo chủ đề
        D-->>A: Số báo
        A-->>W: Chủ đề kèm câu hỏi chuẩn hóa, cờ mới, số báo
        W-->>H: Khung độ phủ, thẻ gợi ý, tab Part, lưới thẻ sắp theo số báo
    end
    alt Truy vấn lỗi
        W-->>H: E-005 Không thể tải danh sách đề forecast, nút Thử lại
    end
    H->>W: Chọn tab Part, bộ lọc, gõ từ khóa
    W-->>H: Lưới lọc ở trình duyệt, rỗng thì E-006, E-007 hoặc E-008
    Note over W: Khung độ phủ luôn 0 chủ đề đã luyện vì không có nơi ghi tiến độ 🟡
```

### Activity — F1 Xem, lọc và tìm chủ đề

```mermaid
flowchart TD
    A["Mở màn forecast"] --> G{"Có phiên và đã onboarding?"}
    G -->|Không| X["Chuyển về trang đăng nhập hoặc onboarding"]
    G -->|Có| B["Xin danh sách chủ đề đã đăng quý 2026-Q3"]
    B --> C{"Truy vấn thành công?"}
    C -->|Lỗi| E["E-005 thông báo lỗi và nút Thử lại"]
    C -->|OK| D["Ánh xạ chủ đề: Hay gặp nếu số báo từ 200, Mới nếu cờ mới của Part 2 và 3"]
    D --> F["Lọc theo tab Part, bộ lọc nhanh, từ khóa"]
    F --> H{"Còn chủ đề sau lọc?"}
    H -->|Không| I["Trạng thái rỗng E-006 hoặc E-007 hoặc E-008"]
    H -->|Có| J["Sắp theo số báo giảm dần và hiện lưới thẻ"]
```

## Flow: F2 Xem chi tiết và lưu chủ đề

### Sequence — F2 Xem chi tiết và lưu chủ đề

```mermaid
sequenceDiagram
    actor H as Học viên
    participant W as Màn forecast (web)
    participant S as Bộ nhớ phiên trình duyệt
    H->>W: Bấm thẻ chủ đề hoặc Bốc ngẫu nhiên đề hot
    W-->>H: Mở chi tiết: thẻ gợi ý Part 2, danh sách câu, ghi chú
    opt Bốc ngẫu nhiên
        W->>W: Chọn trong nhóm Hay gặp chưa luyện, rỗng thì chọn trong mọi chủ đề
    end
    H->>W: Bấm biểu tượng lưu hoặc Lưu vào danh sách ôn
    W->>S: Thêm hoặc bỏ mã chủ đề khỏi danh sách lưu
    W-->>H: Toast Đã lưu vào danh sách ôn hoặc Đã bỏ khỏi danh sách ôn
    Note over S: Danh sách lưu mất khi tải lại, không gửi lên máy chủ 🟡 OQ-3
```

### Activity — F2 Xem chi tiết và lưu chủ đề

```mermaid
flowchart TD
    A["Bấm thẻ hoặc nút bốc ngẫu nhiên"] --> B{"Cách mở?"}
    B -->|Bấm thẻ| D["Mở chi tiết chủ đề"]
    B -->|Bốc ngẫu nhiên| C{"Có chủ đề Hay gặp chưa luyện?"}
    C -->|Có| P1["Chọn ngẫu nhiên trong nhóm đó"]
    C -->|Không| P2["Chọn ngẫu nhiên trong mọi chủ đề"]
    P1 --> D
    P2 --> D
    D --> E{"Bấm lưu?"}
    E -->|Chủ đề đã lưu| F["Bỏ khỏi danh sách và toast Đã bỏ khỏi danh sách ôn"]
    E -->|Chưa lưu| G["Thêm vào danh sách và toast Đã lưu vào danh sách ôn"]
```

## Flow: F3 Luyện cả chủ đề hoặc từng câu

### Sequence — F3 Luyện cả chủ đề hoặc từng câu

```mermaid
sequenceDiagram
    actor H as Học viên
    participant W as Màn forecast (web)
    participant P as Phòng thi (web)
    participant A as API mở lượt thi
    participant D as Cơ sở dữ liệu
    participant C as Màn chấm
    H->>W: Bấm Luyện chủ đề này hoặc Luyện câu này
    W->>P: Tạo phiên luyện (cả chủ đề hoặc một câu bỏ thẻ gợi ý) và chuyển sang /exam
    P->>A: Mở lượt thi: chế độ, mã chủ đề, khóa câu
    alt Cổng pilot đóng
        A-->>P: FORBIDDEN Mock exam is currently restricted to pilot candidates.
        P-->>H: Tiếp tục không có lượt trên máy chủ, không hiện câu lỗi
    else Chủ đề không có hoặc chưa đăng
        A->>D: Tìm chủ đề đã đăng
        D-->>A: Không có
        A-->>P: BAD_REQUEST Unknown or unpublished forecast topic
    else Khóa câu không thuộc chủ đề
        A-->>P: BAD_REQUEST Invalid questionKey for topic
    else Hợp lệ
        A->>D: Ghi lượt thi in_progress kèm chủ đề và khóa
        A-->>P: Mã lượt thi
    end
    H->>P: Ghi âm trả lời các câu
    alt Nộp bài
        P->>C: Chuyển sang màn chấm, bài chưa nộp (nếu chưa có lượt thi trên máy chủ thì màn chấm ở trạng thái chỉ lưu cục bộ)
        C-->>H: Màn chấm tự nộp và theo dõi kết quả
    else Thoát phòng thi
        P-->>W: Xóa phiên luyện và về /app/forecast
    end
    Note over P: Chủ đề Part 2 và 3 luyện cả chủ đề dùng chế độ Part 2 🟡 OQ-11
```

### Activity — F3 Luyện cả chủ đề hoặc từng câu

```mermaid
flowchart TD
    A["Bấm Luyện chủ đề này hoặc Luyện câu này"] --> B{"Luyện từng câu?"}
    B -->|Có| C["Phiên gồm một câu, bỏ thẻ gợi ý, lưu danh sách câu cả chủ đề"]
    B -->|Không| D["Phiên gồm toàn bộ câu của chủ đề, không kèm đáp án mẫu"]
    C --> E["Chuyển sang phòng thi, chọn chế độ Part 1 hoặc Part 3"]
    D --> F["Chuyển sang phòng thi, Part 1 cho chủ đề Part 1 và Part 2 cho chủ đề Part 2 và 3"]
    E --> G{"Máy chủ chấp nhận lượt thi?"}
    F --> G
    G -->|Cổng pilot đóng| H["E-010 FORBIDDEN, phòng thi chạy không lưu máy chủ"]
    G -->|Chủ đề không hợp lệ| I["E-011 hoặc E-012 BAD_REQUEST"]
    G -->|Hợp lệ| J["Ghi âm trả lời"]
    J --> K{"Nộp hay thoát?"}
    K -->|Nộp| L["Sang màn chấm, màn chấm tự nộp, xóa phiên luyện"]
    K -->|Thoát| M["Xóa phiên luyện và về màn forecast"]
```

## Flow: F4 Báo đã gặp chủ đề

### Sequence — F4 Báo đã gặp chủ đề

```mermaid
sequenceDiagram
    actor H as Học viên
    participant A as API báo gặp
    participant D as Cơ sở dữ liệu
    H->>A: Báo gặp: mã chủ đề, ghi chú tùy chọn (web không có nút gọi 🟡 OQ-4)
    alt Chưa đăng nhập
        A-->>H: UNAUTHORIZED Authentication required
    else Chủ đề không có hoặc chưa đăng
        A->>D: Tìm chủ đề
        D-->>A: Không có hoặc không phải đã đăng
        A-->>H: NOT_FOUND Published forecast topic not found
    else Đã báo trước đó
        A->>D: Tìm báo gặp của học viên cho chủ đề
        D-->>A: Có
        A-->>H: success true, alreadyReported true
    else Báo mới
        A->>D: Ghi báo gặp, bỏ qua nếu trùng
        A-->>H: success true, alreadyReported false
    end
    Note over D: Số thí sinh báo gặp trong danh sách = số học viên khác nhau
```

### Activity — F4 Báo đã gặp chủ đề

```mermaid
flowchart TD
    A["Nhận yêu cầu báo gặp"] --> B{"Có phiên đăng nhập?"}
    B -->|Không| E1["E-001 UNAUTHORIZED"]
    B -->|Có| C{"Chủ đề tồn tại và đã đăng?"}
    C -->|Không| E2["E-002 NOT_FOUND"]
    C -->|Có| D{"Học viên đã báo chủ đề này?"}
    D -->|Có| R1["Trả thành công, alreadyReported true, không ghi thêm"]
    D -->|Không| W["Ghi báo gặp với ghi chú hoặc rỗng"]
    W --> R2["Trả thành công, alreadyReported false"]
```

## Flow: F5 Quay lại chủ đề sau kết quả

### Sequence — F5 Quay lại chủ đề sau kết quả

```mermaid
sequenceDiagram
    actor H as Học viên
    participant R as Trang kết quả
    participant W as Màn forecast (web)
    Note over R: Nút chỉ hiện khi có phiên luyện cuối, nhưng không có code đặt phiên này 🟡 OQ-10
    H->>R: Bấm Quay lại chủ đề
    R->>W: Đặt mã chủ đề cần mở lại và chuyển về /app/forecast
    W->>W: Đợi danh sách tải xong
    alt Mã khớp một chủ đề
        W-->>H: Chuyển đúng tab Part và mở chi tiết chủ đề
    else Không khớp
        W-->>H: Hiện danh sách bình thường
    end
    W->>W: Xóa mã cần mở lại
    opt Còn câu kế
        H->>R: Bấm Luyện câu kế tiếp trong chủ đề
        R->>W: Tạo phiên một câu kế (bỏ thẻ gợi ý) và sang /exam
    end
```

### Activity — F5 Quay lại chủ đề sau kết quả

```mermaid
flowchart TD
    A["Mở trang kết quả"] --> B{"Đang xem đúng bài vừa luyện từng câu?"}
    B -->|Không| Z["Không hiện hai nút"]
    B -->|Có| C{"Còn câu kế không phải thẻ gợi ý?"}
    C -->|Có| D["Hiện nút Luyện câu kế tiếp trong chủ đề"]
    C -->|Không| E["Ẩn nút câu kế tiếp"]
    D --> F["Hiện nút Quay lại chủ đề"]
    E --> F
    F --> G["Bấm Quay lại chủ đề: đặt mã chủ đề, về màn forecast"]
    G --> H{"Danh sách đã tải và mã khớp?"}
    H -->|Khớp| I["Chuyển tab Part và mở chi tiết"]
    H -->|Không khớp| J["Không mở gì"]
    I --> K["Xóa mã cần mở lại"]
    J --> K
```
