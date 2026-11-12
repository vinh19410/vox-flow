---
type: reverse-srs-flows
feature: forecast-curation
updated: 2026-11-11
---

# forecast-curation — Flows tái lập (reverse)

> Chỉ vẽ bước CÓ trong code. Bước suy đoán chú thích 🔵/🟡. Nguồn từng flow ghi ngay dưới tiêu đề.

## Flow: F1 Vào màn hình quản trị

Nguồn ✅: apps/web/src/routes/admin/forecast.tsx:9-27; packages/api/src/index.ts:15-38; packages/api/src/routers/forecast-admin.ts:17-19.

### Sequence — F1 Vào màn hình quản trị

```mermaid
sequenceDiagram
    actor A as Người dùng
    participant W as Màn hình (route)
    participant S as Hệ thống API
    A->>W: Mở /admin/forecast
    W->>W: Lấy phiên đăng nhập
    alt Không có phiên
        W-->>A: Chuyển sang /auth
    else Có phiên
        W->>S: Kiểm tra quyền quản trị
        alt Chưa đăng nhập (UNAUTHORIZED) hoặc không là quản trị viên (FORBIDDEN) hoặc lỗi bất kỳ
            S-->>W: Lỗi
            W-->>A: Chuyển về /app/dashboard
        else Là quản trị viên
            S-->>W: isAdmin true
            W-->>A: Hiển thị màn hình Duyệt đề Forecast
        end
    end
    Note over W: Nếu máy khách thiếu thao tác kiểm tra quyền thì bỏ qua bước này 🟡 OQ-17
```

### Activity — F1 Vào màn hình quản trị

```mermaid
flowchart TD
    A["Mở /admin/forecast"] --> B{"Có phiên đăng nhập?"}
    B -->|Không| E1["Chuyển sang /auth"]
    B -->|Có| C["Gọi kiểm tra quyền quản trị"]
    C --> D{"Kiểm tra thành công?"}
    D -->|"Không - FORBIDDEN, UNAUTHORIZED hoặc lỗi khác"| E2["Chuyển về /app/dashboard"]
    D -->|Có| F["Hiển thị màn hình quản trị và tải danh sách quý 2026-Q1"]
```

## Flow: F2 Xem danh sách bản nháp theo quý

Nguồn ✅: apps/web/src/features/admin/forecast-admin-screen.tsx:73-100,249-252; packages/api/src/routers/forecast-admin.ts:21-105.

### Sequence — F2 Xem danh sách bản nháp

```mermaid
sequenceDiagram
    actor A as Quản trị viên
    participant W as Màn hình
    participant S as Hệ thống API
    participant D as Kho dữ liệu
    A->>W: Chọn quý hoặc bấm Làm mới
    W->>S: Lấy danh sách theo quý
    S->>D: Đọc đề theo quý, mới tạo trước
    alt Không có đề
        S-->>W: Danh sách rỗng
        W-->>A: Không có đề nào phù hợp với bộ lọc.
    else Có đề
        S->>D: Đọc nguồn của các đề
        S->>D: Đếm học viên khác nhau đã báo mỗi đề
        S->>S: Phân tích câu hỏi, gắn nhãn [Cue] và [Part 3]
        S-->>W: Đề kèm nguồn và số báo
        W-->>A: Hiển thị thẻ đề, lọc trạng thái ngay trên trình duyệt
    end
    opt Lỗi chứa Admin access required hoặc FORBIDDEN
        S-->>W: Lỗi quyền
        W-->>A: Truy cập bị từ chối
    end
    opt Lỗi khác
        S-->>W: Lỗi
        W-->>A: Banner lỗi với thông điệp thô
    end
```

### Activity — F2 Xem danh sách bản nháp

```mermaid
flowchart TD
    A["Chọn quý (4 quý 2026) hoặc Làm mới"] --> B["Gọi lấy danh sách chỉ theo quý, không truyền trạng thái"]
    B --> C{"Có đề trong quý?"}
    C -->|Không| E1["Trả danh sách rỗng, hiện thông báo không có đề"]
    C -->|Có| D["Đọc nguồn và đếm học viên khác nhau cho mỗi đề"]
    D --> F{"Cột câu hỏi là gì?"}
    F -->|"Object có cueCards và part3"| G["Hiển thị tiền tố [Cue] rồi [Part 3]"]
    F -->|Mảng| H["Hiển thị từng chuỗi"]
    F -->|"JSON hỏng hoặc hình dạng khác"| I["Hiển thị rỗng"]
    G --> J["Màn hình lọc theo tab Tất cả, Bản nháp, Đã duyệt, Lưu trữ"]
    H --> J
    I --> J
```

## Flow: F3 Tạo bản nháp thủ công

Nguồn ✅: apps/web/src/features/admin/forecast-admin-screen.tsx:166-233; packages/api/src/routers/forecast-admin.ts:107-193.

### Sequence — F3 Tạo bản nháp thủ công

```mermaid
sequenceDiagram
    actor A as Quản trị viên
    participant W as Màn hình
    participant S as Hệ thống API
    participant D as Kho dữ liệu
    A->>W: Điền form và bấm Tạo bản nháp
    alt Tiêu đề rỗng
        W-->>A: Vui lòng nhập tiêu đề cho chủ đề.
    else Nguồn web thiếu hoặc sai URL
        W-->>A: Nguồn web bắt buộc có URL hợp lệ (bắt đầu bằng http:// hoặc https://).
    else Hợp lệ
        W->>S: Tạo đề (tiêu đề, quý đang chọn, part, câu hỏi, 1 nguồn)
        alt Sai ràng buộc máy chủ
            S-->>W: Lỗi Title is required, Quarter is required, Only HTTP/HTTPS URLs are allowed, hoặc sourceUrl is required for web sources
            W-->>A: Khung lỗi trong hộp thoại
        else Hợp lệ
            S->>S: Part 2 thì tách [Cue] và [Part 3]
            S->>D: Ghi đề, trạng thái draft
            S->>D: Ghi các nguồn
            S->>D: Đọc lại đề
            S-->>W: Đề vừa tạo
            W-->>A: Chèn đầu danh sách, đóng form, đặt lại ô nhập
        end
    end
    Note over S: Hai lần ghi không nằm trong một giao dịch 🟡 OQ-11
```

### Activity — F3 Tạo bản nháp thủ công

```mermaid
flowchart TD
    A["Bấm Thêm bản nháp và điền form"] --> B{"Tiêu đề sau trim rỗng?"}
    B -->|Có| E1["Lỗi: Vui lòng nhập tiêu đề cho chủ đề."]
    B -->|Không| C{"Nguồn Web và URL không bắt đầu http(s)://?"}
    C -->|Có| E2["Lỗi: Nguồn web bắt buộc có URL hợp lệ"]
    C -->|Không| D["Gửi tạo đề: part mặc định 1, câu hỏi mỗi dòng một câu"]
    D --> E{"Máy chủ chấp nhận?"}
    E -->|Không| E3["Hiện thông điệp lỗi máy chủ trong hộp thoại"]
    E -->|Có| F{"Part bằng 2?"}
    F -->|Có| G["Tách [Cue] vào cueCards, [Part 3] vào part3, câu thường vào cueCards"]
    F -->|Không| H["Lưu mảng phẳng nguyên văn"]
    G --> I["Ghi đề status draft và nguồn"]
    H --> I
    I --> J["Chèn đầu danh sách, số báo 0, đóng form"]
```

## Flow: F4 Nhập nguồn thô và gộp trùng

Nguồn ✅: packages/api/src/routers/forecast-admin.ts:368-438; packages/api/src/forecast/dedupe.ts:124-239. Không có màn hình gọi flow này 🟡 (OQ-2). Actor gọi là quản trị viên qua API.

### Sequence — F4 Nhập nguồn thô và gộp trùng

```mermaid
sequenceDiagram
    actor A as Quản trị viên (qua API)
    participant S as Hệ thống API
    participant G as Bộ gộp trùng
    participant D as Kho dữ liệu
    A->>S: Gửi danh sách nguồn thô
    alt Không là quản trị viên hoặc chưa đăng nhập
        S-->>A: FORBIDDEN Admin access required hoặc UNAUTHORIZED Authentication required
    else Sai ràng buộc (tiêu đề thô, quý, part, URL)
        S-->>A: Lỗi kiểm tra đầu vào
    else Hợp lệ
        S->>G: Gộp (không truyền dịch vụ AI)
        G->>G: Cụm theo cùng quý, cùng part, Jaccard đạt 0,25
        G->>G: Cụm có web thì viết IN HOA từ hỏi đầu câu, không diễn đạt lại
        G-->>S: Danh sách bản nháp (luôn draft)
        loop Mỗi bản nháp
            S->>D: Ghi đề draft, câu hỏi mảng phẳng
            S->>D: Ghi các nguồn gốc
        end
        S-->>A: processed, createdDrafts, drafts
    end
    Note over G: Có đường cắm dịch vụ AI nhưng chưa có bản cài đặt 🟡 OQ-3
```

### Activity — F4 Nhập nguồn thô và gộp trùng

```mermaid
flowchart TD
    A["Nhận danh sách nguồn thô"] --> B{"Danh sách rỗng?"}
    B -->|Có| E1["Trả processed 0, createdDrafts 0"]
    B -->|Không| C["Với mỗi nguồn: chuẩn hóa tiêu đề thành tập từ, bỏ 33 từ dừng"]
    C --> D{"Có cụm cùng quý + part và Jaccard lớn hơn hoặc bằng 0,25?"}
    D -->|"Có - cụm đầu tiên thỏa"| E["Thêm vào cụm, hợp tập từ vào cụm"]
    D -->|Không| F["Tạo cụm mới, tiêu đề lấy từ nguồn này"]
    E --> G{"Cụm có nguồn web?"}
    F --> G
    G -->|Có| H["Tiêu đề Describe và từ hỏi đầu câu viết IN HOA, không diễn đạt lại"]
    G -->|Không| I["Giữ nguyên câu hỏi"]
    H --> J["Gộp câu hỏi và loại trùng tuyệt đối"]
    I --> J
    J --> K["Ghi đề status draft, mỗi nguồn thô thành một nguồn gốc"]
    K --> L["Trả số xử lý, số bản nháp, danh sách bản nháp"]
```

## Flow: F5 Sửa bản nháp

Nguồn ✅: apps/web/src/features/admin/forecast-admin-screen.tsx:136-164,418-430,463-508; packages/api/src/routers/forecast-admin.ts:195-274.

### Sequence — F5 Sửa bản nháp

```mermaid
sequenceDiagram
    actor A as Quản trị viên
    participant W as Màn hình
    participant S as Hệ thống API
    participant D as Kho dữ liệu
    A->>W: Bấm Sửa (mọi trạng thái)
    W-->>A: Hộp thoại Chỉnh sửa đề thi nháp
    A->>W: Đổi tiêu đề, câu hỏi, bấm Lưu thay đổi
    W->>S: Sửa đề (mã, tiêu đề, câu hỏi, không gửi quý hay part)
    alt Tiêu đề rỗng
        S-->>W: Lỗi kiểm tra đầu vào
        W-->>A: Banner lỗi đầu trang, hộp thoại vẫn mở
    else Hợp lệ
        S->>D: Đọc đề theo mã
        alt Không có đề
            S-->>W: NOT_FOUND Forecast topic not found
            W-->>A: Banner lỗi đầu trang, hộp thoại vẫn mở
        else Có đề
            S->>S: Part 2 thì tách nhóm và giữ isNew cũ
            S->>D: Cập nhật các trường được gửi, không đổi status
            S->>D: Đọc lại đề
            S-->>W: Đề sau sửa
            W-->>A: Cập nhật thẻ, đóng hộp thoại
        end
    end
    Note over S: Sửa đề đã duyệt thay đổi nội dung đang xuất bản 🟡 OQ-7
```

### Activity — F5 Sửa bản nháp

```mermaid
flowchart TD
    A["Bấm Sửa, hộp thoại hiện tiêu đề và câu hỏi hiện tại"] --> B["Bấm Lưu thay đổi: tách dòng, trim, bỏ dòng rỗng"]
    B --> D{"Tiêu đề không rỗng?"}
    D -->|Không| E2["Lỗi kiểm tra đầu vào"]
    D -->|Có| C{"Đề tồn tại?"}
    C -->|Không| E1["NOT_FOUND Forecast topic not found"]
    C -->|Có| F{"Part đích bằng 2?"}
    F -->|Có| G["Tách [Cue] và [Part 3], giữ isNew đã lưu, cả hai rỗng thì lưu mảng rỗng"]
    F -->|Không| H["Lưu mảng phẳng"]
    G --> I["Cập nhật, status giữ nguyên"]
    H --> I
    I --> J["Đóng hộp thoại, thẻ hiển thị tiêu đề và câu hỏi mới"]
```

## Flow: F6 Duyệt (xuất bản) đề

Nguồn ✅: apps/web/src/features/admin/forecast-admin-screen.tsx:102-119,432-441; packages/api/src/routers/forecast-admin.ts:276-323.

### Sequence — F6 Duyệt đề

```mermaid
sequenceDiagram
    actor A as Quản trị viên
    participant W as Màn hình
    participant S as Hệ thống API
    participant D as Kho dữ liệu
    A->>W: Bấm Duyệt (chỉ đề nháp)
    W->>S: Duyệt đề theo mã
    S->>D: Đọc đề theo mã
    alt Không có đề
        S-->>W: NOT_FOUND Forecast topic not found
        W-->>A: Banner lỗi đầu trang
    else Có đề (mọi trạng thái đều được)
        S->>D: status published, reviewedBy là mã phiên, reviewedAt hiện tại
        S->>D: Đọc lại đề
        alt Đọc lại không thấy
            S-->>W: INTERNAL_SERVER_ERROR Failed to publish forecast topic
        else Thấy
            S-->>W: Đề đã duyệt
            W-->>A: Huy hiệu Đã duyệt, ẩn nút Duyệt
        end
    end
    Note over S,D: Đề đã duyệt từ đây học viên xem và báo được 🔵 qua feature forecast-practice
```

### Activity — F6 Duyệt đề

```mermaid
flowchart TD
    A["Bấm Duyệt trên đề nháp"] --> B{"Đề tồn tại?"}
    B -->|Không| E1["NOT_FOUND Forecast topic not found"]
    B -->|Có| C["Đặt status published, ghi người duyệt = quản trị viên đang gọi và thời điểm duyệt"]
    C --> D{"Đọc lại thấy đề?"}
    D -->|Không| E2["INTERNAL_SERVER_ERROR Failed to publish forecast topic"]
    D -->|Có| F["Trả đề đã duyệt, màn hình đổi nhãn thành Đã duyệt"]
```

## Flow: F7 Lưu trữ đề

Nguồn ✅: apps/web/src/features/admin/forecast-admin-screen.tsx:121-134,443-453; packages/api/src/routers/forecast-admin.ts:325-366.

### Sequence — F7 Lưu trữ đề

```mermaid
sequenceDiagram
    actor A as Quản trị viên
    participant W as Màn hình
    participant S as Hệ thống API
    participant D as Kho dữ liệu
    A->>W: Bấm Lưu trữ (đề nháp hoặc đã duyệt)
    W->>S: Lưu trữ đề theo mã
    S->>D: Đọc đề theo mã
    alt Không có đề
        S-->>W: NOT_FOUND Forecast topic not found
        W-->>A: Banner lỗi đầu trang
    else Có đề
        S->>D: status archived, cập nhật thời điểm sửa, giữ người duyệt cũ
        S->>D: Đọc lại đề
        alt Đọc lại không thấy
            S-->>W: INTERNAL_SERVER_ERROR Failed to archive forecast topic
        else Thấy
            S-->>W: Đề đã lưu trữ
            W-->>A: Huy hiệu Lưu trữ, ẩn nút Lưu trữ
        end
    end
    Note over S: Không có thao tác bỏ lưu trữ trong code 🟡 OQ-7
```

### Activity — F7 Lưu trữ đề

```mermaid
flowchart TD
    A["Bấm Lưu trữ trên đề chưa lưu trữ"] --> B{"Đề tồn tại?"}
    B -->|Không| E1["NOT_FOUND Forecast topic not found"]
    B -->|Có| C["Đặt status archived, không kiểm tra trạng thái hiện tại"]
    C --> D{"Đọc lại thấy đề?"}
    D -->|Không| E2["INTERNAL_SERVER_ERROR Failed to archive forecast topic"]
    D -->|Có| F["Màn hình đổi nhãn thành Lưu trữ, học viên không còn thấy đề"]
```
