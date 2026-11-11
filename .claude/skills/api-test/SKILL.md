---
name: api-test
description: Dùng khi cần test API kiểu Postman (đối tác hoặc nội bộ dự án) — quản lý test case trong bảng .md, sinh collection Bruno chạy được, rồi ghi kết quả PASS/FAIL ngược vào bảng. `/api-test <feature>` hoặc `/api-test <feature> --run`.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
user-invocable: true
disable-model-invocation: true
argument-hint: "[\"<METHOD /path>\"] [--feature <slug>] [--run] [--tc TC-01,TC-03] [--env mock|sandbox|prod] [--allow-prod]"
---
<!-- Licensed to th.vinh102@gmail.com — Order GD86QNQXZ -->

# /api-test — Test API qua Bruno (bảng .md là gốc → collection .bru)‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

## Goal‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

Giúp IT-BA/QC test API có __truy vết__ + chạy được trên __Bruno__ (extension trong IDE + CLI) — phục vụ __cả API đối tác (3rd) lẫn API nội bộ dự án (own)__:

* **Nguồn ưu tiên là `test/api/api-checklist.md`** (đã qua `/api-checklist` — scope + Expected Result + Fixtures đã duyệt) → expand __n–n cùng intent__: mỗi row checklist nở thành __1 hoặc nhiều__ TC cùng ý-định (vd "validation số tiền" → null/âm/zero/vượt-limit), nhưng __KHÔNG đẻ scenario MỚI ngoài checklist__ (chống bịa). Chưa có checklist → fallback `integration/api-summary*.md`. Loại API (own/3rd/mixed) lấy từ `api_type` của checklist → quyết định auth + path (xem section "Own API").
* Mọi test case + ý nghĩa nghiệp vụ nằm trong 1 bảng `api-tests.md` — __đây là source of truth cho TEST-CASE SPECIFICATION (kiểm thế nào)__, KHÁC `api-checklist.md` (source of truth cho coverage + intent, kiểm GÌ). Kết quả run là __evidence theo từng lần chạy__ (env + thời điểm), KHÔNG phải specification/trạng-thái-hiện-tại. Tách 4 tầng: xem `api-integration.md` Mục 5.
* Skill __sinh collection Bruno__ (`bruno/` với file `.bru`) từ bảng → mở/chạy trong __Bruno extension__ (GUI, collection runner) HOẶC chạy headless qua __Bruno CLI__ (`npx @usebruno/cli`).
* Chạy suite headless → runner dùng chung `.claude/scripts/bruno-runner.mjs` đọc report JSON của Bruno → __ghi PASS/FAIL + thời điểm ngược vào bảng__ + thêm dòng Lịch sử chạy. Runner này 1 bản duy nhất cho mọi feature (không tự sinh lại mỗi lần scaffold) — xem Mục "Runner dùng chung".
* __Môi trường chưa có backend/mock__ ("API trên giấy" — contract suy từ SRS, chưa gọi được thật): runner phát hiện 100% request connection-refused → ghi `⏳ PENDING` (KHÔNG phải `❌ FAIL` giả) vào cột Kết quả, exit code 0. Chỉ khi ≥1 request kết nối được mới ghi PASS/FAIL thật.
* AI __diễn giải kết quả theo nghiệp vụ__ (map PASS/FAIL về FR/error-code/màn hình).

Đây là việc hằng ngày của BA/QC (giống Postman/Newman, nhưng engine là Bruno). __Học viên không xây API.__

__Nguyên tắc bảo mật tối thượng:__ secret (API key) **chỉ sống trong `bruno/.env`** (gitignored). File `.bru` chỉ tham chiếu `{{process.env.PAYGATE_KEY}}` — Bruno (app + CLI) tự nạp `.env` ở collection root vào `process.env`. __AI KHÔNG được đọc, in, hay nắm nội dung biến môi trường__ — chỉ trigger lệnh chạy. Key không bao giờ lọt vào chat / `api-tests.md` / `.bru` / report (sync script mask + xoá report sau khi parse).

## Vì sao Bruno (không phải runner fetch tự viết)‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

* `.bru` là __plain-text, git-friendly__ — diff review được như code; khác Postman (JSON khó đọc).
* Chạy được cả __trong IDE__ (Bruno extension: click request, collection runner, xem pass/fail trực quan) lẫn __headless CLI__ (CI/regression).
* Bruno lo phần request/assert/auth/env — skill chỉ generate + sync kết quả. Không tự maintain runner fetch.

## Runner dùng chung (`.claude/scripts/bruno-runner.mjs`)‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

**Không tự viết `bruno-sync.mjs` riêng cho từng feature.** Có 1 runner canonical dùng chung cho mọi feature (own + 3rd-party), nhận `--dir <path>` trỏ tới folder chứa `api-tests.md` + `bruno/`:

```bash
node .claude/scripts/bruno-runner.mjs gen --dir docs/{feature}/test/api
node .claude/scripts/bruno-runner.mjs run --dir docs/{feature}/test/api --env mock [--tc TC-01,TC-03] [--provider paygate] [--allow-prod]
```

Lý do dùng chung: mỗi feature từng tự sinh 1 bản `bruno-sync.mjs` qua AI — không có gì đảm bảo lần sinh sau đúng như lần trước (từng phát hiện bản thiếu logic parse report/ghi ngược bảng/exit code). Runner chung có fixture test riêng (`.claude/scripts/__tests__/bruno-runner.test.mjs`), sửa 1 lần áp dụng mọi feature.

Runner tự phát hiện dạng bảng theo header cột: có cột `Provider` → 3rd-party (bearer key theo provider); có cột `Auth` → own API (session/public, cookie-session chain qua `_setup/login.bru`). Tên biến base cho own API = `{FEATURE_SLUG}_BASE` viết hoa (vd feature `authentication` → `{{AUTHENTICATION_BASE}}` trong `environments/*.bru`).

## Modes‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

| Mode | Lệnh | Làm gì |
|------|------|--------|
| __Scaffold__ (default) | `/api-test --feature X` (hoặc chỉ `/api-test`, feature auto-detect) | Đọc `api-summary*.md` → đề xuất bộ test case → tạo `api-tests.md` (bảng) + sinh collection `bruno/` (bruno.json + environments + .bru per TC, qua runner chung `gen`) + `bruno/.env.example` + gitignore `.env` |
| __Add case__ | Nói "thêm request mới: `<mô tả>`" (feature X hiểu từ ngữ cảnh) | Thêm 1+ TC vào bảng → regen file `.bru` tương ứng (không đụng TC khác) |
| __Regen__ | Nói "regen lại giùm" | Chạy runner chung `gen` → sinh lại toàn bộ `bruno/` từ bảng (sau khi sửa bảng tay). Giữ environments + .env |
| __Run__ | `/api-test --feature X --run [--env mock] [--tc TC-01,TC-03]` | AI trigger runner chung `run --dir ...` → gọi `npx @usebruno/cli run` → đọc report → ghi kết quả ngược bảng (PASS/FAIL thật, hoặc PENDING nếu môi trường chưa sẵn sàng); AI diễn giải nghiệp vụ |
| __Single__ | `/api-test "<METHOD /path>" --feature X` | Thêm 1 TC + sinh .bru rồi `--run --tc <new>` |
| __HTML__ | Nói "xuất ra HTML" | (optional) sinh `api-tester.html` khám phá thủ công 2 tab Live fetch + Curl-builder |

Wording flag còn giữ (cổng an toàn):
* `--run`: thực sự gọi API (mặc định chỉ soạn test, không gọi).
* `--env mock|sandbox|prod`: chọn môi trường chạy test; `prod` cần thêm `--allow-prod`.
* `--tc TC-01,TC-03`: chọn đúng test case cần chạy (không suy luận được, cần gõ rõ ID hoặc nói "chạy TC-01 với TC-03").
* `--feature <slug>`: gõ tắt khi cần; thiếu thì skill tự suy từ ngữ cảnh (feature đang làm dở), mơ hồ mới hỏi picker.

> __Mở trong IDE (Bruno extension):__ sau scaffold, hướng dẫn user mở folder `bruno/` (trong `test/api/` hoặc `integration/` tuỳ nguồn) trong Bruno extension (hoặc Command Palette → Bruno: Open Collection). User click từng request hoặc Collection Runner để chạy trực quan. **Lưu ý: chạy bằng GUI KHÔNG tự ghi kết quả về `api-tests.md`** — chỉ mode `--run` (CLI + sync) mới ghi ngược bảng.

## Constraints

### Hard rules — never violate

* **Bảng `.md` là source of truth** — `api-tests.md` chứa bảng giữa marker `<!-- TC:START -->` / `<!-- TC:END -->` với cột cố định. Runner chung sinh `.bru` TỪ bảng. Sửa request = sửa bảng rồi nói "regen lại giùm" (hoặc "thêm request mới: ..."). Tweak tay trong Bruno GUI là tạm — sẽ bị ghi đè khi regen.
* **Secret CHỈ trong `bruno/.env`** — gitignored. AI tạo `bruno/.env.example` (chỉ TÊN biến `*_KEY`, không value); user điền `bruno/.env`. AI __KHÔNG__ `cat .env`, __KHÔNG__ `echo $VAR`, __KHÔNG__ `source .env`, KHÔNG đọc value. AI chỉ trigger `node .claude/scripts/bruno-runner.mjs ...`.
* __Base URL không phải secret__ — `*_BASE` sống trong `bruno/environments/{mock,sandbox,prod}.bru` (committed). Key (`*_KEY`) sống trong `.env`. `.bru` request: url `{{PAYGATE_BASE}}/v1/...`, auth `token: {{process.env.PAYGATE_KEY}}`. Own API: url `{{{FEATURE_SLUG}_BASE}}/...` (vd `{{AUTHENTICATION_BASE}}`).
* **`.bru` không chứa secret** — chỉ placeholder `{{process.env.*_KEY}}`. Bruno resolve runtime.
* **`.bru` KHÔNG được có comment `#` ngoài block** — Bruno `.bru` parser chỉ chấp nhận `#` bên trong block hợp lệ (`assert{}`, `vars{}`...). Comment top-level (cuối file, giữa 2 block) làm parser lỗi và crash __toàn bộ collection run__, không chỉ file đó. Runner chung đã xử lý đúng (ghi chú `session` bên trong `assert{}`); nếu sửa `.bru` tay, giữ nguyên tắc này.
* __Sync ghi kết quả ngược vào bảng__ — cập nhật cột `Kết quả` (✅ PASS / ❌ FAIL / ⏳ PENDING nếu env chưa sẵn sàng) + `Lần chạy` (ISO datetime) + prepend 1 dòng tóm tắt vào `## Lịch sử chạy`. Match report ↔ TC qua prefix `TC-NN` trong `meta.name`. KHÔNG ghi secret; mask + xoá report sau parse.
* __Gọi thật__ — Bruno dùng fetch thật. KHÔNG mô phỏng response giả.
* __PENDING ≠ FAIL__ — nếu 100% request trong 1 lần `run` đều connection-refused (chưa có backend/mock chạy — "API trên giấy"), runner ghi `⏳ PENDING` thay vì `❌ FAIL` và exit code 0. Đây là tín hiệu "chưa test được", không phải "test sai". Chỉ khi ≥1 request kết nối được (môi trường sống) mới ghi PASS/FAIL thật.
* __Xác nhận env__ — `--env` default `mock`. `prod` (production thật, có thể tạo data/tốn quota) → AI xác nhận lần hai trước trigger; runner chung cũng từ chối `--env prod` nếu thiếu cờ `--allow-prod`.
* __L1 approval__ trước Write/Edit (`api-tests.md`, `bruno/**`, `.env.example`, `.gitignore`). L2 diff khi sửa file đã tồn tại. Runner chung `.claude/scripts/bruno-runner.mjs` KHÔNG per-feature — không cần L1 khi gọi, chỉ khi sửa chính file runner đó (hiếm, ngoài phạm vi 1 lần chạy skill).
* __CLI qua npx__ — không cài global. Runner chung gọi `npx --yes @usebruno/cli run ...`. Lần đầu npx tải gói (cần mạng).
* __HTML (khi user nói "xuất ra HTML") KHÔNG nhúng khóa__ — key gõ tạm trong RAM browser; curl tab dùng placeholder `$ENV_VAR`. Live-fetch chỉ thật với mock/CORS-enabled.
* __Vietnamese-first__ trong diễn giải.
* **AI tuyệt đối không đọc `bruno/.env`** — kể cả để "kiểm tra giúp". Cần biết biến đã set chưa thì chỉ `test -f bruno/.env` hoặc để Bruno báo lỗi resolve. Không `cat`, `grep`, `echo $VAR`, `printenv`, `env | grep`.

### Pitfalls — easy to get wrong

* **`.env` ở collection root `bruno/.env`** (KHÔNG phải `integration/.env`) — Bruno chỉ tự nạp `.env` cạnh `bruno.json`. `.gitignore` `**/.env` đã cover.
* **`.env` phải gitignored** — check `.gitignore` trước khi tạo. Secret lọt git = sự cố.
* __Mask report__ — Bruno reporter-json có thể chứa header `Authorization` đã resolve. Runner chung chỉ lấy field cần + xoá report sau parse; AI KHÔNG đọc report file.
* __GUI không ghi ngược bảng__ — chạy bằng Bruno extension/collection-runner chỉ hiện kết quả trong IDE; muốn cập nhật `api-tests.md` phải `--run` (CLI + sync). Nói rõ cho user.
* __npx lần đầu tải gói__ — cần mạng; chậm lần đầu. Offline → gợi ý cài global `@usebruno/cli`.
* __Mock chưa chạy__ — connection refused → nhắc `node _teaching/.../mock-paygate.js` (+ mailgate). Mock cần CORS header nếu dùng Live fetch tab HTML.
* **Body có `|`** — vỡ bảng md. Reformulate hoặc escape.
* __Trailing-slash base__ — `*_BASE` kết thúc `/` làm url `...com//v1/...`. Khi điền environments/.env nên bỏ `/` cuối.
* __Case phụ thuộc id__ (refund cần charge_id, sub cancel cần sub_id) — không chạy standalone tốt. Bruno hỗ trợ `vars:post-response` + `bru.setVar` để chain trong collection; nâng cao, gợi ý user dùng GUI hoặc đặt chain thủ công. Suite auto mặc định chỉ case standalone.
* **`prod` không có flag bypass xác nhận** — AI hỏi lần hai + runner chung cần `--allow-prod`.
* __Đừng nhúng secret vào HTML__ — key client-side = lộ. Live-fetch gõ key tạm; curl dùng `$ENV_VAR`.
* __Own API: phân biệt public vs session__ — gắn auth nhầm vào signup/login/forgot (TC public) sẽ sai logic test. Đọc cột `Auth` của bảng.
* __Own API: cookie jar vs JWT__ — nếu auth bằng cookie, Bruno giữ cookie jar TRONG 1 run nên TC sau `_setup/login` tự có cookie; chạy lẻ 1 TC session (không kèm setup) sẽ thiếu auth → 401. Chạy cả suite hoặc include `_setup`.
* __Own API: seed credentials cũng là secret__ — `SEED_EMAIL`/`SEED_PASSWORD` ở `bruno/.env` (gitignored), AI KHÔNG đọc value. Khác 3rd chỉ có `*_KEY`.
* __Own backend chưa build → scaffold-only__ — đừng cố `--run`; generate collection để review shape, hoãn run tới khi có base URL + seed.
* __Đừng tự bịa endpoint/HTTP cho own__ — nếu checklist row Conf 🟡 (contract suy đoán) hoặc còn OQ, giữ nguyên 🟡 trong bảng; khi backend chốt contract → `/api-checklist` (gọi lại, nói cần đổi gì) rồi nói "regen lại giùm" ở `/api-test`.

## Files generated (path tuỳ nguồn)

> __Path__: nguồn từ `api-checklist` (own + 3rd) → `docs/{feature}/test/api/`. Legacy 3rd chỉ api-summary → `docs/{feature}/integration/`. Bảng dưới dùng `<base>/` cho path đó. Runner (`bruno-runner.mjs`) KHÔNG nằm trong path này — dùng chung ở `.claude/scripts/`, không sinh lại mỗi feature.

| File | Vai trò | Ai sửa | Commit? |
|------|---------|--------|---------|
| `api-tests.md` | __Source of truth__: bảng TC + cột Kết quả/Lần chạy + Lịch sử chạy + Ý nghĩa nghiệp vụ + Phát hiện khi test | AI sinh case; runner ghi kết quả | Có |
| `bruno/bruno.json` | Config collection Bruno (để extension + CLI nhận diện) | runner `gen` (auto nếu thiếu) | Có |
| `bruno/environments/{mock,sandbox,prod|local,staging}.bru` | `*_BASE` URL per env (KHÔNG secret) | AI viết 1 lần (từ api-summary); own API dùng tên `{FEATURE_SLUG}_BASE` | Có |
| `bruno/{provider|own}/{TC}-{slug}.bru` | 1 request/TC: method/url/headers/body/auth/assert | runner `gen` (từ bảng — deterministic) | Có |
| `bruno/.env.example` | Template tên biến `*_KEY` (KHÔNG value) | AI | Có |
| `bruno/.env` | Value thật (key) | __CHỈ user__ | __KHÔNG__ (gitignored) |
| `api-tester.html` | (optional, khi user nói "xuất ra HTML") tester thủ công 2 tab | AI | Có |

> Runner (`gen`/`run`/parse report/ghi ngược bảng, mask + xoá report) sống ở `.claude/scripts/bruno-runner.mjs` — dùng chung, KHÔNG sinh riêng per-feature. Xem Mục "Runner dùng chung" ở trên.

## Own API (own / mixed) — auth session + output path

Khi nguồn là `test/api/api-checklist.md` có `api_type: own` (hoặc `mixed` tầng own), `/api-test` xử lý KHÁC 3rd-party. **Phát hiện `api_type` từ frontmatter checklist** → chọn nhánh.

### Output path (co-located với checklist)
* __own / nguồn từ api-checklist__ → ghi vào **`docs/{feature}/test/api/`**: `api-tests.md`, `bruno/`, `bruno/.env.example`, `.gitignore` cho `.env`. KHÔNG dùng `integration/`.
* __3rd-party legacy__ (không có checklist, chỉ api-summary) → giữ `integration/` như cũ.
* __3rd-party có checklist__ → cũng `test/api/` (nhất quán). `api-tests.md` cũ ở `integration/` migrate sang khi chạy lại (L2 diff, hỏi user).

### Auth: session/JWT chain (KHÔNG bearer provider key)
Own API không có "provider key". Auth = __login bằng seed account → nhận session cookie / JWT → gắn vào request cần auth__. Collection thêm 1 request setup chạy trước:

* `bruno/_setup/login.bru` (seq 0): `POST {{{FEATURE_SLUG}_BASE}}/auth/login` body `{ "email": "{{process.env.SEED_EMAIL}}", "password": "{{process.env.SEED_PASSWORD}}" }` → cookie jar Bruno tự giữ session trong 1 run cho các TC `Auth=session` sau đó (không cần auth block per-request khi cookie-based). Nếu backend dùng JWT thay cookie: thêm `vars:post-response { authToken: res.body.token }` + `auth:bearer { token: {{authToken}} }` ở TC session (sửa tay hoặc báo runner cần mở rộng).
* __Seed credentials là secret__ → `bruno/.env` (TÊN biến `SEED_EMAIL` / `SEED_PASSWORD`, AI KHÔNG đọc value). Base URL ở `environments/{local,staging}.bru` (committed, KHÔNG secret), tên biến `{FEATURE_SLUG}_BASE` (vd `AUTHENTICATION_BASE`).
* TC __public__ (signup, login, forgot-password, verify, google-callback): KHÔNG gắn auth block.
* TC __session__ (logout, unlink-google, mọi endpoint cần đăng nhập): chạy sau `_setup/login`, dựa cookie jar.

> Env own đặt tên `local` / `staging` (thay `mock/sandbox/prod` của 3rd). `prod` own vẫn cần `--allow-prod`.

### Bảng `api-tests.md` cho own — thêm cột `Auth`
Cột `Auth`: `public` / `session`. Runner `gen` đọc cột → `public` bỏ auth block; `session` chạy sau `_setup/login.bru` (seq thấp nhất), dựa cookie jar Bruno giữ trong 1 run. Map từ checklist: row có Dimension/Endpoint cần đăng nhập → `session`; còn lại `public`.

### Chained / stateful (own) — phần lớn Auto No
Nhiều scenario own cần state nhiều bước, KHÔNG chạy 1-request được → trong checklist đã đánh `Auto No`, ở đây để __ngoài suite auto__ + ghi rõ cách test thủ công:
* "5 fail → locked" (item 21): cần gọi login 5 lần liên tiếp → script lặp hoặc GUI.
* "revoke-all session" (item 33): cần ≥2 session active trước → setup nhiều login.
* "captcha sau 3 fail" (item 20): cần 3 lần fail tuần tự.
* "remember-me 30 ngày" (item 23): cần kiểm lifetime → không assert tức thì.
* "logout chỉ device này" (item 41): cần 2 session.‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍
* Google OAuth (item 25-28): cần provider → mock OAuth hoặc test thủ công (OQ).
Suite auto own = TC `public` standalone + TC `session` 1-bước (login setup → 1 call).

### api_type = mixed
Endpoint own dùng session-chain như trên; phần verify hành vi khi partner downstream lỗi (vd "PayGate 402 thì /payment/charge của mình trả gì") test ở __suite 3rd-party riêng__ (provider bearer). KHÔNG trộn own-auth + provider-key trong 1 `.bru`.

### Chiều `Dir=in` (inbound webhook — đối tác gọi VÀO app mình)
Row checklist có cột `Dir=in` (dimension `Inbound-webhook`) __KHÔNG phải app gọi ra đối tác__ — mà là __đối tác gọi VÀO endpoint webhook của MÌNH__. Test đúng bản chất: __gửi 1 payload webhook (ký HMAC như đối tác ký) tới endpoint receiver CỦA MÌNH__ (`POST {{{FEATURE_SLUG}_BASE}}/webhooks/{provider}`), rồi assert app mình xử lý đúng (verify chữ ký / kích hoạt nghiệp vụ / ghi event 1 lần).

* **Provider của row inbound = `own`** (endpoint webhook nằm ở app mình), KHÔNG phải provider bearer. Url dùng `{{{FEATURE_SLUG}_BASE}}`, KHÔNG `{{PROVIDER_BASE}}`.
* __Signature là fixture__: payload + chữ ký HMAC hợp lệ cần secret webhook → magic value trong Fixtures (vd `wh_sig_valid`), secret thật ở `bruno/.env`. AI KHÔNG tự sinh chữ ký thật (cần secret + thuật toán) → phần lớn row inbound đánh **`Auto No`** (để trống cột HTTP → runner bỏ qua, xem quy ước ở "Chained/stateful") + ghi cách test thủ công (dùng CLI đối tác gửi test-event, hoặc dev cấp payload ký sẵn). Chỉ khi có payload ký sẵn (fixture) mới thành TC `Auto Yes`.
* __Idempotency inbound__ (gửi cùng event 2 lần → chỉ xử lý 1 lần) + __out-of-order__ cần ≥2 request có state → `Auto No`, test thủ công/GUI như case stateful.
* __KHÔNG bao giờ__ ép row `Dir=in` thành TC gọi RA `{{PROVIDER_BASE}}/webhooks/...` — đó là gọi nhầm chiều (webhook là chiều vào, không phải ra), TC sẽ vô nghĩa. Row inbound không map được sạch → giữ ngoài suite auto + note rõ, KHÔNG drop âm thầm.

### Backend chưa build
`api_type: own` + checklist toàn 🟡 "chờ backend" → `/api-test` vẫn __scaffold được collection__ (review request/expected shape) nhưng cảnh báo: `--run` chưa gọi thật được tới khi backend + env (base URL) + seed account sẵn sàng. Generate để review, hoãn run.

## Định dạng bảng test case (giữ nguyên — bảng là gốc sinh .bru)

Trong `api-tests.md`, bảng nằm giữa marker:

```markdown
<!-- TC:START -->
| TC | Provider | Method | Path | Headers | Body | HTTP | Assert | Ref | Kết quả | Lần chạy |
|----|----------|--------|------|---------|------|------|--------|-----|---------|----------|
| TC-01 | paygate | POST | /v1/customers | — | {"email":"learner@example.com"} | 201 | object=customer | ACL#1 | — | — |
| TC-02 | paygate | POST | /v1/charges | Idempotency-Key: key_tc02 | {"amount":99000,"currency":"vnd","source":"tok_chargeable"} | 201 | status=succeeded | ACL#3 | — | — |
| TC-03 | paygate | POST | /v1/charges | — | {"amount":99000,"currency":"vnd","source":"tok_insufficient"} | 402 | error.code=insufficient_funds | ACL#3 | — | — |
<!-- TC:END -->
```

> **Cột `Ref`** (mới) — neo mỗi TC về ACL item / FR (`ACL#N` hoặc `FR-...`), phục vụ traceability __n–n__ (nhiều TC cùng trỏ 1 ACL item — vd TC-02+TC-03 cùng `ACL#3`). Runner index theo tên cột nên cột phụ này __không phá__ parse/writeback. **`Auto No` → để trống cột `HTTP`** (runner skip case HTTP rỗng, không cố gọi) — dùng cho row cần state nhiều bước (rate-limit, concurrency, inbound-webhook idempotency).

Quy ước cột:
* __Provider__ — `paygate` → folder `bruno/paygate/`, url dùng `{{PAYGATE_BASE}}`, auth `{{process.env.PAYGATE_KEY}}`; `mailgate` → `{{MAILGATE_BASE}}` + `{{process.env.MAILGATE_KEY}}` (uppercase + `_BASE`/`_KEY`).
* __Path__ — tương đối; .bru ghép `{{PROVIDER_BASE}}` + Path trong block `get/post`.
* __Headers__ — `Key: Value` nối bằng `;`; `—` = không. Generate vào block `headers {}`. Content-Type tự suy từ `body: json`; Authorization qua block `auth:bearer`.
* __Body__ — JSON 1 dòng hoặc `—`. **Không dùng ký tự `|` trong body** (vỡ bảng). Generate vào block `body:json {}`.
* __HTTP__ — mã status mong đợi → assert line `res.status: eq <code>`.
* __Assert__ — `dotpath=value` nối bằng `;` (vd `status=active;plan=premium_monthly`); `—` = chỉ check HTTP. Mỗi cặp → `res.body.<dotpath>: eq <value>` (vd `error.code=insufficient_funds` → `res.body.error.code: eq insufficient_funds`).
* __Kết quả / Lần chạy__ — sync ghi; AI để `—` khi tạo mới.

## Bảng → `.bru` mapping (do runner `gen` thực hiện — deterministic)

Mỗi TC sinh 1 file `bruno/{provider}/{TC}-{method}-{path-slug}.bru` (vd `bruno/paygate/TC-02-post-v1-charges.bru`):

```bru
meta {
  name: TC-02 POST /v1/charges (succeeded)
  type: http
  seq: 2
}

post {
  url: {{PAYGATE_BASE}}/v1/charges
  body: json
  auth: bearer
}

auth:bearer {
  token: {{process.env.PAYGATE_KEY}}
}

headers {
  Idempotency-Key: key_tc02
}

body:json {
  {
    "amount": 99000,
    "currency": "vnd",
    "source": "tok_chargeable"
  }
}

assert {
  res.status: eq 201
  res.body.status: eq succeeded
}
```

Quy tắc generate:
* `meta.name` **PHẢI bắt đầu bằng `TC-NN`** (để sync match report ↔ bảng). `seq` = số thứ tự TC.
* GET không body: block `get { url: {{BASE}}/path?query }`, bỏ `body`, vẫn có `auth: bearer` + `auth:bearer{}` nếu cần key. Query string inline trong url.
* Không có header (`—`) → bỏ block `headers`.
* Body `—` → bỏ block `body:json`, bỏ `body: json` trong method block.
* Assert `—` → chỉ `res.status: eq <HTTP>`.

### environments/{env}.bru (chỉ BASE, committed)

```bru
vars {
  PAYGATE_BASE: http://localhost:4242
  MAILGATE_BASE: http://localhost:4343
}
```

* `mock.bru` → localhost mock; `sandbox.bru` / `prod.bru` → base remote thật.
* KHÔNG đặt `*_KEY` ở đây (key là secret → `.env`).

### bruno.json + .env.example

```json
{
  "version": "1",
  "name": "{feature}-api-tests",
  "type": "collection",
  "ignore": ["node_modules", ".git"]
}
```

`bruno/.env.example` (chỉ tên biến KEY, không value; BASE đã ở environments):
```
# Copy -> bruno/.env rồi điền key thật. KHÔNG commit (.env gitignored).
# Bruno (app+CLI) tự nạp file này; .bru tham chiếu {{process.env.PAYGATE_KEY}}.
PAYGATE_KEY=sk_test_xxxxxxxxxxxxxxxx
MAILGATE_KEY=mg_test_xxxxxxxxxxxxxxxx
```

## Runner contract (`.claude/scripts/bruno-runner.mjs` — dùng chung mọi feature)

Runner là 1 file duy nhất, không sinh lại per-feature. Có 2 mode, luôn cần `--dir <path>` trỏ tới folder chứa `api-tests.md` + `bruno/`. Đọc trực tiếp source (`bruno-runner.mjs`) nếu cần biết chi tiết implementation — tóm tắt hành vi:

### `gen --dir <path>`
Parse bảng (giữa marker TC:START/END, tự phát hiện cột `Provider` hay `Auth`) → sinh `bruno/{provider|own}/{TC}-{method}-{pathslug}.bru` (xoá+rewrite các file `.bru` cũ) + `bruno/bruno.json` (nếu thiếu). __KHÔNG đụng__ `bruno/environments/*.bru` + `bruno/.env` (AI/user sở hữu). `meta.name` luôn bắt đầu `TC-NN` để mode `run` match ngược. Bảng có cột `Auth` (own API) → gen thêm `bruno/_setup/login.bru` (seq 0), TC `Auth=session` chạy sau nó dựa cookie jar; TC `Auth=public` không gắn auth block.

### `run --dir <path> [--env mock] [--tc TC-01,TC-03] [--provider paygate] [--allow-prod]`
Tự chạy `gen` trước (refresh `.bru` từ bảng) rồi run. Hành vi:
1) `prod` mà thiếu `--allow-prod` → từ chối chạy (in lý do, exit 2). KHÔNG đọc `.env`.
2) Xác định tập file `.bru` cần chạy (`--tc` / `--provider` / mặc định cả `bruno/`, cộng `_setup/` nếu có session).
3) Gọi Bruno CLI qua npx, report JSON ra file tạm theo `--dir` (tên file dùng `process.pid` + counter, KHÔNG dùng `Date.now()` trong context bị giới hạn).
4) Parse report: mỗi item → TC id (regex `^TC-\d+` trong tên request), HTTP status, kết quả assert. Phát hiện `ECONNREFUSED`/`ENOTFOUND`/`ETIMEDOUT` riêng để nhận diện "môi trường chưa sẵn sàng".
5) __PENDING check__: nếu 100% item connection-refused → ghi `⏳ PENDING` vào bảng (không phải PASS/FAIL), exit code __0__. Ngược lại (≥1 request kết nối được) → ghi PASS/FAIL thật, exit code = số fail.
6) __Mask + scrub__: KHÔNG in/ghi `Authorization`, token, cookie. __Xoá report ngay sau khi parse xong__ (không trước khi đọc).
7) Ghi ngược `api-tests.md`: cột `Kết quả` + `Lần chạy` (ISO) + prepend dòng vào `## Lịch sử chạy`.
8) `npx` lỗi/không tải được gói → in hướng dẫn, exit ≠ 0.

Fixture test cho hành vi trên: `.claude/scripts/__tests__/bruno-runner.test.mjs` (chạy `node .claude/scripts/__tests__/bruno-runner.test.mjs` để verify parse/classify/pending logic không bị hỏng khi sửa runner).

## Approach

### Scaffold (default — `/api-test --feature X`)
1) __Parse args__ — `--feature` optional, auto-detect từ ngữ cảnh; mơ hồ → prompt picker. **Đọc `api_type` từ checklist frontmatter** (own/3rd/mixed) → nếu own/mixed, theo section __"Own API"__: path `test/api/`, auth session-chain (`_setup/login` + cột `Auth`), env `local/staging`, cảnh báo scaffold-only nếu backend chưa build. Nếu 3rd legacy → behavior cũ (bearer key, `integration/`).
2) __Nguồn test case — ưu tiên checklist đã duyệt:__
   * **Có `docs/{feature}/test/api/api-checklist.md`** (output của `/api-checklist`) → __đây là nguồn chính__: parse bảng giữa `<!-- ACL:START -->`/`<!-- ACL:END -->` + Fixtures giữa `<!-- FIX:START -->`/`<!-- FIX:END -->`. Expand __n–n cùng intent__ mỗi row ACL thành 1+ TC row — 1 item nở thành nhiều TC cùng ý-định OK (vd boundary số tiền), nhưng __KHÔNG đẻ scenario MỚI ngoài checklist__ (scope đã review ở `/api-checklist`).
     * **Mỗi TC phái sinh giữ ID `TC-NN` RIÊNG, unique, liên tục** (vd ACL item #3 "validation số tiền" → TC-08/09/10/11) — runner match report↔bảng theo `TC-NN` unique, __tái dùng 1 TC-id cho nhiều row = runner ghi đè kết quả lên nhau__ (mất kết quả). KHÔNG share TC-id.
     * **Truy vết ngược về ACL item ghi ở cột `Ref`** (vd `Ref: ACL#3` hoặc `FR-pp-002`) — KHÔNG nhét vào TC-id. Runner an toàn với cột phụ (index theo tên cột, cột lạ bỏ qua).
     * `Endpoint` → Method + Path · `API`(`3rd:{provider}`/`own`/`mixed`) → cột Provider + base/auth.
     * `Trigger` + Fixtures → Body (vd Trigger `tok_insufficient` + Fixtures định nghĩa → `{"source":"tok_insufficient",...}`). Đây là cơ chế tránh bịa body.
     * `HTTP` → cột HTTP · `Error/Assert` → cột Assert (`error.code=...` / dotpath).
     * Bỏ qua row Conf 🟡 nếu user muốn chỉ chạy phần chắc; mặc định đưa hết, đánh dấu 🟡 trong Ý nghĩa nghiệp vụ.
   * **Đọc thêm `integration/api-summary*.md`** để lấy base URL theo env + diễn giải nghiệp vụ.
   * __Chưa có checklist__ → soft gate warn: "Chưa có api-checklist (scope chưa được review). Đề xuất `/api-checklist {feature}` trước để hiểu API + chốt scope." Vẫn proceed fallback: đọc `api-summary*.md` đề xuất bộ case như cũ.
3) __Đề xuất bộ test case__ — nếu từ checklist: present mapping ACL→TC để user xác nhận. Nếu fallback: ưu tiên case standalone (không phụ thuộc id request trước): happy path + error path từ error catalog (400/402/401/429). Show bảng đề xuất trong chat để user thêm/bớt.
4) __Approval L1__ — plan: tạo `api-tests.md` (bảng + N case) + collection `bruno/` (bruno.json + environments mock/sandbox/prod + N file .bru theo provider) + `bruno/.env.example` + thêm `.env` vào `.gitignore`. User Y.
5) __Write__ — `api-tests.md` (frontmatter v2 `type: api-tests`, bảng giữa marker, `## Lịch sử chạy` rỗng, `## Ý nghĩa nghiệp vụ`, `## Phát hiện khi test`). AI viết `bruno/environments/{mock,sandbox,prod|local,staging}.bru` (base từ api-summary) + `bruno/.env.example`. Rồi chạy `node .claude/scripts/bruno-runner.mjs gen --dir docs/{feature}/test/api` để sinh `bruno/bruno.json` + các `.bru` từ bảng. Edit `.gitignore` thêm `.env` + `.bruno-report-*.json` nếu chưa.
6) __Hướng dẫn user__ — (a) copy `bruno/.env.example` → `bruno/.env`, điền key; (b) chạy nhanh: bật mock rồi `/api-test --feature X --run`; (c) hoặc mở `bruno/` trong __Bruno extension__ để click chạy trực quan (GUI không ghi ngược bảng).

### Run (`/api-test --feature X --run`)
1) __Tiền kiểm__ — `test -f bruno/.env` (chỉ check tồn tại, __KHÔNG đọc nội dung__). Thiếu → nhắc tạo từ `.env.example`. Env mock → optionally check cổng mock sống.
2) __Trigger__ — `node .claude/scripts/bruno-runner.mjs run --dir docs/{feature}/test/api --env <env> [--tc ...] [--provider ...]`. `prod` → xác nhận lần hai + thêm `--allow-prod`.
3) __Đọc kết quả__ — đọc stdout masked + đọc lại bảng (cột Kết quả). KHÔNG đọc `.env`/report.
4) __Diễn giải nghiệp vụ__ — mỗi PASS/FAIL nghĩa gì ("`status=succeeded` → Premium kích hoạt, BR-001"; "`402 insufficient_funds` → màn lỗi E-...-002"). FAIL bất thường → gợi ý (mock tắt / shape đổi / thiếu env / npx chưa tải được).
5) __Output report__ — `{pass}/{total}` + case fail + gợi ý case bổ sung + next `/api-map`.

### Add / Regen
* Nói "thêm request mới: `<mô tả>`": thêm row vào bảng (L1) → sinh file `.bru` mới (chỉ TC đó) → optional `--run --tc <new>`.
* Nói "regen lại giùm": chạy `node .claude/scripts/bruno-runner.mjs gen --dir docs/{feature}/test/api` → sinh lại toàn bộ `bruno/{provider|own}/*.bru` từ bảng hiện tại (sau khi user sửa bảng tay). KHÔNG đụng `environments/` + `.env`.

### Single (`/api-test "<METHOD /path>" --feature X`)
* Thêm 1 TC vào bảng (L1) → sinh .bru → `--run --tc <new>`. Cùng cơ chế Bruno/.env — không gọi curl tay với key trong chat.

### HTML (khi user nói "xuất ra HTML")
* Sinh `docs/{feature}/integration/api-tester.html` self-contained, 2 tab (Banner CORS đỏ; dropdown endpoint pre-fill từ summary + dropdown env; Live fetch với ô key tạm không persist; Curl-builder dùng `$ENV_VAR`). Regen khi summary đổi (L2 diff).

## Output

| File | Nội dung |
|---|---|
**`<base>/` = `docs/{feature}/test/api/`** (mặc định, nguồn từ `/api-checklist`) — hoặc `docs/{feature}/integration/` với **legacy 3rd chỉ có `api-summary`, chưa có checklist**.

| File | Nội dung |
|---|---|
| `<base>/api-tests.md` | Bảng test case (`type: api-tests`) — __source of truth__, sinh `.bru` từ đây |
| `<base>/bruno/` | Collection Bruno: `bruno.json` + `environments/` + `.bru` per TC (runner `gen` sinh, KHÔNG sửa tay) |
| `<base>/bruno/.env.example` | Mẫu biến môi trường |
| `<base>/.gitignore` | Chặn commit `bruno/.env` |
| `docs/{feature}/integration/api-tester.html` | __(optional)__ tester thủ công 2 tab Live fetch + Curl-builder — chỉ sinh khi user nói "xuất ra HTML" |

**`bruno/.env` (secret thật) KHÔNG commit** — gitignored, AI không đọc. Kết quả `--run` ghi ngược vào cột Kết quả của bảng kèm env + ngày.

## References

* @../../rules/api-integration.md
* @../../rules/approval-gate.md
* @../../rules/feature-bootstrap.md
* @../../rules/ba-conventions.md
* @../../rules/delivery-readiness.md
* @../../rules/naming-conventions.md‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍


<!-- wm:c3e3a8b9c06f46427bf9089e2fdafa48 -->
<sub>Tài liệu thuộc bộ AI4BA BA-Kit — bản quyền ai4ba.com</sub>
