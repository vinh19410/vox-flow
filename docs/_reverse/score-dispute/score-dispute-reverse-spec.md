---
type: reverse-srs
feature: score-dispute
status: draft
updated: 2026-11-11
confidence_summary: "✅70 🔵2 🟡24"
links:
  - docs/_reverse/score-dispute/reverse-sources.md
  - docs/_reverse/score-dispute/reverse-gaps.md
  - docs/_reverse/score-dispute/_evidence.md
  - docs/_reverse/score-dispute/srs/score-dispute-reverse-flows.md
  - docs/_reverse/score-dispute/srs/score-dispute-reverse-states.md
  - docs/_reverse/score-dispute/srs/score-dispute-reverse-erd.md
  - docs/_reverse/score-dispute/usecases/score-dispute-reverse-usecase-index.md
---

# score-dispute — SRS tái lập (reverse)

> Trạng thái: `draft` (tái lập, chưa duyệt). Nhãn: ✅ chắc chắn · 🔵 suy đoán · 🟡 cần xác nhận.

## 0. Truy vết nguồn & độ tin cậy

- **CHƯA duyệt.** Tài liệu tái lập từ source code + test, chưa qua BA/PO. Mọi "vì sao", "cho ai", mức ưu tiên đều 🟡.
- **Nguồn:** xem [`reverse-sources.md`](./reverse-sources.md).
- **Câu hỏi mở / khác biệt:** xem [`reverse-gaps.md`](./reverse-gaps.md).
- **Cờ bật/tắt (quan trọng):** toàn bộ hành vi GỬI báo lỗi chỉ xảy ra khi biến cấu hình `SCORE_DISPUTE_ENABLED` có giá trị chuỗi đúng bằng `true`; mặc định khai báo là tắt ✅ [S7: packages/infra/alchemy.run.ts:56]. 🟡 Chưa xác nhận được giá trị đang áp dụng ở môi trường thật (chỉ biết tên biến, không có giá trị đã triển khai) — xem OQ-1.
- **Lưu ý đầu vào giao diện:** theo code hiện tại, nút gửi báo lỗi và badge trạng thái có thể KHÔNG hiển thị với bài thi thật lấy từ máy chủ (xem BR-score-dispute-018, OQ-2). 🔵 Negative-search đã được kiểm toán lặp lại độc lập (phạm vi `apps/web/src` ngoài test, thêm toàn `apps/` và `packages/` cho `lastUnpersistedAttempt`): vẫn không thấy nơi nạp; chỉ chạy ứng dụng thật mới nâng được nhãn.
- **Audit độc lập:** đã chạy 2026-11-11, hạ 6 claim, sửa 8 cite.

### 0.3 Khác biệt với tài liệu chính

| Điểm | Reverse nói (từ nguồn) | Doc chính nói | Đề xuất |
|------|------------------------|---------------|---------|
| Đính kèm đoạn âm thanh / bản gỡ băng cụ thể | Form chỉ có tiêu chí, band kỳ vọng, lý do, đồng ý chia sẻ; KHÔNG có chọn đoạn âm thanh/câu cụ thể ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:85-140] | PRD 4.5 F-12: "đính kèm đoạn âm thanh và bản gỡ băng cụ thể" (docs/_product/prd.md:132) | `/gap` — hỏi PO: đính kèm đoạn cụ thể đã bỏ khỏi scope hay chưa làm (OQ-8) 🟡 |
| Cam kết 72 giờ | Hằng số 72 giờ tính từ lúc gửi ✅ [S1: packages/api/src/routers/dispute.ts:82] | D-09: giữ cam kết 72 giờ (docs/product-decisions.md:13) | Khớp con số; ý nghĩa "cam kết" vẫn 🟡 |
| Trạng thái triển khai | Cờ mặc định tắt ✅ [S7] | roadmap-work-items.md:39 ghi "đã hoàn thành", cờ mặc định tắt, "kích hoạt cùng #29" | Chưa xác nhận đã bật ở production (OQ-1) |

## 1. Scope

Feature cho phép học viên đã nộp bài thi **báo lỗi chấm điểm** trên một bài thi của chính mình: chọn tiêu chí cho là chấm sai, band mong đợi, lý do (tùy chọn) và đồng ý hay không việc chia sẻ bản ghi âm + transcript cho giám khảo ✅ [S1: packages/api/src/routers/dispute.ts:8-17] [S4: apps/web/src/features/results/components/report-modal.tsx:85-140]. Hệ thống ghi nhận báo lỗi ở trạng thái "đang mở" kèm hạn phản hồi 72 giờ ✅ [S1: packages/api/src/routers/dispute.ts:82,96-97], và cho học viên xem trạng thái báo lỗi mới nhất của bài thi ✅ [S1: packages/api/src/routers/dispute.ts:158-168]; phần hiển thị trên giao diện 🟡 [S5: apps/web/src/features/results/results-screen.tsx:319-338] (có thể không tới được học viên thật, OQ-2).

Việc gửi báo lỗi bị khóa theo cờ cấu hình (mặc định tắt) ✅ [S1: packages/api/src/routers/dispute.ts:27-33] [S7: packages/infra/alchemy.run.ts:56]. Việc xem trạng thái KHÔNG bị khóa theo cờ, chỉ trả kèm thông tin cờ để giao diện quyết định hiển thị nút ✅ [S1: packages/api/src/routers/dispute.ts:136,165-168].

**Boundary (out of scope — thuộc feature `dispute-admin`, chỉ nêu điểm bàn giao):**
- Hàng đợi, xem chi tiết, chấp nhận/từ chối báo lỗi, nhập band cập nhật và nội dung trả lời ✅ [S15: packages/api/src/routers/dispute-admin.ts:94,148,228].
- Chuyển trạng thái "đã xử lý"/"không chấp nhận" ✅ [S15: packages/api/src/routers/dispute-admin.ts:244-281].
- Quyền nghe bản ghi âm của quản trị dựa trên đồng ý chia sẻ ✅ [S9: packages/api/src/auth-utils.ts:23-37].
- Cảnh báo định kỳ khi còn 12 giờ trước hạn ✅ [S14: packages/api/src/disputes/overdue.ts:5].
- Phân công nhiều giám khảo cộng tác viên (scale-up): chưa làm, quyết định "không mở rộng" 🟡 [S13: docs/decisions/dispute-scale-up.md].

## 2. Actors & Stakeholders

| Actor | Loại | Mục tiêu | Trong scope? | Nguồn | Nhãn |
|-------|------|----------|--------------|-------|------|
| Học viên (chủ bài thi, đã đăng nhập) | người | Được gửi báo lỗi và xem báo lỗi mới nhất của bài thi mình đã nộp (theo quyền trong code) | Có | S1: packages/api/src/routers/dispute.ts:48-53; S16: packages/api/src/index.ts:15-22 | ✅ |
| Người dùng chưa đăng nhập | người | — (bị từ chối) | Có (nhánh từ chối) | S16: packages/api/src/index.ts:15-22 | ✅ |
| Người dùng khác (không phải chủ bài thi) | người | — (bị từ chối gửi/xem) | Có (nhánh từ chối) | S1: packages/api/src/routers/dispute.ts:48-53,151-156; S2: packages/api/src/routers/dispute.test.ts:120,288 | ✅ |
| Quản trị/giám khảo xử lý báo lỗi | người | Theo code: được nghe audio của bài thi người khác khi học viên đã đồng ý chia sẻ; xử lý báo lỗi thuộc `dispute-admin` | Không (feature `dispute-admin`) — chỉ bàn giao | S15: packages/api/src/routers/dispute-admin.ts:1-14; S9: packages/api/src/auth-utils.ts:30-33 | ✅ |
| Người sở hữu sản phẩm trực tiếp xử lý báo lỗi | người | Giữ cam kết 72 giờ | Không (ngoài code) | S13: docs/product-decisions.md:13 | 🟡 |
| Tác vụ định kỳ cảnh báo quá hạn | hệ thống | Theo code: đánh dấu báo lỗi còn dưới 12 giờ đến hạn | Không (dispute-admin) | S14: apps/server/src/scheduled.ts:16-22 | ✅ |
| Kho dữ liệu cá nhân (xuất/xóa theo yêu cầu quyền riêng tư) | hệ thống | Theo code: xuất và xóa báo lỗi theo mã học viên | Có (đăng ký bảng) | S8: packages/api/src/data-registry.ts:227-235 | ✅ |

## 3. Functional Requirements (FR)

> Priority: code không nói mức ưu tiên → tất cả 🟡 (P? chưa chốt). Cột Nhãn là nhãn của hành vi.

| ID | Title | Description | Priority | Verify by | Nguồn | Nhãn |
|----|-------|-------------|----------|-----------|-------|------|
| FR-score-dispute-001 | Khóa gửi báo lỗi theo cờ | Hệ thống từ chối mọi yêu cầu gửi báo lỗi khi cấu hình `SCORE_DISPUTE_ENABLED` không phải chuỗi đúng `true` (kể cả thiếu, rỗng, `false`, `TRUE`). Nhánh này chạy TRƯỚC mọi kiểm tra khác (kể cả sự tồn tại của bài thi). Lỗi: "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt". | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:27-33; S2: packages/api/src/routers/dispute.test.ts:29-64 | ✅ |
| FR-score-dispute-002 | Yêu cầu đăng nhập | Hệ thống chỉ cho người đã đăng nhập gửi hoặc xem báo lỗi; người chưa đăng nhập bị từ chối. | 🟡 P? | kiểm tra | S16: packages/api/src/index.ts:15-22; S1: packages/api/src/routers/dispute.ts:24,133 | ✅ |
| FR-score-dispute-003 | Bài thi phải tồn tại | Hệ thống từ chối nếu không tìm thấy bài thi theo mã được gửi lên. Lỗi: "Không tìm thấy bài thi". | 🟡 P? | kiểm tra | S1: packages/api/src/routers/dispute.ts:35-46 | ✅ |
| FR-score-dispute-004 | Chỉ chủ bài thi được báo lỗi | Hệ thống từ chối nếu bài thi thuộc người dùng khác. Lỗi: "Bạn không có quyền báo lỗi cho bài thi này". | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:48-53; S2: packages/api/src/routers/dispute.test.ts:120-152 | ✅ |
| FR-score-dispute-005 | Chỉ bài thi đã nộp được báo lỗi | Hệ thống từ chối nếu trạng thái bài thi khác `submitted` (ví dụ đang làm dở). Lỗi: "Chỉ bài thi đã nộp mới có thể gửi báo lỗi". Hệ thống KHÔNG kiểm tra bài thi đã có điểm hay chưa. | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:55-60; S2: packages/api/src/routers/dispute.test.ts:154-188 | ✅ |
| FR-score-dispute-006 | Mỗi bài thi tối đa một báo lỗi đang hoạt động | Hệ thống từ chối nếu bài thi đã có báo lỗi ở trạng thái "đang mở" hoặc "đang xem xét". Lỗi: "Bài thi này đã có báo lỗi đang được xử lý". Ràng buộc được bảo vệ thêm ở tầng dữ liệu (chỉ mục duy nhất một báo lỗi hoạt động trên mỗi bài thi) để chặn gửi đồng thời; khi vi phạm, hệ thống trả cùng câu lỗi. | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:62-78,120-128; S3: packages/db/src/schema/dispute.ts:44-46; S10: packages/db/src/migrations/20261105123206_careful_paladin/migration.sql:20; S2: packages/api/src/routers/dispute.test.ts:190-233 | ✅ |
| FR-score-dispute-007 | Chọn tiêu chí bị cho là chấm sai | Học viên chọn một trong: tổng (ALL), trôi chảy-mạch lạc (FC), từ vựng (LR), ngữ pháp (GRA), phát âm (PRON). Giá trị `P` cũng được chấp nhận và quy đổi thành PRON trước khi lưu. Giá trị khác bị từ chối ở bước kiểm tra đầu vào. | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:10-12; S3: packages/db/src/schema/dispute.ts:19-21; S4: apps/web/src/features/results/components/report-modal.tsx:11-17,47; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:122-147 | ✅ |
| FR-score-dispute-008 | Chọn band kỳ vọng (bắt buộc) | Học viên bắt buộc chọn band kỳ vọng thuộc đúng 7 giá trị: 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0. Giá trị khác bị từ chối ở bước kiểm tra đầu vào. | 🟡 P? | kiểm tra | S1: packages/api/src/routers/dispute.ts:13; S4: apps/web/src/features/results/components/report-modal.tsx:109 | ✅ |
| FR-score-dispute-009 | Lý do tùy chọn, tối đa 1000 ký tự | Lý do có thể bỏ trống. Có nhập thì được cắt khoảng trắng đầu/cuối và tối đa 1000 ký tự; lý do rỗng (sau khi cắt) được lưu là "không có". Giao diện giới hạn 1000 ký tự và hiển thị bộ đếm "n/1000". | 🟡 P? | kiểm tra | S1: packages/api/src/routers/dispute.ts:15,93; S4: apps/web/src/features/results/components/report-modal.tsx:116-122 | ✅ |
| FR-score-dispute-010 | Đồng ý chia sẻ ghi âm + transcript (tùy chọn) | Học viên có thể đánh dấu đồng ý chia sẻ bản ghi âm và transcript của bài thi cho giám khảo để rà soát. Mặc định KHÔNG chia sẻ (cả ở giao diện lẫn khi không gửi trường này). Giá trị được lưu cùng báo lỗi. | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:16,94; S4: apps/web/src/features/results/components/report-modal.tsx:30,130-140; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:100-111 | ✅ |
| FR-score-dispute-011 | Band trước đó (tùy chọn, chỉ API) | Hệ thống chấp nhận thêm "band trước đó" dạng chuỗi tự do và lưu nếu có; giao diện hiện tại không gửi trường này. | 🟡 P? | kiểm tra | S1: packages/api/src/routers/dispute.ts:14,95; S4: apps/web/src/features/results/components/report-modal.tsx:48-54 | ✅ |
| FR-score-dispute-012 | Tạo báo lỗi, trạng thái mở, hạn 72 giờ | Khi mọi kiểm tra đạt, hệ thống tạo báo lỗi ở trạng thái "đang mở" (open), gắn với bài thi và học viên, đặt hạn phản hồi = thời điểm gửi + 72 giờ (72 x 60 x 60 x 1000 ms), ghi thời điểm tạo. Trả về: mã báo lỗi, mã bài thi, tiêu chí, band kỳ vọng, lý do, đồng ý chia sẻ, trạng thái, hạn, thời điểm tạo. | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:80-119; S2: packages/api/src/routers/dispute.test.ts:66-118 | ✅ |
| FR-score-dispute-013 | Lỗi lưu không rõ nguyên nhân | Nếu thao tác lưu không trả về bản ghi, hệ thống báo lỗi nội bộ "Không thể lưu báo lỗi". | 🟡 P? | phân tích | S1: packages/api/src/routers/dispute.ts:101-106 | ✅ |
| FR-score-dispute-014 | Xem báo lỗi mới nhất của một bài thi | Học viên (chủ bài thi) xem được báo lỗi mới nhất (theo thời điểm tạo giảm dần, lấy 1 bản ghi) của bài thi, kèm cờ cho biết tính năng đang bật hay tắt. Chưa có báo lỗi → trả "không có". Chức năng này KHÔNG bị chặn khi cờ tắt. | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:133-169; S2: packages/api/src/routers/dispute.test.ts:235-286 | ✅ |
| FR-score-dispute-015 | Kiểm tra quyền khi xem | Khi xem, hệ thống từ chối nếu bài thi không tồn tại ("Không tìm thấy bài thi") hoặc thuộc người khác ("Bạn không có quyền xem thông tin bài thi này"). | 🟡 P? | test | S1: packages/api/src/routers/dispute.ts:144-156; S2: packages/api/src/routers/dispute.test.ts:288-315 | ✅ |
| FR-score-dispute-016 | Nút "Báo lỗi chấm" trên trang kết quả | Trang kết quả hiện nút "Báo lỗi chấm" CHỈ khi: (a) máy chủ trả cờ bật, (b) bài thi KHÔNG phải bản xem mặc định/prototype, (c) có mã bài thi khác "latest", và (d) chưa có báo lỗi nào của bài thi (không ở trạng thái mở/đang xem xét/đã xử lý/không chấp nhận). Bấm nút mở form báo lỗi. | 🟡 P? | test | S5: apps/web/src/features/results/results-screen.tsx:339-343; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:179-193 | 🟡 |
| FR-score-dispute-017 | Badge trạng thái "đang xử lý" + hạn | Khi báo lỗi mới nhất ở trạng thái mở hoặc đang xem xét, trang kết quả hiện badge "Báo lỗi đang xử lý · Cam kết phản hồi trước HH:mm dd/MM/yyyy" (định dạng vi-VN theo hạn phản hồi) và ẩn nút báo lỗi. | 🟡 P? | test | S5: apps/web/src/features/results/results-screen.tsx:319-328; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:195-213 | 🟡 |
| FR-score-dispute-018 | Badge "đã xử lý" / "không được chấp nhận" | Khi báo lỗi mới nhất là đã xử lý hiện badge "Báo lỗi đã xử lý"; khi bị từ chối hiện badge "Báo lỗi không được chấp nhận"; cả hai trường hợp ẩn nút báo lỗi (học viên không gửi lại được qua giao diện). Cả nhóm hiển thị (FR-016, 017, 018, 023) hạ 🟡 vì điều kiện hiện tại phụ thuộc BR-018: với bài thi thật từ máy chủ có thể không bao giờ chạy tới (OQ-2). | 🟡 P? | test | S5: apps/web/src/features/results/results-screen.tsx:329-338; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:215-232 (chỉ phủ "đã xử lý"; badge "không được chấp nhận" không có test) | 🟡 |
| FR-score-dispute-019 | Form báo lỗi: mặc định và nội dung cam kết | Form tiêu đề "Báo lỗi chấm", mô tả "Đội ngũ giám khảo sẽ xem xét lại bài thi của bạn theo cam kết phản hồi trong vòng 72 giờ.", mặc định chọn tiêu chí Ngữ pháp (GRA), band 6.5, lý do trống, ô đồng ý chưa chọn. Các nhãn tiêu chí: "Band tổng", "Độ trôi chảy & mạch lạc", "Vốn từ vựng", "Ngữ pháp", "Phát âm". | 🟡 P? | test | S4: apps/web/src/features/results/components/report-modal.tsx:27-30,74-77,11-17; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:100-111 | ✅ |
| FR-score-dispute-020 | Gửi thành công: thông báo và làm mới | Gửi thành công → hiện thông báo "Đã gửi báo lỗi. Chúng tôi cam kết phản hồi trong vòng 72 giờ.", tải lại trạng thái báo lỗi của bài thi, rồi đóng form. | 🟡 P? | test | S4: apps/web/src/features/results/components/report-modal.tsx:56-58; S5: apps/web/src/features/results/results-screen.tsx:427-432; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:113-155 | ✅ |
| FR-score-dispute-021 | Gửi thất bại: banner lỗi, giữ form | Gửi thất bại → hiện banner đỏ trong form VÀ thông báo nổi với cùng nội dung; nội dung là thông điệp lỗi do máy chủ trả, nếu không có thì "Không thể gửi báo lỗi. Vui lòng thử lại sau."; form không đóng, banner được xóa mỗi lần mở lại form. | 🟡 P? | test | S4: apps/web/src/features/results/components/report-modal.tsx:34-38,59-65,79-83; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:157-169 | ✅ |
| FR-score-dispute-022 | Trạng thái đang gửi | Khi đang gửi, nút gửi và nút Hủy bị vô hiệu, nút gửi hiện "Đang gửi..."; kết thúc (thành công hay lỗi) mở lại. | 🟡 P? | kiểm tra | S4: apps/web/src/features/results/components/report-modal.tsx:143-155,66-68 | ✅ |
| FR-score-dispute-023 | Mất kết nối trạng thái → im lặng | Nếu tải trạng thái báo lỗi thất bại, giao diện chỉ ghi cảnh báo console "Failed to load dispute status:" và không hiện lỗi cho học viên (nút/badge không xuất hiện). | 🟡 P? | kiểm tra | S5: apps/web/src/features/results/results-screen.tsx:75-88 | 🟡 |
| FR-score-dispute-024 | Đồng ý chia sẻ quyết định quyền nghe audio của quản trị | Quản trị chỉ nghe được bản ghi âm của bài thi người khác khi đồng ý chia sẻ của báo lỗi MỚI NHẤT của bài thi là bật; không có báo lỗi hoặc không đồng ý → từ chối. (Điểm bàn giao: logic thuộc `dispute-admin`/kênh phát audio.) | 🟡 P? | test | S9: apps/server/src/index.ts:322-344; packages/api/src/auth-utils.ts:23-37; S9: packages/api/src/auth-utils.test.ts:57-101 | ✅ |
| FR-score-dispute-025 | Báo lỗi thuộc dữ liệu cá nhân xuất/xóa được | Báo lỗi của học viên nằm trong gói xuất dữ liệu cá nhân và bị xóa khi học viên yêu cầu xóa dữ liệu; báo lỗi của học viên khác không bị ảnh hưởng. | 🟡 P? | test | S8: packages/api/src/data-registry.ts:227-235; S8: packages/api/src/data-registry.test.ts:110,274,312,324 | ✅ |
| FR-score-dispute-026 | Học viên gửi báo lỗi mới sau khi báo lỗi trước đã xử lý (ở tầng dữ liệu) | Ở tầng dữ liệu/ nghiệp vụ gửi, báo lỗi cũ đã đóng (đã xử lý/không chấp nhận) KHÔNG chặn gửi báo lỗi mới cho cùng bài thi (chỉ báo lỗi đang hoạt động mới chặn). Tuy nhiên giao diện ẩn nút nên học viên không gửi lại qua UI. Có chủ ý hay không: chưa rõ. | 🟡 P? | phân tích | S1: packages/api/src/routers/dispute.ts:62-78; S3: packages/db/src/schema/dispute.ts:44-46; S5: apps/web/src/features/results/results-screen.tsx:329-343 | 🟡 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance | Nguồn | Nhãn |
|----|----------|-------------|----------|------------|-------|------|
| NFR-score-dispute-001 | SLA/nghiệp vụ | Hạn phản hồi báo lỗi được đặt bằng đúng 72 giờ kể từ thời điểm gửi (tính theo đồng hồ máy chủ). | 🟡 P? | Test: hạn nằm trong khoảng [trước+72h-1s, sau+72h+1s] | S1: packages/api/src/routers/dispute.ts:81-82; S2: packages/api/src/routers/dispute.test.ts:107-114 | ✅ |
| NFR-score-dispute-002 | security | Mọi thao tác gửi/xem yêu cầu phiên đăng nhập và chỉ chủ bài thi mới được thao tác. | 🟡 P? | Test: người khác nhận từ chối | S16: packages/api/src/index.ts:15-22; S1: packages/api/src/routers/dispute.ts:48-53,151-156; S2: packages/api/src/routers/dispute.test.ts:120,288 | ✅ |
| NFR-score-dispute-003 | privacy | Việc chia sẻ ghi âm/transcript cho giám khảo là opt-in, mặc định không chia sẻ; quản trị không nghe được audio nếu học viên không đồng ý. | 🟡 P? | Test: quản trị bị từ chối khi không đồng ý | S4: apps/web/src/features/results/components/report-modal.tsx:30,138; S9: packages/api/src/auth-utils.test.ts:69-90 | ✅ |
| NFR-score-dispute-004 | privacy | Báo lỗi nằm trong cơ chế xuất/xóa dữ liệu cá nhân; xóa tài khoản/bài thi kéo theo xóa báo lỗi (xóa dây chuyền). | 🟡 P? | Test: sau xóa, báo lỗi của học viên bị xóa, của người khác còn | S8: packages/api/src/data-registry.test.ts:312,324; S3: packages/db/src/schema/dispute.ts:15,18 | ✅ |
| NFR-score-dispute-005 | data-integrity | Không thể có hai báo lỗi đang hoạt động cho một bài thi, kể cả khi hai yêu cầu gửi đồng thời (chặn ở tầng dữ liệu). | 🟡 P? | Chỉ mục duy nhất có điều kiện; test tuần tự phủ nhánh kiểm tra ứng dụng | S3: packages/db/src/schema/dispute.ts:44-46; S1: packages/api/src/routers/dispute.ts:120-128 | ✅ |
| NFR-score-dispute-006 | ngôn ngữ | Toàn bộ thông điệp lỗi và giao diện của feature bằng tiếng Việt. | 🟡 P? | Rà wording | S1: packages/api/src/routers/dispute.ts:31,44,51,58,76,104,126; S4: apps/web/src/features/results/components/report-modal.tsx:56,60,74 | ✅ |
| NFR-score-dispute-007 | triển khai | Tính năng có thể bật/tắt không cần sửa code bằng cấu hình môi trường; mặc định tắt. | 🟡 P? | Kiểm tra cấu hình | S7: packages/infra/alchemy.run.ts:56 | ✅ |
| NFR-score-dispute-008 | performance | Code không nêu mục tiêu thời gian phản hồi/độ trễ/tải cho thao tác gửi hay xem. | 🟡 P? | `<!-- TBD -->` | — (negative-search: xem reverse-gaps.md) | 🟡 |
| NFR-score-dispute-009 | abuse-control | Code không có giới hạn tần suất, tổng số lần gửi, hay cửa sổ thời gian được phép báo lỗi sau khi có điểm. | 🟡 P? | `<!-- TBD -->` | — (negative-search: xem reverse-gaps.md) | 🟡 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Nguồn | Nhãn |
|----|------|---------|---------------|-------|------|
| BR-score-dispute-001 | Cờ bật chỉ khi giá trị cấu hình là chuỗi đúng `true` (phân biệt hoa thường); mọi giá trị khác, kể cả thiếu cấu hình, được coi là tắt. | Mỗi lần gửi / xem | FR-score-dispute-001, 014 | S1: packages/api/src/routers/dispute.ts:27,136 | ✅ |
| BR-score-dispute-002 | Thứ tự kiểm tra khi gửi: cờ → bài thi tồn tại → đúng chủ → đã nộp → chưa có báo lỗi hoạt động → lưu. Lỗi đầu tiên gặp được trả về. (Kiểm tra định dạng đầu vào xảy ra trước tất cả.) | Gửi báo lỗi | FR-score-dispute-001..006 | S1: packages/api/src/routers/dispute.ts:27-78 | ✅ |
| BR-score-dispute-003 | Hạn phản hồi = thời điểm máy chủ nhận yêu cầu + 72 giờ liên tục (không loại trừ cuối tuần/ngày lễ). | Tạo báo lỗi | FR-score-dispute-012 | S1: packages/api/src/routers/dispute.ts:81-82 | ✅ |
| BR-score-dispute-004 | "72 giờ" là cam kết phản hồi của sản phẩm với học viên; nội dung "phản hồi" nghĩa là gì (trả lời có band cuối? chỉ xác nhận?) và hậu quả khi quá hạn chưa được code định nghĩa trong feature này. | Hiển thị cam kết | FR-score-dispute-017, 019, 020 | S4: apps/web/src/features/results/components/report-modal.tsx:75-77; S13: docs/product-decisions.md:13 | 🟡 |
| BR-score-dispute-005 | Báo lỗi mới luôn khởi tạo ở trạng thái "đang mở" (open). Feature này không tạo trạng thái nào khác. | Tạo báo lỗi | FR-score-dispute-012 | S1: packages/api/src/routers/dispute.ts:96; S3: packages/db/src/schema/dispute.ts:25-27 | ✅ |
| BR-score-dispute-006 | Báo lỗi "hoạt động" = trạng thái đang mở hoặc đang xem xét; đã xử lý/không chấp nhận là "đã đóng" và không chặn báo lỗi mới ở tầng nghiệp vụ/dữ liệu. | Kiểm tra trùng | FR-score-dispute-006, 026 | S1: packages/api/src/routers/dispute.ts:68; S3: packages/db/src/schema/dispute.ts:46 | ✅ |
| BR-score-dispute-007 | Trạng thái "đang xem xét" (reviewing) được định nghĩa trong dữ liệu và được coi là hoạt động, nhưng không có đoạn code nào trong repo gán trạng thái này; chưa rõ ai/khi nào chuyển sang "đang xem xét". | — | FR-score-dispute-006, 017 | S3: packages/db/src/schema/dispute.ts:25; S15: packages/api/src/routers/dispute-admin.ts:10 (chỉ cho phép resolved/rejected) | 🟡 |
| BR-score-dispute-008 | Tiêu chí hợp lệ: ALL, FC, LR, GRA, PRON; `P` được quy đổi thành PRON. Cột dữ liệu không có ràng buộc CHECK nên ràng buộc chỉ nằm ở bước kiểm tra đầu vào. | Gửi báo lỗi | FR-score-dispute-007 | S1: packages/api/src/routers/dispute.ts:10-12; S10: packages/db/src/migrations/20261105123206_careful_paladin/migration.sql:5 | ✅ |
| BR-score-dispute-009 | Band kỳ vọng thuộc tập cố định 5.0-8.0 bước 0.5; band trước đó là chuỗi tự do không kiểm tra. Code không nói vì sao chặn dưới 5.0 và trên 8.0. | Gửi báo lỗi | FR-score-dispute-008, 011 | S1: packages/api/src/routers/dispute.ts:13-14 | ✅ |
| BR-score-dispute-010 | Lý do: cắt khoảng trắng, tối đa 1000; sau khi cắt nếu rỗng thì lưu là "không có". | Gửi báo lỗi | FR-score-dispute-009 | S1: packages/api/src/routers/dispute.ts:15,93 | ✅ |
| BR-score-dispute-011 | Đồng ý chia sẻ: mặc định `false`; chỉ báo lỗi MỚI NHẤT của bài thi được dùng khi quyết định quyền nghe audio. | Gửi / phát audio | FR-score-dispute-010, 024 | S1: packages/api/src/routers/dispute.ts:16; S9: apps/server/src/index.ts:324-330 | ✅ |
| BR-score-dispute-012 | Sau khi gửi, code không có chức năng cho học viên đổi hoặc rút lại đồng ý chia sẻ; không có cơ chế hết hạn đồng ý. | — | FR-score-dispute-010 | S1: packages/api/src/routers/dispute.ts:23-170 (chỉ có gửi và xem) | 🟡 |
| BR-score-dispute-013 | Đồng ý chia sẻ chỉ được thực thi ở kênh phát bản ghi âm; code không thấy kiểm tra tương ứng cho "transcript" dù nhãn giao diện nói "bản ghi âm và transcript". | Hiển thị đồng ý | FR-score-dispute-010, 024 | S4: apps/web/src/features/results/components/report-modal.tsx:138; S9: apps/server/src/index.ts:301-344 | 🟡 |
| BR-score-dispute-014 | Xóa bài thi hoặc xóa người dùng thì báo lỗi liên quan bị xóa theo. | Xóa dữ liệu | FR-score-dispute-025 | S3: packages/db/src/schema/dispute.ts:15,18 | ✅ |
| BR-score-dispute-015 | Xem báo lỗi luôn lấy bản ghi mới nhất theo thời điểm tạo; trả toàn bộ bản ghi (kể cả band cập nhật, nội dung trả lời, thời điểm cảnh báo nội bộ nếu đã có). | Xem trạng thái | FR-score-dispute-014 | S1: packages/api/src/routers/dispute.ts:158-168 | ✅ |
| BR-score-dispute-016 | Giao diện quyết định hiện nút dựa vào cờ do máy chủ trả (không dùng cờ phía web). Cờ web hiện có chỉ gồm chấm điểm và thanh toán. | Hiển thị nút | FR-score-dispute-016 | S5: apps/web/src/features/results/results-screen.tsx:339; S12: apps/web/src/lib/feature-flags.ts:1-4 | ✅ |
| BR-score-dispute-017 | Khi đã có báo lỗi bất kỳ của bài thi (kể cả đã đóng), giao diện ẩn nút báo lỗi; vì vậy qua giao diện mỗi bài thi chỉ báo lỗi được 1 lần trong thực tế. | Hiển thị nút | FR-score-dispute-016, 018, 026 | S5: apps/web/src/features/results/results-screen.tsx:319-343 | ✅ |
| BR-score-dispute-018 | Giao diện chỉ tải trạng thái và hiện nút khi mã bài thi nằm trong danh sách bài thi cục bộ của phiên hoặc là bài chưa lưu; với mã bài thi thật từ máy chủ không có trong danh sách cục bộ, giao diện coi như bản xem mặc định nên không tải trạng thái và không hiện nút. Danh sách cục bộ khởi tạo rỗng và không thấy đoạn code nào nạp nó ngoài test. | Mở trang kết quả | FR-score-dispute-016, 017, 023 | S11: apps/web/src/features/history/data.ts:17-33; apps/web/src/features/app-state/initial-state.ts:13; S5: apps/web/src/features/results/results-screen.tsx:55,76,339 | 🔵 |
| BR-score-dispute-019 | Nếu đối tượng gọi máy chủ phía web không có hàm gửi, form vẫn hiện thông báo thành công, gọi làm mới và đóng form mà KHÔNG gửi gì. | Gửi từ giao diện | FR-score-dispute-020 | S4: apps/web/src/features/results/components/report-modal.tsx:46-58 | 🟡 |
| BR-score-dispute-020 | Code không kiểm tra bài thi đã được chấm điểm xong hay chưa khi nhận báo lỗi; chỉ yêu cầu bài thi đã nộp. | Gửi báo lỗi | FR-score-dispute-005 | S1: packages/api/src/routers/dispute.ts:55-60 | ✅ |
| BR-score-dispute-021 | Code không gửi email/push/thông báo nào cho học viên khi gửi báo lỗi hoặc khi có kết quả; học viên chỉ thấy trạng thái khi mở trang kết quả. | Sau khi gửi / xử lý | FR-score-dispute-017, 018 | S5: apps/web/src/features/results/results-screen.tsx:319-338 (negative-search: xem reverse-gaps.md) | 🟡 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery | Nguồn | Nhãn |
|----------|-------|---------|----------|------------|--------------|----------|-------|------|
| E-score-dispute-001 | Tính năng chưa bật | Gửi khi cờ khác `true`. Mã FORBIDDEN. Wording: "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt" | major | FR-score-dispute-001 | Form: banner đỏ + toast cùng nội dung, form giữ mở | Chờ bật cờ; không có thao tác khắc phục phía học viên | S1: packages/api/src/routers/dispute.ts:28-32; S2: packages/api/src/routers/dispute.test.ts:60 | ✅ |
| E-score-dispute-002 | Chưa đăng nhập | Gọi khi không có phiên. Mã UNAUTHORIZED. Wording: "Authentication required" (tiếng Anh) | major | FR-score-dispute-002 | Form: banner hiển thị thông điệp do máy chủ trả (theo FR-score-dispute-021) | Đăng nhập lại | S16: packages/api/src/index.ts:16-21 | ✅ |
| E-score-dispute-003 | Không tìm thấy bài thi (gửi) | Mã bài thi không tồn tại. Mã NOT_FOUND. Wording: "Không tìm thấy bài thi" | major | FR-score-dispute-003 | Form: banner + toast | Kiểm tra lại bài thi | S1: packages/api/src/routers/dispute.ts:41-46 | ✅ |
| E-score-dispute-004 | Không phải chủ bài thi (gửi) | Bài thi của người khác. Mã FORBIDDEN. Wording: "Bạn không có quyền báo lỗi cho bài thi này" | major | FR-score-dispute-004 | Form: banner + toast | Không có (đúng chủ mới gửi được) | S1: packages/api/src/routers/dispute.ts:48-53; S2: packages/api/src/routers/dispute.test.ts:148 | ✅ |
| E-score-dispute-005 | Bài thi chưa nộp | Trạng thái bài thi khác `submitted`. Mã BAD_REQUEST. Wording: "Chỉ bài thi đã nộp mới có thể gửi báo lỗi" | minor | FR-score-dispute-005 | Form: banner + toast | Nộp bài rồi gửi lại | S1: packages/api/src/routers/dispute.ts:55-60; S2: packages/api/src/routers/dispute.test.ts:184 | ✅ |
| E-score-dispute-006 | Đã có báo lỗi đang xử lý (kiểm tra ứng dụng) | Có báo lỗi trạng thái mở hoặc đang xem xét. Mã CONFLICT. Wording: "Bài thi này đã có báo lỗi đang được xử lý" | minor | FR-score-dispute-006 | Form: banner + toast; (thông thường nút đã ẩn nếu trạng thái tải được) | Chờ xử lý xong | S1: packages/api/src/routers/dispute.ts:73-78; S2: packages/api/src/routers/dispute.test.ts:229; S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:157-169 | ✅ |
| E-score-dispute-007 | Đã có báo lỗi đang xử lý (gửi đồng thời) | Vi phạm chỉ mục duy nhất khi hai yêu cầu gửi cùng lúc: thông điệp lỗi chứa "UNIQUE constraint failed" hoặc tên chỉ mục. Mã CONFLICT, cùng wording với E-006 | minor | FR-score-dispute-006 | Như E-006 | Như E-006 | S1: packages/api/src/routers/dispute.ts:120-128 (không có test chạy nhánh này) | ✅ |
| E-score-dispute-008 | Không lưu được báo lỗi | Lưu xong nhưng không trả bản ghi. Mã INTERNAL_SERVER_ERROR. Wording: "Không thể lưu báo lỗi" | major | FR-score-dispute-013 | Form: banner + toast | Thử lại | S1: packages/api/src/routers/dispute.ts:101-106 | ✅ |
| E-score-dispute-009 | Lỗi cơ sở dữ liệu khác khi lưu | Lỗi khác không phải vi phạm duy nhất bị ném lại nguyên trạng. Wording ⚠️ chưa resolve (phụ thuộc thông điệp tầng dưới) | major | FR-score-dispute-012 | Form: banner hiển thị thông điệp lỗi nếu có, không thì "Không thể gửi báo lỗi. Vui lòng thử lại sau." | Thử lại | S1: packages/api/src/routers/dispute.ts:129; S4: apps/web/src/features/results/components/report-modal.tsx:60-64 | 🟡 |
| E-score-dispute-010 | Đầu vào không hợp lệ | Mã bài thi rỗng; tiêu chí ngoài tập; band ngoài tập; lý do quá 1000 ký tự; đồng ý không phải boolean. Mã ⚠️ chưa resolve (thư viện kiểm tra đầu vào, không đặt trong repo). Wording ⚠️ chưa resolve — code không đặt câu tùy biến, dùng thông điệp mặc định của thư viện kiểm tra | minor | FR-score-dispute-007..010 | Form: banner hiện thông điệp mặc định; giao diện đã giới hạn trước (chọn có sẵn, maxLength 1000) | Sửa giá trị | S1: packages/api/src/routers/dispute.ts:8-17; S4: apps/web/src/features/results/components/report-modal.tsx:105-111,122 | 🟡 |
| E-score-dispute-011 | Không tìm thấy bài thi (xem) | Mã bài thi không tồn tại. Mã NOT_FOUND. Wording: "Không tìm thấy bài thi" | minor | FR-score-dispute-015 | Trang kết quả: im lặng (chỉ console.warn), không nút/badge | — | S1: packages/api/src/routers/dispute.ts:144-149; S5: apps/web/src/features/results/results-screen.tsx:83-85 | ✅ |
| E-score-dispute-012 | Không phải chủ bài thi (xem) | Mã FORBIDDEN. Wording: "Bạn không có quyền xem thông tin bài thi này" | major | FR-score-dispute-015 | Trang kết quả: im lặng (console.warn) | — | S1: packages/api/src/routers/dispute.ts:151-156; S2: packages/api/src/routers/dispute.test.ts:310 | ✅ |
| E-score-dispute-013 | Tải trạng thái thất bại | Gọi xem trạng thái lỗi (mạng/máy chủ). Giao diện ghi console "Failed to load dispute status:" | minor | FR-score-dispute-023 | Không nút, không badge | Tải lại trang | S5: apps/web/src/features/results/results-screen.tsx:83-85 | ✅ |
| E-score-dispute-014 | Thông điệp lỗi dự phòng của form | Lỗi không có thông điệp. Wording: "Không thể gửi báo lỗi. Vui lòng thử lại sau." | minor | FR-score-dispute-021 | Banner + toast | Thử lại | S4: apps/web/src/features/results/components/report-modal.tsx:60 | ✅ |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt | Nguồn | Nhãn |
|----|-------------------|---------|---------|-------|------|
| SC-score-dispute-01 | Báo lỗi chấm được phản hồi trong 72 giờ | Hạn phản hồi lưu theo từng báo lỗi (72 giờ từ lúc gửi) | % báo lỗi phản hồi đúng hạn: PRD ghi chỉ tiêu cụ thể [chưa có] | S1: packages/api/src/routers/dispute.ts:82; S13: docs/_product/prd.md:20 | 🟡 |
| SC-score-dispute-02 | Dưới 3% lượt thi phát sinh báo lỗi | Số báo lỗi / số lượt thi | 3% (trích PRD, không có trong code) | S13: docs/_product/prd.md:19 | 🟡 |
| SC-score-dispute-03 | Ngưỡng cân nhắc mở rộng xử lý báo lỗi | Báo lỗi mỗi tuần; tỷ lệ phản hồi đúng hạn | Hơn 5 báo lỗi/tuần hoặc đúng hạn dưới 90% (trích tài liệu quyết định, không có trong code; hiện "chưa có dữ liệu thật") | S13: docs/decisions/dispute-scale-up.md | 🟡 |

## 8. Data Entities (tóm tắt — chi tiết ở `srs/score-dispute-reverse-erd.md`)

- **Báo lỗi chấm (score dispute)**: gắn với một bài thi và một học viên; có tiêu chí bị báo, band kỳ vọng, lý do, đồng ý chia sẻ, trạng thái (mở / đang xem xét / đã xử lý / không chấp nhận), hạn phản hồi, thời điểm tạo/cập nhật, band trước đó, band sau xử lý, nội dung trả lời, thời điểm xử lý, thời điểm cảnh báo quá hạn ✅ [S3: packages/db/src/schema/dispute.ts:10-37].
- Tham chiếu: **Bài thi** (attempt) và **Người dùng** (user), xóa dây chuyền ✅ [S3: packages/db/src/schema/dispute.ts:15,18].
- Phần feature này ghi: tiêu chí, band kỳ vọng, lý do, đồng ý chia sẻ, band trước đó, trạng thái=mở, hạn, thời điểm tạo ✅ [S1: packages/api/src/routers/dispute.ts:86-98]. Phần band sau xử lý, trả lời, thời điểm xử lý, cảnh báo: do `dispute-admin` ghi ✅ [S15: packages/api/src/routers/dispute-admin.ts:260-266] [S14: packages/api/src/disputes/overdue.ts:49-52].

## 9. Flows (tóm tắt — chi tiết ở `srs/score-dispute-reverse-flows.md`)

1. **Gửi báo lỗi chấm** — học viên mở form, chọn tiêu chí/band/lý do/đồng ý, hệ thống kiểm tra cờ, chủ sở hữu, trạng thái nộp, trùng; tạo báo lỗi mở với hạn 72 giờ; giao diện báo thành công và làm mới trạng thái ✅ [S1] [S4].
2. **Xem trạng thái báo lỗi** — trang kết quả hỏi trạng thái và hiện nút hoặc badge theo trạng thái 🟡 (API ✅ [S1: packages/api/src/routers/dispute.ts:133-169]; hiển thị giao diện chưa chắc tới được bài thi thật [S5: apps/web/src/features/results/results-screen.tsx:75-88,319-343], OQ-2).
3. **Đồng ý chia sẻ quyết định quyền nghe audio của quản trị** (điểm bàn giao) ✅ [S9: apps/server/src/index.ts:322-344].

## 10. Screens (tóm tắt)

| Màn / thành phần | Mô tả | Trạng thái | Nguồn | Nhãn |
|------------------|-------|------------|-------|------|
| Trang kết quả bài thi — khu vực nút/badge báo lỗi | Một trong: nút "Báo lỗi chấm" (có icon cờ) / badge vàng "Báo lỗi đang xử lý · Cam kết phản hồi trước ..." (có chấm nhấp nháy) / badge xanh "Báo lỗi đã xử lý" / badge xám "Báo lỗi không được chấp nhận" / không hiện gì | Có đủ nhánh; hiển thị với bài thật chưa chắc (BR-018) | S5: apps/web/src/features/results/results-screen.tsx:318-344 | 🟡 |
| Form "Báo lỗi chấm" (modal) | Chọn tiêu chí (5 nút dạng viên thuốc), chọn band kỳ vọng (dropdown 7 giá trị), mô tả lý do (textarea, bộ đếm n/1000, placeholder "Ví dụ: Mình có dùng nhiều câu phức ở Part 3 nhưng không được ghi nhận…"), ô đồng ý chia sẻ, nút Hủy / "Gửi báo lỗi" (đang gửi: "Đang gửi...") | Mặc định: GRA, 6.5, trống, chưa chọn đồng ý; banner lỗi; đang gửi | S4: apps/web/src/features/results/components/report-modal.tsx:71-159 | ✅ |
| Nhãn ô đồng ý | "Đồng ý chia sẻ bản ghi âm và transcript của bài thi này cho giám khảo để phục vụ rà soát bài chấm (tùy chọn, mặc định không chia sẻ)." | — | S4: apps/web/src/features/results/components/report-modal.tsx:137-139 | ✅ |
| Route chứa màn kết quả | Màn kết quả được gắn ở route lịch sử theo mã bài thi (`history/$attemptId`) | — | S5: apps/web/src/routes/_proto/app/history.$attemptId.tsx:12 | ✅ |

> Responsive/trạng thái hover: không đặc tả ở đây (chi tiết giao diện chung thuộc feature kết quả chấm).

## 11. Constraints, Dependencies & Assumptions

**Constraints (ràng buộc áp đặt):**

| Ràng buộc | Source / Owner | Nguồn | Nhãn |
|-----------|----------------|-------|------|
| Cam kết phản hồi trong 72 giờ | Quyết định D-09 (PO) | S13: docs/product-decisions.md:13; S1: packages/api/src/routers/dispute.ts:82 | 🟡 |
| Tính năng mặc định tắt, bật bằng cấu hình môi trường | Cấu hình hạ tầng | S7: packages/infra/alchemy.run.ts:56 | ✅ |
| Tập band kỳ vọng 5.0-8.0 | Code | S1: packages/api/src/routers/dispute.ts:13 | ✅ |

**Dependencies (deliverable do bên khác sở hữu):**

| Phụ thuộc | Owner | Blocks nếu chưa sẵn | Nguồn | Nhãn |
|-----------|-------|---------------------|-------|------|
| Xử lý báo lỗi phía quản trị (feature `dispute-admin`) | Feature khác | Báo lỗi sẽ không bao giờ chuyển khỏi "đang mở" nếu không có | S15: packages/api/src/routers/dispute-admin.ts:244-281 | ✅ |
| Bài thi đã nộp (feature thi thử) | Feature khác | Không có bài thi `submitted` thì không báo lỗi được | S1: packages/api/src/routers/dispute.ts:55-60 | ✅ |
| Trang kết quả (feature kết quả chấm) | Feature khác | Không có chỗ đặt nút/badge | S5: apps/web/src/features/results/results-screen.tsx:427 | ✅ |
| Kênh phát bản ghi âm kiểm tra đồng ý | Chưa rõ feature sở hữu (route nằm ở máy chủ, không thuộc feature này) | Đồng ý chia sẻ không có tác dụng | S9: apps/server/src/index.ts:322-344 | 🟡 |
| Cron định kỳ cảnh báo quá hạn | dispute-admin | Không cảnh báo sắp quá hạn | S14: apps/server/src/scheduled.ts:16-22 | ✅ |
| Kho đăng ký dữ liệu cá nhân | Feature quyền riêng tư | Báo lỗi không xuất/xóa được | S8: packages/api/src/data-registry.ts:227-235 | ✅ |

**Assumptions (tin là đúng — nêu hệ quả nếu sai):**

| Giả định | Invalidate {X} nếu sai | Nguồn | Nhãn |
|----------|------------------------|-------|------|
| Cờ `SCORE_DISPUTE_ENABLED` đang tắt ở môi trường thật (chưa xác nhận giá trị) | Nếu đang bật: toàn bộ FR gửi đang chạy thật, cần xác minh BR-018 ngay | S7: packages/infra/alchemy.run.ts:56; S13: docs/decisions/dispute-scale-up.md | 🟡 |
| Trang kết quả thực tế cấp danh sách bài cục bộ cho bài từ máy chủ ở nơi khác | Nếu sai: nút báo lỗi không bao giờ hiện cho học viên thật (BR-018) | S11: apps/web/src/features/app-state/initial-state.ts:13 | 🔵 |
| Một người (PO) xử lý toàn bộ báo lỗi | Nếu sai: cần phân công (dispute-scale-up) | S13: docs/product-decisions.md:13 | 🟡 |

## 12. Open Questions

> Danh sách đầy đủ OQ + Gap ở [`reverse-gaps.md`](./reverse-gaps.md). Dưới đây chỉ trích các OQ blocking.

- [ ] OQ-1: Cờ `SCORE_DISPUTE_ENABLED` đang có giá trị nào ở môi trường thật? (code chỉ cho biết mặc định tắt)
- [ ] OQ-2: Bài thi thật lấy từ máy chủ có hiện nút/badge báo lỗi không? (theo code: không, nếu danh sách bài cục bộ rỗng)
- [ ] OQ-3: Ai/khi nào chuyển báo lỗi sang "đang xem xét"? Trạng thái này có cần không?
- [ ] OQ-4: Học viên có được báo lỗi lại sau khi báo lỗi trước đã xử lý/bị từ chối? (API cho phép, giao diện ẩn nút)
- [ ] OQ-5: Đồng ý chia sẻ có bao gồm transcript không, và có rút lại được không?
