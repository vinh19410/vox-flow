---
handoff-version: 1
generated: 2026-11-13T03:38:29Z
generator: ak-handoff@2.0.0
focus: "beta verification and unit-cost measurement for #130, then unblock #18 and #22"
workspace: /root/projects/vox-flow
branch: ci/split-pr-test-and-deploy
head: 6dfbd067bfdbb04513eea484e3a8daa68ad7e001
---

# HANDOFF: Beta verification and unit-cost measurement for #130

## Mission and current status

Mục tiêu tiếp theo là hoàn tất kiểm chứng thực tế trên Beta (`https://vox.vinhtran.io.vn`) và đo unit cost thật cho issue `#130` (đã merge code ở PR `#131`, đang mở với nhãn `ready to ship beta`), sau đó mở khóa phanh chi phí `#18` (`free-quota`) và dữ liệu thật cho Dashboard/Lịch sử `#22` (`progress-history`) trước khi mở cho học viên pilot (`#21`).

- Done:
  - Phân tích ưu tiên sản phẩm (`/ak-sowat`) dựa trên trạng thái repo, CI/CD, GitHub issues và PR đến `2026-11-13`.
  - Xác định nút thắt vận hành: `#10`, `#11`, `#12`, `#7`, `#130` đang `OPEN` với nhãn `ready to ship beta`, làm các plan `#18`/`#19` từng bị chặn ở `Task 1.0 Gate`.
  - Lập kịch bản test thực tế 10 case (6 luồng happy path + 4 edge case) và câu lệnh SQL query D1 remote để kiểm chứng `#130` và đo COGS thật.
  - Phát hiện khoảng trống đo chi phí trên Beta: `SCORING_PRICE_INPUT_PER_1M` và `SCORING_PRICE_OUTPUT_PER_1M` chưa được truyền trong `.github/workflows/deploy-beta.yml` (và mặc định rỗng ở `packages/infra/alchemy.run.ts`), nên `attempt_score.cost_usd` và `score_run.cost_usd` sẽ là `NULL`; phải đọc `input_tokens`, `output_tokens`, và `attempt_answer.duration_ms` để tính chi phí LLM + Whisper STT (+ ElevenLabs TTS mới thêm ở `#138`).
- Remaining:
  - Chạy kịch bản test 10 case trên Beta (`https://vox.vinhtran.io.vn`) và trích xuất dữ liệu chi phí từ D1 remote.
  - Đăng kết quả POT + bảng chi phí lên `#130` và đóng `#130` (hoặc tách bug thực tế nếu phát sinh).
  - Xử lý cấu hình pricing env cho `cost_usd` nếu muốn đo tự động; triển khai `#18` (`free-quota`) và `#22` (`progress-history`); PO thực hiện `#7` (`TD-01`, 30 bài mẫu chuẩn) và `#8` (tư vấn luật sư OQ-6).
- Urgency: cao — `#130` đã mở cho mọi mode (kèm TTS `#138`) nhưng chưa có số đo COGS thật và chưa có hạn mức server (`#18`), hiện chỉ được bảo vệ bởi allowlist `LAUNCH_OPEN` / `LAUNCH_ALLOWED_EMAILS`.

## Scope and guardrails

- Workspace: `/root/projects/vox-flow`
- In scope:
  - Nghiệm thu trên Beta và đóng `#130`, đối chiếu thực tế trạng thái `#10`/`#11` trên Beta.
  - Kế hoạch tiếp theo sau `#130`: cấu hình `SCORING_PRICE_INPUT_PER_1M` / `SCORING_PRICE_OUTPUT_PER_1M`, triển khai `#18` (`free-quota`) và `#22` (`progress-history`).
- Out of scope (hoãn theo `/ak-sowat`):
  - 12 issue hardening/recovery/chore đang mở (`#78`, `#87`, `#89`, `#101`, `#103`, `#107`, `#108`, `#110`, `#111`, `#112`, `#123`, `#124`), trừ khi tái diễn trong lúc verify `#130`.
  - Triển khai thanh toán SePay (`#12`, `#19`, `#20`) và nhóm retention (`#25`, `#27`, `#30`) khi chưa xong `#7`, `#8`, `#9`.
- Constraints:
  - Tuân thủ `AGENTS.md`: dùng `pnpm`, phản hồi tiếng Việt, bắt buộc đăng POT khi hoàn tất issue theo workflow repo.
  - Không tự ý sửa tay migration trong `packages/db/src/migrations` hay `apps/web/src/routeTree.gen.ts`.
- Safety boundaries:
  - Không triển khai, không chạy `destroy`, không áp migration lên môi trường thật khi chưa có xác nhận và chưa sao lưu D1.
  - Không dán email thật, token, presigned URL hay dữ liệu cá nhân vào comment POT trên GitHub.
  - Phiên này chỉ đọc và viết file handoff này; không sửa code nguồn hay thay đổi trạng thái issue.

## Current state

- Branch: `ci/split-pr-test-and-deploy` (PR `#147` từ nhánh này đã merge vào `dev` lúc `2026-11-13T03:20:47Z`; cần chuyển về `dev` và `git pull` trước khi tạo nhánh làm việc mới).
- HEAD: `6dfbd067bfdbb04513eea484e3a8daa68ad7e001` (`ci: split PR unit/type checks from dev deploy workflow`).
- Working tree: dirty (chỉ có thư mục chưa track `.gemini/`, ngoài ra chưa có `plans/handoffs/` trước khi tạo file này).
- Changed files: none.
- Untracked files: `.gemini/` (và file handoff này sau khi ghi).
- Intentional local modifications: not captured (`.gemini/` là thư mục runtime).

## Decisions and rationale

| Decision | Rationale | Alternative rejected | Reference |
|---|---|---|---|
| Ưu tiên verify `#130` + đo COGS thật trước khi làm tính năng mới hoặc dọn 12 issue hardening | Code `#130` (PR `#131`) đã deploy beta nhưng chưa verify và chưa đo `cost_usd`; thêm `#138` TTS càng làm biến phí mù nếu không đo ngay | Tiếp tục xử lý danh sách hardening/chore (`#101`–`#124`) khi chưa có người dùng thật | Output `/ak-sowat` trong session; `gh issue view 130` |
| Sau `#130`, ưu tiên `#18` (`free-quota`) và `#22` (`progress-history`) trước `#19` (`billing`) | Cần phanh chi phí 3 điểm/ngày và vòng lặp lịch sử D1 thật cho pilot; thanh toán đang bị chặn bởi `TD-01` (`#7`), pháp lý (`#8`) và WTP (`#9`) | Mở `FEATURES.billing` hoặc làm `daily-practice`/`reminder` khi chưa chốt giá & độ chính xác | `docs/tech-debt.md`; `apps/web/src/lib/feature-flags.ts` |
| Kịch bản đo cost `#130` phải đọc `input_tokens`, `output_tokens` và `duration_ms` thay vì chỉ dựa vào `cost_usd` | Workflow deploy Beta và `alchemy.run.ts` chưa truyền `SCORING_PRICE_INPUT_PER_1M` / `SCORING_PRICE_OUTPUT_PER_1M`, nên `cost_usd` sẽ là `NULL` và chưa gồm Whisper STT / ElevenLabs TTS | Chỉ query `attempt_score.cost_usd` | `packages/api/src/scoring/config.ts`; `packages/api/src/scoring/score-attempt.ts`; `.github/workflows/deploy-beta.yml` |

## Work performed

- Kiểm tra trạng thái git và nhánh hiện tại (`git status -sb`, `git log -n 15`, `git diff dev..HEAD --stat`): xác nhận `ci/split-pr-test-and-deploy` ở commit `6dfbd06`, các PR mới nhất trên `dev` là `#142` (`#141`), `#140` (`#138`), `#144` (`#139`), `#145` (`#135`), `#146`, `#147`.
- Kiểm tra GitHub issues/PRs/Actions (`gh issue list`, `gh pr list`, `gh run list`, `gh issue view` cho `#7`–`#12`, `#17`–`#19`, `#49`, `#123`, `#124`, `#130`): xác nhận run `43358342113` (`Deploy Beta (dev)`) pass; `#130` vẫn `OPEN` với gate checklist của Kongming; `#18` và `#19` từng dừng tại `Task 1.0 Gate` do `#17`/`#12` còn `OPEN`.
- Đọc đối chiếu kiến trúc và code hiện tại:
  - `docs/_product/roadmap.md`, `docs/roadmap-work-items.md`, `docs/product-decisions.md`, `docs/tech-debt.md`.
  - `packages/api/src/routers/` (xác nhận chưa có router cho `quota`, `billing`, `progress`).
  - `packages/api/src/routers/attempt.ts`, `packages/api/src/scoring/config.ts`, `packages/api/src/scoring/score-attempt.ts`, `packages/db/src/schema/score.ts`, `packages/db/src/schema/attempt.ts`, `packages/infra/alchemy.run.ts`, `.github/workflows/deploy-beta.yml`.
  - `apps/web/src/lib/feature-flags.ts`, `apps/web/src/features/exam/data.ts`, `apps/web/src/features/exam/exam-screen.tsx`, `apps/web/src/features/exam/components/pre-submit-modal.tsx`, `apps/web/src/features/scoring/scoring-screen.tsx`, `apps/web/src/features/results/results-screen.tsx`, `apps/web/src/features/billing/components/payment-panel.tsx`, `apps/web/src/features/dashboard/dashboard-screen.tsx`, `apps/web/src/features/history/history-screen.tsx`.
- Không chỉnh sửa code nguồn, test hay cấu hình hệ thống nào.
- 0 redactions applied.

## Verification

| Check | Command | Outcome | When |
|---|---|---|---|
| Trạng thái git & diff so với `dev` | `git status -sb && git diff dev..HEAD --stat` | Đọc thành công; working tree chỉ có `.gemini/` untracked | 2026-11-13T03:26Z |
| Trạng thái CI/Deploy Beta trên GitHub | `gh run list --limit 10` | Run `43358342113` trên `dev` đạt `completed/success` | 2026-11-13T03:27Z |
| Kiểm tra schema D1 & cấu hình pricing scoring | `git grep -n "SCORING_PRICE\|costUsd"` + đọc `config.ts`, `score-attempt.ts` | Xác nhận `SCORING_PRICE_INPUT_PER_1M` / `SCORING_PRICE_OUTPUT_PER_1M` chưa được set trong `deploy-beta.yml` | 2026-11-13T03:36Z |

Not run:
- `pnpm check-types` và các bộ test unit/integration (`packages/api`, `apps/server`, `apps/web`) — không chạy vì đây là phiên phân tích sản phẩm và lập kịch bản test chỉ-đọc, không sửa code.
- Kịch bản test Beta 10 case và query D1 remote cho `#130` — chưa chạy (cần tài khoản trong `LAUNCH_ALLOWED_EMAILS` và thao tác trên trình duyệt + quyền Wrangler remote D1).

## Open risks and blockers

- Type: risk. Owner: Product Owner / Engineering. Impact: `attempt_score.cost_usd` và `score_run.cost_usd` trên Beta có khả năng đang là `NULL` vì thiếu cấu hình `SCORING_PRICE_INPUT_PER_1M` và `SCORING_PRICE_OUTPUT_PER_1M`, đồng thời chưa tự cộng phí Whisper STT và ElevenLabs TTS (`#138`).
- Type: blocker. Owner: Product Owner. Impact: `TD-01` (`#7`, OQ-5) thiếu 30 bài mẫu có văn bản đồng ý + band của giám khảo thật nên chưa đo được ngưỡng chính xác `>= 80%` lệch `<= 0.5` band cho `#17` (`scoring-results`).
- Type: blocker. Owner: Product Owner. Impact: `#8` (OQ-6 tư vấn luật sư chuyển audio ra nước ngoài) chưa xong Phase 2, chặn mốc mở cho học viên thật (`#21`).
- Type: risk. Owner: Engineering. Impact: Các pipeline tự động cho `#18` (`free-quota`) và `#22` (`progress-history`) có thể bị chặn ở `Task 1.0 Gate` nếu chưa đóng các issue `ready to ship beta` (`#10`, `#11`, `#130`) hoặc chưa tháo phụ thuộc cứng khỏi `#17` (đang kẹt vì `TD-01`).

## Exact next actions

1. **First safe step** — Chuyển nhánh local về `dev` và đồng bộ mới nhất (`git checkout dev && git pull --ff-only`), sau đó lấy mốc thời gian bắt đầu test `TEST_START_MS=$(($(date +%s) * 1000))` và xác nhận tài khoản test nằm trong `LAUNCH_ALLOWED_EMAILS`.
2. Thực thi kịch bản kiểm chứng 10 case cho `#130` trên `https://vox.vinhtran.io.vn`:
   - 6 luồng chính: `Full Test` (nói độ dài gần thật để đo cost), `Part 1`, `Part 2`, `Part 3`, `Forecast chủ đề >= 2 câu`, `Forecast 1 câu lẻ`.
   - 4 edge case: nộp 0 câu trả lời (`400`), `F5` giữa chừng trên `/scoring`, rescue path `"Chấm điểm ngay"` trên bài `submitted` chưa có điểm, và double-click chống enqueue trùng.
3. Chạy 2 truy vấn D1 remote bằng `wrangler d1 execute` (lọc `a.started_at >= <TEST_START_MS>`) trên bảng `attempt`, `attempt_answer`, `attempt_score`, `score_run` để kiểm tra `run_count = 3`, `status = 'done'`, và lấy `input_tokens`, `output_tokens`, `total_audio_sec`, `cost_usd` để tính tổng COGS thật/bài (LLM + Whisper + ElevenLabs).
4. Đăng kết quả POT + bảng chi phí (đã ẩn PII) lên issue `#130` và đóng `#130` nếu đạt toàn bộ tiêu chí (hoặc tách issue bug cụ thể); nếu `cost_usd` trả `NULL`, tạo issue/PR nhỏ cấu hình `SCORING_PRICE_INPUT_PER_1M` và `SCORING_PRICE_OUTPUT_PER_1M` trong `.github/workflows/deploy-beta.yml`.
5. Rà soát và đóng các issue `ready to ship beta` đã nghiệm thu trên Beta (`#10`, `#11`), rồi bắt đầu triển khai `#18` (`free-quota`) và `#22` (`progress-history`) để hoàn thiện vòng lặp miễn phí có kiểm soát trước mốc `#21`.

## Source pointers

- Repo roadmap & decisions: `docs/_product/roadmap.md`, `docs/roadmap-work-items.md`, `docs/product-decisions.md`, `docs/tech-debt.md`
- Deploy & infra config: `.github/workflows/deploy-beta.yml`, `packages/infra/alchemy.run.ts`
- Scoring & cost logic: `packages/api/src/scoring/config.ts`, `packages/api/src/scoring/score-attempt.ts`, `packages/api/src/routers/attempt.ts`, `packages/api/src/routers/scoring.ts`, `packages/db/src/schema/score.ts`, `packages/db/src/schema/attempt.ts`
- Frontend flows for `#130` & gates: `apps/web/src/features/exam/data.ts`, `apps/web/src/features/exam/exam-screen.tsx`, `apps/web/src/features/exam/components/pre-submit-modal.tsx`, `apps/web/src/features/scoring/scoring-screen.tsx`, `apps/web/src/features/results/results-screen.tsx`, `apps/web/src/lib/feature-flags.ts`
- GitHub issues & PRs:
  - Issue `#130`: `https://github.com/vinh19410/vox-flow/issues/130` (PR `#131`: `https://github.com/vinh19410/vox-flow/pull/131`)
  - Blockers / next items: `#7`, `#8`, `#9`, `#10`, `#11`, `#17`, `#18`, `#21`, `#22` (`https://github.com/vinh19410/vox-flow/issues/18`, `https://github.com/vinh19410/vox-flow/issues/22`)
