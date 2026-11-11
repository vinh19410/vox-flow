---
type: reverse-srs-flows
feature: {{feature}}
updated: {{date}}
---

# {{feature}} — Flows tái lập (reverse)‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

## Flow: {{flow_name}}‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

### Sequence — {{flow_name}}‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

```mermaid
sequenceDiagram
    actor A as {{actor}}
    participant S as {{system}}
    participant X as {{dịch vụ ngoài — email/SMS/token nếu có}}
    A->>S: {{action + input}}
    alt {{điều kiện lỗi}}
        S-->>A: {{lỗi + mã E-xxx + wording}}
    else {{happy}}
        S->>X: {{gọi dịch vụ ngoài}}
        X-->>S: {{kết quả}}
        S-->>A: {{kết quả nghiệp vụ}}
    end
    Note over S: {{chú thích bước suy đoán 🔵/🟡 nếu có}}
```

### Activity — {{flow_name}}‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

```mermaid
flowchart TD
    A["{{bước 1}}"] --> B{"{{câu hỏi quyết định — kèm số liệu thật}}"}
    B -->|{{nhánh 1}}| E["{{kết cục + mã lỗi nếu có}}"]
    B -->|{{nhánh 2}}| C["{{bước tiếp}}"]
```


<!-- wm:c3e3a8b9c06f46427bf9089e2fdafa48 -->
<sub>Tài liệu thuộc bộ AI4BA BA-Kit — bản quyền ai4ba.com</sub>
