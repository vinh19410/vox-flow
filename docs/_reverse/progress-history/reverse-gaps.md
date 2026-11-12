# progress-history — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Danh sách lượt thi hiển thị ở Trang chủ và Lịch sử lấy từ đâu ở production? Code web khởi tạo rỗng, không gán ở đâu ngoài test; máy chủ không có thủ tục liệt kê lượt thi/điểm. UI này là prototype chưa nối hay sẽ nối ở mục 18? *(Mục 1, 3, 12 · cần: PO/dev · BLOCKING)*
* [ ] OQ-2: Công thức "band ước lượng" = trung bình tối đa 4 lượt cuối, làm tròn 0.5, và khoảng hiển thị (ước lượng trừ 0.5 đến ước lượng; không đối xứng) có phải quy tắc chốt? Ghi chú kiểm toán: `readiness-card.tsx:26` có nhánh `estBand + 0.5 > 9 ? 9 : estBand`, nhánh này chỉ hợp lý nếu cận trên dự định là ước lượng cộng 0.5, nên khoảng không đối xứng nhiều khả năng là lỗi; hành vi hiện tại vẫn là [ước lượng trừ 0.5, ước lượng]. *(FR-005, 006; BR-001, 002 · cần: PO/BA)*
* [ ] OQ-3: Khoảng tin cậy mỗi lượt (trường `range` của lượt) do ai cấp và theo phép tính nào (chấm 3 lần, chênh lệch tối đa)? Khoảng ở Trang chủ (4 lượt) và khoảng từng lượt có cùng nghĩa không? *(FR-018, 006 · cần: PO/dev scoring)*
* [ ] OQ-4: "Nhịp luyện đề xuất 1 bài / ngày" và bảy thanh trống là hằng số trang trí hay sẽ tính từ ngày thi và số bài đã làm? *(FR-012 · cần: PO)*
* [ ] OQ-5: "Việc hôm nay" lấy nhiệm vụ từ nguồn nào (phụ thuộc `daily-practice` mục 21)? Hiện luôn trống. *(FR-013 · cần: PO)*
* [ ] OQ-6: Ngày thi nhập tại thẻ đếm ngược chỉ cập nhật trạng thái cục bộ, không lưu hồ sơ; lần nạp hồ sơ sau có thể ghi đè về giá trị máy chủ. Có chủ ý không? *(FR-010, 011 · cần: PO/dev)*
* [ ] OQ-7: Thẻ đếm ngược chỉ hiển thị khi đã có ít nhất 1 lượt thi (nằm sau nhánh trạng thái trống); học viên mới đã đặt ngày thi ở onboarding vẫn không thấy đếm ngược. Có chủ ý không? *(BR-011 · cần: PO)*
* [ ] OQ-8: Trục dọc biểu đồ cố định 4.5-8.0, không kẹp giá trị; band 8.5, 9.0 hoặc dưới 4.5 và mục tiêu 8.5/9.0 vẽ ra ngoài khung. Cần mở rộng thang không? *(NFR-003, BR-009 · cần: PO/UX)*
* [ ] OQ-9: Lượt chưa chấm, chấm lỗi hoặc đang chấm có xuất hiện trong lịch sử và biểu đồ không (mô hình lượt phía web chỉ có band bắt buộc)? *(FR-017-019 · cần: PO)*
* [ ] OQ-10: Roadmap mong "phân biệt tiến bộ thật với dao động giữa các bài"; code chỉ vẽ vùng mờ cho từng lượt, không có phép so sánh/ngưỡng. Định nghĩa "tiến bộ thật" là gì? *(SC-01 · cần: PO)*
* [ ] OQ-11: Roadmap nêu "điểm mạnh và cần cải thiện" trên dashboard; code không có. Thêm vào scope hay bỏ khỏi roadmap? *(Mục 0.3 · cần: PO)*
* [ ] OQ-12: Sắp xếp theo ngày và trùng ngày: code dựa vào thứ tự mảng. Lượt cùng ngày/thứ tự trả về từ máy chủ được xử lý thế nào? *(BR-006 · cần: dev)*
* [ ] OQ-13: Ngày dạng chuỗi không giờ được phân tích và hiển thị theo giờ máy khách; có lệch ngày theo múi giờ không? *(BR-016 · cần: dev)*
* [ ] OQ-14: Mã màn "S19" hiển thị như dòng nhỏ trên tiêu đề màn Lịch sử cho học viên. Có giữ ở production không? *(Mục 10 · cần: PO/UX)*
* [ ] OQ-15: Không có phân trang/giới hạn số lượt; chiến lược khi học viên có hàng trăm lượt? *(NFR-005 · cần: dev)*
* [ ] OQ-17: Cờ `VITE_FEATURE_SCORING` (`apps/web/src/lib/feature-flags.ts:2`) bật hay tắt ở môi trường chạy thật? Cờ tắt thì chi tiết lượt không có kết quả chấm sẽ hiện "Bài thi đã được lưu" (E-010). *(E-010 · cần: dev/PO)*
* [ ] OQ-18: Ngày trong danh sách lượt dùng định dạng mặc định vi-VN (2/4/2025, không đệm số 0) còn thẻ đếm ngược dùng dd/mm/yyyy đệm số 0 (`attempt-list.tsx:27` so với `countdown-card.tsx:23`). Có chủ ý không? *(NFR-001 · cần: UX)*
* [ ] OQ-16: Các bảng `in_history` trên lượt thi ở máy chủ luôn đặt true (bài thi mới luôn lưu); lượt cũ/tắt lưu có cần lọc khỏi lịch sử không? *(FR-027 · cần: PO)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| 3 (FR nạp dữ liệu) | Thủ tục máy chủ trả danh sách lượt thi kèm band và khoảng band; bước web gán danh sách vào state | Hai màn luôn trống ở production | dev + PO |
| 3, 6 (chi tiết lượt) | Test cho biểu đồ, thẻ sẵn sàng (khoảng), thẻ đếm ngược (nhập ngày), cột band, nhãn "Mới nhất" | Hành vi chỉ từ code, không có test xác nhận | dev/QA |
| 7 (Success Criteria) | Không có chỉ số đo thành công | Không biết thế nào là "đạt" | PO |
| 3 (xuất dữ liệu) | PRD yêu cầu tải JSON lịch sử (`docs/_product/prd.md:153`); không thấy trong code của feature | Thiếu chức năng | PO (có thuộc `privacy-controls`?) |
| 3 (so sánh theo tiêu chí) | Không có biểu đồ/thống kê theo từng tiêu chí (FC, LR, GRA, P) dù lượt thi máy chủ có điểm từng tiêu chí | Không thấy điểm mạnh/yếu | PO |
| 4 (hiệu năng) | Không có yêu cầu hiệu năng/giới hạn | — | dev |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| Trạng thái triển khai | Code: UI Trang chủ + Lịch sử + biểu đồ đã có, kèm test (S6, S1, S17) | `docs/roadmap-work-items.md:33`: mục 18 trạng thái 🔒 (chờ 11, 13), chưa làm | 2026-11-11. Hai bên không đối nghịch thật nếu UI là prototype chưa nối dữ liệu; cần PO chốt "đã làm" nghĩa là gì |
| Nội dung dashboard | Code: không có điểm mạnh/cần cải thiện (S6-S10) | `docs/_product/roadmap.md:77`: có "điểm mạnh và cần cải thiện" | Roadmap trạng thái nháp |
| Quyền riêng tư là phụ thuộc | Work-items dòng 18: phụ thuộc 11, 13 | Roadmap dòng 77: phụ thuộc `scoring-results`, `privacy-controls` | Mục 11 = `privacy-controls` và đã xong (`docs/roadmap-work-items.md:26`); bài thi nay luôn được lưu (quyết định D-10, `packages/api/src/exam/consent.ts:12-17`) nên phụ thuộc này có thể đã được đáp ứng |

## 4. Inferred assumptions (suy đoán cần verify)

* Danh sách lượt thi phía web sẽ được gán từ máy chủ ở lần phát triển sau — *validate: hỏi dev về mục 18/issue #22; nếu sai: toàn bộ FR-005..022 không bao giờ chạy*.
* Thứ tự danh sách là thời gian tăng dần (cũ trước) — *validate: thủ tục máy chủ tương lai; nếu sai: "bài gần nhất", "Mới nhất", ước lượng 4 lượt cuối đều sai*.
* Nhánh "chưa đủ dữ liệu" của thẻ sẵn sàng và nhánh trống của thẻ bài gần nhất là dư (không thể đạt được từ Trang chủ) — *validate: tái sử dụng thẻ ở nơi khác; nếu sai: cần FR bổ sung*.
* Khoảng tin cậy của Trang chủ có thể là lỗi (cận trên bằng ước lượng thay vì ước lượng cộng 0.5; nhánh `+0.5 > 9` ở `readiness-card.tsx:26` là bằng chứng gián tiếp) — *validate: hỏi PO/dev; nếu đúng là lỗi: sửa công thức*.

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

- **Nơi gán `attempts` trong state (loại trừ test):** `grep -rnE "\battempts\b" apps/web/src packages --include=*.ts --include=*.tsx --exclude-dir=node_modules --exclude-dir=__tests__ --exclude=*.test.*` → chỉ thấy khai báo kiểu (`apps/web/src/features/app-state/types.ts:74`), giá trị khởi tạo `[]` (`apps/web/src/features/app-state/initial-state.ts:13`) và các chỗ đọc (`results-screen.tsx:55,267`, dashboard, history). Không có chỗ gán. Loại: dead-code-nghi / dữ liệu prototype.
- **`HISTORY` ngoài test:** `grep -rnE "HISTORY\b" apps packages --include=*.ts --include=*.tsx --exclude-dir=node_modules` → định nghĩa ở `apps/web/src/features/history/data.ts:3`; tham chiếu còn lại đều là test (`report-modal.test.tsx:8`, `slice-c.test.tsx:39`, `state-and-data.test.ts:9`). Loại: dữ liệu giả lập chỉ dùng cho test.
- **`setLastUnpersistedAttempt` ngoài store/test:** `grep -rn "setLastUnpersistedAttempt" apps/web/src --exclude-dir=__tests__` → chỉ `apps/web/src/features/app-state/store.tsx:90,146` và `types.ts:102`; không có nơi gọi để gán lượt tạm. Loại: dead-code-nghi.
- **Thủ tục máy chủ liệt kê lượt thi/điểm:** `grep -nE "protectedProcedure|publicProcedure" packages/api/src/routers/attempt.ts packages/api/src/routers/scoring.ts packages/api/src/routers/profile.ts` → attempt: start, getActive, getFollowUp, submit; scoring: status, retry, getResult; profile: get, upsert, completeOnboarding. Không có thủ tục liệt kê nhiều lượt hay điểm theo thời gian. Tên router ở `packages/api/src/routers/index.ts:11-28` (attempt, privacy, profile, dispute, disputeAdmin, forecast, forecastAdmin, scoring) cũng không có router lịch sử/tiến độ. Loại: code-câm (thiếu hẳn).
- **Điểm mạnh/cần cải thiện:** `grep -rniE "điểm mạnh|cần cải thiện|strength|weakness" apps/web/src/features/dashboard apps/web/src/features/history` → không có kết quả. Loại: code-câm.
- **Xuất JSON lịch sử:** `grep -rniE "tải về|export|download" apps/web/src/features/history apps/web/src/features/dashboard` → không có kết quả. Loại: code-câm.
- **Cờ tính năng ảnh hưởng hai màn:** `apps/web/src/lib/feature-flags.ts:1-4` chỉ có `scoring` (VITE_FEATURE_SCORING) và `billing` (VITE_FEATURE_BILLING); dashboard/history không đọc cờ; chi tiết lượt đọc cờ `scoring` ở `results-screen.tsx:223`. Loại: cờ tắt ảnh hưởng chi tiết lượt.
- **Test skip/todo cho feature:** `grep -n "it.skip\|it.todo\|test.skip" apps/web/src/features/__tests__/slice-b.test.tsx apps/web/src/features/app-state/__tests__/state-and-data.test.ts` → không có.
- **Test cho biểu đồ/khoảng/nhãn:** `grep -rln "TrendChart\|Mới nhất\|khoảng tin cậy" apps/web/src --include=*.test.*` → không có. Loại: test-thiếu.
- **Sắp xếp theo ngày:** `grep -nE "sort\(" apps/web/src/features/history apps/web/src/features/dashboard -r` → không có. Loại: code-câm.
- **Lưu ngày thi từ thẻ đếm ngược:** `grep -n "profile" apps/web/src/features/dashboard -r` → không có. Chỉ `countdown-card.tsx:43` gọi cập nhật state cục bộ.

</details>
