Nguồn: dựng lại ngày 2026-11-05; không có PRD gốc, người sở hữu xác nhận ngày 2026-11-05
Nguồn quyết định: docs/product-decisions.md

# PRD — Vox Flow: IELTS Speaking AI

---

## 1. Tầm nhìn & Mục tiêu sản phẩm [PRD-trích] [D-01]

- **Tên sản phẩm:** [D-01] Tên sản phẩm chính thức là **Vox Flow** trên cả giao diện người dùng và kỹ thuật/repository (`@vox-flow/*`).
- **Tầm nhìn:** Giúp học viên luyện thi IELTS Speaking nâng band tự tin thông qua việc thi thử với giám khảo AI và nhận kết quả chấm điểm minh bạch, có khoảng tin cậy và trích dẫn bằng chứng cụ thể cho từng nhận định [Feature map].
- **Chỉ số thành công cốt lõi (North Star):**
  - Tỷ lệ học viên thực hiện hành động "Luyện lại câu yếu" sau khi nhận kết quả chấm [PRD-trích] [D-05].
  - 60% học viên đăng ký hoàn thành bài thi thử đầu tiên [PRD-trích Mục 8].
  - Có học viên trả phí đầu tiên [PRD-trích Mục 8].
  - ≥ 90% bài chấm có độ chênh giữa 3 lần chấm độc lập ≤ 0.5 band [PRD-trích Mục 8].
  - ≥ 80% bài lệch trong khoảng 0.5 band so với điểm giám khảo người chấm thật [PRD-trích OQ-5].
  - 30% học viên luyện từ 3 ngày/tuần trở lên [PRD-trích Mục 8].
  - Dưới 3% lượt thi phát sinh báo lỗi chấm điểm [PRD-trích Mục 8].
  - 100% báo lỗi chấm điểm được phản hồi trong vòng 72 giờ [PRD-trích 7.4] [D-09].

---

## 2. Người dùng mục tiêu & Phân định vai trò [PRD-trích]

### 2.1. Học viên (Student) [PRD-trích]
- Người chuẩn bị thi IELTS (Academic/General). Phân khúc band mục tiêu cụ thể: [chưa có].
- Cần môi trường thi thử phản xạ tự nhiên, không áp lực tâm lý như gặp người thật, nhận kết quả ngay và hiểu rõ điểm yếu để sửa.
- **Xác thực:** [D-03] [Feature map F-02] Đăng nhập duy nhất bằng tài khoản Google OAuth. Không hỗ trợ email magic link hay tài khoản mật khẩu trong MVP.

### 2.2. Quản trị viên / Người sở hữu sản phẩm (Admin / PO) [OQ-2] [OQ-4] [D-07] [D-09]
- Người vận hành hệ thống, có chuyên môn chấm thi IELTS.
- **Ranh giới vai trò (RBAC):** [D-07] [D-09]
  - Quản trị viên duyệt và biên tập đề forecast quý (F-13, GAP-04, OQ-2).
  - Tiếp nhận và xử lý hàng đợi báo lỗi chấm điểm của học viên (F-12, GAP-03, OQ-4).
  - **Quy tắc an toàn ủy quyền:** Học viên dùng tài khoản Google tuyệt đối không thể truy cập các chức năng quản trị duyệt đề forecast hay xử lý báo lỗi điểm thi. Thiết kế kỹ thuật cụ thể thuộc phạm vi của WI-19 và WI-25.

---

## 3. Phạm vi sản phẩm (Scope) [D-02]

### 3.1. Phạm vi MVP v1 (Giai đoạn Now & Next) [D-02]
Bao gồm 21 tính năng từ Feature Map và 6 khoảng trống nghiệp vụ (GAP), phân kỳ theo 2 giai đoạn:
1. **Giai đoạn Now — Vòng lõi chạy thật từ đầu đến cuối:**
   - Landing page giới thiệu giá trị [F-01]
   - Onboarding: Đăng nhập Google, thiết lập mục tiêu band & ngày thi, test mic [F-02, F-03, F-04] [D-03]
   - Quản trị quyền riêng tư dữ liệu & 2 công tắc đồng ý [F-05, F-21] [D-10]
   - Thi thử Full Test & từng Part với giám khảo AI, ghi âm thật [F-06, F-07, F-08, GAP-01]
   - Chấm điểm 3 lần độc lập, lấy trung vị và khoảng tin cậy [F-09, GAP-01]
   - Xem kết quả: Band tổng & bằng chứng câu yếu nhất miễn phí, chi tiết 4 tiêu chí sau paywall [F-10, F-11] [D-04, D-05]
   - Hạn mức lượt miễn phí 3 điểm/ngày kèm trần hệ thống [GAP-06, OQ-1]
   - Mua gói & thanh toán QR tự động kích hoạt [F-18, F-19, GAP-02]
   - Quản lý gói & xuất biên nhận thanh toán [F-20] [D-11]
   - Đối soát thanh toán xử lý ngoại lệ [GAP-02]
2. **Giai đoạn Next — Hoàn thiện trải nghiệm giữ chân học viên:**
   - Theo dõi tiến độ band & biểu đồ theo thời gian [F-16, F-17]
   - Luyện đề forecast theo quý & gợi ý độ phủ [F-13, F-14]
   - Công cụ admin cập nhật đề forecast 3 nguồn [GAP-04, OQ-2] [D-07]
   - Việc luyện mỗi ngày & chuỗi ngày [F-15]
   - Nhắc luyện qua email & thông báo đẩy tối đa 1 lần/ngày [GAP-05, OQ-3] [D-08]
   - Báo lỗi chấm điểm kèm audio/transcript [F-12]
   - Quy trình xử lý báo lỗi bản tối thiểu, cam kết 72h [GAP-03 tối thiểu, OQ-4] [D-09]
   - Báo band điểm thi thật sau ngày thi [D-06]

### 3.2. Ngoài phạm vi v1 (Later / Could) [D-02] [D-12]
- Gói dành cho giáo viên / trung tâm (`teacher-plan`) [D-12] [PRD-trích].
- Quy trình xử lý báo lỗi mở rộng phân công nhiều giám khảo cộng tác viên [GAP-03 mở rộng].
- Ứng dụng di động native trên App Store / Google Play (v1 chạy Web responsive / PWA).
- Hỗ trợ các phương thức đăng nhập khác ngoài Google [D-03].
- Xuất hóa đơn đỏ VAT (v1 chỉ cung cấp biên nhận điện tử) [D-11].

---

## 4. Đặc tả luồng tính năng chi tiết

### 4.1. Thu hút & Onboarding [Feature map F-01..F-05]
- **F-01 Landing page:** [Feature map S01] Thể hiện rõ giá trị cốt lõi: thi thử IELTS Speaking với AI, chấm 3 lần khách quan, thấy bằng chứng câu nói. Lời hứa hạn mức: "Miễn phí band tổng và phân tích câu yếu mỗi ngày; mở rộng chi tiết với gói trả phí". Không dùng thông điệp "không giới hạn" gây hiểu lầm.
- **F-02 Đăng nhập Google:** [Feature map S02] [D-03] Nút "Tiếp tục với Google". Tự động tạo hồ sơ học viên lần đầu đăng nhập.
- **F-03 Thiết lập mục tiêu:** [Feature map S03] Học viên chọn band mục tiêu (5.0 – 9.0) và ngày thi dự kiến. Dữ liệu này dùng để tính nhịp luyện tập hằng ngày và nhắc báo điểm thật sau ngày thi [D-06].
- **F-04 Kiểm tra micro 5 giây:** [Feature map S04] Thu âm 5 giây và phát lại để học viên tự kiểm tra chất lượng mic trước khi bước vào phòng thi.
- **F-05 Quản lý quyền riêng tư & Đồng ý dữ liệu:** [Feature map S05] [D-10]
  - Cung cấp 2 công tắc tách biệt hoàn toàn, mặc định đều TẮT:
    1. Công tắc 1: *Lưu trữ bài nói và bản gỡ băng để xem lại lịch sử và theo dõi tiến độ*.
    2. Công tắc 2: *Đóng góp bài nói ẩn danh để hiệu chuẩn mô hình chấm điểm* [D-10].
  - Học viên có thể thay đổi tùy chọn bất kỳ lúc nào trong màn hình Cài đặt cá nhân.

### 4.2. Phòng thi thử AI [Feature map F-06..F-08, GAP-01]
- **F-06 Chọn chế độ thi:** [Feature map S07]
  - Full Test (khoảng 12–15 phút, gồm đủ Part 1, Part 2, Part 3) — Tiêu tốn 3 điểm hạn mức miễn phí [OQ-1].
  - Luyện riêng Part 1, Part 2, hoặc Part 3 — Tiêu tốn 1 điểm hạn mức/lượt [OQ-1].
  - Chọn giọng giám khảo AI (Anh – Anh, Anh – Mỹ, Anh – Úc).
- **F-07 Giao diện phòng thi:** [Feature map S08–S10]
  - Giám khảo AI đọc câu hỏi bằng giọng nói tự nhiên.
  - Part 2 có cue card hiển thị rõ ràng, đồng hồ đếm ngược 1 phút chuẩn bị kèm ô nháp ghi chú, sau đó tự động chuyển sang 2 phút nói.
  - Câu hỏi nối tiếp linh hoạt dựa trên câu trả lời của thí sinh.
- **F-08 Cảnh báo độ dài:** [Feature map S10] Nếu câu trả lời quá ngắn (< 3 từ hoặc dưới 3 giây), hệ thống hiện cảnh báo nhắc nhở trước khi chuyển câu.
- **GAP-01 Thu âm & truyền tải:** Thu âm định dạng Opus/WebM từ trình duyệt, đảm bảo chất lượng âm thanh để chuyển tiếp xử lý ASR và chấm điểm.

### 4.3. Chấm điểm & Báo cáo kết quả [Feature map F-09..F-12] [D-04, D-05]
- **F-09 Cơ chế chấm 3 lần:** [Feature map S11]
  - Mỗi bài nói được chấm 3 lần độc lập bởi AI evaluator. Điểm chính thức là trung vị (median) của 3 lần chấm.
  - Hiển thị khoảng tin cậy (Confidence Interval, ví dụ: "Band 6.5 (độ tin cậy: 6.5 – 7.0)").
- **F-10 Hạn mức miễn phí:** [Feature map S12] [OQ-1] [GAP-06]
  - Mỗi học viên miễn phí được cấp 3 điểm/ngày (đặt lại lúc 00:00 giờ Việt Nam).
  - Hệ thống áp dụng trần ngân sách AI toàn hệ sinh thái khoảng 33.000đ/ngày (tương đương ngân sách AI < 1 triệu đồng/tháng). Khi chạm trần, học viên miễn phí được thông báo quay lại vào ngày hôm sau; học viên trả phí không bị giới hạn bởi trần này.
- **F-11 Trả kết quả & Phân tách Paywall:** [Feature map S13–S14] [D-04] [D-05]
  - **Miễn phí xem:**
    - Điểm Band tổng thể (Overall Band) và khoảng tin cậy.
    - Phân tích chi tiết kèm bằng chứng trích dẫn câu nói của **duy nhất 1 câu yếu nhất** trong bài thi [D-04].
    - Nút hành động North Star: **"Luyện lại câu này"** [D-05] cho phép học viên ghi âm lại ngay câu yếu để cải thiện phản xạ.
  - **Khóa sau Paywall (Gói trả phí hoặc dùng 1 lượt mở bài):**
    - Chi tiết 4 tiêu chí chấm thi IELTS: Fluency & Coherence (FC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA), Pronunciation (PR).
    - Toàn bộ bằng chứng trích dẫn, lỗi sai ngữ pháp/từ vựng kèm đề xuất sửa câu cho toàn bộ bài thi.
  - **Quy tắc an toàn dữ liệu máy chủ (Data Minimization):** [D-04] Backend API tuyệt đối không gửi dữ liệu 4 tiêu chí bị khóa về client cho các bài thi chưa được mở khóa.

### 4.4. Đề forecast & Luyện tập hằng ngày [Feature map F-13..F-15, GAP-04, GAP-05] [D-07, D-08]
- **F-13 & F-14 Luyện đề forecast theo quý:** [Feature map S07b]
  - Danh mục đề thi Speaking cập nhật theo quý (Q1, Q2, Q3).
  - Lọc theo chủ đề, lưu danh sách cần ôn tập, hiển thị tỷ lệ bao phủ đề (% đã luyện).
- **GAP-04 Công cụ quản trị đề forecast:** [D-07] [OQ-2]
  - Dành riêng cho Người sở hữu sản phẩm (Admin).
  - Thu nạp đề từ 3 nguồn: (1) Tự soạn bởi Admin, (2) Học viên báo gặp trong phòng thi thật, (3) Thu thập từ các nguồn web công khai.
  - AI hỗ trợ lọc trùng, gợi ý chuẩn hóa. Mọi đề thu thập từ web phải được viết lại câu hỏi, lưu liên kết nguồn gốc để đảm bảo bản quyền và kiểm duyệt an toàn nội dung.
  - Mọi đề bắt buộc phải có xác nhận phê duyệt của Admin trước khi hiển thị cho học viên.
- **F-15 Việc hôm nay & Nhịp luyện:** [Feature map S06] Gợi ý nhiệm vụ luyện tập ngắn mỗi ngày dựa trên điểm yếu bài trước và ngày thi mục tiêu, duy trì chuỗi ngày học liên tục (Streak).
- **GAP-05 Nhắc luyện tập:** [D-08] [OQ-3]
  - Gửi lời nhắc qua Web Push (nếu đã cấp quyền) hoặc Email vào khung giờ học viên đã cài đặt.
  - Tần suất: Tối đa 1 thông báo/ngày. Nếu học viên không tương tác trong 7 ngày liên tiếp, tự động giảm tần suất xuống 1 lần/tuần.
  - Thông báo sắp hết hạn gói trả phí gửi trước 3 ngày và vào ngày hết hạn.

### 4.5. Phản biện & Báo lỗi chấm điểm [Feature map F-12, GAP-03] [D-09]
- **F-12 Gửi báo lỗi:** [Feature map S15] Học viên có thể gửi khiếu nại nếu nhận thấy điểm chấm bất thường, đính kèm đoạn âm thanh và bản gỡ băng cụ thể.
- **GAP-03 Quy trình xử lý tối thiểu (Next):** [D-09] [OQ-4]
  - Hàng đợi khiếu nại dành cho Admin (Người sở hữu sản phẩm trực tiếp xử lý với chuyên môn IELTS).
  - Kiểm tra trạng thái đồng ý dữ liệu của học viên trước khi nghe lại audio.
  - Cam kết phản hồi trong vòng 72 giờ: nếu khiếu nại đúng, Admin cập nhật lại điểm band chính thức cho bài thi.

### 4.6. Gói dịch vụ, Thanh toán & Biên nhận [Feature map F-18..F-20, GAP-02] [D-11]
- **F-18 Bốn gói dịch vụ:** [Feature map S22]
  1. *Gói theo lượt:* 49.000đ — 3 lượt mở chi tiết bài thi, không giới hạn thời gian sử dụng.
  2. *Gói tuần:* 99.000đ — 7 ngày mở chi tiết không giới hạn.
  3. *Gói tháng:* 249.000đ — 30 ngày mở chi tiết không giới hạn.
  4. *Gói đến ngày thi:* 349.000đ — Sử dụng đến ngày thi đã đăng ký (tối đa 60 ngày), tự động kết thúc không tự gia hạn.
- **F-19 Thanh toán mã QR:** [Feature map S23] [GAP-02]
  - Tích hợp cổng chuyển khoản ngân hàng SePay quét mã VietQR tự động kích hoạt tài khoản ngay khi nhận được tiền.
- **F-20 Quản lý gói & Biên nhận thanh toán:** [Feature map S24] [D-11]
  - Hiển thị gói đang kích hoạt, ngày hết hạn hoặc số lượt mở chi tiết còn lại.
  - Tự động xuất "Biên nhận thanh toán" điện tử với mã giao dịch SePay, thời gian và số tiền. Chưa xuất hóa đơn VAT trong v1 [D-11].
- **GAP-02 Đối soát thanh toán:** Hỗ trợ quy trình kiểm tra và xử lý thủ công các giao dịch sai nội dung chuyển khoản hoặc trễ webhook.

### 4.7. Quản lý dữ liệu cá nhân & Quyền riêng tư [Feature map F-21] [D-10]
- **F-21 Xuất và Xóa dữ liệu:** [Feature map S25]
  - Học viên có quyền tải về toàn bộ dữ liệu lịch sử bài làm và bản gỡ băng ở định dạng JSON.
  - Học viên có quyền yêu cầu xóa dữ liệu cá nhân; quy trình và cam kết thời hạn xóa chủ động đang hold, chờ kết quả tư vấn luật sư tại OQ-6 / #8 [hold].
## 5. Yêu cầu phi chức năng & Bảo mật [PRD-trích]

### 5.1. Bảo vệ dữ liệu cá nhân & Chuyển dữ liệu quốc tế [D-10] [OQ-6]
- Tuân thủ khung pháp lý bảo vệ dữ liệu cá nhân tại Việt Nam (Luật 91/2025/QH15 và Nghị định 356/2025 thay thế Nghị định 13/2023 từ 01/01/2026).
- Việc chuyển dữ liệu giọng nói học viên tới các nhà cung cấp dịch vụ AI/ASR quốc tế (Azure, Anthropic, OpenAI) tuân thủ yêu cầu đánh giá tác động chuyển dữ liệu ra nước ngoài (Điều 20).
- Các câu hỏi pháp lý chi tiết (quy định Điều 24 đối với học viên dưới 16 tuổi, phân loại giọng nói là dữ liệu nhạy cảm, quy trình đăng ký hộ kinh doanh) liên kết theo dõi tại OQ-6 và Work Item 04 (#8).

### 5.2. An toàn phân quyền & Kiểm soát truy cập
- **Ranh giới Admin:** [D-07] [D-09] Bảo vệ các chức năng duyệt đề forecast và xử lý báo lỗi, tách biệt hoàn toàn khỏi quyền hạn của học viên; thiết kế kỹ thuật cụ thể thuộc WI-19 và WI-25.

### 5.3. Hiệu năng & Độ trễ
- Tốc độ nhận diện giọng nói, độ trễ phản hồi và thời gian trả kết quả chấm: [chưa có] (sẽ đo đạc và xác định chính thức qua thử nghiệm GAP-01 và OQ-5).

---

## 6. Theo dõi vết quyết định (Decision Trace)

Mọi quyết định điều chỉnh trong tài liệu này đều bắt nguồn từ `docs/product-decisions.md` do Người sở hữu sản phẩm phê duyệt:
- [D-01]: Tên sản phẩm chính thức là "Vox Flow" trên cả UI và kỹ thuật (Chốt: vinh19410 xác nhận, 2026-11-05)
- [D-02]: Phạm vi MVP v1 bám sát Feature Map 2026-11-04 và Roadmap Now/Next (Chốt: vinh19410 xác nhận, 2026-11-04)
- [D-03]: Đăng nhập duy nhất Google OAuth trong MVP (Chốt: vinh19410 xác nhận, 2026-11-04)
- [D-04]: Miễn phí bằng chứng câu yếu nhất và band tổng; khóa toàn bộ 4 tiêu chí sau paywall (Chốt: vinh19410 xác nhận, 2026-11-05)
- [D-05]: Giữ hành động North Star "Luyện lại câu yếu" thuộc màn hình kết quả `scoring-results` (Chốt: vinh19410 xác nhận, 2026-11-05)
- [D-06]: Giữ tính năng nhập band thật sau ngày thi ở giai đoạn Next (Chốt: vinh19410 xác nhận, 2026-11-05)
- [D-07]: Công cụ admin đề forecast do PO vận hành, tổng hợp 3 nguồn và kiểm duyệt chặt chẽ (Chốt: vinh19410 xác nhận, 2026-11-05 theo OQ-2)
- [D-08]: Nhắc luyện thuộc MVP, hỗ trợ email và thông báo đẩy với giới hạn 1 lần/ngày (Chốt: vinh19410 xác nhận, 2026-11-05 theo OQ-3)
- [D-09]: Xử lý báo lỗi bản tối thiểu đưa lên Next do PO trực tiếp phụ trách trong 72 giờ (Chốt: vinh19410 xác nhận, 2026-11-05 theo OQ-4)
- [D-10]: Dùng 2 công tắc tách biệt mặc định TẮT. Nhãn công tắc 2 là "Hiệu chuẩn chấm điểm", cam kết không huấn luyện mô hình nền; chờ kết quả tư vấn OQ-6 / #8 (Chốt: vinh19410 xác nhận, 2026-11-05)
- [D-11]: Cung cấp biên nhận thanh toán điện tử, chưa xuất hóa đơn VAT trong v1 (Chốt: vinh19410 xác nhận, 2026-11-05)
- [D-12]: Xếp gói giáo viên (`teacher-plan`) vào giai đoạn Later (Could) (Chốt: vinh19410 xác nhận, 2026-11-05)
