# Hồ sơ kiểm chứng mức sẵn lòng trả (WTP) cho các gói giá Vox Flow

Trạng thái: Đề xuất — chờ PO xác nhận ngưỡng (Gate A)

Phương pháp: Phỏng vấn 1-1 chuyên sâu (20–30 phút) theo phương pháp Mom Test tập trung vào hành vi chi tiêu quá khứ, đánh giá lựa chọn giữa 4 gói giá gắn với số ngày đến ngày thi, câu hỏi cảm nhận giá Van Westendorp định tính phụ trợ, và thang đo cam kết hành vi thực tế (Commitment Ladder).
Cỡ mẫu: Tối thiểu 20 học viên IELTS mục tiêu có ngày thi trong vòng 60 ngày, phân bổ đều theo các nhóm thời gian đến ngày thi (≤14 ngày, 15–30 ngày, 31–60 ngày); không có kênh tuyển dụng nào chiếm quá 40% tổng mẫu.
Ngưỡng giữ giá: Đề xuất quy tắc phê duyệt cho từng gói (áp dụng theo thứ tự ưu tiên Đổi giá > Giữ giá > Chưa đủ căn cứ): (1) Đủ điều kiện mẫu: Mỗi gói phải có tối thiểu 5 học viên chọn để làm căn cứ đánh giá (gói 49k đánh giá trên toàn bộ mẫu, gói 99k/249k/349k đánh giá trên nhóm học viên có ngày thi phù hợp); (2) Đề xuất đổi giá (ưu tiên cao nhất): Nếu tỷ lệ ý định mua (4–5/5) < 20% HOẶC tỷ lệ người đánh giá mức "quá đắt" ≤ giá niêm yết đạt > 50%; (3) Đề xuất giữ giá: Nếu không thuộc diện đổi giá VÀ đạt đồng thời tỷ lệ cam kết hành vi ≥ 35% cùng tỷ lệ ý định mua ≥ 40%; (4) Chưa đủ căn cứ kết luận (mọi trường hợp còn lại, bao gồm ý định mua ≥ 40% nhưng cam kết < 35%, hoặc ý định mua từ 20% đến dưới 40%, hoặc số học viên chọn gói < 5): Giữ giá cơ sở và mở rộng mẫu thêm 10 học viên ở vòng 2.

---

## 1. Mục tiêu và Bối cảnh kiểm chứng

### 1.1. Vấn đề cần giải quyết
Tính năng `billing` trong roadmap hiện đang xếp mức ưu tiên cao tại Now (Mục 2 trong `docs/roadmap-chamro.md:55`), nhưng cột Evidence vẫn ở trạng thái `Giả định`. Để bảo đảm tính bền vững tài chính cho mô hình chấm điểm AI (chi phí nhận dạng giọng nói và suy luận mô hình ngôn ngữ lớn), dự án cần có bằng chứng thực tế về mức độ sẵn lòng chi trả của người học trước khi hoàn tất tích hợp cổng thanh toán thật (WI15 - Issue #19).

### 1.2. Danh mục 4 gói giá khảo sát (theo PRD §4.6)
1. **Gói theo lượt (49.000đ):** Mua 3 lượt mở chi tiết bài thi (phân tích 4 tiêu chí, trích dẫn câu nói, lỗi sai, gợi ý sửa). Không hết hạn, không miễn trừ hạn mức chấm hàng ngày. Phù hợp người chỉ cần kiểm tra nhanh band điểm trước kỳ thi hoặc người học tự do.
2. **Gói 7 ngày (99.000đ):** 7 ngày mở chi tiết bài thi không giới hạn lượt. Phù hợp người ôn luyện nước rút trong 1 tuần trước ngày thi.
3. **Gói 30 ngày (249.000đ):** 30 ngày mở chi tiết bài thi không giới hạn lượt. Phù hợp người có lộ trình ôn luyện tiêu chuẩn 1 tháng.
4. **Gói đến ngày thi (349.000đ):** Mở chi tiết không giới hạn tính từ ngày kích hoạt cho đến đúng ngày thi đã đăng ký (tối đa 60 ngày), tự động kết thúc không tự gia hạn.

### 1.3. Nhận diện hiện tượng gói chiếm ưu thế (Dominance)
Trong thiết kế sản phẩm, các gói giá có sự tương quan phụ thuộc vào khoảng cách đến ngày thi của học viên:
- **Thí sinh thi trong 31–60 ngày:** Gói 349k (tối đa 60 ngày) mang lại lợi ích kinh tế vượt trội so với việc mua gói 30 ngày (249k) rồi gia hạn tiếp (tổng chi phí sẽ là 498k). Do đó, gói 349k có xu hướng áp đảo gói 249k ở phân khúc này.
- **Thí sinh thi trong ≤ 14 ngày:** Việc mua 1 hoặc 2 gói tuần (99k hoặc 198k) kinh tế hơn gói 30 ngày (249k).
- **Nguyên tắc phân tích:** Không đo lường mức độ sẵn lòng trả cho từng gói một cách cô lập. Kết quả đánh giá của từng gói phải được tính trên nhóm học viên mà gói đó là lựa chọn kinh tế và hợp lý nhất theo ngày thi.

---

## 2. Tiêu chí sàng lọc người tham gia (Screener)

Để bảo đảm tính khách quan, an toàn pháp lý và tránh dữ liệu giả mạo, người tham gia phỏng vấn phải thỏa mãn toàn bộ các điều kiện sàng lọc sau:

1. **Độ tuổi:** Từ đủ 16 tuổi trở lên (học viên 16–17 tuổi tham gia khảo sát ý kiến trải nghiệm người dùng theo hướng dẫn bảo vệ dữ liệu cá nhân tại `docs/legal/oq-6-tu-van-luat-su.md`).
2. **Thời gian thi IELTS:** Có lịch thi IELTS Speaking trong vòng 60 ngày tới (khớp trần 60 ngày của gói 349k theo `docs/_product/prd.md:130`). Đối với học viên thi sau 60 ngày (61–90 ngày), chỉ ghi nhận nghiên cứu định tính cho gói lượt (49k) hoặc gói tháng (249k) và không tính vào mẫu chốt ngưỡng của gói 349k.
3. **Minh chứng hợp lệ:** Người tham gia xuất trình trực tiếp qua chia sẻ màn hình phiếu báo/email xác nhận đăng ký thi tại IDP/BC (đã che thông tin số định danh cá nhân) để đối chiếu trực tiếp trong cuộc gọi; người phỏng vấn không chụp ảnh màn hình, không lưu trữ tệp và không chuyển tiếp thông tin này.
4. **Lịch sử chi tiêu học tập:** Đã từng tự học nghiêm túc hoặc chi trả tiền cho việc luyện thi IELTS Speaking (học trung tâm, thuê gia sư, mua tài liệu, thi thử) trong vòng 6 tháng gần nhất.
5. **Tiêu chí loại trừ:** Tuyệt đối loại trừ người quen, bạn bè, đồng nghiệp của đội ngũ phát triển, hoặc người đã biết trước về dự án Vox Flow để tránh thiên vị lịch sự (Courtesy Bias).
6. **Đa dạng hóa kênh tuyển dụng:** Phân bổ người tham gia từ ít nhất 3 kênh độc lập (nhóm tự học IELTS trên Facebook, cộng đồng ôn thi trên Zalo, diễn đàn sinh viên/học sinh). Không có kênh nào chiếm quá 40% tổng số người được phỏng vấn.

---

## 3. Kịch bản phỏng vấn 1-1 chuyên sâu (20–30 phút)

Người phỏng vấn tuân thủ quy tắc Mom Test: hỏi về hành vi và chi phí thực tế trong quá khứ trước, không hỏi ý kiến giả định tương lai, không giải thích hay bảo vệ mức giá.

### Phần 1: Khởi động và Khảo sát hành vi chi tiêu quá khứ (7 phút)
- *Câu hỏi 1.1:* Ngày thi IELTS Speaking dự kiến của bạn là ngày nào? Mục tiêu band điểm tổng và band Speaking của bạn là bao nhiêu?
- *Câu hỏi 1.2:* Hiện tại bạn đang luyện Speaking hàng ngày theo hình thức nào? Bạn tự ghi âm nghe lại, luyện cùng bạn, hay có giáo viên sửa bài?
- *Câu hỏi 1.3:* Trong 6 tháng qua, bạn đã chi trả những khoản tiền nào cho việc ôn luyện Speaking? (Khóa học, buổi chấm bài riêng, thi thử tại trung tâm, mua app, v.v.). Mức chi phí cho lần gần nhất là bao nhiêu?
- *Câu hỏi 1.4:* Điểm bất tiện hoặc tốn kém nhất trong cách bạn đang ôn Speaking hiện tại là gì?

### Phần 2: Trải nghiệm giá trị giải pháp qua Mockup chuẩn (8 phút)
*Lưu ý người phỏng vấn:* Sử dụng tài liệu mockup tĩnh chuẩn hóa theo PRD §4.6 và Quyết định D-04, không chia sẻ màn hình prototype đang có câu chữ chưa cập nhật.
- Người phỏng vấn giới thiệu quy trình làm bài thi thử mô phỏng 3 phần thi với giám khảo AI và giải thích rõ: kết quả điểm thi trong bản demo là kết quả mẫu phục vụ nghiên cứu giao diện.
- Demo đối chiếu hai mức trải nghiệm:
  - **Phần miễn phí (Free):** Học viên xem được band điểm tổng thể ước lượng, khoảng tin cậy, toàn bộ phân tích bằng chứng chi tiết cho 1 câu nói yếu nhất và nút "Luyện lại câu này" (hạn mức 3 điểm/ngày kèm trần chi phí toàn hệ thống theo `docs/_product/prd.md:51, 107-110` và Quyết định D-04).
  - **Phần mở chi tiết có phí (Paid Detail):** Mở khóa toàn bộ bảng phân tích 4 tiêu chí chuẩn IELTS cho mọi câu trong bài nói (Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation), trích dẫn từng câu nói thực tế của thí sinh, chỉ rõ điểm ngữ pháp/từ vựng chưa chuẩn và gợi ý mẫu câu nâng band.
- *Câu hỏi 2.1:* Khi nhìn vào hai phần kết quả này, thông tin nào là thông tin bạn thực sự cần để cải thiện bài nói cho lần luyện tập tiếp theo?

### Phần 3: Đánh giá lựa chọn 4 gói giá và Cảm nhận giá (8 phút)
Người phỏng vấn trình bày đồng thời cả 4 gói giá trên một màn hình so sánh duy nhất (kèm điều kiện rõ ràng: 49k cho 3 lượt, 99k cho 7 ngày, 249k cho 30 ngày, 349k đến ngày thi tối đa 60 ngày).
- *Câu hỏi 3.1:* Dựa trên ngày thi cụ thể của bạn (đã ghi nhận ở Phần 1), nếu cần sử dụng tính năng mở chi tiết bài thi để ôn luyện, bạn sẽ chọn gói nào trong 4 gói trên, hay bạn sẽ không chọn gói nào? Vì sao?
- *Câu hỏi 3.2:* Mức độ chắc chắn bạn sẽ thanh toán cho gói bạn vừa chọn khi sản phẩm ra mắt là bao nhiêu, trên thang điểm từ 1 đến 5? (1: Hoàn toàn không mua; 2: Khó có khả năng; 3: Cân nhắc; 4: Có thể sẽ mua; 5: Chắc chắn mua).
- *Câu hỏi 3.3 (Van Westendorp định tính phụ trợ cho gói đã chọn):*
  - Ở mức giá nào bạn cảm thấy gói này bắt đầu rẻ đến mức bạn nghi ngờ chất lượng và không muốn dùng?
  - Ở mức giá nào bạn cảm thấy gói này là một món hời (rất đáng tiền)?
  - Ở mức giá nào bạn cảm thấy gói này bắt đầu đắt, phải suy nghĩ cân nhắc trước khi mua?
  - Ở mức giá nào bạn cảm thấy gói này quá đắt đến mức chắc chắn sẽ bỏ qua và tìm giải pháp khác?

### Phần 4: Thử nghiệm Thang đo cam kết hành vi (Commitment Ladder) (5 phút)
Để loại bỏ sự thiên vị nể nang trong câu trả lời phỏng vấn, người phỏng vấn đề nghị học viên thực hiện một bước cam kết cụ thể không dùng tiền mặt (do SePay chưa hoàn thành và dự án đang chờ tư vấn pháp lý OQ-6):
- **Bậc 1 (Đăng ký Waitlist):** Học viên đồng ý điền email cá nhân vào danh sách chờ mở bán chính thức qua liên kết xác thực kép (Double Opt-in) để nhận thông báo kích hoạt gói đã chọn khi mở cổng thanh toán.
- **Bậc 2 (Đặt lịch thử nghiệm Beta):** Học viên đồng ý nhận thông báo ưu tiên và đặt trước khung giờ trải nghiệm giao diện người dùng (Usability testing) khi mở thử nghiệm beta mà không phát sinh việc gửi dữ liệu giọng nói ra bên ngoài.
- **Bậc 3 (Không cam kết):** Học viên từ chối cả hai hành động trên (được phân loại là chưa có mức sẵn lòng trả thực tế).
*Lưu ý bảo mật:* Không yêu cầu cung cấp số điện thoại hay thông tin liên hệ của bạn bè/người quen.

---

## 4. Mẫu bảng tổng hợp dữ liệu ẩn danh (Aggregate-only Table)

Tất cả dữ liệu thô sau phỏng vấn được tổng hợp vào bảng ẩn danh bên dưới. Tuyệt đối không ghi tên học viên, số điện thoại, email hay bất kỳ thông tin nhận dạng cá nhân (PII) nào vào bảng này.

| Mã học viên | Ngày phỏng vấn (YYYY-MM-DD) | Khoảng ngày đến thi | Gói lựa chọn | Mức ý định (1–5) | VW Quá rẻ (VND) | VW Rẻ (VND) | VW Đắt (VND) | VW Quá đắt (VND) | Bậc cam kết đạt được | Kênh tiếp cận |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| *(Chờ thu thập)* | | | | | | | | | | |

---

## 5. Quy định bảo mật dữ liệu và Vòng đời xử lý âm thanh (Audio Data Lifecycle)

Để bảo đảm tuân thủ nghiêm ngặt các quy định bảo vệ dữ liệu cá nhân tại Việt Nam (Luật 91/2025/QH15, Nghị định 356/2025/NĐ-CP) và các nguyên tắc bảo mật của dự án Vox Flow:

1. **Xin phép trước khi bắt đầu:** Trước khi bắt đầu phỏng vấn, người phỏng vấn đọc kịch bản xin phép: *"Buổi trò chuyện hôm nay phục vụ mục đích nghiên cứu sản phẩm và giá cho giải pháp luyện thi IELTS Speaking Vox Flow. Chúng tôi xin phép hỏi 2 câu hỏi riêng biệt: (1) Bạn có đồng ý tham gia buổi phỏng vấn không? và (2) Bạn có đồng ý cho phép ghi âm cục bộ cuộc gọi để ghi chép nội bộ không? Nếu bạn không muốn ghi âm, chúng tôi sẽ chỉ ghi chép bằng tay."*
2. **Lưu trữ ghi âm cục bộ có mã hóa và cấm AI đám mây:** Bản ghi âm buổi phỏng vấn (nếu có) chỉ được lưu trực tiếp trên thiết bị cá nhân của người phỏng vấn trong thư mục có mã hóa ổ đĩa. Tuyệt đối không tải tệp ghi âm lên các công cụ AI chuyển văn bản đám mây (Otter, Google Recorder, v.v.) để tránh phát sinh chuyển dữ liệu âm thanh ra nước ngoài trước khi có kết luận OQ-6, và không chia sẻ qua đường link đám mây mở.
3. **Thời hạn hủy dữ liệu ghi âm (14 ngày):** Trong vòng tối đa 14 ngày kể từ ngày diễn ra cuộc phỏng vấn, người phỏng vấn có trách nhiệm xóa vĩnh viễn toàn bộ các tệp ghi âm giọng nói gốc sau khi hoàn thành trích xuất dữ liệu ẩn danh vào bảng tổng hợp.
4. **Quyền rút lại sự đồng ý:** Người phỏng vấn công bố địa chỉ email liên hệ hỗ trợ của dự án ngay đầu buổi phỏng vấn để người tham gia có thể gửi yêu cầu rút lại sự đồng ý hoặc xóa dữ liệu bất kỳ lúc nào.

---

## 6. Hướng dẫn phê duyệt Gate A và Kích hoạt Phase 2

Tài liệu này hoàn tất phạm vi công việc của **Phase 1**. Phase 2 (Thu thập dữ liệu thực tế và kết luận) đang ở trạng thái `Blocked` chờ hai điều kiện ngoài đời thực:

1. **Phê duyệt Gate A (Chốt quy tắc ngưỡng):**
   - Người sở hữu sản phẩm (PO `@vinh19410`) xem xét bộ quy tắc ngưỡng đề xuất tại mục `Ngưỡng giữ giá` ở đầu tài liệu.
   - Khi đồng ý (hoặc sau khi điều chỉnh các tỷ lệ phần trăm), PO đăng một bình luận trên GitHub Issue #9 với cấu trúc:
     ```markdown
     Đã chốt ngưỡng: [Nội dung quy tắc ngưỡng giữ giá và đổi giá] ngày [YYYY-MM-DD].
     ```
2. **Triển khai Gate B (Phỏng vấn thực tế):**
   - Đội ngũ triển khai phỏng vấn đủ số lượng học viên mục tiêu theo kịch bản trên.
   - Tất cả các cuộc phỏng vấn hợp lệ phải có ngày diễn ra vào hoặc sau ngày chốt ngưỡng Gate A để bảo đảm tính trung thực khoa học.
   - Sau khi hoàn thành phỏng vấn và điền đủ bảng dữ liệu ẩn danh, Phase 2 sẽ được kích hoạt để phân tích số liệu, đưa ra kết luận giữ/đổi giá và cập nhật roadmap.
