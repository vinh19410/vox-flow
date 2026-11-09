# Hồ sơ câu hỏi tư vấn pháp lý (OQ-6)

> **Mục đích tài liệu:** Tài liệu này chuẩn bị nội dung câu hỏi và mô tả kiến trúc kỹ thuật để người sở hữu sản phẩm làm việc trực tiếp với luật sư chuyên về bảo vệ dữ liệu cá nhân (theo Luật Bảo vệ dữ liệu cá nhân và Nghị định liên quan). Tài liệu không chứa kết luận pháp lý của AI agent.
> **Trạng thái:** Hồ sơ câu hỏi sẵn sàng — chờ buổi làm việc chính thức với luật sư.
> **Ngày lập:** 2026-11-05
> **Dự án:** Vox Flow (ChấmRõ) — Nền tảng luyện thi IELTS Speaking với AI.

---

## 1. Giới thiệu bối cảnh hệ thống

Vox Flow (ChấmRõ) là ứng dụng web hỗ trợ người học luyện thi IELTS Speaking.
- **Hiện trạng triển khai trong mã nguồn:** Giao diện người dùng hiện ở mức bản mẫu (prototype) mô phỏng các màn hình thi và chấm điểm; chưa kết nối backend thực tế, chưa cấu hình bucket lưu trữ và chưa tích hợp API bên thứ ba.
- **Kiến trúc kỹ thuật dự kiến:**
  1. Học viên ghi âm câu trả lời trực tiếp trên trình duyệt (dự kiến sử dụng Web Audio API / MediaRecorder).
  2. Tệp âm thanh được tải lên máy chủ API qua kết nối HTTPS bảo mật.
  3. Lưu trữ âm thanh: dự kiến sử dụng dịch vụ lưu trữ đám mây (chưa cấu hình phân vùng lưu trữ, chưa chốt khu vực máy chủ).
  4. Chấm điểm và phân tích: dự kiến gửi âm thanh và transcript tới dịch vụ nhận dạng tiếng nói và mô hình AI đặt tại nước ngoài theo các phương án đang xem xét tại OQ-5 (chưa chọn nhà cung cấp chính thức, chưa ký thỏa thuận xử lý dữ liệu DPA hay cam kết không lưu giữ dữ liệu ZDR).
---

## 2. Danh mục 7 câu hỏi chính (OQ-6)

## Câu 1
Cá nhân vận hành sản phẩm có được hưởng miễn trừ nào không, và có nên đăng ký hộ kinh doanh trước khi thu tiền không?

- **Bối cảnh kỹ thuật / vận hành:** Hiện tại sản phẩm do cá nhân phát triển và vận hành thử nghiệm. Giai đoạn tiếp theo (Mục 08 & 15 trong roadmap) dự kiến tích hợp cổng thanh toán SePay để thu phí theo gói bài thi thử qua chuyển khoản ngân hàng tự động (VietQR).
- **Điểm cần luật sư làm rõ:**
  - Quy định tại Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP về thương mại điện tử có bắt buộc cá nhân phải đăng ký Hộ kinh doanh hoặc thành lập Doanh nghiệp trước khi mở bán gói dịch vụ trên website không?
  - Nghĩa vụ thuế thu nhập cá nhân và đăng ký kinh doanh theo Luật Quản lý thuế số 38/2019/QH14.
  - Tư cách pháp nhân/thể nhân ảnh hưởng thế nào đến nghĩa vụ bảo vệ dữ liệu cá nhân (nghĩa vụ của "Bên Kiểm soát dữ liệu cá nhân" hoặc "Bên Kiểm soát và xử lý dữ liệu cá nhân").

## Câu 2
Giọng nói dùng để chấm bài có phải dữ liệu nhạy cảm không?

- **Bối cảnh kỹ thuật / vận hành:** Tệp âm thanh chứa giọng nói của học viên đọc các câu trả lời tiếng Anh. Giọng nói được sử dụng để phân tích ngữ âm, phát âm (phoneme evaluation), độ trôi chảy (fluency) và nhận dạng nội dung bài nói (ASR).
- **Điểm cần luật sư làm rõ:**
  - Dữ liệu giọng nói trong trường hợp này có bị phân loại là "dữ liệu sinh trắc học" (biometric data) thuộc nhóm dữ liệu cá nhân nhạy cảm theo quy định pháp luật Việt Nam không?
  - Nếu là dữ liệu cá nhân nhạy cảm, các yêu cầu bổ sung bắt buộc gồm những gì (văn bản đồng ý riêng biệt, thông báo trước khi xử lý, biện pháp kỹ thuật bảo vệ)?

## Câu 3
Hồ sơ chuyển dữ liệu ra nước ngoài có được miễn không?

- **Bối cảnh kỹ thuật / vận hành:** Âm thanh của học viên được chuyển tới máy chủ của các nhà cung cấp AI đặt ngoài lãnh thổ Việt Nam (ví dụ máy chủ của Microsoft Azure tại khu vực Đông Nam Á / Mỹ, máy chủ của SpeechSuper, máy chủ của Anthropic Claude).
- **Điểm cần luật sư làm rõ:**
  - Có trường hợp miễn trừ nào áp dụng cho cá nhân, doanh nghiệp siêu nhỏ, hoặc sản phẩm giáo dục/công nghệ đang trong giai đoạn thử nghiệm không?
  - Nếu không được miễn trừ, các thành phần hồ sơ bắt buộc gồm những gì theo Mẫu quy định của Bộ Công an (Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao - A05)?

## Câu 4
Hồ sơ nộp sau khi bắt đầu chuyển dữ liệu hay phải được duyệt trước?

- **Bối cảnh kỹ thuật / vận hành:** Dự án cần xác định quy trình và lịch trình nộp hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài để không làm gián đoạn kế hoạch mở thử nghiệm cho học viên.
- **Điểm cần luật sư làm rõ:**
  - Thủ tục nộp hồ sơ là cơ chế hậu kiểm (gửi hồ sơ trong thời hạn 60 ngày kể từ ngày bắt đầu chuyển dữ liệu) hay tiền kiểm (phải có chấp thuận/phê duyệt của cơ quan quản lý trước khi tệp âm thanh đầu tiên rời khỏi Việt Nam)?
  - Nếu là hậu kiểm, hệ thống có được quyền chuyển dữ liệu ngay khi học viên đồng ý trong thời gian chờ cơ quan quản lý phản hồi hay không?

## Câu 5
Điều 24 có áp dụng cho học viên dưới 16 tuổi không, và ghi trong điều khoản sử dụng có đủ không?

- **Bối cảnh kỹ thuật / vận hành:** Người học luyện thi IELTS tại Việt Nam có tỷ lệ đáng kể là học sinh THCS và THPT (độ tuổi từ 13 đến 18 tuổi).
- **Điểm cần luật sư làm rõ:**
  - Quy định về xử lý dữ liệu cá nhân của trẻ em (dưới 16 tuổi theo Luật Trẻ em 2016 và quy định bảo vệ dữ liệu cá nhân): Cần có sự đồng ý của ai (trẻ em từ đủ 7 tuổi và cha/mẹ hoặc người giám hộ)?
  - Việc đưa điều khoản thỏa thuận vào "Điều khoản dịch vụ" (Terms of Service) dạng click-through (tích chọn đồng ý khi đăng ký tài khoản) có giá trị pháp lý ràng buộc đối với người dưới 16 tuổi không?
  - Sản phẩm có bắt buộc phải xây dựng quy trình xác minh độ tuổi (age-gating) và thu thập chữ ký/đồng ý xác thực của phụ huynh không?

## Câu 6
Thu thập đề từ web có rủi ro bản quyền gì không?

- **Bối cảnh kỹ thuật / vận hành:** Mục 19 trong roadmap (`forecast-curation`) dự kiến xây dựng công cụ thu thập đề thi IELTS Speaking Forecast (các chủ đề thường gặp trong quý) từ các diễn đàn, nhóm học tập và trang mạng công cộng để biên tập thành bộ đề luyện thi trong hệ thống.
- **Điểm cần luật sư làm rõ:**
  - Các câu hỏi thi IELTS (ví dụ: các chủ đề Part 1, Part 2 cue cards, Part 3) do thí sinh ghi nhớ và chia sẻ lại trên mạng xã hội có được bảo hộ quyền tác giả theo Luật Sở hữu trí tuệ không?
  - Việc hệ thống tổng hợp, phân loại, biên tập lại và cung cấp cho người dùng thi thử (có thu phí gói) có tạo ra rủi ro khiếu nại bản quyền từ chủ sở hữu bài thi IELTS (IDP, Hội đồng Anh, Cambridge) hoặc từ các đơn vị tổng hợp đề thi khác không?
  - Cần áp dụng biện pháp miễn trừ hoặc biên soạn lại (paraphrasing/original prompt design) ở mức độ nào để bảo đảm an toàn pháp lý?

## Câu 7
Học viên có quyền yêu cầu xóa dữ liệu không, trong thời hạn nào, và sản phẩm có bắt buộc phải có nút xóa chủ động không?

- **Bối cảnh kỹ thuật / vận hành:** Mục 11 trong roadmap (`privacy-controls`) thiết kế tính năng quản lý quyền riêng tư. Hiện có sự không thống nhất giữa bản sao giao diện mẫu và quyết định roadmap:
  - Trên giao diện prototype (`consent-rows.tsx:8`), mô tả công tắc ghi: *"Tắt thì bài sẽ bị xóa sau khi bạn đóng màn kết quả."*
  - Tuy nhiên, tại `docs/roadmap-work-items.md` (hàng 11), quyết định đã chốt là: *"Không tự xóa bài khi tắt lưu; luồng chủ động xóa dữ liệu đang hold, chờ 04."*
  - Khoảng trống giữa cam kết hiển thị với học viên và cơ chế lưu trữ thực tế cần được luật sư làm rõ để chuẩn hóa trước khi triển khai WI11.
- **Điểm cần luật sư làm rõ:**
  - Thời hạn luật định hệ thống phải thực hiện khi người dùng yêu cầu rút lại sự đồng ý hoặc yêu cầu xóa dữ liệu cá nhân là bao lâu theo quy định pháp luật?
  - Ứng dụng có bắt buộc phải cung cấp nút tự phục vụ "Xóa tài khoản và dữ liệu" trực tiếp trên giao diện người dùng không, hay chỉ cần cung cấp kênh tiếp nhận yêu cầu (email hỗ trợ)?
  - Nghĩa vụ yêu cầu các bên thứ ba (các nhà cung cấp AI ở nước ngoài đã nhận audio/transcript) xóa dữ liệu tương ứng được quy định như thế nào?
---

## 3. Các câu hỏi bổ sung do đội ngũ kỹ thuật đề xuất

### Bổ sung A: Đối chiếu điều khoản chuyển dữ liệu ra nước ngoài và trẻ em giữa Luật 91/2025/QH15, Nghị định 356/2025 và Nghị định 13/2023/NĐ-CP
- **Vấn đề:** Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định số 356/2025/NĐ-CP đã có hiệu lực thi hành từ ngày 01/01/2026 (thay thế Nghị định 13/2023/NĐ-CP). Các tài liệu kỹ thuật ban đầu có sự viện dẫn đan xen giữa các điều khoản cũ và mới.
- **Câu hỏi cho luật sư:** Xin luật sư xác định chính xác số điều, văn bản pháp luật hiện hành áp dụng trực tiếp cho:
  1. Đánh giá tác động chuyển dữ liệu cá nhân ra nước ngoài và thời hạn 60 ngày kể từ lần chuyển đầu tiên.
  2. Quy định bảo vệ dữ liệu cá nhân của trẻ em (học viên dưới 16 tuổi).
### Bổ sung B: Thử nghiệm 30 bài mẫu có đồng ý bằng văn bản (OQ-5) có kích hoạt thời hạn 60 ngày nộp hồ sơ không?
- **Vấn đề:** Để chuẩn bị cho tính năng chấm điểm (`scoring-results`), dự án dự kiến chạy thử nghiệm trên 30 bài mẫu của tình nguyện viên đã ký cam kết đồng ý bằng văn bản nhằm so sánh độ chính xác của các dịch vụ nhận dạng tiếng nói và AI (Work Item 03).
- **Câu hỏi cho luật sư:** Việc gửi 30 tệp âm thanh mẫu này sang các máy chủ API ở nước ngoài (Azure, SpeechSuper, Anthropic) với mục đích đo lường nội bộ kỹ thuật có được coi là "lần chuyển dữ liệu cá nhân đầu tiên ra nước ngoài" làm kích hoạt đồng hồ đếm ngược 60 ngày nộp hồ sơ đánh giá tác động lên Bộ Công an hay không?

### Bổ sung C: Thẩm quyền và cơ chế xác thực sự đồng ý của cha mẹ/người giám hộ đối với học viên dưới 16 tuổi
- **Vấn đề:** Nếu học viên khai báo ngày sinh dưới 16 tuổi trong màn hình Onboarding:
- **Câu hỏi cho luật sư:**
  1. Hệ thống cần thiết kế phương thức xác thực sự đồng ý của cha mẹ như thế nào (qua email xác nhận của phụ huynh, tải lên giấy ủy quyền/giấy khai sinh, hay tin nhắn OTP)?
  2. Trường hợp hệ thống chưa kịp triển khai cơ chế xác thực phụ huynh phức tạp trong giai đoạn MVP, giải pháp an toàn pháp lý có phải là tạm thời giới hạn độ tuổi đăng ký chỉ dành cho người từ đủ 16 tuổi trở lên hay không?

### Bổ sung D: Phân định pháp lý giữa "Hiệu chuẩn chấm điểm" (Calibration) và "Huấn luyện AI" (AI Training) đối với dữ liệu giọng nói
- **Vấn đề:** Giao diện Onboarding và cài đặt quyền riêng tư hiện có lựa chọn: "Cho phép dùng giọng nói để cải thiện AI: Ẩn danh và chỉ dùng để hiệu chuẩn chấm điểm. Mặc định tắt — không ảnh hưởng tính năng nào."
- **Câu hỏi cho luật sư:**
  1. Việc dùng thuật ngữ "Hiệu chuẩn chấm điểm" (dùng mẫu để kiểm thử độ lệch band điểm nội bộ) có được coi là cùng bản chất với "Huấn luyện mô hình AI" (Model Training) theo quy định về mục đích xử lý dữ liệu không?
  2. Việc gửi âm thanh tới API thương mại của bên thứ ba (như Anthropic Claude, Azure) có yêu cầu học viên phải đồng ý riêng về việc nhà cung cấp API có thể lưu giữ tạm thời bản ghi nhật ký (logging) để giám sát an toàn hay không?

### Bổ sung E: Điều khoản lưu giữ dữ liệu (Zero Data Retention - ZDR), khu vực máy chủ xử lý và thỏa thuận xử lý dữ liệu (DPA) với bên thứ ba
- **Vấn đề:** Hệ thống dự kiến kết nối với API của Microsoft Azure Speech, SpeechSuper và Anthropic.
- **Câu hỏi cho luật sư:**
  1. Dự án có bắt buộc phải ký kết Thỏa thuận Xử lý Dữ liệu (DPA - Data Processing Agreement) hoặc Điều khoản hợp đồng tiêu chuẩn (SCC) với từng nhà cung cấp nước ngoài trước khi gửi âm thanh của người dùng không?
  2. Việc kích hoạt chính sách không lưu giữ dữ liệu (Zero Data Retention) của nhà cung cấp có giúp giảm nhẹ trách nhiệm trong hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài không?

---

## 4. Luồng dữ liệu kỹ thuật và các bên xử lý

Sơ đồ mô tả luồng di chuyển dữ liệu âm thanh và văn bản dự kiến của học viên:

```
[Trình duyệt học viên] 
       │ (1. Dự kiến: Trình duyệt thu âm giọng nói học viên)
       ▼ (2. Dự kiến: Truyền qua kết nối bảo mật HTTPS về máy chủ API)
[Máy chủ API backend]
       │
       ├───► [Dịch vụ lưu trữ tệp đám mây] 
       │     (Dự kiến: Lưu audio nếu học viên bật lưu; hiện chưa cấu hình vùng lưu trữ)
       │
       ├───► [Dịch vụ nhận dạng giọng nói ASR / Phát âm]
       │     (Dự kiến: Một trong các ứng viên theo OQ-5 — máy chủ đặt ngoài Việt Nam)
       │     (Hiện CHƯA chốt nhà cung cấp và CHƯA có thỏa thuận DPA)
       │
       └───► [Mô hình ngôn ngữ lớn LLM]
             (Dự kiến: Gửi transcript chấm điểm — máy chủ đặt tại nước ngoài)
             (Hiện CHƯA có thỏa thuận Zero Data Retention ký kết)
```

- **Ghi chú về tính sẵn sàng:** Toàn bộ các chặng trên hiện ở mức thiết kế kỹ thuật dự kiến; mã nguồn hiện tại của dự án chưa tích hợp kết nối thực tế tới bất kỳ dịch vụ lưu trữ hoặc API AI nào ở nước ngoài.
- **Rủi ro dữ liệu cá nhân nói (Verbal PII):** Trong bài thi IELTS Speaking Part 1, học viên thường tự giới thiệu họ tên, quê quán, trường học, nghề nghiệp hoặc nơi làm việc. Do đó, cả tệp âm thanh và bản ghi lời thoại đều có khả năng chứa thông tin định danh cá nhân trực tiếp.

---

## 5. Căn cứ pháp lý cần luật sư xác nhận

*(Phần này ghi nhận các văn bản pháp luật mà đội ngũ kỹ thuật đang tham chiếu để luật sư rà soát và hiệu chỉnh chính thức):*
1. **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** và **Nghị định số 356/2025/NĐ-CP** (đã có hiệu lực thi hành từ ngày 01/01/2026, thay thế Nghị định 13/2023/NĐ-CP).
2. **Nghị định 13/2023/NĐ-CP** (tham chiếu lịch sử đối với các điều khoản chuyển tiếp).
3. **Luật Trẻ em số 102/2016/QH13** ngày 05/04/2016.
4. **Luật An ninh mạng số 24/2018/QH14** ngày 12/06/2018 và Nghị định số 53/2022/NĐ-CP.
5. **Nghị định số 52/2013/NĐ-CP** và **Nghị định số 85/2021/NĐ-CP** về thương mại điện tử.
6. **Luật Sở hữu trí tuệ số 50/2005/QH11** (sửa đổi, bổ sung năm 2009, 2019, 2022).
---

## 6. Ma trận phân công đầu việc sau tư vấn

| Câu hỏi | Hạng mục ảnh hưởng trực tiếp | Người phụ trách dự kiến | Tác động kỹ thuật / vận hành |
|---|---|---|---|
| **Câu 1** | WI08: `sepay-setup` | PO / Vận hành | Quyết định mở tài khoản Hộ kinh doanh hay cá nhân trước khi tích hợp cổng nạp tiền. |
| **Câu 2, 3, 4** | WI17: `first-real-students-gate` | PO & Luật sư | Lập và nộp hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài tới Cục A05; chốt thời điểm mở cổng học viên thật. |
| **Câu 5, Bổ sung C** | WI10: `onboarding` & WI11: `privacy-controls` | Kỹ thuật (Frontend/Backend) | Thêm chặn tuổi dưới 16 hoặc luồng xác minh sự đồng ý của cha mẹ. |
| **Câu 6** | WI19: `forecast-curation` | Kỹ thuật & Nội dung | Xác định quy trình biên tập lại đề thi web để tránh rủi ro vi phạm bản quyền. |
| **Câu 7, Bổ sung D, E** | WI11: `privacy-controls` & WI13: `scoring-results` | Kỹ thuật (Backend) | Hoàn thiện luồng xóa dữ liệu F-21; cấu hình hợp đồng ZDR và DPA với các nhà cung cấp AI. |
