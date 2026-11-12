---
type: reverse-srs-flows
feature: landing-page
updated: 2026-11-11
---

# landing-page — Flows tái lập (reverse)

## Flow: Mở và duyệt trang chủ

Nguồn: apps/web/src/routes/_proto/index.tsx:5-7; apps/web/src/routes/_proto/route.tsx:15-44; apps/web/src/features/app-state/use-profile-hydration.ts:29-41; apps/web/src/features/landing/landing-screen.tsx:9-47. Nhãn ✅.

### Sequence — Mở và duyệt trang chủ

```mermaid
sequenceDiagram
    actor K as Khách
    participant W as Trang web (khung proto)
    participant A as Phiên đăng nhập (SDK client)
    K->>W: Mở đường dẫn gốc
    W->>W: Ép giao diện sáng
    W->>A: Đọc phiên hiện tại
    alt Phiên đang tải
        A-->>W: Chưa xác định
    else Có hoặc không có phiên
        A-->>W: Người dùng hoặc null
    end
    W->>W: Nạp hồ sơ nếu có phiên, nếu xong phiên mà không có người dùng thì đặt lại trạng thái ban đầu
    W-->>K: Hiển thị header, hero, lời hứa, bảng giá, footer
    Note over W: Không chuyển hướng người đã đăng nhập (FR-002) ✅, có chủ ý hay không là 🟡
```

### Activity — Mở và duyệt trang chủ

```mermaid
flowchart TD
    A["Mở đường dẫn gốc"] --> B["Khung proto: gỡ chế độ tối, đặt màu sáng"]
    B --> C["Đọc phiên đăng nhập"]
    C --> D{"Phiên đang tải?"}
    D -->|Có| E["Người dùng chưa xác định"]
    D -->|Không| F["Người dùng hoặc null"]
    E --> G["Hiển thị trang chủ"]
    F --> H["Nạp hồ sơ nếu có phiên, không có người dùng thì đặt lại trạng thái"]
    H --> G
    G --> I["Không có nhánh chuyển hướng cho người đã đăng nhập - OQ-6"]
```

## Flow: Bấm nút kêu gọi để vào đăng nhập/đăng ký

Nguồn: apps/web/src/features/landing/landing-screen.tsx:20-21; apps/web/src/features/landing/components/hero.tsx:31; apps/web/src/features/app-state/routes.ts:9; test apps/web/src/features/__tests__/slice-a.test.tsx:155-173. Nhãn ✅.

### Sequence — Bấm nút kêu gọi

```mermaid
sequenceDiagram
    actor K as Khách
    participant W as Trang chủ
    participant R as Bộ định tuyến
    participant U as Màn đăng nhập
    K->>W: Bấm Đăng nhập, Thi thử miễn phí hoặc Thi thử ngay - miễn phí
    W->>R: Điều hướng tới màn auth
    R->>U: Hiển thị màn đăng nhập/đăng ký
    U-->>K: Người dùng tiếp tục ở feature auth
    Note over W,U: Ba nút cùng đích, không phân biệt đăng nhập và đăng ký ✅. Không dẫn thẳng vào thi thử 🟡 OQ-7
```

### Activity — Bấm nút kêu gọi

```mermaid
flowchart TD
    A["Khách bấm 1 trong 3 nút"] --> B{"Nút nào?"}
    B -->|"Đăng nhập (đầu trang)"| C["Điều hướng tới /auth"]
    B -->|"Thi thử miễn phí (đầu trang)"| C
    B -->|"Thi thử ngay - miễn phí (hero)"| C
    C --> D["Màn đăng nhập/đăng ký - ngoài scope"]
```

## Flow: Cuộn tới mục bằng liên kết đầu trang

Nguồn: apps/web/src/features/landing/landing-screen.tsx:15-18; apps/web/src/features/landing/components/promises-section.tsx:5; apps/web/src/features/landing/components/pricing-teaser.tsx:9. Nhãn ✅.

### Sequence — Cuộn tới mục

```mermaid
sequenceDiagram
    actor K as Khách
    participant W as Trang chủ
    K->>W: Bấm Cách chấm hoặc Bảng giá
    alt Màn hình dưới ngưỡng md
        W-->>K: Hai liên kết bị ẩn, không có đường tắt
    else Từ ngưỡng md trở lên
        W-->>K: Cuộn tới khối lời hứa hoặc khối bảng giá
    end
    Note over W: Thẻ giá chỉ để xem, không có nút mua ✅
```

### Activity — Cuộn tới mục

```mermaid
flowchart TD
    A["Khách ở trang chủ"] --> B{"Chiều rộng từ md trở lên?"}
    B -->|Không| C["Liên kết neo bị ẩn"]
    B -->|Có| D{"Liên kết nào?"}
    D -->|"Cách chấm"| E["Cuộn tới mục có id how"]
    D -->|"Bảng giá"| F["Cuộn tới mục có id pricing"]
    F --> G["Xem 1 thẻ miễn phí và 3 thẻ trả phí, không có nút mua"]
```

## Flow: Đọc điều khoản và quay lại

Nguồn: apps/web/src/features/landing/landing-screen.tsx:31-42; apps/web/src/routes/_proto/terms.tsx:11-99; test apps/web/src/features/__tests__/slice-a.test.tsx:174-176. Nhãn ✅.

### Sequence — Đọc điều khoản

```mermaid
sequenceDiagram
    actor K as Khách
    participant W as Trang chủ
    participant T as Trang điều khoản
    participant U as Màn đăng nhập
    K->>W: Bấm liên kết Điều khoản dịch vụ và Chính sách sử dụng
    alt Giữ Ctrl hoặc Meta
        W-->>K: Trình duyệt mở liên kết mặc định (tab mới)
    else Bấm thường
        W->>T: Điều hướng trong ứng dụng tới trang điều khoản
    end
    T-->>K: Hiển thị 6 mục điều khoản
    alt Bấm Quay lại và lịch sử có hơn 1 mục
        T-->>K: Quay về trang trước
    else Lịch sử không đủ
        T->>U: Chuyển tới màn đăng nhập
    end
    opt Bấm Quay lại Đăng nhập ở cuối trang
        T->>U: Chuyển tới màn đăng nhập
    end
```

### Activity — Đọc điều khoản

```mermaid
flowchart TD
    A["Khách bấm liên kết điều khoản ở footer"] --> B{"Giữ Ctrl hoặc Meta?"}
    B -->|Có| C["Trình duyệt mở /terms mặc định"]
    B -->|Không| D["Điều hướng trong ứng dụng tới /terms"]
    C --> E["Đọc 6 mục điều khoản"]
    D --> E
    E --> F{"Thoát bằng cách nào?"}
    F -->|"Nút Quay lại"| G{"Lịch sử trình duyệt dài hơn 1?"}
    G -->|Có| H["Quay lại trang trước"]
    G -->|Không| I["Chuyển tới màn đăng nhập"]
    F -->|"Nút Quay lại Đăng nhập"| I
```
