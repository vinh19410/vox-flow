# score-dispute — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Giá trị thật của cờ `SCORE_DISPUTE_ENABLED` ở môi trường đã triển khai là gì? Code chỉ cho biết mặc định khai báo là tắt; tài liệu quyết định cũng ghi "chưa kiểm tra giá trị đã triển khai". — *(liên quan: Mục 0, 1, 11 · cần: PO/dev xác nhận trên môi trường thật; chỉ cần biết bật/tắt, không cần giá trị bí mật)*
* [ ] OQ-2: Với bài thi thật lấy từ máy chủ (mã bài thi không có trong danh sách bài cục bộ), nút "Báo lỗi chấm" và badge trạng thái có hiển thị không? Theo code hiện tại giao diện coi mã lạ là "bản xem mặc định" nên không tải trạng thái và không hiện nút; danh sách bài cục bộ khởi tạo rỗng và không có đoạn code non-test nạp nó. Đây có phải lỗi hay do còn phụ thuộc feature khác? — *(Mục 3 FR-016/017, Mục 5 BR-018, Mục 10 · cần: dev/PO)*
* [ ] OQ-3: Trạng thái "đang xem xét" (reviewing) do ai/khi nào đặt? Không có đoạn code nào gán; quản trị chỉ chuyển sang đã xử lý/không chấp nhận. Có cần giữ trạng thái này không? — *(Mục 5 BR-007 · PO/dev)*
* [ ] OQ-4: Học viên có được báo lỗi lại cùng một bài thi sau khi báo lỗi trước đã xử lý/không chấp nhận? API cho phép (chỉ chặn báo lỗi đang hoạt động) nhưng giao diện ẩn nút. Nếu cho phép, giới hạn số lần? — *(FR-026, BR-006, BR-017 · PO)*
* [ ] OQ-5: "Đồng ý chia sẻ bản ghi âm và transcript": code chỉ thực thi ở kênh phát bản ghi âm, không thấy kiểm tra cho transcript. Transcript có hiển thị cho quản trị bất kể đồng ý không? Học viên có rút lại/đổi đồng ý được không (hiện không có chức năng)? — *(BR-012, BR-013 · PO/dev/pháp lý)*
* [ ] OQ-6: "Cam kết phản hồi 72 giờ" nghĩa là gì chính xác (trả band cuối hay chỉ xác nhận đã nhận)? 72 giờ liên tục hay giờ làm việc? Quá hạn thì hệ quả gì với học viên (code chỉ cảnh báo nội bộ 12 giờ trước hạn, thuộc dispute-admin)? — *(BR-003, BR-004, SC-01 · PO)*
* [ ] OQ-7: Có cần giới hạn tần suất, tổng số báo lỗi mỗi học viên, hoặc cửa sổ thời gian được báo lỗi sau khi có điểm không? Hiện không có. — *(NFR-009 · PO)*
* [ ] OQ-8: PRD F-12 nói "đính kèm đoạn âm thanh và bản gỡ băng cụ thể", form hiện chỉ có tiêu chí/band/lý do/đồng ý. Chọn đoạn cụ thể đã bỏ hay chưa làm? — *(Mục 0.3 · PO)*
* [ ] OQ-9: Học viên có nhận thông báo (email/push) khi gửi thành công hoặc khi có kết quả không? Hiện chỉ thấy badge khi mở lại trang kết quả. — *(BR-021 · PO)*
* [ ] OQ-10: Có nên chặn báo lỗi khi bài thi chưa có điểm (đang chấm/chấm lỗi)? Hiện chỉ cần bài thi đã nộp. — *(BR-020, FR-005 · PO/dev)*
* [ ] OQ-11: Trường "band trước đó" API nhận nhưng giao diện học viên không gửi (quản trị cũng có thể ghi trường này khi xử lý: packages/api/src/routers/dispute-admin.ts:12,264): dùng cho mục đích gì (hiệu chuẩn, hiển thị)? — *(FR-011 · dev)*
* [ ] OQ-12: Nhánh dự phòng "không có hàm gửi vẫn báo thành công" ở form có chủ ý không (dấu vết prototype)? — *(BR-019 · dev)*
* [ ] OQ-13: API trả toàn bộ bản ghi báo lỗi cho học viên, kể cả trường nội bộ như thời điểm cảnh báo quá hạn. Có chủ ý hiển thị không? — *(BR-015 · dev/PO)*
* [ ] OQ-14: Vì sao band kỳ vọng giới hạn 5.0-8.0 (không cho dưới 5.0 hoặc trên 8.0)? — *(BR-009 · PO)*
* [ ] OQ-15: Giá trị `P` được chấp nhận như bí danh của PRON để tương thích giao diện cũ hay mục đích khác? — *(FR-007 · dev)*
* [ ] OQ-16: Mức ưu tiên (P0/P1/P2) của từng FR/NFR — code không nói. — *(Mục 3, 4 · PO/BA)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 7 | Chỉ tiêu % phản hồi đúng hạn 72 giờ (PRD ghi [chưa có]) | Không có mốc đạt cho SC-01 | PO |
| Mục 4 NFR | Mục tiêu hiệu năng/độ trễ cho gửi và xem | Không nghiệm thu được NFR hiệu năng | PO/dev |
| Mục 6 | Wording lỗi đầu vào không hợp lệ (dùng thông điệp mặc định của thư viện) | Học viên có thể thấy câu tiếng Anh khó hiểu nếu qua được kiểm tra giao diện | dev |
| Mục 6 | Wording lỗi chưa đăng nhập là tiếng Anh "Authentication required" | Không đồng nhất ngôn ngữ giao diện | dev/PO |
| Mục 3 | Không có test cho: nhánh vi phạm duy nhất khi gửi đồng thời; band ngoài tập; lý do quá 1000 ký tự; lý do rỗng/trim; `P` → PRON phía API; badge "không được chấp nhận"; nhánh "không có hàm gửi" | Rủi ro hồi quy không bị phát hiện | dev (tester) |
| Mục 3 | Không có test it.skip/todo trong các file test của feature | — (đã grep, xem negative-search) | — |
| Mục 8 | Không có DDL kiểm tra (CHECK) cho tiêu chí/band/trạng thái ở cột dữ liệu | Dữ liệu sai có thể vào bằng đường khác ngoài API | dev |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| Đính kèm đoạn âm thanh/transcript cụ thể | PRD: "đính kèm đoạn âm thanh và bản gỡ băng cụ thể" (docs/_product/prd.md:132) | Form: chỉ có ô đồng ý chia sẻ toàn bộ ghi âm + transcript (apps/web/src/features/results/components/report-modal.tsx:130-140) | PRD là doc, code mới hơn về triển khai; không tự chọn bên (OQ-8) |
| Tình trạng "đã hoàn thành" vs khả năng tiếp cận UI | Roadmap: "Đã hoàn thành ... nối modal giao diện" (docs/roadmap-work-items.md:39) | Code: nút/badge có thể không hiện với bài thật (apps/web/src/features/results/results-screen.tsx:55,76,339) | Cần xác minh (OQ-2) |
| Wording nhãn đồng ý | Nhãn: chia sẻ "bản ghi âm và transcript" (report-modal.tsx:138) | Chỉ thấy thực thi cho bản ghi âm (apps/server/src/index.ts:322-344) | OQ-5 |

## 4. Inferred assumptions (suy đoán cần verify)

* Cờ có thể đang tắt ở môi trường thật (mặc định khai báo là tắt, tài liệu ghi "chưa kiểm tra") 🟡 — *validate: kiểm tra cấu hình đã triển khai · nếu sai: toàn bộ feature đang chạy thật, ưu tiên xử lý OQ-2*
* Nút/badge báo lỗi có thể không tới được học viên thật vì danh sách bài cục bộ rỗng và `lastUnpersistedAttempt` không được nạp ngoài test 🔵 (audit độc lập đã lặp lại negative-search, cùng kết quả; `HISTORY` chỉ được dùng trong test; `PersistedAppStateSchema` không lưu `attempts`: apps/web/src/features/app-state/store.tsx:58-64) — *validate: chạy ứng dụng với bài thật đã nộp · nếu sai: ghi lại nguồn nạp danh sách*
* "Cam kết 72 giờ" áp dụng thống nhất mọi tiêu chí, không phân biệt 🟡 — *validate: PO · nếu sai: hạn phải phụ thuộc loại*

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

- `reviewing` (gán trạng thái) — scope: `apps/` và `packages/` (*.ts, *.tsx, trừ node_modules, snapshot, test): chỉ thấy khai báo enum, kiểu, điều kiện đọc/lọc (packages/db/src/schema/dispute.ts:25, packages/api/src/routers/dispute.ts:68, packages/api/src/routers/dispute-admin.ts:102,272, packages/api/src/disputes/overdue.ts:30, apps/web/src/features/results/results-screen.tsx:319, apps/web/src/features/admin/disputes-screen.tsx:37,318,528); KHÔNG có nơi nào ghi `status: "reviewing"` → BR-007 🟡.
- `setLastUnpersistedAttempt(`, `attempts:`, `setAttempts`, `.attempts`, `HISTORY`, `lastUnpersistedAttempt` — scope: `apps/web/src` (*.ts, *.tsx) loại `__tests__` và `test/` (lặp lại độc lập khi audit; `lastUnpersistedAttempt` quét thêm toàn `apps/`, `packages/`): giá trị khởi tạo `attempts: []` (apps/web/src/features/app-state/initial-state.ts:13), không thấy nơi nạp ngoài test/harness → BR-018 🔵.
- `SCORE_DISPUTE_ENABLED|FEATURES.*dispute|VITE_FEATURE.*DISPUTE` — scope: `apps/`, `packages/` (*.ts, *.tsx, *.json, *.toml, *.yml): cờ chỉ ở packages/infra/alchemy.run.ts:56, packages/api/src/context.ts:16, packages/api/src/routers/dispute.ts:27,136, test; apps/web/src/lib/feature-flags.ts:1-4 chỉ có `scoring`, `billing` → không có cờ phía web.
- `dispute` liên quan email/push/notification/rate-limit/quota — scope: `apps/`, `packages/` (*.ts, *.tsx trừ migrations, routeTree.gen.ts): các file chứa `dispute` chỉ là router, schema, data-registry, auth-utils, server index (audio), scheduled, overdue, màn admin, màn kết quả, report-modal, terms; không có gửi thông báo hay giới hạn tần suất → BR-021, NFR-009 🟡.
- `transcript` kiểm tra đồng ý — scope: `apps/server/src/index.ts` và `packages/api/src/auth-utils.ts`: chỉ kiểm tra cho đường dẫn phát audio → BR-013 🟡.
- `it.skip|it.todo|describe.skip|xit` — scope: packages/api/src/routers/dispute.test.ts, apps/web/src/features/results/__tests__/report-modal.test.tsx, packages/api/src/auth-utils.test.ts: không thấy (đọc toàn file, chỉ có `it(`).
- Hàm/route sửa đồng ý chia sẻ sau khi gửi — scope: packages/api/src/routers/dispute.ts, dispute-admin.ts: không có → BR-012 🟡.

</details>
