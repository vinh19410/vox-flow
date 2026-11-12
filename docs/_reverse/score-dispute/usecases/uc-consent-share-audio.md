# UC: Học viên đồng ý chia sẻ ghi âm và transcript cho giám khảo khi báo lỗi

**Nhãn UC:** ✅ phần ghi nhận đồng ý và hiệu lực với audio; 🟡 phần transcript và rút lại đồng ý.

## a. Mô tả
Khi gửi báo lỗi, học viên tick ô đồng ý để giám khảo được nghe bản ghi âm (và xem transcript) của bài thi phục vụ rà soát. Mặc định không chia sẻ ✅ [S4: apps/web/src/features/results/components/report-modal.tsx:130-140].

## b. Actor
- Chính: Học viên. Thứ cấp (bàn giao): Quản trị/giám khảo — chỉ nghe được khi có đồng ý ✅ [S9: packages/api/src/auth-utils.ts:29-33].

## c. Tiền điều kiện
Như `uc-submit-score-dispute` (đang ở form báo lỗi).

## d. Luồng chính
1. Ở form, học viên đọc nhãn "Đồng ý chia sẻ bản ghi âm và transcript của bài thi này cho giám khảo để phục vụ rà soát bài chấm (tùy chọn, mặc định không chia sẻ)." ✅.
2. Học viên tick ô → giá trị chia sẻ = đúng ✅ [S6: apps/web/src/features/results/__tests__/report-modal.test.tsx:133-136].
3. Gửi báo lỗi; giá trị đồng ý được lưu cùng báo lỗi ✅ [S1: packages/api/src/routers/dispute.ts:94].
4. Khi quản trị yêu cầu nghe audio của bài thi, hệ thống đọc đồng ý của báo lỗi mới nhất: có đồng ý → cho nghe; không có báo lỗi hoặc không đồng ý → từ chối ✅ [S9: apps/server/src/index.ts:322-344; packages/api/src/auth-utils.test.ts:57-101].

## e. Luồng thay thế / ngoại lệ
- 2a. Không tick (mặc định) → quản trị bị từ chối nghe audio ✅.
- 4a. Chủ bài thi luôn nghe được audio của mình, bất kể đồng ý ✅ [S9: packages/api/src/auth-utils.ts:24-27].
- *. Rút lại/đổi đồng ý sau khi gửi: không có chức năng 🟡 (OQ-5).
- *. Transcript: không thấy kiểm tra đồng ý ở nơi nào 🟡 (OQ-5).

## f. Hậu điều kiện
Báo lỗi lưu giá trị đồng ý; quyền nghe audio của quản trị phản ánh đúng giá trị của báo lỗi mới nhất ✅.

## g. Quy tắc nghiệp vụ liên quan
BR-score-dispute-011 ✅; 🟡 BR-012, BR-013.

## h. Truy vết
- FR: FR-score-dispute-010, 024.
- Screen: Form báo lỗi (ô đồng ý).
- Error: không có lỗi riêng.
- OQ: OQ-5.
- Test: packages/api/src/routers/dispute.test.ts:66 (shareConsent true được lưu); packages/api/src/auth-utils.test.ts:57,69,91.
