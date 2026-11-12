# onboarding-profile — Gaps & Open Questions

## 1. Open Questions

* [ ] OQ-1: Priority P0/P1/P2 của từng FR/NFR là gì? Roadmap chỉ gán nhóm "Must" cho `onboarding` ở mức feature, không phân rã. — *(liên quan: Mục 3, 4 · cần: PO)* [S35: docs/roadmap-chamro.md:54]
* [ ] OQ-2: Ngày thi dùng để làm gì? PRD nói "tính nhịp luyện tập hằng ngày và nhắc báo điểm thật sau ngày thi"; trong code chỉ có đếm ngược Dashboard và thời hạn gói thi, không có nhịp luyện hay nhắc; văn bản giao diện lại nói "gợi ý việc cần luyện mỗi ngày" [S9: apps/web/src/features/onboarding/components/goal-step.tsx:57] và "gợi ý bài tập trọng tâm" [S17: apps/web/src/features/profile/profile-screen.tsx:272]. Đây là chưa làm (Next theo D-06) hay nằm ở feature khác? — *(liên quan: Mục 1 Boundary, 0.3 · cần: PO)* [S35: docs/_product/prd.md:79] [S35: docs/product-decisions.md:10 D-06]
* [ ] OQ-3: Bắt buộc qua kiểm tra mic (không có nút bỏ qua) và ngưỡng "5 giây, mức âm đỉnh từ 0.05" có chủ ý không? Học viên micro nhỏ hoặc trình duyệt chặn micro sẽ không thể hoàn tất onboarding. — *(liên quan: FR-007..010, BR-008, BR-009 · cần: PO/dev)* [S10: apps/web/src/features/onboarding/components/mic-check.tsx:44-45, 161-186]
* [ ] OQ-4: Vì sao band thấp nhất là 5.0 (học viên mục tiêu dưới 5.0 không chọn được)? PRD ghi phân khúc band mục tiêu là [chưa có]. — *(liên quan: BR-001 · cần: PO)* [S35: docs/_product/prd.md:27]
* [ ] OQ-5: Lệch múi giờ: ô chọn ngày của onboarding chặn theo ngày địa phương, máy chủ và màn Hồ sơ theo UTC. Học viên ở múi giờ chậm hơn UTC (buổi tối) chọn "hôm nay" có thể bị từ chối. Học viên mục tiêu chủ yếu ở múi giờ nào? — *(liên quan: BR-003, BR-004 · cần: PO/dev)* [S9: apps/web/src/features/onboarding/components/goal-step.tsx:51-52] [S1: packages/api/src/routers/profile.ts:30-35]
* [ ] OQ-6: Khi máy chủ từ chối (ngày không hợp lệ, band sai, chưa đăng nhập), onboarding luôn hiện "Không thể lưu mục tiêu. Vui lòng kiểm tra kết nối và thử lại." — gây hiểu nhầm là lỗi mạng. Có chấp nhận không? — *(liên quan: E-004, E-008 · cần: PO/UX)* [S9: apps/web/src/features/onboarding/components/goal-step.tsx:44-46]
* [ ] OQ-7: Nhánh "nếu không có kênh gọi máy chủ thì coi như thành công" ở lưu mục tiêu/hoàn tất onboarding/lưu mục tiêu Hồ sơ là dự phòng prototype hay hành vi production? Nếu production thì học viên có thể "hoàn tất" mà không có bản ghi. — *(liên quan: FR-027 · cần: dev)* [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:21-24]
* [ ] OQ-8: Cơ chế nhớ "đã onboard": hàm đánh dấu người dùng đã onboard và hàm xóa bộ nhớ không có nơi gọi nào ngoài test. Cố ý (chỉ cache sau khi hỏi hồ sơ) hay thiếu móc nối sau khi hoàn tất/đăng xuất? — *(liên quan: FR-015, NFR-005 · cần: dev)* [S14: apps/web/src/lib/auth-guard.ts:12-18]
* [ ] OQ-9: Nhãn "Đã xác thực" cạnh email trên màn Hồ sơ luôn hiện, không đọc trạng thái xác thực email thật. Đây là hiển thị cố định có chủ ý? — *(liên quan: FR-018 · cần: PO/dev)* [S17: apps/web/src/features/profile/profile-screen.tsx:253-255]
* [ ] OQ-10: Học viên không có cách xóa ảnh đại diện trên giao diện (máy chủ chấp nhận ảnh rỗng/null, nhưng giao diện không bao giờ gửi), và ảnh đã đổi trên màn không tự hoàn lại nếu lưu lỗi. Có cần "xóa ảnh" và hoàn tác khi lỗi không? — *(liên quan: FR-021, BR-020 · cần: PO/UX)* [S17: apps/web/src/features/profile/profile-screen.tsx:48-55, 102-123]
* [ ] OQ-11: Tên hiển thị tối đa 50 ký tự chỉ được chặn ở giao diện; luật độ dài/ký tự ở phía máy chủ nằm trong thư viện xác thực, feature này không tự đặt. Cần xác nhận luật thật. — *(liên quan: BR-013 · cần: dev)* [S17: apps/web/src/features/profile/profile-screen.tsx:222]
* [ ] OQ-12: Ảnh đại diện từ link https bên ngoài không bị giới hạn tên miền hay kiểm tra nội dung; trình duyệt người xem sẽ tải ảnh từ bên thứ ba (rò rỉ IP/theo dõi). Chấp nhận không? — *(liên quan: BR-017 · cần: PO/Security)* [S4: packages/auth/src/image-validation.ts:26]
* [ ] OQ-13: Trên tab "Link URL", link gõ vào chỉ có hiệu lực sau khi bấm "Xem thử"; bấm "Xác nhận đổi ảnh" ngay sẽ lưu ảnh đang xem trước trước đó, không thông báo. Cố ý? — *(liên quan: FR-023 · cần: UX)* [S18: apps/web/src/features/profile/components/avatar-modal.tsx:50-67]
* [ ] OQ-14: Nút "Quay lại" ở bước 1 chuyển về màn đăng nhập dù học viên đã có phiên. Màn đăng nhập xử lý người đã đăng nhập thế nào chưa được khảo sát trong phạm vi này. — *(liên quan: FR-013 · cần: dev)* [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:35]
* [ ] OQ-15: Lời khuyên "độ ồn trên 50 dB" là văn bản tĩnh, không đo dB; có kế hoạch đo thật không? — *(liên quan: BR-010 · cần: PO)* [S10: apps/web/src/features/onboarding/components/mic-check.tsx:156]
* [ ] OQ-16: Ranh giới feature: thẻ "Gói hiện tại", "Quản lý & Nâng cấp gói", "Tài khoản & Phiên" và "Đăng xuất" nằm chung màn Hồ sơ; phần nào thuộc spec feature này? Reverse này chỉ coi mục tiêu + định danh + ảnh là trong phạm vi. — *(liên quan: Mục 1 Boundary · cần: BA)* [S17: apps/web/src/features/profile/profile-screen.tsx:371-456]
* [ ] OQ-17: Đồng bộ hồ sơ vẫn nạp "đồng ý dữ liệu" khi đăng nhập dù quyết định D-10 nói bỏ bước đồng ý khỏi onboarding. Thuộc feature quyền riêng tư, nhưng nằm cùng hook đồng bộ; xác nhận không thuộc spec này. — *(liên quan: FR-017 · cần: BA)* [S13: apps/web/src/features/app-state/use-profile-hydration.ts:79-94] [S35: docs/product-decisions.md:14 D-10]
* [ ] OQ-18: Đồng hồ kiểm tra mic và ngưỡng đo dùng tham số cố định; hành vi trên thiết bị di động (iOS yêu cầu thao tác người dùng để AudioContext chạy) có được kiểm chứng ngoài test mock không? — *(liên quan: FR-007 · cần: QA)* [S12: apps/web/src/hooks/use-mic-level.ts:55-59]
* [ ] OQ-19: Cổng chặn fail-open (lỗi hỏi hồ sơ, hoặc không có kênh máy chủ) cho học viên vào ứng dụng khi chưa chắc có hồ sơ/band, nên "mọi học viên vào ứng dụng đều có mục tiêu" (SC-03) không được đảm bảo tuyệt đối. Chấp nhận không? — *(liên quan: FR-015, NFR-004, SC-03 · cần: dev/PO)* [S14: apps/web/src/lib/auth-guard.ts:49-67]

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 3, 4 | Priority P0/P1/P2 | Không xếp được thứ tự ưu tiên kiểm thử/phát triển | PO |
| Mục 7 | Chỉ số thành công (tỷ lệ hoàn tất onboarding, thời gian hoàn tất, tỷ lệ qua mic) | Không đo được feature có đạt mục đích | PO |
| Mục 2 | Vai trò admin/hỗ trợ có được xem/sửa hồ sơ học viên không | Không biết có use case admin | PO |
| Mục 3 | Luật thật của tên hiển thị phía máy chủ (độ dài, ký tự) | Có thể lệch giữa giao diện (50) và máy chủ | Dev |
| Mục 3 | Hành vi chạm lại bước 1 sau khi đã onboard (sửa mục tiêu chỉ qua màn Hồ sơ) | Không có lỗ hổng, nhưng chưa có nguồn nói rõ là chủ ý | PO |
| Mục 6 | Câu thông báo riêng cho lỗi máy chủ (tách khỏi lỗi kết nối) | Học viên hiểu sai nguyên nhân (OQ-6) | UX |
| Test | Không có test cho: bước kiểm tra mic độc lập ngoài luồng slice-a; ô ngày thi onboarding với ngày quá khứ; hook ảnh ở phía máy chủ nối với luồng cập nhật thật (chỉ test hàm kiểm tra thuần); nút "Xóa ngày" trên Hồ sơ; cache onboarded sau hoàn tất | Rủi ro hồi quy chưa có lưới an toàn | QA/Dev |

**Test bị bỏ qua (`it.skip`/`it.todo`):** không có trong các file test của feature (negative-search bên dưới).

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| So sánh ngày thi "không quá khứ" | Ô chọn ngày onboarding: theo ngày địa phương [S9: apps/web/src/features/onboarding/components/goal-step.tsx:51-52] | Máy chủ và màn Hồ sơ: theo ngày UTC [S1: packages/api/src/routers/profile.ts:30-35] [S17: apps/web/src/features/profile/profile-screen.tsx:133-135] | Lệch nội bộ code; hệ quả xem OQ-5. Không có doc chính nói |
| Mục đích ngày thi | Code: lưu, hiển thị đếm ngược, thời hạn gói [S1: packages/api/src/routers/profile.ts:53-89] | PRD: nhịp luyện hằng ngày + nhắc báo band [S35: docs/_product/prd.md:79] | OQ-2. Doc chính không nhất thiết sai (có thể là hạng mục Next) |
| Danh sách band lặp 3 nơi | Máy chủ [S1: packages/api/src/routers/profile.ts:8] | Giao diện onboarding [S9: apps/web/src/features/onboarding/components/goal-step.tsx:9], màn Hồ sơ [S17: apps/web/src/features/profile/profile-screen.tsx:29] | Hiện đồng nhất; nguy cơ lệch khi sửa. Không phải mâu thuẫn thực tế |

## 4. Inferred assumptions (suy đoán cần verify)

* Điều kiện "band rỗng" khi hoàn tất onboarding không bao giờ xảy ra vì cột bắt buộc — *validate: xác nhận không có dữ liệu cũ band null (migration chỉ có một bản tạo bảng) · nếu sai: lỗi E-006 có thể xuất hiện với dữ liệu lỗi* 🔵 [S1: packages/api/src/routers/profile.ts:101] [S3: packages/db/src/migrations/20261105235801_bitter_madripoor/migration.sql:3]
* Hộp thoại ảnh giữ trạng thái chọn ảnh giữa các lần mở vì thành phần không bị gỡ khi đóng (chỉ nội dung modal ẩn) — *validate: chạy giao diện; xem cách Modal xử lý open=false · nếu sai: xem trước có thể không khớp ảnh hiện tại* 🔵 [S18: apps/web/src/features/profile/components/avatar-modal.tsx:27] [S17: apps/web/src/features/profile/profile-screen.tsx:460-465]
* Xóa người dùng kéo theo xóa hồ sơ, nên sau khi tài khoản được tạo lại học viên sẽ onboard lại từ đầu — *validate: kiểm tra luồng xóa tài khoản · nếu sai: học viên mới có thể thừa hưởng trạng thái cũ* 🔵 [S3: packages/db/src/migrations/20261105235801_bitter_madripoor/migration.sql:8] [S33: packages/api/src/data-registry.ts:62-64]
* Mã lỗi `BAD_REQUEST` cho đầu vào sai do thư viện kiểm tra tự gán, không viết trong code — *validate: chạy một lời gọi sai band · nếu sai: chỉ ảnh hưởng ghi chú mã trong Error Matrix* 🔵 [S1: packages/api/src/routers/profile.ts:10-15]
* Ngày thi lưu là chuỗi ngày thuần (không múi giờ) và đọc lại nguyên văn — *validate: đọc test* ✅ [S6: packages/api/src/routers/profile.test.ts:108]

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

| Câu hỏi | Pattern | Scope | Kết quả |
|---------|---------|-------|---------|
| Test bị bỏ qua? | `it.skip`, `it.todo`, `describe.skip`, `xit(` | các file test liệt kê ở S6, S7, S21-S28 | Không có |
| Ai gọi đánh dấu/xóa cache onboarded? | `markUserOnboarded`, `clearOnboardedUserCache` | `apps/web/src` (trừ test) | Chỉ định nghĩa tại `apps/web/src/lib/auth-guard.ts:12,16`; còn lại chỉ nằm trong test/mock |
| Prop `compact` của MicCheck có ai truyền? | `MicCheck` | `apps/web/src` ngoài `features/onboarding` | Không có nơi dùng khác; `onboarding-screen.tsx:52` không truyền `compact` |
| Trạng thái email xác thực có được đọc? | `emailVerified` | `apps/web/src` | Không có kết quả (nhãn "Đã xác thực" cố định) |
| Ai dùng ngày thi / band mục tiêu ngoài feature? | `examDate`, `s.target` | `apps/web/src`, `packages/api/src` (trừ test và feature này) | Dashboard (đếm ngược, readiness), billing (thời hạn gói, gói thi), history, results, forecast; KHÔNG có nhịp luyện/nhắc |
| Có nhắc báo band sau ngày thi? | `reminder`, `remind` gắn với `examDate` | `apps/web/src`, `packages/api/src` (đọc kết quả `examDate` ở trên) | Không thấy trong kết quả `examDate` |
| Cờ tính năng ảnh hưởng feature? | `FEATURES.` trong `apps/web/src/lib/feature-flags.ts` (chỉ có `scoring`, `billing`) | file `apps/web/src/lib/feature-flags.ts:1-4` | Không cờ nào gắn trực tiếp với onboarding/hồ sơ; thẻ gói/nâng cấp trên Hồ sơ thuộc billing (ngoài phạm vi) |
| Thủ tục tRPC dành cho admin với hồ sơ? | `adminProcedure` trong `packages/api/src/routers/profile.ts` | file đó | Không có |
| Ngưỡng độ dài tên phía máy chủ? | `name` trong hook `packages/auth/src/index.ts:46-73` | file đó | Không có luật cho tên; chỉ kiểm tra ảnh |
| Đường xóa ảnh trên giao diện? | `image: null`, `removeAvatar` | `apps/web/src/features/profile` | Không có nơi gửi null |

</details>
