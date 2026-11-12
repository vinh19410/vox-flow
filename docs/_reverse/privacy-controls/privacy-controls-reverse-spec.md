---
type: reverse-srs
feature: privacy-controls
status: draft
updated: 2026-11-11
confidence_summary: "✅65 🔵1 🟡23"
links:
  - reverse-sources.md
  - reverse-gaps.md
  - _evidence.md
  - srs/privacy-controls-reverse-flows.md
  - srs/privacy-controls-reverse-states.md
  - srs/privacy-controls-reverse-erd.md
  - usecases/privacy-controls-reverse-usecase-index.md
---

# privacy-controls — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập, chưa duyệt). Nhãn: ✅ chắc chắn · 🔵 suy đoán · 🟡 cần xác nhận.
> Priority luôn là `TBD 🟡` vì code không nói mức ưu tiên nghiệp vụ.

## 0. Truy vết nguồn & độ tin cậy

**CHƯA duyệt.** Tài liệu này được tái lập hoàn toàn từ source code + test (repo `vox-flow`, nhánh `dev`), không qua BA/PO.

- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Audit độc lập:** đã chạy 2026-11-11, hạ 11 claim, sửa 4 cite.
- **Phát hiện then chốt (đọc trước):** phần lớn hạ tầng quyền riêng tư tồn tại ở backend nhưng **không được nối vào UI và không được chặn thao tác nào**: (1) không có màn hình đồng ý / xuất dữ liệu nào gọi các API tương ứng; (2) hàm kiểm tra đồng ý (`requireConsent`) chỉ được test gọi, không có nơi sản xuất nào gọi; (3) bài thi luôn được lưu vô điều kiện (đảo quyết định D-10); (4) hàm xoá dữ liệu cá nhân tồn tại nhưng không có nơi gọi và không có tác vụ xoá tự động nào. Xem Mục 1, BR-010, OQ-1..OQ-6.

### 0.3 Khác biệt với tài liệu chính

Nguồn tài liệu chính: `docs/roadmap-work-items.md` (dòng 26) và `docs/product-decisions.md` (dòng 14, D-10). Tài liệu chỉ để đối chiếu; fact trong spec lấy từ code.

| Điểm | Reverse nói (từ code) | Doc chính nói | Đề xuất |
|------|------------------------|---------------|---------|
| Giao diện đồng ý | Không có component `ConsentRows` / `PrivacyScreen`, không có route privacy, web không gọi `setConsent` / `exportData` (negative-search trong gaps) 🟡 | S25:26 ghi "nối giao diện `ConsentRows`, `PrivacyScreen` theo D-10" | `/gap`: xác nhận doc lỗi thời hay UI nằm ở nhánh khác (OQ-1) |
| Kiểm tra `requireConsent` | Hàm tồn tại + có test nhưng không có caller sản xuất 🟡 | Roadmap ghi "kiểm tra `requireConsent`" như tính năng hoàn thành | `/gap` (OQ-2) |
| Xoá tự động 24h | Không có mã xoá tự động nào (cron chỉ chạy cảnh báo dispute quá hạn + quét lại điểm) ✅ | Roadmap ghi "Luồng xóa tự động 24h đang hold theo OQ-6 Câu 7" | Khớp (đang hold); xác nhận nghiệp vụ 24h chưa có nguồn (OQ-4) |
| D-10 | Bài thi luôn lưu, không phụ thuộc đồng ý ✅ (consent.ts:12-16) | `docs/product-decisions.md:14`: loại bỏ trang /app/privacy và ConsentStep, giữ bảng consent_event | Khớp; nhưng mâu thuẫn với dòng roadmap:26 về PrivacyScreen |

## 1. Scope

Feature đặc tả những gì **code thật sự làm** quanh quyền riêng tư dữ liệu của học viên:

- Ghi nhận và đọc lại lựa chọn đồng ý của học viên theo hai loại: "lưu bài" (save) và "hiệu chuẩn chấm điểm" (calibration, bí danh train). ✅ [S1]
- Xuất toàn bộ dữ liệu cá nhân của chính học viên đang đăng nhập. ✅ [S1, S3]
- Danh mục dữ liệu cá nhân theo bảng (DATA_REGISTRY): cách xuất, cách xoá từng bảng; danh sách bảng được khai báo là không chứa dữ liệu cá nhân kèm lý do (khai báo trong code; tính đúng của phân loại là 🟡, OQ-13). ✅ [S3]
- Năng lực xoá toàn bộ dữ liệu cá nhân của một học viên (kể cả file ghi âm). ✅ [S3] — nhưng chưa có điểm kích hoạt (🟡, OQ-3).
- Hàm chặn thao tác khi chưa trả lời bước đồng ý. ✅ hành vi [S1:9-35, S2:136] — nhưng chưa được nối vào thao tác nào (🟡, OQ-2).
- Thực tế hiện hành: bài thi luôn được lưu vô điều kiện, đồng ý không ảnh hưởng. ✅ [S5:12-16, S7:88]

**Boundary (out of scope):**

- Đồng ý chia sẻ ghi âm cho giám khảo khi báo lỗi chấm (shareConsent) thuộc feature score-dispute / dispute-admin; chỉ nêu ở đây như liên quan (BR-019, BR-020). ✅ [S15, S17, S18]
- Đăng ký / đăng nhập, điều khoản dịch vụ (trang `/terms`) — chỉ trích dẫn đoạn nói về lưu trữ dữ liệu (BR-022, 🟡).
- Màn hình xác nhận ghi âm trước khi thi (thẻ "Trước khi bắt đầu") được mô tả ở Mục 10 vì là điểm duy nhất hiển thị lời đồng ý ghi âm cho học viên, nhưng nút này không ghi nhận sự kiện đồng ý nào. ✅ [S12:28-38]

## 2. Actors & Stakeholders

| Actor | Loại | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|------|----------|--------------|-------|------|
| Học viên đã đăng nhập | người | Ghi nhận / rút lại đồng ý, xem trạng thái đồng ý, xuất dữ liệu cá nhân của chính mình (mục tiêu suy từ khả năng của API, không có UI; tư cách bên gọi ✅ theo S1, S8:15-22) | Có | S1 (mọi thao tác yêu cầu phiên đăng nhập, S8:15-22) | 🟡 |
| Học viên (bên gọi thực tế qua giao diện) | người | Gọi các thao tác này qua giao diện — hiện chỉ có thao tác đọc trạng thái đồng ý được gọi từ web, tự động sau đăng nhập | Có | S10:79-96 | ✅ |
| Người vận hành / quản trị hệ thống (kích hoạt xoá dữ liệu) | người | Xoá dữ liệu cá nhân khi có yêu cầu | Không rõ — không có điểm kích hoạt nào trong code | S3:268-280 | 🟡 |
| Kho lưu ghi âm (R2) | ngoài | Lưu / liệt kê / xoá file ghi âm theo tiền tố | Có | S3:19-31, S3:176-197 | ✅ |
| Cơ sở dữ liệu (D1) | ngoài | Lưu sự kiện đồng ý và các bảng dữ liệu cá nhân; giới hạn 100 tham số bind mỗi truy vấn | Có | S3:39-46, S4:354 | ✅ |
| Quản trị viên (nghe ghi âm khi học viên chia sẻ) | người | Rà soát khiếu nại chấm điểm (mục tiêu suy từ tên tham số dispute, thuộc dispute-admin) | Không (thuộc dispute-admin) | S15:23-35 | 🟡 |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-privacy-controls-001 | Ghi nhận đồng ý lưu bài theo từng loại | Khi học viên gửi một lựa chọn gồm loại "save" và giá trị đồng ý/không đồng ý, hệ thống ghi thêm một sự kiện đồng ý mới cho học viên đó (không sửa sự kiện cũ) và trả kết quả thành công. | TBD 🟡 | test | S1:94-100, S1:121; S2:82-111 | ✅ |
| FR-privacy-controls-002 | Ghi nhận đồng ý hiệu chuẩn theo từng loại | Tương tự FR-001 với loại "calibration"; học viên có thể bật rồi tắt lại, mỗi lần thêm một sự kiện. | TBD 🟡 | test | S1:94-100; S2:102-110 | ✅ |
| FR-privacy-controls-003 | Ghi nhận đồng ý dạng gộp | Hệ thống chấp nhận cách gửi gộp gồm các trường tùy chọn save, calibration, train; với mỗi trường có giá trị đúng/sai, hệ thống ghi một sự kiện tương ứng. Trường không gửi thì không ghi sự kiện. | TBD 🟡 | test | S1:43-49, S1:101-119; S2:113-124 | ✅ |
| FR-privacy-controls-004 | Bí danh "train" của hiệu chuẩn | Trong cách gửi gộp, "train" được coi là cùng ý nghĩa với "calibration": nếu cả hai cùng gửi thì "calibration" được ưu tiên; nếu chỉ có "train" thì dùng giá trị "train". | TBD 🟡 | kiểm tra | S1:110 | ✅ |
| FR-privacy-controls-005 | Từ chối cách gửi gộp rỗng | Nếu cách gửi gộp không có trường nào trong save / calibration / train có kiểu đúng/sai, hệ thống từ chối với thông điệp "At least one consent setting (save, calibration, or train) must be provided". | TBD 🟡 | kiểm tra | S1:50-56 | ✅ |
| FR-privacy-controls-006 | Gắn phiên bản chính sách | Mỗi sự kiện đồng ý lưu kèm phiên bản chính sách; nếu học viên không gửi thì dùng "v1". | TBD 🟡 | test | S1:92, S6:17; S2:85-89 | ✅ |
| FR-privacy-controls-007 | Đọc trạng thái đồng ý hiện tại | Hệ thống trả về cho học viên: save, calibration, train (bằng giá trị calibration) và hasAnswered (đã từng trả lời bước lưu bài hay chưa), dựa trên sự kiện mới nhất của từng loại. | TBD 🟡 | test | S1:60-86; S2:97-100 | ✅ |
| FR-privacy-controls-008 | Mặc định khi chưa từng trả lời | Học viên chưa có sự kiện nào nhận về save=false, calibration=false, hasAnswered=false. | TBD 🟡 | test | S1:77-85; S2:73-80, S2:126-134 | ✅ |
| FR-privacy-controls-009 | Cô lập đồng ý giữa học viên | Việc đọc / ghi đồng ý luôn theo học viên đang đăng nhập; đồng ý của người này không lộ cho người khác. | TBD 🟡 | test | S1:61, S1:66; S2:126-134 | ✅ |
| FR-privacy-controls-010 | Xuất dữ liệu cá nhân | Học viên đăng nhập lấy được một bản xuất gồm thời điểm xuất (ISO), mã học viên và dữ liệu nhóm theo từng bảng trong danh mục dữ liệu cá nhân. | TBD 🟡 | test | S1:124-127; S3:256-266; S2:161-175 | ✅ |
| FR-privacy-controls-011 | Bản xuất chỉ chứa dữ liệu của chính học viên | Bản xuất của học viên A không chứa dữ liệu học viên B. | TBD 🟡 | test | S2:161-175; S4:110 | ✅ |
| FR-privacy-controls-012 | Bản xuất chỉ lộ trường kết quả cho học viên | Với điểm chấm, bản xuất chỉ gồm attemptId, status, overall, criteriaJson, oneLiner, createdAt, scoredAt; không gồm userId, model, tries, lastError, costUsd, updatedAt. Dữ liệu chạy chấm điểm xuất ra danh sách rỗng. | TBD 🟡 | test | S3:127-138, S3:146-151; S4:527 | ✅ |
| FR-privacy-controls-013 | Bản xuất hạn chế dữ liệu nhạy cảm của đăng nhập | Phiên đăng nhập xuất ra chỉ gồm id, createdAt, expiresAt, userAgent, ipAddress; tài khoản liên kết xuất ra chỉ gồm id, providerId, accountId, createdAt; báo cáo forecast xuất ra id, topicId, notes, createdAt. | TBD 🟡 | kiểm tra | S3:78-85, S3:94-100, S3:109-118 | ✅ |
| FR-privacy-controls-014 | Danh mục dữ liệu cá nhân bao phủ mọi bảng | Mỗi bảng trong schema dữ liệu phải thuộc danh mục dữ liệu cá nhân (có cách xuất + xoá) hoặc danh mục bảng không cá nhân kèm lý do dài hơn 5 ký tự; bảng mới thiếu phân loại làm test hỏng. | TBD 🟡 | test | S3:47, S3:247-254; S4:78-108 | ✅ |
| FR-privacy-controls-015 | Danh mục có 12 bảng cá nhân + 3 bảng khai báo là không cá nhân | Bảng cá nhân (12): user, user_profile, consent_event, session, account, forecast_report, attempt_score, score_run, attempt, attempt_answer, score_dispute, scoring_retry_log. Bảng khai báo không cá nhân (3, kèm lý do trong code): verification, forecast_topic, forecast_source; ba bảng này không được xuất và không được xoá bởi hàm xoá. Việc chúng thật sự không chứa dữ liệu cá nhân chưa kiểm chứng (OQ-13). | TBD 🟡 | kiểm tra | S3:48-244, S3:247-254 | ✅ |
| FR-privacy-controls-016 | Xoá toàn bộ dữ liệu cá nhân của một học viên | Hệ thống có năng lực xoá dữ liệu học viên: xoá lần lượt các bảng phụ thuộc theo thứ tự khai báo trong danh mục, bảng người dùng được xoá sau cùng. | TBD 🟡 | test | S3:268-280; S4:110 | ✅ |
| FR-privacy-controls-017 | Xoá file ghi âm theo tiền tố | Khi xoá một bài thi, hệ thống liệt kê toàn bộ file ghi âm dưới tiền tố `users/{userId}/attempts/{attemptId}/` (theo trang, theo dõi con trỏ đến hết), xoá từng file, thử lại 1 lần nếu lỗi tạm thời; bao gồm cả file mồ côi của các lần ghi cũ. | TBD 🟡 | test | S3:168-203; S4:583 | ✅ |
| FR-privacy-controls-018 | Có điểm kích hoạt xoá dữ liệu | Có nơi người dùng / vận hành / lịch tự động kích hoạt việc xoá dữ liệu. | TBD 🟡 | phân tích | S3:268 (hàm tồn tại), negative-search ở gaps (không có caller) | 🟡 |
| FR-privacy-controls-019 | Chặn thao tác khi chưa trả lời bước đồng ý | Hàm kiểm tra: nếu học viên chưa có bất kỳ sự kiện "save" nào thì từ chối với mã FORBIDDEN; nếu đã có thì trả về {save, calibration} từ sự kiện mới nhất. Hàm này hiện không được thao tác sản xuất nào gọi. | TBD 🟡 | test | S1:9-35; S2:136-159 | ✅ |
| FR-privacy-controls-020 | Thao tác thực sự bị chặn khi thiếu đồng ý | Có ít nhất một thao tác nghiệp vụ thật bị chặn khi thiếu đồng ý. | TBD 🟡 | phân tích | negative-search: không có caller của hàm kiểm tra đồng ý ngoài test | 🟡 |
| FR-privacy-controls-021 | Bắt đầu bài thi luôn lưu lịch sử | Khi bắt đầu bài thi, hệ thống luôn đặt bài vào lịch sử (inHistory=true) và calibrationGranted=false, không đọc sự kiện đồng ý nào. | TBD 🟡 | kiểm tra | S5:12-16; S7:88-97; S26:93 | ✅ |
| FR-privacy-controls-022 | Yêu cầu đăng nhập cho mọi thao tác quyền riêng tư | Đọc đồng ý, ghi đồng ý, xuất dữ liệu đều yêu cầu phiên đăng nhập; không có phiên → từ chối UNAUTHORIZED "Authentication required". | TBD 🟡 | kiểm tra | S8:15-22; S1:60,88,124 | ✅ |
| FR-privacy-controls-023 | Nạp trạng thái đồng ý lên ứng dụng web sau đăng nhập | Sau khi nạp hồ sơ, web gọi đọc trạng thái đồng ý và lưu vào trạng thái ứng dụng (save, calibration, train, mỗi giá trị rơi về true/false/false nếu thiếu); lỗi mạng bị nuốt, không chặn. | TBD 🟡 | kiểm tra | S10:79-96 | ✅ |
| FR-privacy-controls-024 | Trạng thái đồng ý khởi tạo phía web | Trước khi nạp, trạng thái đồng ý ở web là save=true, calibration=false, train=false. | TBD 🟡 | kiểm tra | S11:9 | ✅ |
| FR-privacy-controls-025 | Lời xác nhận ghi âm trước khi thi | Thẻ "Trước khi bắt đầu" hiển thị câu "Ghi âm được xử lý bảo mật để chấm bài và tự động lưu vào lịch sử làm bài của bạn." và nút "Đồng ý ghi âm & bắt đầu"; bấm nút chuyển sang màn thi mà không ghi sự kiện đồng ý. | TBD 🟡 | demo | S12:22-38; S23:266-268 | ✅ |
| FR-privacy-controls-026 | Giao diện đồng ý / xuất dữ liệu cho học viên | Học viên có màn hình để bật / tắt đồng ý và tải bản xuất dữ liệu. | TBD 🟡 | demo | negative-search: không có component/route/lời gọi web | 🟡 |
| FR-privacy-controls-027 | Xoá tự động sau 24 giờ | Dữ liệu (ghi âm?) tự động bị xoá sau 24 giờ. | TBD 🟡 | phân tích | Chỉ có trong doc (S25:26); negative-search code: không có | 🟡 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-privacy-controls-001 | performance / platform | Mọi truy vấn xuất / xoá phải nằm trong trần 100 tham số bind mỗi truy vấn của D1; bảng chỉ có khóa attempt_id phải truy vấn bằng truy vấn con theo userId, không bao giờ liệt kê danh sách id. | TBD 🟡 | Test 120 bài thi + trả lời không vượt giới hạn | S3:39-46; S4:354 | ✅ |
| NFR-privacy-controls-002 | data-minimization | Bản xuất không chứa trường vận hành (model, cost, token, lỗi, payload thô). | TBD 🟡 | Test kiểm key set chính xác của điểm chấm | S3:39-41; S4:527 | ✅ |
| NFR-privacy-controls-003 | reliability | Xoá file ghi âm phải thất bại rõ ràng (throw) trước khi xoá dòng bài thi nếu còn file sót hoặc trang bị cắt không có con trỏ, để lần xoá sau vẫn còn tiền tố để tìm. | TBD 🟡 | Hai test: không con trỏ, xoá liên tục lỗi — dòng bài thi vẫn tồn tại | S3:171-175, S3:193-200; S4:645, S4:663 | ✅ |
| NFR-privacy-controls-004 | auditability | Lịch sử đồng ý chỉ thêm, không sửa / xoá từng dòng (trừ khi xoá cả người dùng). | TBD 🟡 | Kiểm tra: chỉ có insert trong luồng ghi | S1:95,103,112; S6:14 (cascade) | ✅ |
| NFR-privacy-controls-005 | security | Bản xuất tài khoản liên kết không chứa token / mật khẩu; phiên xuất có ipAddress + userAgent. | TBD 🟡 | kiểm tra | S3:94-100, S3:78-85 | ✅ |
| NFR-privacy-controls-006 | retention | Thời hạn lưu giữ dữ liệu / ghi âm. | TBD 🟡 | — | negative-search: không có TTL / xoá theo hạn | 🟡 |
| NFR-privacy-controls-007 | performance | Xuất dữ liệu thực hiện tuần tự từng bảng (một truy vấn / bảng), không song song. Thời lượng chấp nhận được chưa có nguồn. | TBD 🟡 | Test xoá + xuất ~70 truy vấn dùng timeout 30 giây | S3:258-260; S4:108-111 | 🟡 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-privacy-controls-001 | Mỗi lần đổi lựa chọn đồng ý là một sự kiện mới được thêm; không cập nhật sự kiện cũ. | Gửi lựa chọn đồng ý | FR-001..003 | S1:95-118 | ✅ |
| BR-privacy-controls-002 | Trạng thái đồng ý hiện hành của mỗi loại = sự kiện mới nhất theo thời điểm tạo của loại đó. | Đọc đồng ý / kiểm tra đồng ý | FR-007, FR-019 | S1:63-78; S2:102-111 | ✅ |
| BR-privacy-controls-003 | `hasAnswered` chỉ phụ thuộc vào việc có ít nhất một sự kiện loại "save"; chỉ có sự kiện calibration thì vẫn là false. | Đọc đồng ý | FR-007 | S1:84 | ✅ |
| BR-privacy-controls-004 | Trường "train" trả về luôn bằng giá trị "calibration". | Đọc đồng ý | FR-007 | S1:83 | ✅ |
| BR-privacy-controls-005 | Cách gửi từng loại: loại chỉ nhận "save" hoặc "calibration"; giá trị đồng ý bắt buộc đúng/sai; phiên bản chính sách tùy chọn (chuỗi). | Gửi lựa chọn | FR-001, FR-002 | S1:38-42 | ✅ |
| BR-privacy-controls-006 | Phiên bản chính sách mặc định "v1"; hệ thống không kiểm tra định dạng hay phiên bản đó có tồn tại. | Gửi lựa chọn không kèm phiên bản | FR-006 | S1:92, S1:41; S6:17 | ✅ |
| BR-privacy-controls-007 | Ý nghĩa nghiệp vụ của "policyVersion" (phiên bản điều khoản nào, khi nào tăng, có buộc hỏi lại không). | — | FR-006 | Không có trong code | 🟡 |
| BR-privacy-controls-008 | Bước kiểm tra đồng ý chỉ yêu cầu đã có ít nhất một sự kiện "save"; sự kiện "save" với granted=false vẫn được cho qua (đồng nghĩa "đã trả lời", không phải "đã đồng ý"). | Gọi hàm kiểm tra đồng ý | FR-019 | S1:17-22; S2:136-148 | ✅ |
| BR-privacy-controls-009 | Hàm kiểm tra đồng ý trả cờ save / calibration từ sự kiện mới nhất của từng loại; thiếu sự kiện calibration thì calibration=false. | Gọi hàm kiểm tra đồng ý | FR-019 | S1:31-34; S2:150-159 | ✅ |
| BR-privacy-controls-010 | Bài thi luôn được lưu vào lịch sử (inHistory=true) và hiệu chuẩn luôn tắt (calibrationGranted=false) bất kể lựa chọn đồng ý; mã ghi chú đây là "D-10 reversal". | Bắt đầu bài thi | FR-021 | S5:12-16; S7:88-97 | ✅ |
| BR-privacy-controls-011 | Giá trị mặc định ở cơ sở dữ liệu của bài thi: in_history = true, calibration_granted = false. | Tạo bài thi | FR-021 | S14:16-17 | ✅ |
| BR-privacy-controls-012 | Lý do nghiệp vụ của việc bỏ bước đồng ý (ngầm định chấp thuận lưu bài khi tiếp tục qua trang xác thực, theo YAGNI). | — | FR-021 | Chỉ có trong doc S24:14, code chỉ ghi "D-10 reversal" | 🟡 |
| BR-privacy-controls-013 | Bảng mới thêm vào schema phải được phân loại; bảng có cột user_id riêng dùng điều kiện trực tiếp, bảng chỉ có attempt_id dùng truy vấn con. | Thêm bảng mới | FR-014 | S3:39-46; S4:78-108 | ✅ |
| BR-privacy-controls-014 | Dữ liệu chạy chấm điểm được coi là dữ liệu vận hành, không xuất cho học viên; nhưng vẫn xoá khi xoá dữ liệu. | Xuất / xoá | FR-012, FR-016 | S3:146-161; S4:538-545 | ✅ |
| BR-privacy-controls-015 | Quyết định "dữ liệu chạy chấm không thuộc bản xuất" có thể mở lại nếu một câu hỏi mở nêu trong chú thích code (OQ-6 của tài liệu gốc, không có trong repo này) kết luận phải xuất. | — | FR-012 | S3:148-150 (chú thích), OQ-6 không có trong repo ở đây | 🟡 |
| BR-privacy-controls-016 | Thứ tự xoá: tất cả bảng khác "user" theo thứ tự khai báo trong danh mục, rồi "user" cuối cùng. | Xoá dữ liệu | FR-016 | S3:270-279 | ✅ |
| BR-privacy-controls-017 | Xoá bài thi: xoá file ghi âm trước (theo tiền tố), chỉ khi sạch mới xoá dòng bài thi; thử xoá lại 1 lần khi lỗi; còn file sót → lỗi "Erasure left N audio object(s) undeleted under {prefix}"; trang bị cắt không con trỏ → lỗi "Erasure stalled for {prefix}: truncated page without a cursor". | Xoá dữ liệu | FR-017 | S3:176-202; S4:645-675 | ✅ |
| BR-privacy-controls-018 | Sự kiện đồng ý bị xoá dây chuyền khi xoá người dùng. | Xoá người dùng | FR-016 | S6:14 | ✅ |
| BR-privacy-controls-019 | Người khác chủ bài thi chỉ được nghe ghi âm khi là quản trị viên VÀ khiếu nại gần nhất của bài đó có shareConsent=true; chủ bài luôn được nghe. (thuộc score-dispute, nêu để tham chiếu) | Tải ghi âm | — | S15:23-35; S16:57-91 | ✅ |
| BR-privacy-controls-020 | Cờ chia sẻ ghi âm cho giám khảo mặc định không chia sẻ (false) ở cả form, validator và cột DB. | Gửi khiếu nại | — | S17:16; S19:30; S18:24 | ✅ |
| BR-privacy-controls-021 | Chia sẻ ghi âm cho giám khảo là cơ chế đồng ý riêng, KHÔNG ghi vào sự kiện đồng ý của feature này. | Gửi khiếu nại | — | S17:94 | ✅ |
| BR-privacy-controls-022 | Điều khoản nêu: ghi âm và kết quả chấm được lưu vào lịch sử tài khoản; dữ liệu âm thanh "chỉ được xử lý cho mục đích cung cấp tính năng chấm thi, đánh giá phát âm và hỗ trợ phúc khảo (dispute) khi bạn yêu cầu". | Hiển thị điều khoản | FR-021 | S13:57-63 | ✅ |
| BR-privacy-controls-023 | Quy tắc "dữ liệu bị xoá sau 24 giờ" và điều kiện kích hoạt. | — | FR-027 | Không có trong code | 🟡 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-privacy-controls-001 | Chưa đăng nhập | Gọi đọc đồng ý / ghi đồng ý / xuất dữ liệu khi không có phiên | major | FR-022 | Không có UI privacy; phía web lỗi đọc đồng ý bị nuốt (S10:91-93) | Đăng nhập lại. Mã UNAUTHORIZED, thông điệp exact: "Authentication required" | S8:15-22 | ✅ |
| E-privacy-controls-002 | Chưa trả lời bước đồng ý | Hàm kiểm tra đồng ý khi học viên chưa có sự kiện "save" | major | FR-019 | Không có caller sản xuất — không xuất hiện ở UI | Ghi sự kiện save. Mã FORBIDDEN, thông điệp exact: "Consent required: user has not completed consent step" | S1:17-22; S2:136-142 | ✅ |
| E-privacy-controls-003 | Gửi gộp không có trường nào | Gửi lựa chọn gộp mà save / calibration / train đều không phải đúng/sai | minor | FR-005 | Không có UI gọi | Gửi ít nhất một trường. Thông điệp nguồn: "At least one consent setting (save, calibration, or train) must be provided". Mã lỗi hiển thị cho client ⚠️ chưa resolve (tRPC bọc lỗi union của zod; chưa có test xác nhận chuỗi cuối) | S1:50-56 | 🟡 |
| E-privacy-controls-004 | Gửi sai dạng đầu vào | Thiếu cả kind lẫn trường gộp, kind ngoài {save, calibration}, granted không phải boolean | minor | FR-001..003 | Không có UI gọi | Sửa đầu vào. Thông điệp ⚠️ chưa resolve (lỗi validate zod mặc định, chưa test) | S1:37-57 | 🟡 |
| E-privacy-controls-005 | Trang ghi âm bị cắt không có con trỏ | Khi xoá, kho ghi âm báo còn trang tiếp nhưng không trả con trỏ | critical | FR-017 | Không có UI (không có caller) | Lỗi throw (Error thường). Thông điệp exact: "Erasure stalled for {prefix}: truncated page without a cursor"; dòng bài thi giữ nguyên để chạy lại | S3:193-195; S4:657 (/cursor/i) | ✅ |
| E-privacy-controls-006 | Còn file ghi âm chưa xoá được | Xoá file ghi âm lỗi cả lần thử lại | critical | FR-017 | Không có UI | Chạy lại. Thông điệp exact: "Erasure left {N} audio object(s) undeleted under {prefix}"; dòng bài thi giữ nguyên | S3:198-200; S4:675 (/undeleted/i) | ✅ |
| E-privacy-controls-007 | Khiếu nại chưa bật (liên quan, thuộc score-dispute) | Gửi khiếu nại (có cờ shareConsent) khi cờ SCORE_DISPUTE_ENABLED khác "true" | major | — | Modal báo lỗi chấm | Mã FORBIDDEN, thông điệp exact: "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt" | S17:27-33; S20:56 | ✅ |
| E-privacy-controls-008 | Lỗi xuất dữ liệu (DB lỗi) | Truy vấn bất kỳ trong bản xuất thất bại | major | FR-010 | Không có UI | Không có xử lý riêng, lỗi truyền thẳng; wording ⚠️ chưa resolve | S3:256-266 | 🟡 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-privacy-controls-01 | Học viên kiểm soát được việc lưu / chia sẻ dữ liệu của mình | Chưa có | TBD — code không nói; hiện bài thi luôn lưu | Không có | 🟡 |
| SC-privacy-controls-02 | Tuân thủ yêu cầu truy cập / xoá dữ liệu cá nhân | Chưa có | TBD — chưa có quy định pháp lý hay SLA nào trong code | Không có | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/privacy-controls-reverse-erd.md`)

- **Sự kiện đồng ý** (consent_event): mỗi dòng là một lần học viên chọn đồng ý / không đồng ý cho một loại (save, calibration), kèm phiên bản chính sách và thời điểm; thuộc về học viên, xoá khi xoá học viên. ✅ [S6:6-24]
- **Bài thi** (attempt): có hai cờ liên quan quyền riêng tư là inHistory (mặc định true) và calibrationGranted (mặc định false). ✅ [S14:16-17]
- **Danh mục dữ liệu cá nhân** (DATA_REGISTRY): 12 bảng cá nhân với hàm xuất + xoá, 3 bảng khai báo là không cá nhân kèm lý do (OQ-13). ✅ [S3:47-254]
- **Cờ chia sẻ khiếu nại** (score_dispute.share_consent): cơ chế đồng ý riêng, mặc định false. ✅ [S18:24]

## 9. Flows (tóm tắt — chi tiết ở `srs/privacy-controls-reverse-flows.md`)

1. Ghi nhận / rút lại đồng ý (hai dạng đầu vào) — ✅ code, chưa có UI gọi.
2. Đọc trạng thái đồng ý và nạp lên ứng dụng web — ✅.
3. Xuất dữ liệu cá nhân — ✅ code, chưa có UI gọi.
4. Bắt đầu bài thi: xác nhận ghi âm và lưu vô điều kiện — ✅.
5. Xoá toàn bộ dữ liệu cá nhân (kèm file ghi âm) — ✅ code, không có điểm kích hoạt (🟡).
6. Kiểm tra đồng ý chặn thao tác — ✅ hàm, không có caller (🟡) — vẽ chung ở Flow 4 dưới dạng nhánh "không được gọi".

States: `srs/privacy-controls-reverse-states.md` (vòng đời đồng ý mỗi loại). ERD: `srs/privacy-controls-reverse-erd.md`.

## 10. Screens (tóm tắt)

Feature **không có màn hình riêng** cho đồng ý / xuất dữ liệu (không có route, component). Chỉ có các điểm UI liên quan:

| Screen | Mô tả | Liên quan | Nguồn | Nhãn |
|--------|-------|-----------|-------|------|
| Thẻ "Trước khi bắt đầu" (chọn bài thi) | Câu "Ghi âm được xử lý bảo mật để chấm bài và tự động lưu vào lịch sử làm bài của bạn." + nút "Đồng ý ghi âm & bắt đầu"; bấm nút xoá phiên luyện, bỏ cờ chờ nộp, chuyển sang màn thi; không ghi sự kiện đồng ý | FR-021, FR-025 | S12:22-38; S23:266-268 | ✅ |
| Trang Điều khoản (`/terms`) | Mục 3 "Xử lý và lưu trữ dữ liệu bài làm" | BR-022 | S13:55-64 | ✅ |
| Form khiếu nại điểm — hộp chọn chia sẻ | Hộp chọn không tích sẵn: "Đồng ý chia sẻ bản ghi âm và transcript của bài thi này cho giám khảo để phục vụ rà soát bài chấm (tùy chọn, mặc định không chia sẻ)." (thuộc score-dispute) | BR-020 | S19:130-140 | ✅ |
| Màn hình đồng ý / quyền riêng tư / xuất dữ liệu | KHÔNG TỒN TẠI trong code | FR-026 | negative-search | 🟡 |

## 11. Constraints, Dependencies & Assumptions

**Constraints:**

| Ràng buộc | Source / Owner | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Tối đa 100 tham số bind mỗi truy vấn của D1 | Nền tảng Cloudflare D1 | S3:44-46; S4:354 | ✅ |
| R2 phân trang tối đa 1000 đối tượng mỗi lần liệt kê (xoá phải đi theo con trỏ) | Nền tảng R2 | S3:171-173 (chú thích) | ✅ |
| Khóa tiền tố ghi âm: `users/{userId}/attempts/{attemptId}/` | Quy ước lưu trữ | S3:176 | ✅ |
| Quyết định D-10 (bỏ bước đồng ý, giữ bảng consent_event) | Chủ sản phẩm (theo doc, không có trong code) | S5:12-13 (ghi chú), S24:14 | 🟡 |
| Không được đảo quyết định đã chốt trong roadmap Mục 7 | CLAUDE.md dự án | (ràng buộc quy trình, không phải code) | 🟡 |

**Dependencies:**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Kho ghi âm R2 (liệt kê + xoá) | Hạ tầng Cloudflare | Không xoá được ghi âm | S3:19-31 | ✅ |
| Bảng người dùng / phiên đăng nhập (xác thực) | Feature auth-account | Mọi thao tác quyền riêng tư (cần phiên) | S8:15-22 | ✅ |
| Các bảng dữ liệu của feature khác (attempt, score, dispute, forecast...) | Feature tương ứng | Danh mục dữ liệu cá nhân phải được cập nhật khi bảng mới thêm | S3:47-244; S4:78 | ✅ |
| Cờ SCORE_DISPUTE_ENABLED (mặc định tắt) | Hạ tầng / chủ sản phẩm | Đồng ý chia sẻ ghi âm không thu thập được qua UI khi cờ tắt | S20:56 | ✅ |

**Assumptions:**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Sự kiện đồng ý vẫn được giữ để tương thích ngược / phục vụ UI sau này (bảng được giữ dù D-10 bỏ UI) | FR-001..009 có thể là code chết | S5:12-13; docs D-10 | 🟡 |
| Trạng thái đồng ý ở web chưa có nơi đọc (chỉ được nạp) | FR-023, FR-024 chỉ là trạng thái thừa | negative-search ở gaps | 🔵 |
| Việc gọi xoá dữ liệu sẽ do quy trình vận hành / tác vụ tương lai, chưa có | FR-016..018 | S3:268 + negative-search | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ ở [`reverse-gaps.md`](./reverse-gaps.md). Các OQ blocking:

- [ ] OQ-1: Giao diện đồng ý / xuất dữ liệu (`ConsentRows`, `PrivacyScreen`) có tồn tại ở nhánh khác không, hay doc lỗi thời? (FR-026)
- [ ] OQ-2: Hàm kiểm tra đồng ý (`requireConsent`) dự định chặn thao tác nào? Hiện không có caller. (FR-019, FR-020)
- [ ] OQ-3: Ai / cái gì kích hoạt việc xoá dữ liệu cá nhân (yêu cầu của học viên, vận hành, lịch)? (FR-018)
- [ ] OQ-4: Luồng xoá tự động 24 giờ: xoá cái gì (ghi âm? bài thi?), từ mốc nào, và vì sao đang hold? (FR-027)
- [ ] OQ-5: Sau D-10, sự kiện đồng ý save / calibration còn ý nghĩa nghiệp vụ nào? Có xoá bảng / API hay giữ?
- [ ] OQ-6: Bản xuất có cần gồm score_run (và các bảng vận hành khác) không?
- [ ] OQ-13: Ba bảng khai báo "không cá nhân" (verification, forecast_topic, forecast_source) có thật không chứa dữ liệu cá nhân? `verification.identifier` có thể chứa email (đăng nhập email/mật khẩu bật, packages/auth/src/index.ts:34), `forecast_topic.reviewed_by` là khóa ngoại tới user (packages/db/src/schema/forecast.ts:19), `forecast_source.raw_content` có thể là nội dung do học viên gửi (sourceType "student"). Cần PO/pháp lý.
- [ ] OQ-14: Hàm xoá dữ liệu chạy tuần tự, không giao dịch, và xoá file R2 chỉ theo tiền tố của các bài thi còn dòng; file nằm dưới `users/{userId}/` nhưng không còn dòng bài thi thì không được tìm thấy. Có cần xoá theo tiền tố `users/{userId}/` không? (FR-016, FR-017)
