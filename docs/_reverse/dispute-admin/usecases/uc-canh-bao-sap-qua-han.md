---
type: reverse-usecase
feature: dispute-admin
slug: canh-bao-sap-qua-han
status: draft
updated: 2026-11-11
---

# UC: Cảnh báo ca sắp quá hạn 12 giờ bằng tác vụ định kỳ

> Tái lập từ code, CHƯA duyệt. Nhãn: ✅ / 🔵 / 🟡.

**a. Mục tiêu:** Tự động đánh dấu các ca còn ≤ 12 giờ đến hạn để admin ưu tiên xử lý. 🟡 [S3:12-65]. Ý nghĩa nghiệp vụ của việc chỉ đánh dấu: 🟡 OQ-3.

**b. Actor chính:** Lịch cron của nền tảng / bộ xử lý lịch (hệ thống) ✅ [S5:42-55]. **Actor phụ:** Quản trị viên (thấy huy hiệu "Sắp quá hạn (<12h)" và số ở thẻ) ✅ [S11:371-377, S11:291-300].

**c. Tiền điều kiện:** Lịch giờ `0 * * * *` được khai báo ở hạ tầng; có ca open/reviewing. ✅ [S16:61-62][S5:8]

**d. Hậu điều kiện:** Các ca đủ điều kiện có warnedAt = thời điểm chạy; chạy lại không đổi gì. ✅ [S3:46-64][S4:90-93]

**e. Luồng chính:**
1. Cron giờ kích hoạt; bộ xử lý lịch chạy kiểm tra cảnh báo (lịch 5 phút thì bỏ qua). ✅ [S5:42-55][S6:28-38]
2. Hệ thống tìm ca open/reviewing, chưa cảnh báo, chưa có thời điểm xử lý, hạn không muộn hơn bây giờ + 12 giờ. ✅ [S3:20-35]
3. Cập nhật có điều kiện (chỉ khi warnedAt vẫn rỗng) đặt warnedAt và updatedAt. ✅ [S3:46-59]
4. Ghi log "[scheduled] Checked overdue disputes: warned N disputes". ✅ [S5:19]
5. Lần mở hàng đợi tiếp theo, ca có warnedAt hiện huy hiệu và tính vào thẻ "Sắp quá hạn". ✅ [S1:134-136, S1:313]

**f. Luồng thay thế / ngoại lệ:**
- 2a. Không có ca: trả 0, không cập nhật. ✅ [S3:37-42]
- 2b. Ca hạn đúng +12 giờ: được cảnh báo; +12 giờ 1 giây: không. ✅ [S4:96-136]
- 2c. Ca đã quá hạn nhưng chưa cảnh báo: vẫn được cảnh báo (lte). ✅ [S3:33]
- 3a. Lỗi: ghi log "[scheduled] Error processing scheduled event:", các tác vụ khác vẫn chạy (E-018). ✅ [S5:20-22][S6:46-50]
- Không có thông báo gửi đi (OQ-3). ✅ [S3:16-65]

**g. Quy tắc / FR liên quan:** BR-022..BR-026; FR-018..FR-022. Priority: TBD 🟡.

**h. Màn hình / Lỗi / OQ:** Không có màn riêng (hiệu ứng ở SCR-01); E-018, E-020; OQ-3, OQ-6, OQ-17.

