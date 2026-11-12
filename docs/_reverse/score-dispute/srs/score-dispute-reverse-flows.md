---
type: reverse-srs-flows
feature: score-dispute
updated: 2026-11-11
---

# score-dispute — Flows tái lập (reverse)

> Mọi bước vẽ ra đều có trong code (nguồn ở chú thích). Bước suy đoán đánh dấu 🔵/🟡. Cờ `SCORE_DISPUTE_ENABLED` mặc định tắt: nhánh gửi chỉ chạy khi cờ bằng chuỗi `true` 🟡 (chưa biết giá trị thật).

## Flow: Gửi báo lỗi chấm

Nguồn: packages/api/src/routers/dispute.ts:24-131; apps/web/src/features/results/components/report-modal.tsx:40-69.

### Sequence — Gửi báo lỗi chấm

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Giao diện web
    participant S as Hệ thống API
    participant D as Cơ sở dữ liệu
    HV->>W: Mở form, chọn tiêu chí, band, lý do, đồng ý chia sẻ, bấm Gửi
    W->>S: Gửi báo lỗi kèm mã bài thi
    alt Chưa đăng nhập
        S-->>W: E-002 Authentication required
    else Cờ khác true
        S-->>W: E-001 Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt
    else Có phiên và cờ bật
        S->>D: Tìm bài thi theo mã
        D-->>S: Bài thi hoặc rỗng
        alt Không có bài thi
            S-->>W: E-003 Không tìm thấy bài thi
        else Không phải chủ bài thi
            S-->>W: E-004 Bạn không có quyền báo lỗi cho bài thi này
        else Bài thi chưa nộp
            S-->>W: E-005 Chỉ bài thi đã nộp mới có thể gửi báo lỗi
        else Hợp lệ
            S->>D: Tìm báo lỗi đang mở hoặc đang xem xét của bài thi
            alt Đã có báo lỗi hoạt động
                S-->>W: E-006 Bài thi này đã có báo lỗi đang được xử lý
            else Chưa có
                S->>D: Tạo báo lỗi trạng thái open, hạn = bây giờ + 72 giờ
                alt Vi phạm chỉ mục duy nhất do gửi đồng thời
                    D-->>S: UNIQUE constraint failed
                    S-->>W: E-007 Bài thi này đã có báo lỗi đang được xử lý
                else Lưu không trả bản ghi
                    S-->>W: E-008 Không thể lưu báo lỗi
                else Lưu được
                    D-->>S: Bản ghi báo lỗi
                    S-->>W: Mã báo lỗi, trạng thái open, hạn phản hồi
                end
            end
        end
    end
    alt Thành công
        W-->>HV: Thông báo Đã gửi báo lỗi. Chúng tôi cam kết phản hồi trong vòng 72 giờ.
        W->>S: Tải lại trạng thái báo lỗi
        W-->>HV: Đóng form, hiện badge đang xử lý
    else Thất bại
        W-->>HV: Banner đỏ và thông báo cùng nội dung, form giữ mở
    end
    Note over W: Nếu client không có hàm gửi vẫn báo thành công (🟡 dấu vết prototype)
```

### Activity — Gửi báo lỗi chấm

```mermaid
flowchart TD
    A["Học viên bấm Báo lỗi chấm trên trang kết quả"] --> B["Form mặc định GRA, band 6.5, đồng ý chưa chọn"]
    B --> C["Học viên chọn tiêu chí, band 5.0 đến 8.0, lý do tối đa 1000 ký tự, đồng ý chia sẻ tùy chọn"]
    C --> D["Bấm Gửi báo lỗi, nút đổi thành Đang gửi..."]
    D --> E{"Đăng nhập?"}
    E -->|Không| X1["E-002 Authentication required"]
    E -->|Có| F{"Cờ bằng chuỗi true?"}
    F -->|Không| X2["E-001 chưa kích hoạt"]
    F -->|Có| G{"Bài thi tồn tại?"}
    G -->|Không| X3["E-003 Không tìm thấy bài thi"]
    G -->|Có| H{"Đúng chủ bài thi?"}
    H -->|Không| X4["E-004 không có quyền báo lỗi"]
    H -->|Có| I{"Trạng thái là submitted?"}
    I -->|Không| X5["E-005 Chỉ bài thi đã nộp"]
    I -->|Có| J{"Đã có báo lỗi open hoặc reviewing?"}
    J -->|Có| X6["E-006 đã có báo lỗi đang được xử lý"]
    J -->|Không| K["Tạo báo lỗi: status open, dueAt = bây giờ + 72 giờ"]
    K --> L{"Lưu thành công?"}
    L -->|Trùng chỉ mục duy nhất| X7["E-007 đã có báo lỗi đang được xử lý"]
    L -->|Không có bản ghi| X8["E-008 Không thể lưu báo lỗi"]
    L -->|Có| M["Toast cam kết 72 giờ, tải lại trạng thái, đóng form"]
    X1 --> Z["Banner đỏ và toast, form giữ mở, học viên có thể thử lại"]
    X2 --> Z
    X3 --> Z
    X4 --> Z
    X5 --> Z
    X6 --> Z
    X7 --> Z
    X8 --> Z
```

## Flow: Xem trạng thái báo lỗi trên trang kết quả

Nguồn: packages/api/src/routers/dispute.ts:133-169; apps/web/src/features/results/results-screen.tsx:75-91,318-344.

### Sequence — Xem trạng thái báo lỗi

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Trang kết quả
    participant S as Hệ thống API
    participant D as Cơ sở dữ liệu
    HV->>W: Mở trang kết quả của một bài thi
    alt Mã bài thi là latest hoặc không có trong danh sách cục bộ
        Note over W: Không tải trạng thái, không hiện nút (🔵 bài thật có thể rơi vào nhánh này)
    else Mã bài thi có trong danh sách cục bộ
    W->>S: Hỏi báo lỗi của bài thi
    S->>D: Tìm bài thi
    alt Không có bài thi
        S-->>W: E-011 Không tìm thấy bài thi
        W-->>HV: Im lặng, console.warn
    else Không phải chủ
        S-->>W: E-012 Bạn không có quyền xem thông tin bài thi này
        W-->>HV: Im lặng, console.warn
    else Hợp lệ
        S->>D: Lấy báo lỗi mới nhất theo thời điểm tạo
        D-->>S: Bản ghi hoặc rỗng
        S-->>W: enabled và báo lỗi hoặc rỗng
        alt Trạng thái open hoặc reviewing
            W-->>HV: Badge Báo lỗi đang xử lý, hạn phản hồi
        else Trạng thái resolved
            W-->>HV: Badge Báo lỗi đã xử lý
        else Trạng thái rejected
            W-->>HV: Badge Báo lỗi không được chấp nhận
        else Chưa có báo lỗi và enabled
            W-->>HV: Nút Báo lỗi chấm
        else Chưa có báo lỗi và không enabled
            W-->>HV: Không hiện gì
        end
    end
    end
```

### Activity — Xem trạng thái báo lỗi

```mermaid
flowchart TD
    A["Mở trang kết quả với mã bài thi"] --> B{"Mã là latest hoặc không có trong danh sách cục bộ?"}
    B -->|Có| N["Không tải trạng thái, không nút, không badge"]
    B -->|Không| C["Hỏi máy chủ báo lỗi của bài thi"]
    C --> D{"Máy chủ trả lỗi?"}
    D -->|Có E-011 hoặc E-012 hoặc lỗi mạng| W["Ghi console.warn, không hiện gì"]
    D -->|Không| E{"Báo lỗi mới nhất có trạng thái nào?"}
    E -->|open hoặc reviewing| F["Badge vàng: đang xử lý, hạn phản hồi giờ và ngày vi-VN"]
    E -->|resolved| G["Badge xanh: đã xử lý"]
    E -->|rejected| H["Badge xám: không được chấp nhận"]
    E -->|Chưa có| I{"Máy chủ báo enabled?"}
    I -->|Có| J["Hiện nút Báo lỗi chấm"]
    I -->|Không| K["Không hiện gì"]
```

## Flow: Đồng ý chia sẻ quyết định quyền nghe audio (điểm bàn giao)

Nguồn: apps/server/src/index.ts:301-344; packages/api/src/auth-utils.ts:23-37. Thuộc kênh phát audio, vẽ để thấy hệ quả của ô đồng ý.

### Sequence — Quyền nghe audio theo đồng ý

```mermaid
sequenceDiagram
    actor U as Người yêu cầu audio
    participant S as Máy chủ phát audio
    participant D as Cơ sở dữ liệu
    U->>S: Yêu cầu bản ghi âm của một câu trả lời
    alt Chưa đăng nhập
        S-->>U: 401 Unauthorized
    else Có phiên
        S->>D: Tìm bài thi
        alt Không có bài thi
            S-->>U: 403 Forbidden
        else Có bài thi
            opt Người yêu cầu không phải chủ bài thi
                S->>D: Lấy báo lỗi mới nhất của bài thi
                D-->>S: shareConsent hoặc rỗng
            end
            alt Là chủ bài thi
                S-->>U: Cho phép
            else Là quản trị và shareConsent là true
                S-->>U: Cho phép
            else Còn lại
                S-->>U: 403 Forbidden
            end
        end
    end
    Note over S: Transcript không thấy kiểm tra tương ứng (🟡 OQ-5)
```

### Activity — Quyền nghe audio theo đồng ý

```mermaid
flowchart TD
    A["Yêu cầu audio của một bài thi"] --> B{"Có phiên đăng nhập?"}
    B -->|Không| X1["401 Unauthorized"]
    B -->|Có| C{"Bài thi tồn tại?"}
    C -->|Không| X2["403 Forbidden"]
    C -->|Có| D{"Người yêu cầu là chủ bài thi?"}
    D -->|Có| OK["Cho phép"]
    D -->|Không| E["Đọc shareConsent của báo lỗi mới nhất"]
    E --> F{"Email thuộc danh sách quản trị và shareConsent là true?"}
    F -->|Có| OK
    F -->|Không| X3["403 Forbidden"]
```
