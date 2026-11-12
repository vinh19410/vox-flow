---
type: reverse-srs
feature: dispute-admin
status: draft
updated: 2026-11-11
confidence_summary: "✅92 🔵3 🟡34"
links:
  - docs/_reverse/dispute-admin/reverse-sources.md
  - docs/_reverse/dispute-admin/reverse-gaps.md
  - docs/_reverse/dispute-admin/_evidence.md
  - docs/_reverse/dispute-admin/srs/dispute-admin-reverse-flows.md
  - docs/_reverse/dispute-admin/srs/dispute-admin-reverse-states.md
  - docs/_reverse/dispute-admin/srs/dispute-admin-reverse-erd.md
  - docs/_reverse/dispute-admin/usecases/dispute-admin-reverse-usecase-index.md
---

# dispute-admin — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập từ code, **CHƯA duyệt**). Nhãn: ✅ code/test khẳng định · 🔵 suy đoán có ≥2 chỗ code hậu thuẫn · 🟡 cần xác nhận (code không nói).
> Priority (P0/P1/P2) luôn là TBD 🟡 vì code không nói mức ưu tiên; cột Priority KHÔNG được tính vào `confidence_summary` (chỉ đếm cột Nhãn cuối mỗi dòng bảng ở Mục 2-7, 10, 11).

## 0. Truy vết nguồn & độ tin cậy

- **Trạng thái duyệt:** CHƯA duyệt. Tài liệu là bản tái lập từ source code + test, chưa có xác nhận của product owner/BA.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md) (S1-S22).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Bằng chứng chi tiết (validation, wording lỗi, hop):** xem [`_evidence.md`](./_evidence.md).
- **Quy ước:** tên endpoint/hàm/bảng chỉ xuất hiện ở cột Nguồn / `_evidence.md`; phần mô tả dùng ngôn ngữ nghiệp vụ.
- **Audit độc lập:** đã chạy 2026-11-11, hạ 29 claim, sửa 1 cite.
- **Điểm bàn giao:** việc học viên gửi báo lỗi (tạo ca, hạn 72 giờ, cờ bật tính năng) thuộc feature `score-dispute` (bản nháp riêng); spec này chỉ nêu điểm nối ở Mục 11.

### 0.3 Khác biệt với tài liệu chính

Feature trùng runbook vận hành `docs/runbooks/score-dispute.md` (S21). Runbook KHÔNG phải nguồn fact; các khác biệt được ghi ở đây, chi tiết ở `reverse-gaps.md` mục 3.

| Điểm | Reverse nói (từ code) | Doc chính nói (`docs/runbooks/score-dispute.md`) | Đề xuất |
|------|------------------------|--------------------------------------------------|---------|
| Văn bản mẫu trả lời 1 | "Chào bạn, sau khi rà soát bài thi phần {tiêu chí}, ban chuyên môn xác nhận hệ thống AI đã chấm khắt khe hơn tiêu chí IELTS chuẩn. Điểm của bạn đã được cập nhật thành Band {band}. Chúc bạn ôn tập tốt!" [S11:87-89] | Kết thúc bằng "Chúc bạn ôn tập tốt và đạt mục tiêu thi sắp tới!" [S21:46] | `/cr`: chốt bản chuẩn |
| Văn bản mẫu trả lời 2 | Không có cụm "(về ngữ pháp, từ vựng hoặc phát âm)" và câu cuối ngắn hơn [S11:93-95] | Có cụm trên và "để hệ thống ngày càng hoàn thiện hơn!" [S21:49] | `/cr` |
| Văn bản mẫu trả lời 3 | "do bạn không đồng ý chia sẻ bản ghi âm, chúng tôi chỉ có thể đối chiếu qua bản ghi văn bản transcript" [S11:99-100] | "do bạn không đồng ý chia sẻ bản ghi âm cho lần báo lỗi này, ban chuyên môn chỉ có thể đối chiếu bài thi dựa trên dữ liệu văn bản transcript" [S21:52] | `/cr` |
| Admin đối chiếu theo transcript | Chi tiết ca KHÔNG trả transcript, điểm AI hay phản hồi AI; chỉ trả câu hỏi, thời lượng, loại tệp [S1:195-209] | "Quản trị viên chỉ đối chiếu dựa trên bản ghi văn bản transcript đã lưu trữ" [S21:21] | `/gap` — OQ-9 |
| Học viên xem kết quả | Màn kết quả học viên chỉ hiện huy hiệu "Báo lỗi đã xử lý" / "Báo lỗi không được chấp nhận" [S18:329-338]; không hiện band mới hay nội dung phản hồi | "Học viên có thể xem kết quả trực tiếp trên màn hình kết quả bài thi" [S21:29] | `/gap` — OQ-2, OQ-3 |
| Ngưỡng tìm thêm người | Chỉ có chữ cố định "> 5 cần tìm thêm người" ở thẻ số liệu [S11:277]; không có ngưỡng 90% hay cảnh báo tự động | Hai ngưỡng: > 5 báo lỗi/tuần, tỷ lệ đúng hạn < 90% [S21:60-61] | `/gap` — OQ-7 |

## 1. Scope

Feature cho phép **quản trị viên** của sản phẩm xử lý các báo lỗi chấm điểm (ca khiếu nại) do học viên gửi: xem hàng đợi theo hạn xử lý, mở chi tiết một ca, nghe lại bản ghi âm **chỉ khi học viên đã đồng ý chia sẻ**, ra quyết định chấp nhận (kèm band điểm mới) hoặc từ chối, gửi lời phản hồi cho học viên, theo dõi số liệu vận hành, và nhận cảnh báo (dạng đánh dấu) cho các ca sắp quá hạn 12 giờ nhờ tác vụ định kỳ. ✅ [S1:89-336][S3:16-65][S11:104-651]

- Chỉ người dùng đã đăng nhập có email nằm trong danh sách quản trị cấu hình mới dùng được các chức năng này. ✅ [S10:31-45][S8:1-13]
- Hàng đợi sắp theo hạn xử lý gần nhất trước. ✅ [S1:130]
- Việc tải bản ghi âm có hai lớp chặn: danh sách chi tiết ca chỉ phát đường dẫn audio khi có đồng ý; cổng tải tệp audio độc lập cũng từ chối admin khi không có đồng ý. ✅ [S1:210-224][S8:23-37][S7:322-344]
- Tác vụ định kỳ mỗi giờ đánh dấu các ca còn ≤ 12 giờ đến hạn (kể cả đã quá hạn) một lần duy nhất; việc đánh dấu chỉ ghi thời điểm cảnh báo, không có kênh thông báo nào được gọi. ✅ [S3:16-65][S5:7-8][S5:16-23] (ý nghĩa nghiệp vụ của việc "chỉ đánh dấu": 🟡 OQ-3)

**Boundary (out of scope của spec này):**

- Học viên gửi báo lỗi, chọn tiêu chí/band kỳ vọng/đồng ý chia sẻ, tính hạn 72 giờ, cờ bật tính năng cho học viên: feature `score-dispute`. ✅ [S17:23-131]
- Việc có hay không cập nhật điểm chính thức của bài thi sau khi chấp nhận: code của feature này KHÔNG làm; xem OQ-2. ✅ (negative search trong `reverse-gaps.md`)
- Quy trình chấm điểm AI, hàng đợi chấm điểm (cron quét 5 phút chỉ nằm chung bộ xử lý lịch; không thuộc feature). ✅ [S5:42-55]
- Màn hình `forecast-admin` và các màn quản trị khác. ✅ [`apps/web/src/routes/admin/forecast.tsx` tồn tại cạnh route disputes]

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|-----------------------------|----------|--------------|-------|------|
| Quản trị viên (email nằm trong danh sách quản trị) | người | Xem hàng đợi, xem ca, nghe audio khi được phép, ra quyết định + phản hồi, xem số liệu | Có | S10:31-45, S8:1-13, S1:89-336 | 🟡 |
| Danh tính thực tế của quản trị viên ("người sở hữu sản phẩm") | người | Giai đoạn đầu product owner tự xử lý (theo UI: "Chỉ người sở hữu sản phẩm (admin) mới có quyền truy cập") | Có | S11:242, S2:11-19 | 🟡 |
| Người dùng đã đăng nhập nhưng không phải quản trị viên | người | Không có mục tiêu hợp lệ; bị từ chối (lỗi 403 ở API, chuyển về dashboard ở route) | Có (ca bị chặn) | S10:31-38, S12:16-24, S2:95-101 | 🟡 |
| Người chưa đăng nhập | người | Không có; bị yêu cầu xác thực (API) hoặc chuyển tới trang đăng nhập (route) | Có (ca bị chặn) | S10:15-22, S12:9-14, S2:103-109 | 🟡 |
| Học viên (chủ ca) | người | Gửi báo lỗi trước; nhận phản hồi sau khi admin xử lý; quyết định đồng ý chia sẻ audio | Không (phía `score-dispute`); chỉ là người nhận kết quả | S17:23-131, S18:319-338, S1:210 | 🟡 |
| Tác vụ định kỳ (cron theo giờ) | hệ thống | Đánh dấu cảnh báo ca sắp quá hạn | Có | S5:7-8, S5:42-55, S3:16-65 | 🟡 |
| Kho lưu trữ audio (R2) | ngoài | Cung cấp tệp ghi âm cho cổng tải audio | Có (phụ thuộc) | S7:365-373 | 🟡 |
| Người nhận cảnh báo sắp quá hạn | người | Code không chỉ rõ ai nhận hay nhận bằng kênh nào | Không rõ | S3:16-65 | 🟡 |

> Cột "Mục tiêu" là suy luận về mục đích sử dụng nên cả bảng ở 🟡. Hành vi có căn cứ trong code của từng actor (chặn quyền, nghe audio, cảnh báo định kỳ) được xác nhận ✅ ở FR-001, FR-002, FR-009, FR-018 và BR-001, BR-007.

## 3. Functional Requirements (FR)

Priority: TBD cho mọi FR (code không nói; OQ-1).

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-dispute-admin-001 | Chỉ quản trị viên được vào | Hệ thống từ chối mọi thao tác của hàng đợi/xử lý/số liệu nếu người dùng chưa đăng nhập (lỗi xác thực) hoặc email không nằm trong danh sách quản trị (lỗi quyền truy cập). Danh sách quản trị lấy từ cấu hình môi trường, cách nhau bằng dấu phẩy. | TBD | test | S10:15-45, S2:88-110 | ✅ |
| FR-dispute-admin-002 | Kiểm tra quyền khi vào màn quản trị | Trước khi hiển thị màn hình hàng đợi, hệ thống kiểm tra phiên đăng nhập; chưa đăng nhập thì chuyển tới trang đăng nhập; đã đăng nhập nhưng bước kiểm tra quyền admin lỗi (không đủ quyền hoặc lỗi bất kỳ) thì chuyển về trang tổng quan học viên. | TBD | demo | S12:7-27 | ✅ |
| FR-dispute-admin-003 | Xem hàng đợi báo lỗi | Admin xem danh sách ca kèm: mã ca, mã bài thi, tên và email học viên, tiêu chí khiếu nại, band kỳ vọng, lý do, đồng ý chia sẻ audio, trạng thái, hạn xử lý, thời điểm cảnh báo, thời điểm xử lý, band cũ, band mới, nội dung phản hồi, thời điểm tạo. Tên/email lấy theo liên kết tới hồ sơ người dùng; nếu không còn người dùng thì tên/email trống. | TBD | test | S1:20-24, S1:107-128, S2:187-202 | ✅ |
| FR-dispute-admin-004 | Lọc hàng đợi theo nhóm trạng thái | Có ba bộ lọc: tất cả (mặc định ở API), "open" gồm ca đang mở hoặc đang xem xét, "resolved" gồm ca đã chấp nhận hoặc đã từ chối. Không truyền bộ lọc thì coi là tất cả. | TBD | kiểm tra | S1:20-24, S1:97-105 | ✅ |
| FR-dispute-admin-005 | Sắp hàng đợi theo hạn xử lý | Hàng đợi sắp theo hạn xử lý tăng dần (gần hạn nhất trước), áp dụng cho mọi bộ lọc. | TBD | test | S1:130, S2:187-196 | ✅ |
| FR-dispute-admin-006 | Gắn cờ sắp quá hạn và quá hạn cho từng ca | Mỗi ca trong hàng đợi có cờ "sắp quá hạn" và cờ "quá hạn" tính theo thời điểm truy vấn (quy tắc ở BR-005, BR-006). | TBD | test | S1:132-144, S2:198 | ✅ |
| FR-dispute-admin-007 | Xem chi tiết một ca | Admin mở một ca theo mã và nhận: thông tin ca, thông tin bài thi (chế độ, trạng thái, giờ bắt đầu, giờ nộp; có thể trống nếu bài không còn), và danh sách câu trả lời theo thứ tự câu (mã, khóa câu hỏi, nội dung câu hỏi, phần thi, thứ tự, thời lượng, loại tệp, giờ tạo). | TBD | test | S1:148-226 | ✅ |
| FR-dispute-admin-008 | Chỉ cấp đường dẫn nghe audio khi học viên đồng ý | Trong chi tiết ca, mỗi câu trả lời có cờ "được phép nghe" và đường dẫn audio chỉ khi học viên đã đồng ý chia sẻ; không đồng ý thì cờ là sai và đường dẫn rỗng. | TBD | test | S1:210-224, S2:204-220 | ✅ |
| FR-dispute-admin-009 | Cổng tải audio theo quyền | Khi một người không phải chủ bài thi tải audio, hệ thống chỉ cho phép nếu người đó là admin và ca báo lỗi mới nhất của bài thi có đồng ý chia sẻ; mọi trường hợp khác bị từ chối. Chủ bài thi luôn được nghe audio của mình. | TBD | test | S8:23-37, S7:322-344, S9:35-110 | ✅ |
| FR-dispute-admin-010 | Chấp nhận khiếu nại kèm band mới | Admin chọn "chấp nhận", bắt buộc chọn band mới trong tập 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0 và nhập phản hồi; hệ thống lưu trạng thái đã chấp nhận, band mới, phản hồi, thời điểm xử lý. | TBD | test | S1:8-14, S1:251-267, S2:224-248 | ✅ |
| FR-dispute-admin-011 | Từ chối khiếu nại | Admin chọn "từ chối" và nhập phản hồi; hệ thống lưu trạng thái đã từ chối, band mới để trống (kể cả khi client có gửi band), phản hồi, thời điểm xử lý. | TBD | kiểm tra | S1:263, S1:259-267 | ✅ |
| FR-dispute-admin-012 | Bắt buộc có phản hồi cho học viên | Nội dung phản hồi không được rỗng sau khi bỏ khoảng trắng đầu/cuối cả khi chấp nhận lẫn từ chối. | TBD | kiểm tra | S1:13 | ✅ |
| FR-dispute-admin-013 | Lưu band cũ để đối chiếu | Khi xử lý, band cũ lấy theo giá trị admin gửi lên; nếu không gửi thì giữ giá trị đã có trên ca; nếu cả hai đều không có thì để trống. Band cũ là chuỗi tự do, không kiểm tra định dạng. | TBD | test | S1:12, S1:264, S2:224-239 | ✅ |
| FR-dispute-admin-014 | Mỗi ca chỉ được xử lý một lần | Ca đã chấp nhận hoặc đã từ chối không được xử lý lại; ca không tồn tại báo không tìm thấy. | TBD | test | S1:231-249, S2:250-263 | ✅ |
| FR-dispute-admin-015 | Chống xử lý đồng thời bởi hai admin | Việc cập nhật chỉ có hiệu lực nếu ca vẫn đang ở trạng thái mở hoặc đang xem xét tại thời điểm ghi; nếu ca vừa bị người khác xử lý, hệ thống báo xung đột và không ghi đè. | TBD | kiểm tra | S1:259-282 | ✅ |
| FR-dispute-admin-016 | Học viên thấy kết quả xử lý ở dữ liệu ca | Sau khi xử lý, dữ liệu ca mà học viên đọc được (qua feature phía học viên) có trạng thái, band mới, band cũ, nội dung phản hồi. | TBD | test | S2:241-248 | ✅ |
| FR-dispute-admin-017 | Số liệu vận hành | Admin xem 6 số liệu: tổng số ca, số ca chưa xử lý, số ca đã xử lý, tỷ lệ xử lý đúng hạn (%), số ca tạo trong 7 ngày gần nhất, số ca chưa xử lý đang sắp quá hạn. Công thức ở BR-017 đến BR-021. | TBD | test | S1:290-335, S2:265-273 | ✅ |
| FR-dispute-admin-018 | Cảnh báo sắp quá hạn bằng tác vụ định kỳ | Mỗi giờ hệ thống tìm các ca còn mở/đang xem xét, chưa từng cảnh báo, chưa có thời điểm xử lý, và có hạn xử lý không muộn hơn thời điểm hiện tại cộng 12 giờ, rồi ghi thời điểm cảnh báo cho các ca đó đúng một lần. | TBD | test | S3:16-65, S4:30-94 | ✅ |
| FR-dispute-admin-019 | Cảnh báo không lặp | Chạy lại tác vụ cảnh báo không đánh dấu lại ca đã có thời điểm cảnh báo; kết quả lần chạy lại là 0 ca. | TBD | test | S3:46-59, S4:90-93 | ✅ |
| FR-dispute-admin-020 | Biên 12 giờ của cảnh báo | Ca có hạn đúng bằng thời điểm hiện tại cộng 12 giờ được cảnh báo; ca muộn hơn dù chỉ 1 giây thì không. | TBD | test | S3:33, S4:96-136 | ✅ |
| FR-dispute-admin-021 | Lỗi tác vụ cảnh báo không làm dừng tác vụ khác | Nếu bước kiểm tra cảnh báo lỗi, hệ thống ghi log lỗi và vẫn chạy tiếp các tác vụ định kỳ khác trong cùng lần kích hoạt. | TBD | test | S5:16-23, S6:46-50 | ✅ |
| FR-dispute-admin-022 | Lịch chạy tác vụ định kỳ | Kiểm tra cảnh báo chạy ở lịch mỗi giờ (phút 0); lịch 5 phút chỉ chạy quét chấm điểm, không chạy kiểm tra cảnh báo; kích hoạt thủ công/không nhận diện được thì chạy tất cả. | TBD | test | S5:7-14, S5:42-55, S6:28-45 | ✅ |
| FR-dispute-admin-023 | Màn hình hàng đợi | Màn hình có tiêu đề, thẻ số liệu, 3 nút lọc (Chờ xử lý, Tất cả, Đã xử lý; mặc định "Chờ xử lý"), nút Làm mới, danh sách ca, và thông báo "Không có báo lỗi nào trong hàng đợi." khi rỗng. | TBD | demo | S11:248-428 | ✅ |
| FR-dispute-admin-024 | Hiển thị từng ca trong hàng đợi | Mỗi ca hiện tên học viên (hoặc email, hoặc "Học viên"), tiêu chí, band kỳ vọng, band cũ nếu có, huy hiệu sắp quá hạn, huy hiệu đã giải quyết kèm band hoặc đã từ chối, lý do (hoặc "(Không có lý do chi tiết)"), hạn xử lý định dạng ngày giờ vi-VN (theo múi giờ của trình duyệt, không cố định giờ Việt Nam), trạng thái quyền nghe audio; viền cảnh báo khi sắp quá hạn. | TBD | test | S11:351-408, S13:135-154 | ✅ |
| FR-dispute-admin-025 | Mở chi tiết ca bằng hộp thoại | Nút trên mỗi ca ghi "Xử lý khiếu nại" (ca chưa xử lý) hoặc "Xem chi tiết" (ca đã xử lý); mở hộp thoại hiện thông tin học viên, tiêu chí, lý do, phần bản ghi âm, và biểu mẫu quyết định (ca chưa xử lý) hoặc kết quả đã xử lý (ca đã xử lý, chỉ đọc). | TBD | demo | S11:154-178, S11:418-422, S11:431-648 | ✅ |
| FR-dispute-admin-026 | Phần bản ghi âm trong hộp thoại | Nếu học viên đồng ý: hiện nhãn "Được phép nghe" và trình phát cho từng câu trả lời. Nếu không: hiện nhãn "Không được phép nghe" và thông báo khóa audio, không hiện trình phát. | TBD | test | S11:468-524, S13:156-181 | ✅ |
| FR-dispute-admin-027 | Biểu mẫu quyết định | Biểu mẫu có lựa chọn "Nâng band điểm (Chấp nhận)" / "Giữ nguyên điểm (Từ chối)", ô "Band cũ", ô chọn "Band mới cập nhật" (chỉ hiện khi chấp nhận, 7 mức), ô phản hồi; nút "Xác nhận & Hoàn tất" bị khóa khi phản hồi rỗng hoặc đang gửi. | TBD | demo | S11:529-631 | ✅ |
| FR-dispute-admin-028 | Giá trị mặc định khi mở ca | Khi mở ca: quyết định mặc định là chấp nhận, band mới mặc định bằng band kỳ vọng của ca, band cũ lấy từ ca (hoặc rỗng), phản hồi mặc định là mẫu "Chấp nhận nâng band". | TBD | test | S11:154-165, S13:183-197 | ✅ |
| FR-dispute-admin-029 | Mẫu trả lời nhanh | Có 3 mẫu (Chấp nhận nâng band, Giữ nguyên điểm số, Rà soát không có audio theo transcript). Chọn mẫu điền sẵn nội dung phản hồi; mẫu 1 đặt quyết định = chấp nhận, mẫu 2 đặt quyết định = từ chối, mẫu 3 không đổi quyết định. Nội dung mẫu dùng tiêu chí của ca và band đang chọn tại thời điểm bấm. | TBD | test | S11:83-102, S11:180-191, S13:183-197 | ✅ |
| FR-dispute-admin-030 | Gửi quyết định từ giao diện | Bấm xác nhận gửi quyết định (chấp nhận gửi kèm band mới; từ chối không gửi band), đóng hộp thoại và tải lại số liệu + hàng đợi. | TBD | demo | S11:194-222 | ✅ |
| FR-dispute-admin-031 | Số liệu hiển thị trên giao diện | 4 thẻ: Tỷ lệ đúng hạn (mặc định 100% nếu chưa có số liệu), Báo lỗi tuần này (mặc định 0), Đang chờ xử lý, Sắp quá hạn (mặc định 0), mỗi thẻ có chú thích cố định. | TBD | test | S11:256-301, S13:135-147 | ✅ |
| FR-dispute-admin-032 | Làm mới dữ liệu | Nút "Làm mới" và việc đổi bộ lọc tải lại số liệu cùng hàng đợi; trong lúc tải nút làm mới bị khóa. | TBD | demo | S11:127-152, S11:338-341 | ✅ |
| FR-dispute-admin-033 | Màn hình từ chối truy cập | Nếu việc tải số liệu/hàng đợi lỗi (bất kể nguyên nhân), thay toàn bộ màn hình bằng thông báo "Truy cập bị từ chối". | TBD | test | S11:141-143, S11:234-246, S13:199-204 | ✅ |
| FR-dispute-admin-034 | Phát audio trong giao diện | Trình phát dùng đường dẫn audio từ API; nếu là đường dẫn tương đối thì ghép với địa chỉ máy chủ cấu hình và gửi kèm thông tin đăng nhập của trình duyệt. | TBD | demo | S11:496-508 | ✅ |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-dispute-admin-001 | security / privacy | Audio của học viên chỉ lộ cho admin khi có đồng ý chia sẻ, được kiểm tra ở hai lớp độc lập (danh sách chi tiết ca và cổng tải tệp); không đồng ý hoặc chưa từng có ca thì từ chối. | TBD | Test phân quyền audio đã có (xem Mục 5); ngưỡng "đạt" chính thức: TBD | S1:210-224, S8:23-37, S7:322-344, S9:57-110 | ✅ |
| NFR-dispute-admin-002 | security | Quyền admin xác định theo email (không phân biệt hoa/thường, bỏ khoảng trắng); danh sách rỗng thì không ai là admin. | TBD | test S9:5-25 | S8:1-13, S9:4-25 | ✅ |
| NFR-dispute-admin-003 | reliability / data integrity | Cập nhật xử lý ca và cập nhật cảnh báo đều có điều kiện để tránh ghi đè/ghi lặp khi chạy đồng thời. | TBD | Chưa có test cho nhánh xung đột; cảnh báo lặp có test S4:90-93 | S1:269-282, S3:46-59 | ✅ |
| NFR-dispute-admin-004 | reliability | Lỗi của tác vụ cảnh báo được bắt và ghi log, không làm lỗi cả lần kích hoạt lịch. | TBD | test S6:46-50 | S5:16-23 | ✅ |
| NFR-dispute-admin-005 | performance / scalability | Hàng đợi và số liệu đọc toàn bộ ca trong bảng, không phân trang, không giới hạn số dòng; số liệu tính trong bộ nhớ. | TBD | Không có chỉ tiêu hiệu năng | S1:107-130, S1:291-321 | ✅ |
| NFR-dispute-admin-006 | audit / traceability | Không có trường lưu admin nào đã xử lý ca, không có log hành động của admin. Thời điểm xử lý và nội dung phản hồi được lưu. | TBD | Có/không cần audit: TBD | S14:7-38, S1:259-267 | 🟡 |
| NFR-dispute-admin-007 | localization | Giao diện tiếng Việt; thời gian hiển thị theo định dạng vi-VN. | TBD | demo | S11:224-232, S11:250-254 | ✅ |
| NFR-dispute-admin-008 | privacy / data lifecycle | Ca báo lỗi nằm trong tập dữ liệu được xuất và xóa theo người dùng; xóa bài thi hoặc người dùng xóa kéo theo xóa ca. | TBD | Không có test trong phạm vi đã đọc | S20:227-234, S14:13-18 | ✅ |
| NFR-dispute-admin-009 | accessibility | Code không nêu yêu cầu truy cập (a11y) cho màn hình admin. | TBD | TBD | S11:1-651 | 🟡 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-dispute-admin-001 | Admin là người dùng có email (so khớp không phân biệt hoa/thường, bỏ khoảng trắng hai đầu) nằm trong danh sách quản trị cấu hình, ngăn bởi dấu phẩy, bỏ phần tử rỗng. Email rỗng hoặc danh sách rỗng thì không phải admin. | Mọi thao tác admin; tải audio của bài người khác | FR-dispute-admin-001, FR-dispute-admin-009 | S8:1-13, S9:5-25 | ✅ |
| BR-dispute-admin-002 | Bộ lọc "open" gồm trạng thái mở và đang xem xét; "resolved" gồm đã chấp nhận và đã từ chối; "all" không lọc. | Truy vấn hàng đợi | FR-dispute-admin-004 | S1:20-24, S1:100-105 | ✅ |
| BR-dispute-admin-003 | Ca được coi là "đã xử lý" trong hàng đợi nếu có thời điểm xử lý hoặc trạng thái là đã chấp nhận/đã từ chối. | Tính cờ hạn của hàng đợi | FR-dispute-admin-006 | S1:133 | ✅ |
| BR-dispute-admin-004 | Cờ "sắp quá hạn" (hàng đợi) = ca chưa xử lý VÀ (đã có thời điểm cảnh báo HOẶC hạn xử lý cách hiện tại ít hơn 12 giờ, tính cả ca đã quá hạn). Đúng 12 giờ thì chưa tính (so sánh nhỏ hơn thuần), trừ khi đã có thời điểm cảnh báo. | Truy vấn hàng đợi | FR-dispute-admin-006 | S1:134-136 | ✅ |
| BR-dispute-admin-005 | Cờ "quá hạn" = ca chưa xử lý VÀ hạn xử lý nhỏ hơn thời điểm hiện tại. | Truy vấn hàng đợi | FR-dispute-admin-006 | S1:137 | ✅ |
| BR-dispute-admin-006 | Đường dẫn audio của một câu trả lời chỉ được cấp khi ca có đồng ý chia sẻ; đường dẫn có dạng gắn mã bài thi và mã câu trả lời. | Xem chi tiết ca | FR-dispute-admin-008 | S1:210-224, S2:204-220 | ✅ |
| BR-dispute-admin-007 | Quyền tải audio: (1) chủ bài thi luôn được; (2) admin chỉ được khi đồng ý chia sẻ của ca đúng bằng "có"; (3) còn lại bị từ chối, gồm admin khi không có ca hoặc đồng ý là "không". Đồng ý chia sẻ được đọc từ ca tạo gần nhất của bài thi và chỉ đọc khi người tải không phải chủ bài. Danh sách chi tiết ca dùng đồng ý của chính ca đang mở, còn cổng tải dùng ca tạo gần nhất của bài thi nên hai lớp có thể lệch nhau khi một bài có nhiều ca (OQ-21). | Tải tệp audio | FR-dispute-admin-009 | S8:23-37, S7:322-340, S9:35-110 | ✅ |
| BR-dispute-admin-008 | Quyền tải audio KHÔNG phụ thuộc trạng thái ca: ca đã xử lý vẫn cho admin nghe nếu có đồng ý. | Tải tệp audio | FR-dispute-admin-009 | S7:322-340, S8:23-37 | ✅ |
| BR-dispute-admin-009 | Khóa lưu audio phải thuộc đúng người dùng và bài thi; sai tiền tố thì bị từ chối ("Forbidden"). Nếu không tìm thấy đối tượng trong kho thì báo không có audio. | Tải tệp audio | FR-dispute-admin-009 | S7:361-363, S19:94-110, S19:150-156 | ✅ |
| BR-dispute-admin-010 | Chỉ ca mở hoặc đang xem xét mới được xử lý; ca đã chấp nhận/đã từ chối bị từ chối với thông báo "đã được xử lý trước đó". | Gửi quyết định | FR-dispute-admin-014 | S1:244-249, S2:250-263 | ✅ |
| BR-dispute-admin-011 | Quyết định chỉ nhận 2 giá trị: chấp nhận hoặc từ chối. Chấp nhận BẮT BUỘC có band mới; band mới thuộc tập {5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0}. Thứ tự kiểm tra: ca tồn tại, ca chưa xử lý, rồi mới đến band bắt buộc. | Gửi quyết định | FR-dispute-admin-010 | S1:8-11, S1:231-256 | ✅ |
| BR-dispute-admin-012 | Từ chối: band mới luôn lưu là trống, kể cả khi client gửi band. | Gửi quyết định | FR-dispute-admin-011 | S1:263 | ✅ |
| BR-dispute-admin-013 | Không có kiểm tra band mới phải khác band cũ, khác band kỳ vọng, hay cao hơn band cũ; không kiểm tra định dạng band cũ. | Gửi quyết định | FR-dispute-admin-010, FR-dispute-admin-013 | S1:8-14, S1:251-267 | ✅ |
| BR-dispute-admin-014 | Khi xử lý ghi: trạng thái, band mới, band cũ (input, rồi giá trị sẵn có, rồi trống), phản hồi, thời điểm xử lý, thời điểm cập nhật (cùng một mốc). | Gửi quyết định | FR-dispute-admin-013 | S1:258-268 | ✅ |
| BR-dispute-admin-015 | Việc ghi chỉ thành công nếu ca còn ở trạng thái mở/đang xem xét; nếu 0 dòng bị ảnh hưởng thì báo xung đột "đã được xử lý bởi người khác". | Gửi quyết định | FR-dispute-admin-015 | S1:269-282 | ✅ |
| BR-dispute-admin-016 | Code của feature KHÔNG ghi band mới vào điểm chính thức của bài thi, KHÔNG gửi thông báo cho học viên; chỉ lưu vào ca. | Gửi quyết định | FR-dispute-admin-016 | S1:259-267, `reverse-gaps.md` negative-search N1-N2 | ✅ |
| BR-dispute-admin-017 | Số ca đã xử lý đúng hạn = số ca ở trạng thái đã chấp nhận/đã từ chối có thời điểm xử lý không muộn hơn hạn xử lý (bằng nhau vẫn đúng hạn). Ca đã xử lý mà thiếu thời điểm xử lý được tính là đúng hạn. | Tính số liệu | FR-dispute-admin-017 | S1:303-310 | ✅ |
| BR-dispute-admin-018 | Tỷ lệ đúng hạn (%) = đúng hạn / đã xử lý x 100, làm tròn 1 chữ số thập phân; nếu chưa có ca đã xử lý thì là 100. | Tính số liệu | FR-dispute-admin-017 | S1:323-326 | ✅ |
| BR-dispute-admin-019 | Ca chưa xử lý (trạng thái ngoài chấp nhận/từ chối) được đếm là "chưa xử lý"; trong đó ca đã có thời điểm cảnh báo hoặc hạn cách hiện tại ít hơn 12 giờ (kể cả quá hạn) được đếm thêm vào "sắp quá hạn". | Tính số liệu | FR-dispute-admin-017 | S1:311-316 | ✅ |
| BR-dispute-admin-020 | "Ca tuần này" = số ca (mọi trạng thái) có thời điểm tạo từ 7 ngày trước đến nay (bao gồm đúng mốc 7 ngày). | Tính số liệu | FR-dispute-admin-017 | S1:293, S1:318-320 | ✅ |
| BR-dispute-admin-021 | Số liệu "chưa xử lý" ở số liệu API tính theo trạng thái (không dựa thời điểm xử lý), còn "đã xử lý" ở hàng đợi dựa thêm vào thời điểm xử lý; hai định nghĩa không hoàn toàn trùng khi dữ liệu có trạng thái chưa xử lý nhưng đã có thời điểm xử lý. | Tính số liệu / hàng đợi | FR-dispute-admin-006, FR-dispute-admin-017 | S1:133, S1:303 | 🔵 |
| BR-dispute-admin-022 | Điều kiện được tác vụ định kỳ cảnh báo: trạng thái mở hoặc đang xem xét, chưa có thời điểm cảnh báo, chưa có thời điểm xử lý, hạn xử lý không muộn hơn (nhỏ hơn hoặc bằng) hiện tại cộng 12 giờ — gồm cả ca đã quá hạn. | Chạy tác vụ định kỳ | FR-dispute-admin-018, FR-dispute-admin-020 | S3:5, S3:20-35, S4:96-136 | ✅ |
| BR-dispute-admin-023 | Ghi thời điểm cảnh báo là cập nhật có điều kiện (chỉ khi vẫn chưa có thời điểm cảnh báo), đồng thời cập nhật thời điểm sửa đổi; kết quả trả số ca và mã ca vừa được đánh dấu. | Chạy tác vụ định kỳ | FR-dispute-admin-019 | S3:46-64, S4:86-93 | ✅ |
| BR-dispute-admin-024 | Tác vụ cảnh báo chỉ ghi thời điểm cảnh báo; code không gửi email/thông báo nào cho ai. Cờ thời điểm cảnh báo được hàng đợi dùng để hiện huy hiệu "Sắp quá hạn". | Chạy tác vụ định kỳ | FR-dispute-admin-018 | S3:16-65, S1:134-136 | ✅ |
| BR-dispute-admin-025 | Tác vụ kiểm tra cảnh báo chạy ở lịch mỗi giờ và ở mọi lịch không phải lịch 5 phút; lịch 5 phút chỉ chạy quét chấm điểm; lịch lạ chạy cả hai. | Kích hoạt lịch | FR-dispute-admin-022 | S5:42-55, S6:28-45 | ✅ |
| BR-dispute-admin-026 | Danh sách lịch trong mã xử lý phải khớp danh sách lịch trong khai báo hạ tầng. | Triển khai | FR-dispute-admin-022 | S5:7-14, S16:61-62, S6:52-56 | ✅ |
| BR-dispute-admin-027 | Chức năng admin (hàng đợi, xử lý, số liệu) và tác vụ cảnh báo KHÔNG bị chặn bởi cờ bật tính năng báo lỗi (mặc định tắt); cờ chỉ chặn học viên gửi mới. | Mọi thao tác admin | FR-dispute-admin-001 | S1:89-336 (không có tham chiếu cờ), S17:27-33, S16:56 | ✅ |
| BR-dispute-admin-028 | Giao diện mặc định mở bộ lọc "Chờ xử lý"; số "Chờ xử lý" trên nút lấy từ số liệu API, nếu chưa có thì đếm ca mở/đang xem xét trong danh sách đang hiển thị; riêng thẻ "Đang chờ xử lý" khi chưa có số liệu chỉ đếm ca mở, không gồm đang xem xét. | Mở màn hình | FR-dispute-admin-023 | S11:111, S11:286, S11:318 | ✅ |
| BR-dispute-admin-029 | Giao diện gửi band cũ = giá trị ô nhập sau khi bỏ khoảng trắng, nếu rỗng thì dùng band cũ sẵn có của ca, nếu vẫn rỗng thì không gửi. | Gửi quyết định | FR-dispute-admin-030 | S11:208 | ✅ |
| BR-dispute-admin-030 | Đổi band mới trong ô chọn KHÔNG tự cập nhật nội dung phản hồi; chỉ khi bấm lại mẫu thì nội dung mới dùng band hiện chọn. Hệ quả: phản hồi có thể nêu band khác band đã chọn. | Soạn phản hồi | FR-dispute-admin-029 | S11:180-191, S11:571-583 | ✅ |
| BR-dispute-admin-031 | Nếu tải số liệu hoặc hàng đợi thất bại vì bất kỳ lý do nào (quyền, mạng, lỗi máy chủ), giao diện coi như bị từ chối truy cập. | Tải dữ liệu | FR-dispute-admin-033 | S11:127-146 | ✅ |
| BR-dispute-admin-032 | Lỗi khi mở chi tiết ca hoặc khi gửi quyết định được hiện trong khung lỗi ở thân trang (ngoài hộp thoại), dùng thông điệp của lỗi nếu lỗi là đối tượng Error, ngược lại dùng câu mặc định (E-016, E-017). | Mở ca / gửi quyết định | FR-dispute-admin-025, FR-dispute-admin-030 | S11:172-176, S11:216-220, S11:303-307 | ✅ |

## 6. Error Matrix

Mã lỗi tRPC ghi kèm câu thật. Không resolve được → `⚠️ chưa resolve`.

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-dispute-admin-001 | Chưa đăng nhập | Gọi thao tác admin khi không có phiên. Mã `UNAUTHORIZED`: "Authentication required" | major | FR-dispute-admin-001 | Route chuyển tới trang đăng nhập; API trả lỗi | Đăng nhập | S10:15-22, S2:103-109, S12:9-14 | ✅ |
| E-dispute-admin-002 | Không đủ quyền admin | Email không nằm trong danh sách. Mã `FORBIDDEN`: "Admin access required" | major | FR-dispute-admin-001, FR-dispute-admin-002 | Route chuyển về `/app/dashboard`; màn đã mở thì hiện "Truy cập bị từ chối" | Dùng tài khoản admin / thêm email vào danh sách cấu hình | S10:31-38, S2:95-101, S12:16-24 | ✅ |
| E-dispute-admin-003 | Không tìm thấy hồ sơ khi xem | Mã ca không tồn tại ở bước xem chi tiết. Mã `NOT_FOUND`: "Không tìm thấy hồ sơ khiếu nại" | minor | FR-dispute-admin-007 | Khung lỗi ở thân trang với thông điệp trên | Làm mới hàng đợi | S1:176-181, S11:172-176 | ✅ |
| E-dispute-admin-004 | Không tìm thấy hồ sơ khi xử lý | Mã ca không tồn tại ở bước gửi quyết định. Mã `NOT_FOUND`: "Không tìm thấy hồ sơ khiếu nại" | minor | FR-dispute-admin-014 | Khung lỗi ở thân trang | Làm mới hàng đợi | S1:237-242 | ✅ |
| E-dispute-admin-005 | Ca đã xử lý trước đó | Ca đã chấp nhận/từ chối bị gửi quyết định lần nữa. Mã `BAD_REQUEST`: "Báo lỗi này đã được xử lý trước đó" | minor | FR-dispute-admin-014 | Khung lỗi ở thân trang; hộp thoại giữ nguyên | Đóng hộp thoại, làm mới | S1:244-249, S2:250-263 | ✅ |
| E-dispute-admin-006 | Thiếu band mới khi chấp nhận | Quyết định chấp nhận nhưng không có band mới. Mã `BAD_REQUEST`: "Vui lòng chọn band điểm cập nhật khi chấp nhận khiếu nại" | minor | FR-dispute-admin-010 | Khung lỗi ở thân trang (giao diện luôn gửi band khi chấp nhận nên khó xảy ra từ UI) | Chọn band rồi gửi lại | S1:251-256, S11:204-207 | ✅ |
| E-dispute-admin-007 | Xung đột khi hai admin xử lý | Ca bị người khác xử lý giữa lúc đọc và ghi. Mã `CONFLICT`: "Báo lỗi này đã được xử lý bởi người khác" | major | FR-dispute-admin-015 | Khung lỗi ở thân trang | Làm mới hàng đợi và xem kết quả đã có | S1:277-282 | ✅ |
| E-dispute-admin-008 | Phản hồi rỗng | Phản hồi rỗng sau khi bỏ khoảng trắng. Thông điệp kiểm tra dữ liệu: "Nội dung trả lời không được để trống" (mã `BAD_REQUEST` do tầng kiểm tra đầu vào của tRPC: ⚠️ chưa resolve chuỗi mã ở code). Giao diện chặn trước bằng nút bị khóa. | minor | FR-dispute-admin-012 | Nút "Xác nhận & Hoàn tất" bị khóa khi rỗng | Nhập nội dung phản hồi | S1:13, S11:625 | 🔵 |
| E-dispute-admin-009 | Đầu vào sai định dạng khác | Mã ca rỗng; quyết định ngoài 2 giá trị; band mới ngoài tập 7 mức; bộ lọc ngoài 3 giá trị. Thông điệp: ⚠️ chưa resolve (do thư viện kiểm tra dữ liệu sinh ra, code không đặt chuỗi) | minor | FR-dispute-admin-004, FR-dispute-admin-010 | Khung lỗi ở thân trang | Sửa đầu vào | S1:8-24 | 🟡 |
| E-dispute-admin-010 | Tải audio khi chưa đăng nhập | Cổng tải audio không có phiên. HTTP 401, nội dung "Unauthorized" | major | FR-dispute-admin-009 | Trình phát không phát được | Đăng nhập | S7:302-306 | ✅ |
| E-dispute-admin-011 | Tải audio bị cấm | HTTP 403, nội dung "Forbidden" khi: bài thi không tồn tại (cùng mã 403, không phải 404); người tải không được phép (không phải chủ và không phải admin có đồng ý); khóa audio sai tiền tố | major | FR-dispute-admin-009 | Trình phát không phát được | Chỉ được nghe khi học viên đã đồng ý | S7:318-320, S7:342-344, S7:361-363, S19:94-110, S19:150-152 | ✅ |
| E-dispute-admin-012 | Không có câu trả lời | HTTP 404, nội dung "Not found" khi không có câu trả lời khớp mã (hoặc khóa câu hỏi) trong bài | minor | FR-dispute-admin-009 | Trình phát lỗi | — | S7:346-359 | ✅ |
| E-dispute-admin-013 | Không có tệp audio trong kho | HTTP 404, nội dung "Audio not found" khi kho không có đối tượng | minor | FR-dispute-admin-009 | Trình phát lỗi | — | S19:154-156, S7:386-388 | ✅ |
| E-dispute-admin-014 | Kho audio không khả dụng | HTTP 503, nội dung "Storage unavailable" khi chưa cấu hình kho | critical | FR-dispute-admin-009 | Trình phát lỗi | Cấu hình kho audio | S7:365-368 | ✅ |
| E-dispute-admin-015 | Màn hình từ chối truy cập (giao diện) | Tải số liệu/hàng đợi lỗi bất kỳ nguyên nhân. Tiêu đề "Truy cập bị từ chối"; nội dung "Chỉ người sở hữu sản phẩm (admin) mới có quyền truy cập vào hàng đợi xử lý báo lỗi." | major | FR-dispute-admin-033 | Toàn màn hình bị thay | Bấm làm mới không có (màn thay hẳn); tải lại trang | S11:141-143, S11:234-246, S13:199-204 | ✅ |
| E-dispute-admin-016 | Lỗi mặc định khi mở chi tiết ca | Lỗi ném ra không phải đối tượng Error (câu mặc định). Hiện "Không thể tải chi tiết hồ sơ" | minor | FR-dispute-admin-025 | Khung lỗi thân trang | Thử lại | S11:173 | ✅ |
| E-dispute-admin-017 | Lỗi mặc định khi gửi quyết định | Lỗi ném ra không phải đối tượng Error (câu mặc định). Hiện "Lỗi khi xử lý báo lỗi" | minor | FR-dispute-admin-030 | Khung lỗi thân trang | Thử lại | S11:217 | ✅ |
| E-dispute-admin-018 | Lỗi tác vụ cảnh báo | Bước kiểm tra cảnh báo ném lỗi (ví dụ cơ sở dữ liệu không phản hồi). Ghi log "[scheduled] Error processing scheduled event:" kèm lỗi; không lan ra | major | FR-dispute-admin-021 | Không có UI; chỉ log | Chờ lần chạy giờ kế tiếp | S5:21, S6:46-50 | ✅ |
| E-dispute-admin-019 | Không có ca trong hàng đợi | Danh sách rỗng. Hiện "Không có báo lỗi nào trong hàng đợi." (trạng thái rỗng, không phải lỗi) | minor | FR-dispute-admin-023 | Khung viền đứt | — | S11:346-349 | ✅ |
| E-dispute-admin-020 | Số lượng ca lớn làm cảnh báo lỗi | Câu cập nhật dùng danh sách mã ca; code không chặn kích thước danh sách; giới hạn tham số của cơ sở dữ liệu có thể làm lỗi khi quá nhiều ca | major | FR-dispute-admin-018 | Chỉ log | — | S3:44-59 | 🟡 |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-dispute-admin-01 | Giải quyết báo lỗi trong 72 giờ kể từ khi tạo | Tỷ lệ xử lý đúng hạn (số liệu API) | Giao diện ghi "Cam kết dưới 72 giờ"; không có mốc phần trăm tối thiểu trong code | S11:253, S11:266, S1:323-326 | 🟡 |
| SC-dispute-admin-02 | Đủ nhân lực xử lý | Số ca trong tuần | Giao diện ghi chú cố định "> 5 cần tìm thêm người"; ngưỡng không được code dùng để cảnh báo hay chặn | S11:274-277, S1:293-320 | 🟡 |
| SC-dispute-admin-03 | Không có ca nào bị bỏ sót trước hạn | Số ca "sắp quá hạn" trên thẻ | Giao diện ghi "Ưu tiên xử lý ngay"; mốc đạt (ví dụ 0) không có | S11:291-300, S1:311-316 | 🟡 |
| SC-dispute-admin-04 | Học viên biết kết quả báo lỗi | Trạng thái ca và huy hiệu trên màn kết quả | Huy hiệu hiển thị khi ca đã chấp nhận/từ chối; không có thông báo chủ động | S18:329-338, S2:241-248 | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/dispute-admin-reverse-erd.md`)

- **Ca khiếu nại (score_dispute)**: tiêu chí khiếu nại (ALL, FC, LR, GRA, PRON), band kỳ vọng, lý do, đồng ý chia sẻ audio (mặc định không), trạng thái (open, reviewing, resolved, rejected; mặc định open), hạn xử lý, band cũ, band mới, nội dung phản hồi, thời điểm xử lý, thời điểm cảnh báo, thời điểm tạo/sửa. Tối đa một ca đang mở/đang xem xét cho mỗi bài thi (chỉ mục duy nhất một phần). ✅ [S14:7-48][S15]
- **Bài thi (attempt)** và **câu trả lời (attempt_answer)**: nguồn dữ liệu bài làm và audio để admin đối chiếu; câu trả lời có cột transcript nhưng không được đưa vào chi tiết ca. ✅ [S22:32-57][S1:195-209]
- **Người dùng (user)**: tên, email học viên hiển thị trong hàng đợi. ✅ [S1:112-113]

## 9. Flows (tóm tắt — chi tiết ở `srs/dispute-admin-reverse-flows.md`)

1. **Vào màn quản trị và xem hàng đợi + số liệu** (kiểm tra quyền, tải số liệu, tải hàng đợi theo bộ lọc). ✅
2. **Xem chi tiết ca và nghe audio theo đồng ý** (chi tiết ca, cổng tải audio hai lớp). ✅
3. **Giải quyết / từ chối ca kèm phản hồi** (kiểm tra thứ tự, chống xử lý đồng thời). ✅
4. **Cảnh báo sắp quá hạn bằng tác vụ định kỳ mỗi giờ** (chọn ca, ghi đánh dấu một lần, cô lập lỗi). ✅

## 10. Screens (tóm tắt)

Route thật: `/admin/disputes` [S12:7]. Không nằm trong cờ tính năng giao diện (`FEATURES` chỉ có scoring, billing) [`apps/web/src/lib/feature-flags.ts:1-4`].

| Screen | Thành phần chính | Trạng thái | Nguồn | Nhãn |
|--------|------------------|-----------|-------|------|
| SCR-01 Hàng đợi xử lý báo lỗi chấm | Tiêu đề "Hàng đợi xử lý báo lỗi chấm", mô tả "Cam kết giải quyết trong 72 giờ: xem xét bài thi, đối chiếu tiêu chí và cập nhật band điểm."; 4 thẻ số liệu; nút lọc Chờ xử lý/Tất cả/Đã xử lý; nút Làm mới; danh sách ca | đang tải (nút làm mới khóa), rỗng ("Không có báo lỗi nào trong hàng đợi."), có lỗi (khung lỗi), có dữ liệu | S11:248-428 | ✅ |
| SCR-02 Hộp thoại xử lý báo lỗi chấm thi | Mã hồ sơ + mã bài; khối học viên/tiêu chí/lý do; khối bản ghi âm (nhãn quyền nghe, trình phát hoặc thông báo khóa); biểu mẫu quyết định (ca chưa xử lý) hoặc khối kết quả (ca đã xử lý) | có quyền nghe, không có quyền nghe, ca chưa xử lý, ca đã xử lý, đang gửi ("Đang gửi...") | S11:431-648 | ✅ |
| SCR-03 Truy cập bị từ chối | Biểu tượng khóa, tiêu đề, nội dung giải thích | hiện thay toàn màn hình khi tải dữ liệu lỗi | S11:234-246 | ✅ |

**Chi tiết SCR-02 (wording thật):** nhãn "Được phép nghe" / "Không được phép nghe"; thông báo khóa "⚠️ Không xem được audio" + "Học viên không đồng ý chia sẻ bản ghi âm cho lần báo lỗi này. Theo chính sách quyền riêng tư, âm thanh bị khóa và bạn chỉ xem xét dựa trên dữ liệu văn bản." [S11:517-521]; khối kết quả: "Kết quả đã xử lý", "Trạng thái: {status} · Band cập nhật: {band hoặc 'Không đổi'}", "Phản hồi đã gửi: \"{nội dung}\"" [S11:633-644]. Trạng thái hiển thị thô (open/resolved/rejected, không dịch). ✅

**Ba mẫu trả lời (wording thật, S11:83-102):** (1) "Chấp nhận nâng band", (2) "Giữ nguyên điểm số", (3) "Rà soát không có audio (theo transcript)". Mẫu 3 không dùng biến tiêu chí dù hàm nhận tham số. ✅

## 11. Constraints, Dependencies & Assumptions

> Cột Owner/Source là suy luận về người sở hữu nên các dòng ở 🟡; giá trị ràng buộc và phụ thuộc tự nó có căn cứ code, xem FR/BR/NFR tương ứng.

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Source / Owner | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Danh sách admin đến từ biến môi trường `ADMIN_EMAILS` (mặc định rỗng = không ai là admin); đổi danh sách cần cấu hình lại/triển khai lại | Hạ tầng / product owner | S16:52, S8:1-13 | 🟡 |
| Cờ `SCORE_DISPUTE_ENABLED` mặc định "false", chỉ giá trị chuỗi "true" mới bật; cờ này KHÔNG chặn chức năng admin | Hạ tầng / product owner | S16:56, S17:27, S17:136 | 🟡 |
| Hạn xử lý của ca = thời điểm tạo + 72 giờ, do phía học viên đặt; phía admin chỉ đọc | Feature score-dispute | S17:82 | 🟡 |
| Mỗi bài thi chỉ có một ca đang mở/đang xem xét (chỉ mục duy nhất một phần ở mức cơ sở dữ liệu) | Feature score-dispute / schema | S14:44-46, S15 | 🟡 |
| Band mới giới hạn trong 7 mức 5.0-8.0 bước 0.5 | Code | S1:11 | 🟡 |
| Ngưỡng cảnh báo 12 giờ là hằng số trong code (không cấu hình) | Code | S3:5, S1:136 | 🟡 |
| Lịch cron: `0 * * * *` và `*/5 * * * *` khai báo ở hạ tầng, phải khớp mã | Hạ tầng | S16:61-62, S5:7-14 | 🟡 |
| Hàng đợi/ số liệu không phân trang | Code | S1:107-130, S1:291 | 🟡 |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Ca khiếu nại do học viên tạo (feature score-dispute) | score-dispute | Hàng đợi rỗng | S17:23-131 | 🟡 |
| Cơ sở dữ liệu D1 (bảng ca, bài thi, câu trả lời, người dùng) | Hạ tầng | Mọi chức năng | S14:7-12, S1:5 | 🟡 |
| Kho R2 chứa audio | Hạ tầng | Không nghe được audio (503) | S7:365-368 | 🟡 |
| Dịch vụ đăng nhập (phiên người dùng) | Auth | Không xác định được admin | S10:15-22, S12:9 | 🟡 |
| Tác vụ định kỳ của nền tảng (cron trigger) | Hạ tầng | Không có cảnh báo sắp quá hạn (huy hiệu vẫn tính được theo hạn) | S5:42-55, S1:134-136 | 🟡 |
| Địa chỉ máy chủ cho giao diện (biến công khai) để ghép đường dẫn audio tương đối | Hạ tầng web | Trình phát trỏ sai | S11:503 | 🟡 |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Lưu band mới trong ca là "kết quả" duy nhất của việc chấp nhận (điểm bài thi do bên khác cập nhật hoặc không cập nhật) | BR-016, SC-04, toàn bộ ý nghĩa của "chấp nhận" | S1:259-267 | 🟡 |
| Đồng ý chia sẻ audio mà học viên chọn lúc gửi ca là bất biến suốt vòng đời ca (không có luồng thu hồi trong code đã đọc) | BR-007, NFR-001 | S14:24, S17:94 | 🔵 |
| Chỉ một vài admin tin cậy dùng hệ thống (không cần phân vai, không cần log ai xử lý) | NFR-006, E-007 | S10:31-45, S14:7-38 | 🟡 |
| Việc admin "xem xét dựa trên dữ liệu văn bản" có nguồn dữ liệu ngoài màn hình này (vì chi tiết ca không trả transcript/điểm AI) | FR-dispute-admin-007, FR-dispute-admin-029 | S1:195-209, S11:519-521 | 🟡 |
| Cảnh báo sắp quá hạn chỉ phục vụ huy hiệu trên hàng đợi (không có kênh nhắn) | BR-024 | S3:16-65, S1:134-136 | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây chỉ trích các OQ blocking.

- [ ] OQ-1: Mức ưu tiên (P0/P1/P2) của từng FR/NFR là gì? (code không nói)
- [ ] OQ-2: Khi chấp nhận kèm band mới, điểm chính thức của bài thi có được cập nhật ở đâu không? Code chỉ lưu band mới vào ca.
- [ ] OQ-3: Học viên và admin có được thông báo chủ động (email/push) khi ca xử lý xong / sắp quá hạn không? Code không gửi thông báo nào.
- [ ] OQ-9: Admin phải đối chiếu theo transcript nhưng chi tiết ca không trả transcript/điểm AI — nguồn dữ liệu thực tế để quyết định là gì?
- [ ] OQ-21: Khi một bài thi có nhiều ca (ca cũ đã xử lý, ca mới), danh sách chi tiết dùng đồng ý của ca đang mở còn cổng tải audio dùng đồng ý của ca tạo gần nhất; hai giá trị có thể khác nhau (đường dẫn được cấp nhưng tải bị 403, hoặc ngược lại). Có chủ đích không?
- [ ] OQ-4: Trạng thái "đang xem xét" (reviewing) có luồng đặt nào không? Hiện không có code chuyển sang trạng thái này.
