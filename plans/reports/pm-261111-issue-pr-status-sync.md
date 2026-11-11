# Báo cáo Quản lý Dự án: Đồng bộ trạng thái Issue & Plan có PR đã merge (2026-11-11)

## Kết quả tổng quan

Đã hoàn tất đối soát toàn bộ **71 GitHub Issues**, **57 Pull Requests đã merge**, **Project #15** (`https://github.com/users/vinh19410/projects/15`) và **41 thư mục kế hoạch (`plans/*`)**:

- **Đóng (`completed`) và gắn nhãn `shipped` cho 31 GitHub Issues** đã hoàn tất trọn vẹn qua PR merge vào `dev`/`main` (gồm 21 issue Nhóm A, 9 issue Nhóm B và `#61` theo PO Exception).
- **Đồng bộ cột `Status = Done` trên Project #15** cho toàn bộ 22 issue hoàn tất trước đó còn kẹt ở `Backlog` / `In progress` / thiếu trên bảng (`#1, #53, #55, #57, #61, #62, #65, #66, #69, #71, #80, #84, #85, #92, #93, #94, #96, #97, #106, #109, #119, #127`).
- **Thêm 7 issue bị thiếu vào Project #15** theo quy tắc `AGENTS.md`: `#1, #106, #109` (`Done`) và `#107, #108, #110, #111` (`Backlog`).
- **Đồng bộ ngược (sync-back) 11 thư mục `plans/*` và `docs/roadmap-work-items.md`** để khớp trạng thái `completed` của các PR đã merge, đồng thời giữ nguyên trung thực các checkbox chưa kiểm chứng phần cứng/E2E/pháp lý.
- **Giữ nguyên `OPEN` 7 issue mới xong Phase 1 (`Refs #N`) / đang chờ cổng ngoài:** `#7, #8, #9, #10, #11, #12, #30` (cùng 24 issue đang chờ làm chưa có PR hoàn tất). Tổng số issue đang mở giảm từ **62 → 31**.

## Bảng đối soát 31 Issue đã đóng & đồng bộ `Done`

| Issue | PR đã merge (nhánh @ SHA) | Project #15 (trước → sau) | Nhãn sau đồng bộ |
|---|---|---|---|
| #1 | PR #2 (`dev` @ `ee91229`) | *(thiếu)* → `Done` | `shipped` |
| #6 | PR #32 (`dev` @ `a09b69a`) | `Done` → `Done` | `documentation`, `ai-handle`, `shipped` |
| #13 | PR #38 (`dev` @ `8e51ff6`) | `Done` → `Done` | `enhancement`, `ai-handle`, `shipped` |
| #14 | PR #52 (`dev` @ `5c56897`) | `Done` → `Done` | `enhancement`, `ai-handle`, `shipped` |
| #15 | PR #39 (`dev` @ `167f3fd`) | `Done` → `Done` | `enhancement`, `ai-handle`, `shipped` |
| #16 | PR #40 (`dev` @ `385e963`) | `Done` → `Done` | `enhancement`, `ai-handle`, `shipped` |
| #23 | PR #42 (`dev` @ `9aa1a09`) | `Done` → `Done` | `enhancement`, `ai-handle`, `shipped` |
| #26 | PR #41 (`dev` @ `16e0eb4`) | `Done` → `Done` | `documentation`, `ai-handle`, `shipped` |
| #45 | PR #48 (`dev` @ `7027834`) | `Done` → `Done` | `bug`, `ai-handle`, `shipped` |
| #46 | PR #47 (`dev` @ `12f83c0`) | `Done` → `Done` | `bug`, `ai-handle`, `shipped` |
| #53 | PR #54 (`dev` @ `5fda567`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #55 | PR #56 (`dev` @ `4adbce6`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #57 | PR #58 (`dev` @ `e189087`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #61 | Commit `4a623c3` + PO Exception seed D1 Prod | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #62 | PR #63 (`dev` @ `5a437ee`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #65 | PR #67 (`dev` @ `cc8e6ba`) | `Backlog` → `Done` | `bug`, `ai-handle`, `shipped` |
| #66 | PR #70 (`dev` @ `b4bfca3`) | `In progress` → `Done` | `enhancement`, `ai-handle`, `shipped` |
| #69 | PR #72 (`dev` @ `159aaca`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #71 | PR #74 (`dev` @ `554ce5a`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #80 | PR #82 (`dev` @ `f837976`) | `Backlog` → `Done` | `bug`, `ai-handle`, `shipped` |
| #84 | PR #86 (`dev` @ `c46cd5d`) | `Backlog` → `Done` | `bug`, `ai-handle`, `shipped` |
| #85 | PR #88 (`dev` @ `1897585`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #92 | PR #102 (`dev` @ `655493b`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #93 | PR #113 (`08eac75`), PR #115 (`99be14c`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #94 | PR #105 (`dev` @ `a6d2877`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #96 | PR #114 (`a0b1576`), PR #116 (`dbc2e1c`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #97 | PR #118 (`faa7ae2`), PR #120 (`fcb53fd`), PR #121 (`36cf360`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #106 | PR #117 (`dev` @ `1bcc464`) | *(thiếu)* → `Done` | `ai-handle`, `shipped` |
| #109 | PR #122 (`dev` @ `4b46fca`) | *(thiếu)* → `Done` | `ai-handle`, `shipped` |
| #119 | PR #125 (`2438510`), PR #126 (`b335a85`) | `Backlog` → `Done` | `ai-handle`, `shipped` |
| #127 | PR #129 (`dev` @ `b08aed2`) | `Backlog` → `Done` | `ai-handle`, `shipped` |

## Các Issue giữ nguyên `OPEN` (có PR liên quan nhưng chưa đủ điều kiện đóng)

| Issue | PR đã merge | Lý do giữ `OPEN` |
|---|---|---|
| #7 | PR #33, #34 (`Refs #7`) | Mới dựng công cụ đánh giá; đang chờ 30 bài mẫu có đồng ý bằng văn bản (OQ-5). |
| #8 | PR #31 (`Refs #8`) | Mới xong hồ sơ câu hỏi Phase 1; chờ buổi tư vấn luật sư thực tế (OQ-6). |
| #9 | PR #35 (`Refs #9`) | Mới xong quy trình Mom Test Phase 1; chờ PO chốt ngưỡng Gate A & phỏng vấn học viên. |
| #10 | PR #36 (`Refs #10`) | PR ghi `Refs #10`; cần đối chiếu riêng nếu muốn chốt hoàn tất sau khi beta đã lên Cloudflare. |
| #11 | PR #51 (`Refs #11`) | Ghi rõ giữ `OPEN` chờ kiểm thử E2E Google OAuth thật trên môi trường triển khai. |
| #12 | PR #37 (`Refs #12`) | Xong phần khai báo repo; còn thao tác cấu hình tài khoản SePay & xác nhận hộ kinh doanh (#8). |
| #17, #24 | PR #95 (`#90`) | PR #95 mới phủ scoring beta không paywall cho forecast; phần eval/paywall (#17) & phụ thuộc đầy đủ (#24) vẫn mở. |
| #30 | PR #50 (`Refs #30`) | Quyết định kiến trúc giữ `OPEN` ở giai đoạn Later chờ dữ liệu tải thật. |

## Đồng bộ Plan Local (`plans/*`) & Hạng mục chưa kiểm chứng thực địa

- Đã cập nhật `status: completed` và trạng thái bảng Phase / checkbox đã có bằng chứng test & POT cho 11 plan: `261104-0713-clone-prototype-ui` (#1), `261110-0252-scoring-pipeline-forecast` (#90), `261110-0626-hardening-export-d1-bind` (#92), `261110-0634-queue-hardening-prompt-injection` (#93), `261110-0635-94-attempt-start-race-upload` (#94), `261110-0654-audio-generation-order` (#96), `261110-0837-97-promise-withresolvers-ios-compat` (#97), `261110-0834-attempt-sync-timeout` (#106), `261110-0835-109-mock-submit-flush` (#109), `261110-1009-119-honest-local-only-handoff` (#119), `261110-ios-safari-date-input-appearance-fix` (#84).
- **Giữ nguyên `[ ]` (không tự đánh dấu `[x]` khi thiếu bằng chứng thực địa):**
  - `plans/261110-ios-safari-date-input-appearance-fix` (#84): 2 tiêu chí kiểm tra trực tiếp trên thiết bị iPhone thật sau deploy beta (mới có ảnh chụp Chromium/WebKit giả lập).
  - `plans/261105-0910-wi10-onboarding/plan.md` (#14): 2 tiêu chí E2E đa thiết bị trên trình duyệt thật (đã pass unit/integration D1).
  - `plans/261105-0910-wi11-privacy-controls/plan.md` (#15): tiêu chí xóa tự động trong 24h đang tạm hoãn theo OQ-6 Câu 7.

## Câu hỏi mở / Đề xuất tiếp theo

1. Các issue `#7, #8, #9, #10, #11, #12, #30` hiện vẫn `OPEN` nhưng trên Project #15 đang nằm ở cột `Done` (từ đợt cập nhật 05/11) — có muốn chuyển các mục đang chờ cổng ngoài này về `In progress` hoặc `Backlog` trên Project #15 để bảng phản ánh đúng việc chưa đóng không?
2. Thay đổi đồng bộ trong `plans/*` và `docs/roadmap-work-items.md` hiện nằm trên working tree local nhánh `dev` — bạn có muốn tạo nhánh/PR docs-only hoặc commit kèm đợt cập nhật kế tiếp không?
