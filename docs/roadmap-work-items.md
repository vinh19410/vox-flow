---
type: roadmap-work-items
status: draft
updated: 2026-11-13
links: [docs/_product/roadmap.md, docs/_product/prd.md, docs/product-decisions.md, docs/roadmap-chamro.md]
---

# Vox Flow (ChấmRõ) — Danh sách công việc theo roadmap

**Trạng thái:** ✅ Xong · 🟢 Làm được ngay · ⏸️ Hold (chờ quyết định hoặc yếu tố ngoài) · 🔒 Chờ việc khác

**Phụ thuộc:** số là việc phải xong trước; "(mềm)" là nên chờ nhưng không chặn.

| # | Công việc | Giai đoạn | Trạng thái | GitHub issue | Phải chờ | Ghi chú |
|---|---|---|---|---|---|---|
| 01 | Clone UI prototype vào `apps/web` | Nền | ✅ | [#1](https://github.com/vinh19410/vox-flow/issues/1) (đã đóng) | – | PR #2 đã merge vào `dev` (`ee91229`). Vẫn còn dữ liệu giả ở bản prototype gốc (đã thay dần ở các issue sau). |
| 02 | Chốt 12 điểm lệch, cập nhật PRD, thay roadmap cũ | Nền | ✅ | [#6](https://github.com/vinh19410/vox-flow/issues/6) (đã đóng) | – | PR #32 đã merge vào `dev` (`a09b69a`). Đã chốt 12 quyết định tại `docs/product-decisions.md`, dựng lại PRD và roadmap chính thức tại `docs/_product/`. Mở khóa việc viết SRS. |
| 03 | Thử chấm 30 bài mẫu, chọn dịch vụ giọng nói + AI (OQ-5) | Nền | ✅ | [#7](https://github.com/vinh19410/vox-flow/issues/7) (đã đóng) | – | Đóng ngày 2026-11-13 theo quyết định PO: chốt pipeline hiện tại (`whisper-1` + 3 lượt `gpt-6-luna` trung vị, `#90`/`#130`) làm chính, gỡ cổng chặn 30 bài mẫu ngoài; chuyển sang tự eval & hiệu chuẩn dần trên dữ liệu dự án tại [#154](https://github.com/vinh19410/vox-flow/issues/154) (`docs/decisions/scoring-self-eval.md`). |
| 04 | Tư vấn luật sư về chuyển audio ra nước ngoài (OQ-6) | Nền | ⏸️ | [#8](https://github.com/vinh19410/vox-flow/issues/8) | Buổi tư vấn | Hồ sơ câu hỏi sẵn sàng tại `docs/legal/oq-6-tu-van-luat-su.md`. Đang chờ buổi tư vấn luật sư để thực hiện Phase 2. Không chặn việc xây sản phẩm, chỉ chặn mở cho học viên thật. |
| 05 | Kiểm chứng mức sẵn lòng trả | Nền | ⏸️ | [#9](https://github.com/vinh19410/vox-flow/issues/9) | PO chốt ngưỡng & phỏng vấn học viên thật | Hồ sơ kiểm chứng sẵn sàng tại `docs/research/wtp-validation.md`. Đang chờ PO chốt ngưỡng (Gate A) và phỏng vấn học viên thật để thực hiện Phase 2. |
| 06 | Dựng môi trường backend Cloudflare | Nền | 🟢 | [#10](https://github.com/vinh19410/vox-flow/issues/10) | – | Thêm ngoài roadmap. Báo cáo so giao diện ghi backend chưa chạy được vì thiếu thông tin xác thực Cloudflare. |
| 07 | Đăng nhập Google | Nền | 🔒 | [#11](https://github.com/vinh19410/vox-flow/issues/11) | 06 | Thêm ngoài danh sách tính năng (roadmap chỉ coi là phụ thuộc ngoài). Code đã có Google OAuth bên cạnh email + mật khẩu (D-03); chờ 06 để gắn thông tin xác thực Cloudflare thật. |
| 08 | Thiết lập SePay | Nền | 🟢 | [#12](https://github.com/vinh19410/vox-flow/issues/12) | 04 (mềm) | Nên chờ luật sư trả lời có cần đăng ký hộ kinh doanh trước khi thu tiền không. |
| 09 | Landing (`landing-page`) | Now | ✅ | [#13](https://github.com/vinh19410/vox-flow/issues/13) (đã đóng) | – | PR #38 đã merge vào `dev` (`8e51ff6`). Đã sửa lời hứa hạn mức 3 điểm/ngày và kiểm tra luồng vào auth. |
| 10 | Tài khoản & mục tiêu (`onboarding`) | Now | ✅ | [#14](https://github.com/vinh19410/vox-flow/issues/14) (đã đóng) | 02, 07 (mềm), 09 (mềm) | PR #52 đã merge vào `dev` (`5c56897`). Đã hoàn thành schema D1 `user_profile`, router `profile` và giao diện onboarding. |
| 11 | Quyền riêng tư (`privacy-controls`) | Now | ✅ | [#15](https://github.com/vinh19410/vox-flow/issues/15) (đã đóng) | – | PR #39 đã merge vào `dev` (`167f3fd`). Đã hoàn thành bảng `consent_event`, router `privacy` (`getConsent`, `setConsent`, `exportData`), kiểm tra `requireConsent`, danh sách `DATA_REGISTRY` và nối giao diện `ConsentRows`, `PrivacyScreen` theo D-10. Luồng xóa tự động 24h đang hold theo OQ-6 Câu 7. |
| 12 | Thi thử AI (`mock-exam`) | Now | ✅ | [#16](https://github.com/vinh19410/vox-flow/issues/16) (đã đóng) | 03, 10, 11 | PR #40 đã merge vào `dev` (`385e963`). Ghi âm thật qua MediaRecorder, lưu R2 riêng tư, IndexedDB cache chống mất mạng, AI follow-up có dự phòng. |
| 13 | Chấm điểm & bằng chứng (`scoring-results`) | Now | 🔒 | [#17](https://github.com/vinh19410/vox-flow/issues/17) | 11, 12 | Pipeline chấm 3 lần cho mọi mode đã chạy thật (`#90`, `#130`). Phần còn lại: phân quyền paywall phía server (D-04) & luyện lại câu yếu (D-05); đánh giá độ sát điểm liên tục chuyển sang [#154](https://github.com/vinh19410/vox-flow/issues/154). |
| 14 | Hạn mức miễn phí (`free-quota`) | Now | 🔒 | [#18](https://github.com/vinh19410/vox-flow/issues/18) | 13 | Đã chốt 3 điểm/ngày. Trần toàn hệ thống chỉnh theo unit cost của pipeline chính (`#130`). |
| 15 | Mua gói & QR (`billing`) | Now | 🔒 | [#19](https://github.com/vinh19410/vox-flow/issues/19) | 08, 10, 13, 05 (mềm) | Gói 49k: 3 lượt mở chi tiết, không hết hạn, không miễn hạn mức. Sửa `billing-screen.tsx:34`, đang ghi "Band tổng không giới hạn". |
| 16 | Đối soát thanh toán (`payment-reconciliation`) | Now | 🔒 | [#20](https://github.com/vinh19410/vox-flow/issues/20) | 08, 15 | Phải xong trước khi thu tiền thật. |
| 17 | **Mốc: mở cho học viên thật đầu tiên** | Now | 🔒 | [#21](https://github.com/vinh19410/vox-flow/issues/21) | 04, 09–16 | Thêm ngoài roadmap theo OQ-6. Đây là cổng kiểm tra, không phải tính năng. |
| 18 | Tiến độ band (`progress-history`) | Next | 🔒 | [#22](https://github.com/vinh19410/vox-flow/issues/22) | 11, 13 | Có thể làm song song với 21 và 24. |
| 19 | Cập nhật đề forecast (`forecast-curation`) | Next | ✅ | [#23](https://github.com/vinh19410/vox-flow/issues/23) (đã đóng) | 06, 07, 11, 04 (mềm) | PR #42 đã merge vào `dev` (`9aa1a09`). Đã hoàn thành schema D1, router `forecastAdmin`/`forecast`, dedupe AI, màn quản trị `/admin/forecast` và runbook `forecast-update.md` theo D-04/OQ-2. |
| 20 | Luyện forecast (`forecast-practice`) | Next | 🔒 | [#24](https://github.com/vinh19410/vox-flow/issues/24) | 12, 13, 14, 15, 19 | Chờ nhiều việc nhất trong nhóm Next. |
| 21 | Luyện mỗi ngày (`daily-practice`) | Next | 🔒 | [#25](https://github.com/vinh19410/vox-flow/issues/25) | 13 | Cần bám lỗi thật của học viên. |
| 22 | Chọn dịch vụ email + thông báo đẩy | Next | ✅ | [#26](https://github.com/vinh19410/vox-flow/issues/26) (đã đóng) | – | PR #41 đã merge vào `dev` (`16e0eb4`). Đã chọn Resend (email) và @block65/webcrypto-web-push (push) tại `docs/decisions/email-push-provider.md`. Mở khóa #27. |
| 23 | Nhắc luyện & hết hạn gói (`practice-reminder`) | Next | 🔒 | [#27](https://github.com/vinh19410/vox-flow/issues/27) | 15, 21, 22 | Tối đa 1 nhắc/ngày. Effort S có thể đã thấp so với phạm vi mới. |
| 24 | Báo lỗi chấm (`score-dispute`) | Next | ✅ | [#28](https://github.com/vinh19410/vox-flow/issues/28) (đã đóng) | – | PR #43 đã merge vào `dev` (`79ab3c3`). Đã hoàn thành bảng `score_dispute`, router `dispute` (`submit`, `get`), đăng ký `DATA_REGISTRY`, cam kết 72 giờ và nối modal giao diện. Cờ `SCORE_DISPUTE_ENABLED` mặc định tắt; kích hoạt cùng #29. |
| 25 | Xử lý báo lỗi bản tối thiểu (GAP-03) | Next | ✅ | [#29](https://github.com/vinh19410/vox-flow/issues/29) (đã đóng) | 24 | PR #44 đã merge vào `dev`. Đã hoàn thành API hàng đợi, cảnh báo sắp quá hạn 12h qua Cloudflare cron, bảo vệ audio theo shareConsent, màn hình quản trị và runbook vận hành. |
| 26 | Xử lý báo lỗi bản mở rộng (GAP-03) | Later | 🔒 | [#30](https://github.com/vinh19410/vox-flow/issues/30) | 25 | Đã hoàn thành đánh giá Phase 1 tại `docs/decisions/dispute-scale-up.md`: chưa mở rộng do chưa có dữ liệu thật (cờ mặc định tắt tại `alchemy.run.ts:29`, chưa kiểm tra giá trị đã triển khai). Giữ ở Later chờ tải thật. |
