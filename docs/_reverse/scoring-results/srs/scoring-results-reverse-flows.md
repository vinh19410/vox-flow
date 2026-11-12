---
type: reverse-srs-flows
feature: scoring-results
status: draft
updated: 2026-11-11
---

# scoring-results — Flows tái lập (reverse)

> Mỗi flow có hai sơ đồ: `sequenceDiagram` (tương tác giữa các bên) và `flowchart` (bước, quyết định, số liệu thật). Chỉ vẽ bước có trong code; bước suy đoán được chú thích riêng. Nguồn dùng ID trong [`../reverse-sources.md`](../reverse-sources.md). Nhãn: ✅ code/test khẳng định · 🔵 suy đoán có ít nhất 2 chỗ hậu thuẫn · 🟡 cần xác nhận.

## F1: Nộp bài và xếp hàng chấm ✅ [S16, S7, S17]

### Sequence F1

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Web (màn chấm)
    participant A as API nộp bài
    participant D as CSDL
    participant Q as Hàng đợi chấm
    HV->>W: Vào màn chấm sau khi thi xong
    W->>W: Chờ và gửi lại các ghi âm còn trên thiết bị
    alt Còn ghi âm chưa lên hoặc không đọc được bản lưu
        W-->>HV: Chưa tải lên đủ câu trả lời, KHÔNG nộp
    else Đã lên đủ
        W->>A: Nộp bài
        A->>D: Đọc bài, kiểm chủ sở hữu và trạng thái
        alt Bài đã nộp
            A-->>W: BAD_REQUEST Attempt is already submitted
            W->>W: Chuyển sang hỏi trạng thái chấm (F4)
        else Bài đã bỏ
            A-->>W: BAD_REQUEST Attempt is abandoned
        else Vượt trần số câu hoặc dung lượng
            A-->>W: BAD_REQUEST ANSWER_COUNT_EXCEEDED hoặc TOTAL_AUDIO_LIMIT_EXCEEDED
        else Không có câu trả lời
            A-->>W: BAD_REQUEST Attempt has no recorded answers
        else Hợp lệ
            A->>D: Một lô giao dịch đánh dấu đã nộp và tạo bản ghi chấm queued
            opt Bản ghi chấm vừa được tạo mới
                A->>Q: Gửi thông điệp attemptId trễ 10 giây
                Note over A,Q: Gửi lỗi hoặc thiếu binding chỉ ghi log, không làm hỏng nộp bài
            end
            A-->>W: success
            W-->>HV: Đang chấm bài của bạn
        end
    end
```

### Flowchart F1

```mermaid
flowchart TD
    A["Học viên vào màn chấm"] --> B{"Mọi ghi âm đã lên máy chủ?"}
    B -->|Không| C["Hiện Chưa tải lên đủ câu trả lời - KHÔNG nộp"]
    B -->|Có| D["Gửi yêu cầu nộp bài"]
    D --> E{"Bài hợp lệ?"}
    E -->|Đã nộp| F["Hỏi trạng thái chấm - đi F4"]
    E -->|Đã bỏ| G["Lỗi Attempt is abandoned"]
    E -->|Vượt trần 35 MiB hoặc quá số câu| H["Lỗi ANSWER_COUNT_EXCEEDED hoặc TOTAL_AUDIO_LIMIT_EXCEEDED"]
    E -->|0 câu trả lời| I["Lỗi Attempt has no recorded answers"]
    E -->|Hợp lệ| J["Một giao dịch: đánh dấu đã nộp + tạo bản ghi chấm queued"]
    J --> K{"Bản ghi chấm mới được tạo?"}
    K -->|Không - nộp lặp| L["Không xếp hàng lại"]
    K -->|Có| M["Gửi hàng đợi trễ 10 giây"]
    M --> N{"Gửi thành công?"}
    N -->|Có| O["Bài chờ worker"]
    N -->|Không| P["Giữ queued - bộ quét sẽ xếp lại sau (F3)"]
```

## F2: Worker chấm bài ✅ [S2, S12, S5, S6, S3, S18]

### Sequence F2

```mermaid
sequenceDiagram
    participant Q as Hàng đợi chấm
    participant C as Worker consumer
    participant D as CSDL
    participant R as Kho âm thanh R2
    participant AI as Dịch vụ AI ngoài
    Q->>C: Giao thông điệp attemptId
    alt Thông điệp sai khuôn
        C->>Q: Xác nhận và bỏ
    else Hợp lệ
        C->>D: Nhận việc nếu queued hoặc processing quá 12 phút và tries nhỏ hơn 3
        alt Không nhận được
            C->>Q: Xác nhận - skipped
        else Nhận được - tries tăng 1
            C->>D: Đọc bài và câu trả lời, kiểm khóa âm thanh và trần
            alt Không có câu trả lời hoặc khóa sai hoặc vượt trần
                C->>D: failed ngay với lỗi không thể thử lại
                C->>Q: Xác nhận
            else Tiền điều kiện đạt
                opt Còn lần chấm cần chạy
                    loop Từng câu trả lời
                        C->>R: Đọc ghi âm
                    end
                    Note over C,R: Tổng vượt 8 MiB thì bỏ hết âm thanh, chấm bằng văn bản
                end
                loop Từng câu chưa có phiên âm, tối đa 240 giây
                    C->>AI: Phiên âm (timeout 60 giây)
                    AI-->>C: Văn bản
                    C->>D: Lưu phiên âm ngay
                end
                C->>AI: Chấm lần 1 (timeout 180 giây), có âm thanh nếu còn
                alt AI từ chối âm thanh
                    C->>AI: Chấm lại lần 1 bằng văn bản
                end
                par Các lần còn lại
                    C->>AI: Chấm lần 2 và các lần sau
                end
                C->>D: Lưu mỗi lần chấm đã kiểm chứng
                C->>D: Lấy trung vị từng tiêu chí, band tổng, ghi done
                C->>Q: Xác nhận
            end
        end
    end
    opt Lỗi trong lúc chạy
        alt Lỗi 400 401 403 404 hoặc lỗi không thể thử lại hoặc đây là tries 3
            C->>D: failed kèm thông điệp đã che khóa (chỉ nếu còn giữ lease)
            C->>Q: Xác nhận
        else Lỗi có thể thử lại
            C->>D: Trả về queued (chỉ nếu còn giữ lease)
            C->>Q: Yêu cầu giao lại sau 30 giây
        end
    end
```

### Flowchart F2

```mermaid
flowchart TD
    A["Nhận thông điệp attemptId"] --> B{"Đúng khuôn?"}
    B -->|Không| X["Xác nhận và bỏ"]
    B -->|Có| C{"Nhận việc được? queued hoặc processing quá 12 phút, tries nhỏ hơn 3"}
    C -->|Không| S["skipped - xác nhận"]
    C -->|Có| D["processing, tries cộng 1"]
    D --> E{"Có câu trả lời? Khóa âm thanh hợp lệ? Trong trần?"}
    E -->|Không| F["failed ngay"]
    E -->|Có| G{"Tổng âm thanh dưới hoặc bằng 8 MiB?"}
    G -->|Có| H["Chấm kèm âm thanh"]
    G -->|Không| I["Chấm chỉ bằng văn bản"]
    H --> J["Phiên âm câu thiếu - tối đa 240 giây - lưu từng câu"]
    I --> J
    J --> K{"Hết ngân sách 240 giây?"}
    K -->|Có| R["Lỗi có thể thử lại - lần giao sau tiếp tục"]
    K -->|Không| L["Chấm N lần độc lập - mặc định 3"]
    L --> M{"AI từ chối âm thanh?"}
    M -->|Có| N["Chấm lại bằng văn bản"]
    M -->|Không| O["Kiểm chứng JSON, làm tròn 0.5, lọc trích dẫn"]
    N --> O
    O --> P{"Đủ N lần chấm hợp lệ?"}
    P -->|Không| R
    P -->|Có| Q["Trung vị 4 tiêu chí, band tổng làm tròn IELTS"]
    Q --> T["done, ghi chi phí và thời điểm"]
    R --> U{"Lỗi 400 401 403 404 hoặc tries bằng 3?"}
    U -->|Có| F
    U -->|Không| V["Trả về queued, giao lại sau 30 giây"]
```

## F3: Quét bài kẹt mỗi 5 phút ✅ [S8, S13]

### Sequence F3

```mermaid
sequenceDiagram
    participant CR as Cron 5 phút
    participant S as Bộ quét
    participant D as CSDL
    participant Q as Hàng đợi chấm
    CR->>S: Kích hoạt lịch mỗi 5 phút
    S->>D: Tìm bài queued hoặc processing cập nhật cuối quá 12 phút
    loop Từng bài kẹt
        alt tries đã bằng hoặc lớn hơn 3
            S->>D: failed, lastError Scoring timed out
        else Còn lượt
            S->>Q: Gửi lại attemptId
            alt Gửi được
                S->>D: Trả về queued, cập nhật thời điểm
            else Không có hàng đợi hoặc gửi lỗi
                Note over S,D: Không đổi gì, lần quét sau thử lại
            end
        end
    end
    Note over CR,S: Lỗi của bộ quét chỉ ghi log, không chặn job khiếu nại quá hạn
```

### Flowchart F3

```mermaid
flowchart TD
    A["Cron 5 phút"] --> B["Tìm bài queued hoặc processing, cập nhật cuối cách nay hơn 12 phút"]
    B --> C{"Còn bài kẹt?"}
    C -->|Không| Z["Kết thúc, log số lượng"]
    C -->|Có| D{"tries lớn hơn hoặc bằng 3?"}
    D -->|Có| E["failed - Scoring timed out"]
    D -->|Không| F["Gửi lại hàng đợi"]
    F --> G{"Gửi được?"}
    G -->|Có| H["Về queued, đóng dấu thời gian mới"]
    G -->|Không| I["Giữ nguyên - chờ 5 phút sau"]
    E --> C
    H --> C
    I --> C
```

## F4: Theo dõi tiến trình trên màn chấm ✅ [S19, S20, S21]

### Sequence F4

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Web (màn chấm)
    participant A as API trạng thái
    HV->>W: Giữ màn chấm mở
    loop Mỗi 2.5 giây (dưới 60 giây), 5 giây (dưới 3 phút), 10 giây (từ 3 phút)
        W->>A: Hỏi trạng thái
        alt done
            A-->>W: done
            W-->>HV: Chuyển sang trang kết quả (thay thế lịch sử)
        else failed
            A-->>W: failed kèm manualRetries và canRetry
            W-->>HV: Chấm điểm chưa thành công, nút Chấm lại (F5)
        else queued hoặc processing
            A-->>W: trạng thái
            W-->>HV: Đang chờ đến lượt hoặc AI đang phân tích
        else not_scored
            A-->>W: not_scored
            Note over W: Sau 4 lần báo chưa chấm (cộng dồn) coi như lỗi chấm
        else Hỏi lỗi mạng
            A--xW: lỗi
            Note over W: 3 lỗi liên tiếp thì dừng
        end
    end
    opt Quá 10 phút chưa xong
        W-->>HV: Đang chậm hơn bình thường, nút Kiểm tra lại
    end
    opt 3 lỗi mạng liên tiếp
        W-->>HV: Mất kết nối khi kiểm tra kết quả, nút Thử lại
    end
```

### Flowchart F4

```mermaid
flowchart TD
    A["Bắt đầu hỏi trạng thái ngay"] --> B{"Kết quả hỏi"}
    B -->|done| C["Xóa job, chuyển trang kết quả"]
    B -->|failed| D["Màn Chấm điểm chưa thành công"]
    B -->|queued hoặc processing| E["Cập nhật dòng trạng thái"]
    B -->|not_scored| F{"Đã đủ 4 lần cộng dồn?"}
    B -->|Lỗi mạng| G{"Đã 3 lỗi liên tiếp?"}
    F -->|Có| D
    F -->|Không| E
    G -->|Có| H["Màn Mất kết nối - nút Thử lại"]
    G -->|Không| E
    E --> I{"Đã chờ từ 10 phút?"}
    I -->|Có| J["Màn Đang chậm hơn bình thường - nút Kiểm tra lại"]
    I -->|Không| K["Chờ 2.5 giây dưới 60 giây, 5 giây dưới 3 phút, 10 giây sau đó"]
    K --> A
    H -->|Bấm Thử lại| A
    J -->|Bấm Kiểm tra lại| A
```

## F5: Thử lại chấm (thủ công hoặc đường cứu) ✅ [S1, S17, S19]

### Sequence F5

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Web
    participant A as API thử lại
    participant D as CSDL
    participant Q as Hàng đợi chấm
    HV->>W: Bấm Chấm lại hoặc Chấm điểm ngay
    W->>A: Yêu cầu thử lại
    A->>D: Kiểm chủ sở hữu
    alt Không tìm thấy hoặc không phải chủ
        A-->>W: NOT_FOUND Attempt not found hoặc FORBIDDEN
    else Chưa có bản ghi chấm
        alt Bài chưa nộp
            A-->>W: BAD_REQUEST Only a submitted attempt can be scored
        else Bài đã nộp
            A->>D: Tạo bản ghi queued, không tính hạn mức
            A->>Q: Gửi attemptId trễ 10 giây
            A-->>W: queued
        end
    else Có bản ghi chấm
        A->>D: Một lô: ghi nhật ký nếu dưới 3 lượt trong ngày và bản ghi failed với manual_retries dưới 1, rồi cập nhật về queued
        alt Một dòng được cập nhật
            A->>Q: Gửi attemptId trễ 10 giây
            A-->>W: queued, manualRetries 1
            W-->>HV: Quay lại trạng thái chờ
        else Không dòng nào
            A->>D: Đọc lại để chọn lỗi
            alt manualRetries từ 1 trở lên
                A-->>W: BAD_REQUEST RETRY_LIMIT_EXCEEDED
            else failed và đã 3 lượt trong ngày
                A-->>W: TOO_MANY_REQUESTS DAILY_RETRY_LIMIT_EXCEEDED
            else Khác
                A-->>W: BAD_REQUEST Only a failed or unscored attempt can be retried
            end
        end
    end
    opt Lỗi
        W-->>HV: Câu thân thiện theo mã, hoặc câu chung nếu mã lạ
    end
```

### Flowchart F5

```mermaid
flowchart TD
    A["Yêu cầu thử lại"] --> B{"Bài tồn tại và thuộc người gọi?"}
    B -->|Không| X["NOT_FOUND hoặc FORBIDDEN"]
    B -->|Có| C{"Đã có bản ghi chấm?"}
    C -->|Không| D{"Bài đã nộp?"}
    D -->|Không| E["BAD_REQUEST Only a submitted attempt can be scored"]
    D -->|Có| F["Tạo bản ghi queued - không tính hạn mức - không ghi nhật ký"]
    C -->|Có| G{"failed, manual_retries dưới 1, lượt ngày dưới 3?"}
    G -->|Có| H["Ghi nhật ký, manual_retries cộng 1, về queued, tries về 0, xóa lỗi"]
    G -->|Không| I{"manual_retries từ 1 trở lên?"}
    I -->|Có| J["RETRY_LIMIT_EXCEEDED"]
    I -->|Không| K{"failed và lượt ngày từ 3 trở lên?"}
    K -->|Có| L["DAILY_RETRY_LIMIT_EXCEEDED"]
    K -->|Không| M["Only a failed or unscored attempt can be retried"]
    F --> N["Xếp hàng trễ 10 giây"]
    H --> N
    N --> O["Web về trạng thái chờ và hỏi tiếp - F4"]
```

## F6: Xem kết quả ✅ [S22, S23, S1]

### Sequence F6

```mermaid
sequenceDiagram
    actor HV as Học viên
    participant W as Web (màn kết quả)
    participant A as API
    HV->>W: Mở trang kết quả của một bài
    par Song song
        W->>A: Hỏi trạng thái
    and
        W->>A: Lấy kết quả
    end
    alt Lỗi NOT_FOUND hoặc FORBIDDEN
        A-->>W: lỗi
        W-->>HV: Không tìm thấy bài thi hoặc Bạn không có quyền xem bài thi này
    else Lỗi khác
        A--xW: lỗi
        W-->>HV: Không tải được kết quả, nút Tải lại
    else Trạng thái done nhưng kết quả rỗng
        W->>A: Lấy kết quả lần 2
        alt Vẫn rỗng
            W-->>HV: Bài thi đã chấm xong nhưng chưa đọc được kết quả
        end
    else Có kết quả
        A-->>W: band tổng, 4 tiêu chí, câu trả lời
        W-->>HV: Bạn đạt band X.X, lưới tiêu chí, hai tab
    else Chưa có điểm
        A-->>W: trạng thái
        W-->>HV: Đang chấm, Chấm điểm chưa thành công, hoặc Chưa được chấm điểm
    end
    opt Trạng thái queued hoặc processing
        HV->>W: Xem tiến trình chấm
        W->>W: Mở màn chấm (F4)
    end
    opt Trạng thái failed hoặc not_scored đã nộp
        HV->>W: Chấm lại hoặc Chấm điểm ngay
        W->>A: Thử lại (F5), thành công thì mở màn chấm
    end
```

### Flowchart F6

```mermaid
flowchart TD
    A["Mở trang kết quả"] --> B{"Bài từ máy chủ? không phải latest và không phải bài cục bộ"}
    B -->|Không| P["Đường prototype - dữ liệu giả 🟡"]
    B -->|Có| C["Hỏi trạng thái và lấy kết quả song song"]
    C --> D{"Kết quả hỏi"}
    D -->|NOT_FOUND hoặc FORBIDDEN| E["Màn không tìm thấy hoặc không có quyền - không có Tải lại"]
    D -->|Lỗi khác| F["Màn Không tải được kết quả - có Tải lại"]
    D -->|Thành công| G{"Trạng thái done và kết quả rỗng?"}
    G -->|Có| H["Đọc lại kết quả đúng 1 lần"]
    H --> I{"Còn rỗng?"}
    I -->|Có| J["Lỗi đã chấm xong nhưng chưa đọc được"]
    I -->|Không| M["Hiện kết quả thật"]
    G -->|Không| K{"Có kết quả?"}
    K -->|Có| M
    K -->|Không| L{"Trạng thái"}
    L -->|queued hoặc processing| N["Bài thi đang được chấm - nút Xem tiến trình"]
    L -->|failed| O["Chấm điểm chưa thành công - nút Chấm lại"]
    L -->|not_scored và đã nộp| Q["Bài thi chưa được chấm điểm - nút Chấm điểm ngay"]
    L -->|Còn lại| R{"Cờ FEATURES.scoring?"}
    R -->|Tắt| S["Tính năng chấm điểm AI sắp ra mắt"]
    R -->|Bật| P
    M --> T["Band tổng, 4 tiêu chí mở hoàn toàn, tab bằng chứng và tab xem lại từng câu"]
```
