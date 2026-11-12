# privacy-controls — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Giao diện đồng ý / quyền riêng tư / xuất dữ liệu (`ConsentRows`, `PrivacyScreen`) có tồn tại ở nhánh khác không, hay doc roadmap lỗi thời? Code ở `dev` không có component, route hay lời gọi thao tác ghi đồng ý / xuất dữ liệu từ web. — *(liên quan: Mục 3 FR-026, Mục 10 · cần: PO/dev quyết · blocking)*
* [ ] OQ-2: Hàm kiểm tra đồng ý (chặn khi chưa có sự kiện "save") dự định chặn thao tác nào (bắt đầu thi? nộp bài? xem lịch sử?) — hiện không có caller sản xuất. Giữ hay bỏ? — *(liên quan: FR-019, FR-020, BR-008 · cần: PO/dev · blocking)*
* [ ] OQ-3: Ai kích hoạt việc xoá dữ liệu cá nhân (học viên tự xoá tài khoản, quản trị viên, tác vụ định kỳ)? Hàm xoá tồn tại nhưng không có điểm gọi nào ngoài test. — *(liên quan: FR-016..018 · cần: PO/dev · blocking)*
* [ ] OQ-4: Luồng "xoá tự động 24 giờ" (nêu trong roadmap, đang hold): xoá dữ liệu nào (ghi âm? bản chép lời? cả bài thi?), mốc 24 giờ tính từ lúc nào, ngoại lệ khi có khiếu nại đang mở, và vì sao hold (OQ-6 Câu 7 của tài liệu gốc không có trong repo)? — *(liên quan: FR-027, NFR-006, BR-023 · cần: PO)*
* [ ] OQ-5: Sau D-10, sự kiện đồng ý "save" / "calibration" còn mục đích nghiệp vụ nào (bài thi luôn lưu, hiệu chuẩn luôn tắt)? Giữ API và bảng để dùng lại hay loại bỏ? — *(liên quan: FR-001..009, BR-010, BR-012 · cần: PO)*
* [ ] OQ-6: Bản xuất có cần gồm dữ liệu chạy chấm điểm và các trường vận hành khác không? Code ghi "Nếu OQ-6 kết luận phải xuất, mở lại bằng projection riêng". — *(liên quan: FR-012, BR-015 · cần: PO/pháp lý)*
* [ ] OQ-7: "policyVersion" mang ý nghĩa gì (số phiên bản điều khoản)? Khi điều khoản đổi, có buộc hỏi lại không? Mặc định "v1" cố định. — *(liên quan: FR-006, BR-007 · cần: PO)*
* [ ] OQ-8: Ở web, trạng thái đồng ý mặc định `save=true` nhưng sau khi nạp từ server, học viên chưa từng trả lời nhận `save=false` (server luôn trả boolean nên giá trị dự phòng true không bao giờ dùng). Có nơi nào đọc trạng thái này không? Hiện không có. — *(liên quan: FR-023, FR-024 · cần: dev)*
* [ ] OQ-9: Học viên có quyền yêu cầu xoá / rút đồng ý đã cấp cho giám khảo (chia sẻ ghi âm khiếu nại) sau khi gửi không? Code không có thao tác sửa shareConsent sau khi gửi (thuộc score-dispute). — *(liên quan: BR-019..021 · cần: PO)*
* [ ] OQ-10: Thông điệp lỗi thực tế client nhận khi gửi sai đầu vào (kể cả gửi gộp rỗng) — cần test xác nhận. — *(liên quan: E-003, E-004 · cần: dev)*
* [ ] OQ-11: Bản xuất có yêu cầu định dạng / cách tải về (file JSON?) không? Hiện chỉ trả đối tượng qua API, không có nơi tải. — *(liên quan: FR-010 · cần: PO)*
* [ ] OQ-12: Xuất dữ liệu có giới hạn tần suất / kích thước không? Code không có giới hạn. — *(liên quan: FR-010, NFR-007 · cần: dev)*
* [ ] OQ-13: Ba bảng khai báo "không cá nhân" (verification, forecast_topic, forecast_source) có thật không chứa dữ liệu cá nhân? `verification.identifier` có thể chứa email (đăng nhập email/mật khẩu bật tại packages/auth/src/index.ts:34; nội dung identifier do thư viện xác thực quyết định, chưa kiểm chứng), `forecast_topic.reviewed_by` là khóa ngoại tới user (packages/db/src/schema/forecast.ts:19), `forecast_source.raw_content` có thể là nội dung học viên gửi (source_type "student" tại forecast.ts:47, raw_content tại forecast.ts:49). Ba bảng này không được xuất và không được xoá bởi hàm xoá. — *(liên quan: FR-015 · cần: PO/pháp lý · blocking)*
* [ ] OQ-14: Hàm xoá dữ liệu chạy tuần tự, không giao dịch (packages/api/src/data-registry.ts:268-280); nếu lỗi giữa chừng, các bảng đã xoá không hoàn tác. File R2 chỉ được xoá theo tiền tố của các bài thi còn dòng (data-registry.ts:169-176), file dưới `users/{userId}/` không còn dòng bài thi sẽ không được tìm thấy. Ngoài ra `attempt_answer` bị xoá sau `attempt` nên truy vấn con của nó rỗng, việc xoá thực tế dựa vào khóa ngoại xoá dây chuyền (packages/db/src/schema/attempt.ts:38). — *(liên quan: FR-016, FR-017, BR-016 · cần: dev/pháp lý)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 7 Success Criteria | Mục tiêu và chỉ số đo kiểm soát quyền riêng tư | Không xác định "xong" | PO |
| Mục 3 Priority | Mức ưu tiên cho mọi FR | Không xếp thứ tự thực hiện | PO |
| Mục 10 Screens | Màn hình đồng ý / xuất dữ liệu | Học viên không tự quản đồng ý hay tải dữ liệu | PO/UX |
| FR-018, FR-027 | Điểm kích hoạt xoá + quy tắc 24 giờ | Dữ liệu không bao giờ tự xoá | PO/dev |
| Mục 4 NFR | Thời hạn lưu giữ, SLA xử lý yêu cầu xoá/xuất | Rủi ro tuân thủ chưa xác định | PO/pháp lý |
| Actors | Vai trò tiếp nhận yêu cầu quyền riêng tư của học viên | Không rõ ai chịu trách nhiệm | PO |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| Có giao diện quyền riêng tư không | Code: không có component/route/lời gọi ghi đồng ý hay xuất dữ liệu (S10, S11, S12; negative-search N1, N2) | Roadmap: "nối giao diện `ConsentRows`, `PrivacyScreen` theo D-10" (S25:26) | Không tự chọn bên. Quyết định D-10 (S24:14) nói loại bỏ trang /app/privacy → khớp code, lệch roadmap:26 |
| Kiểm tra đồng ý | Code: hàm tồn tại nhưng không được thao tác nào gọi (N3) | Roadmap: ghi "kiểm tra `requireConsent`" là phần đã hoàn thành (S25:26) | Có thể "hoàn thành" nghĩa là viết hàm + test |
| Trạng thái "đã đồng ý lưu" | Phía web mặc định save=true (S11:9); server trả save=false cho người chưa trả lời (S1:77, S2:73-80) | — | Hai mặc định lệch nhau; không có nơi đọc nên không gây hành vi (N6) |
| Ý nghĩa sự kiện "save" | Hàm kiểm tra coi "đã có sự kiện save (kể cả false)" là đạt (S1:17-22, S2:144-148) | Tên "Consent required" gợi ý cần đồng ý (S1:20) | Chuỗi lỗi nói "completed consent step" (đã hoàn tất bước), không phải "đã đồng ý" → khớp hành vi; wording dễ gây hiểu lầm |

## 4. Inferred assumptions (suy đoán cần verify)

* 🔵 Sự kiện đồng ý và API được giữ lại cho UI sau này, vì D-10 ghi "giữ nguyên bảng consent_event" và chú thích code nhắc "D-10 reversal" — *validate: hỏi PO · nếu sai: bảng / API là mã chết nên dọn.*
* 🔵 Hàm xoá dữ liệu cá nhân được viết cho yêu cầu xoá của học viên hoặc tác vụ định kỳ (có chú thích về "later erasure pass" và test nhiều trang R2) nhưng chưa nối — *validate: PO/dev · nếu sai: có thể là tiện ích nội bộ.*
* 🔵 `score_run` bị loại khỏi bản xuất vì là dữ liệu vận hành (chú thích code), nhưng vẫn bị xoá — *validate: PO/pháp lý · nếu sai: bản xuất thiếu dữ liệu phải trả cho học viên.*
* 🟡 Việc đặt `Priority` P-nào: không suy được.

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

Lệnh chạy từ gốc repo `/root/projects/vox-flow`, loại `node_modules`.

* **N1** — Web có gọi ghi đồng ý / xuất dữ liệu không? Pattern: `setConsent|exportData|privacy\.` · scope: `apps/web/src` (`*.ts`, `*.tsx`) → chỉ 1 kết quả: `apps/web/src/features/app-state/use-profile-hydration.ts:81` (đọc `privacy.getConsent`). Không có `setConsent` hay `exportData` ở web. Loại: code-câm / dead-code-nghi.
* **N2** — Có component / route privacy không? Pattern: `ConsentRows|PrivacyScreen|ConsentStep|app/privacy|/privacy` · scope: `apps`, `packages`, `docs/*.md` → chỉ xuất hiện trong `docs/product-decisions.md:14` và `docs/roadmap-work-items.md:26` (nội dung doc), cộng `import { privacyRouter }` ở `packages/api/src/routers/index.ts:7` và `packages/api/src/routers/privacy.test.ts:7`. Không có component / route.
* **N3** — Ai gọi hàm kiểm tra đồng ý? Pattern: `requireConsent\b` · scope: `apps`, `packages` (`*.ts`, `*.tsx`) → chỉ định nghĩa `packages/api/src/routers/privacy.ts:9` và test `packages/api/src/routers/privacy.test.ts:7,136-157`. Không có caller sản xuất. Loại: dead-code-nghi.
* **N4** — Ai gọi hàm xoá dữ liệu cá nhân? Pattern: `eraseUserData` · scope: `apps`, `packages` trừ `data-registry*` → 0 kết quả. Test `packages/api/src/data-registry.test.ts` gọi trực tiếp. Loại: dead-code-nghi.
* **N5** — Có xoá tự động / TTL / retention không? Pattern: `retention|ttl|expir.*audio|purge|24 ?h|86400|86_400|24 \* 60` · scope: `apps/server/src`, `packages/api/src`, `packages/infra` (trừ test) → chỉ gặp `apps/server/src/index.ts:130-132` (ngưỡng "24h" cho thế hệ tải lên, không liên quan xoá). Cron khai báo ở `packages/infra/alchemy.run.ts:62` (`"0 * * * *"`, `"*/5 * * * *"`) và bộ xử lý ở `apps/server/src/scheduled.ts:42-55` chỉ chạy cảnh báo khiếu nại quá hạn + quét lại điểm. Kết luận: không có luồng xoá tự động nào trong code. Loại: code-câm (khớp trạng thái "hold" trong doc).
* **N6** — Có nơi nào đọc trạng thái đồng ý ở web? Pattern: `\.consent\b|consent\.(save|calibration|train)|s\.consent` · scope: `apps/web/src` → chỉ lúc gán trong `use-profile-hydration.ts:85-87`. Không có chỗ đọc. Loại: dead-code-nghi.
* **N7** — Ai đọc `inHistory` / `calibrationGranted` ngoài bài thi? Pattern: `calibrationGranted|inHistory` · scope: `apps`, `packages` trừ test, schema, exam/consent → `packages/api/src/routers/attempt.ts:97-108` (ghi + trả) và `packages/api/src/routers/privacy.ts:78-83` (tên biến cục bộ). Không có chỗ lọc lịch sử theo `inHistory`. Loại: code-câm.
* **N8** — Có migration riêng cho `consent_event` không? Bảng được tạo trong `packages/db/src/migrations/20261105112648_familiar_union_jack/migration.sql` (không sửa tay theo CLAUDE.md).
* **N9** — Test bị skip? Pattern: `it\.skip|it\.todo|describe\.skip|test\.skip|\.todo\(` · scope: `packages/api/src/routers/privacy.test.ts`, `packages/api/src/data-registry.test.ts` → 0 kết quả.
* **N11 (audit 2026-11-11, chạy lại N1-N5)** — Kết quả lặp lại khớp N1 (chỉ `use-profile-hydration.ts:81`), N3 (chỉ định nghĩa + test), N4 (chỉ test, gồm data-registry.test.ts:297,468,633,657,675), N5 (chỉ `apps/server/src/index.ts:132` ngưỡng 24h cho generation; `index.ts:288` xoá khoá ghi âm cũ khi tải bản mới, không phải xoá theo hạn; cron chỉ ở alchemy.run.ts:62; không có cấu hình lifecycle cho bucket R2 tại alchemy.run.ts:28). Phạm vi: apps, packages, *.ts/*.tsx, trừ node_modules.
* **N10** — Có test cho nhánh chưa đăng nhập của thao tác riêng tư không? Pattern: `UNAUTHORIZED|unauth` · scope: `packages/api/src/routers/privacy.test.ts` → 0 kết quả (E-001 chỉ có nguồn code).

</details>
