---
name: srs
description: >-
  Turn PRD scope into a structured per-feature SRS (`spec.md`: FR, NFR, Business Rules,
  Error Matrix, Success Criteria), and optionally continue through Models (use cases,
  flows, ERD, states), UX (user-flow, wireframes), and Delivery (user stories, AC).
  Activate when the user asks to create or update an SRS (`/srs <feature>` or `/srs`).
---
<!-- Licensed to th.vinh102@gmail.com — Order GD86QNQXZ -->

# /srs — Per-feature SRS Orchestrator (tuần tự, hỏi chạy tới tầng nào)‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

> **KHÔNG dùng `context: fork`** — giống `/cr`. Skill chạy ở main conversation vì có nhiều điểm HITL thật (L1/L2 mỗi lần Write, HARD STOP của `/user-flow`). Chạy **tuần tự**, KHÔNG song song hoá qua sub-agent ghi file — mọi file chỉ được ghi SAU approval (xem Constraints "An toàn ghi file").

## Goal‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

Từ PRD → `spec.md` (core spec: FR/NFR/BR/Error/Success Criteria) TRƯỚC TIÊN. Ngay từ đầu hỏi anh **muốn chạy tới tầng nào** (chọn 1 lần), rồi chạy tuần tự đúng tới tầng đó — mỗi phần đọc output đã chốt của phần trước làm nguồn, không bịa.

**Vì sao tuần tự (không song song hoá phần GHI):** an toàn dữ liệu > tốc độ. Sub-agent chạy qua `invoke_subagent` không hỏi trực tiếp user giữa chừng, nên nếu để nó **ghi file** trước rồi confirm sau thì rollback (`git checkout`/`rm`) không đáng tin — có thể nuốt thay đổi chưa commit của anh, và làm sai lệch `changelog.md`/staleness. Do đó `/srs` chạy tuần tự, **L1 trước mỗi lần Write (`write_file`/`edit_file`)**, đúng chuẩn approval-gate. **Phạm vi cấm sub-agent = GHI file đích, KHÔNG phải mọi sub-agent:** `invoke_subagent` (`TypeName: "research"` hoặc read-only `self` đọc nhiều file → trả findings/proposed-content, KHÔNG ghi file) là hợp lệ và tiết kiệm main-context — dùng được cho phân tích nặng ở Tầng-1 và review ở Phase G. Cái cấm là sub-agent tự ghi file đích trước approval.

## 4 tầng nội dung‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

```
Tầng 1  Core spec        spec.md (Scope/FR/NFR/BR/Error/Success Criteria/entities/OQ)
          │
Tầng 2  Models           usecases/ (UC prose) + flows.md + erd.md + states.md
          │
Tầng 3  UX               user-flow (HARD STOP) → wireframe (ascii/html)
          │
Tầng 4  Delivery         userstories/ (+ AC nếu chọn)
```

Chọn tầng N = chạy **1..N** (lũy tiến, tầng sau bao gồm tầng trước). Vd chọn 3 = chạy Tầng 1+2+3.

## Menu — hỏi NGAY ĐẦU (sau khi resolve feature + upstream, TRƯỚC Batch phỏng vấn)‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

```
Chạy /srs cho {feature} tới đâu?
  [1] Core spec       — FR / NFR / Business Rules / Error Matrix / Success Criteria
  [2] +Models         — use case + flows (sequence/activity) + ERD + state diagram
  [3] +UX             — user flow (cần anh duyệt) + wireframe (ASCII / HTML)
  [4] +Delivery       — user story (+ acceptance criteria)
  [all]               — chạy hết (tương tác nhiều bước qua 4 skill — sẽ in roadmap trước)

→ Chọn số N = chạy tầng 1 đến N (vd "3" = spec + models + UX).
→ Hoặc gõ tổ hợp bỏ tầng giữa, vd "1,2,4" = spec + models + story, BỎ wireframe.
```

- Hỏi menu **1 lần duy nhất, sớm** để biết cần phỏng vấn phần nào (front-load đúng phạm vi). KHÔNG dừng hỏi lại "tiếp không" giữa các tầng — mọi làm-rõ-phạm-vi (kể cả xác nhận `[4]` cần kéo thêm tầng nào) gộp vào lần tương tác menu này.
- `--spec-only` hoặc nói "chỉ cần spec thôi" = tương đương chọn [1].
- **`[4]` không cần Tier-3 wireframe** — `/userstory` chỉ bắt buộc `spec.md` (FR) + use case; screens là ref-optional (thiếu → ghi TBD, bổ sung sau). Nên xử lý ngay TẠI menu (không hỏi lại giữa flow):
  - Chọn `[4]` mà bỏ `[2]` → hỏi luôn ở menu: "Story cần use case làm nguồn — chạy kèm Tầng 2 (Models) nhé? (Y/không, dùng screen ref = TBD)". Chốt trong lần menu này.
  - Muốn **spec + story, BỎ wireframe** → hợp lệ: chọn `[4]` + trả lời "không cần wireframe" → skill chạy Tầng 1+2+4, Tầng 3 wireframe skip (screens = TBD).
  - Menu cũng nhận tổ hợp gõ tay dạng `1,2,4` (bỏ 3) — skill hiểu là chạy đúng các tầng đó.

## Constraints‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍

### Hard rules — never violate

- **An toàn ghi file (QUAN TRỌNG)** — mọi file chỉ Write (`write_file`/`edit_file`) SAU khi user Y ở L1. KHÔNG ghi file trước rồi confirm sau. KHÔNG dùng `git checkout --`/`rm` làm cơ chế rollback. Nếu 1 phần cần chạy qua `invoke_subagent` để tận dụng context riêng, sub-agent phải trả **proposed content** về main thread, main thread mới Write sau approval — sub-agent KHÔNG tự Write file đích.
- **Chạy tuần tự theo tầng đã chọn** — Tầng 1 → 2 → 3 → 4, dừng ở tầng anh chọn. Trong mỗi tầng, làm từng artifact, L1 trước mỗi nhóm Write.
- **Front-load gaps, KHÔNG front-load toàn bộ** — agent ĐỌC upstream (PRD/URD/BRD/brainstorm) TRƯỚC, dựng bản nháp scope + FR, rồi chỉ hỏi anh xác nhận/bổ sung **chỗ còn thiếu**. KHÔNG bắt anh liệt kê lại từ đầu thứ upstream đã có (no-re-ask, [ba-conventions.md](../../references/ba-conventions.md) Mục 2).
- **`spec.md` = source of truth SAU Phase C — chặn re-read upstream** — đọc upstream (PRD/URD/BRD) là chi phí **1 lần** ở Phase B. Từ Tầng 2 trở đi (UC/ERD/flows/user-flow/story), nguồn là `spec.md` vừa chốt (đã trong context) + đúng artifact tầng đó sinh — **KHÔNG re-open PRD/URD/BRD raw** mỗi tầng. Chọn nguồn để đọc thì ưu tiên KG (`kg facts`/`kg neighbors`) shortlist trước, rồi Read đúng file cần (per [kg-usage.md](../../references/kg-usage.md)).
- **Thông tin cấp dự án đọc + ghi vào profile** — compliance áp dụng, thị trường/ngôn ngữ, thuật ngữ gọi người dùng cuối (chạm nhiều ở NFR bảo mật/riêng tư + wording lỗi): đọc `docs/_shared/project-profile.md` ở Phase B cùng upstream; thiếu mà cần cho NFR thì hỏi rồi đề xuất ghi vào profile. Per [project-profile.md](../../references/project-profile.md).
- **NFR hỏi bằng outcome nghiệp vụ, KHÔNG hỏi ngôn ngữ dev** — "khách chờ tối đa mấy giây?", "giờ vận hành nào cần khả dụng?", "lượng giao dịch giờ cao điểm?", "dữ liệu nào nhạy cảm, ai được xem, giữ bao lâu?". KHÔNG hỏi "encrypt at-rest?", "isolation level?", "thuật toán hash?". Giá trị nghiệp vụ chưa chốt → ghi `TBD — owner — deadline`, KHÔNG tự đặt số.
- **Ranh giới nội dung SRS-cho-BA (xem Pitfalls — Tầng nội dung)** — SRS chỉ chứa requirement nghiệp vụ + ràng buộc đã-được-phê-duyệt (có source/owner). KHÔNG chứa quyết định solution design (nền tảng, thuật toán, endpoint, cấu trúc dữ liệu vật lý, SDK). Những cái đó thuộc dev/architect.
- **Stop-on-stuck = structured result + preflight zero-write** — nếu 1 phần thiếu info nghiệp vụ không tự suy được, KHÔNG bịa, KHÔNG ghi file dở. Trả về structured result `NEEDS_INPUT` (xem Mục "Stop-on-stuck") → `/srs` gom câu hỏi hỏi anh 1 batch → chạy lại phần đó với answer. Preflight: kiểm đủ input TRƯỚC khi generate; thiếu → zero-write.
- **Marker `[NEEDS CLARIFICATION: câu hỏi]` inline — KHÔNG đoán bừa chỗ mơ hồ NHỎ** (mượn Spec Kit; NỐI vào OQ, không tạo hệ thứ 2). Khi soạn spec gặp chi tiết mơ hồ mà **không block cả phần** (vd "màn xác nhận hiện phân tách phí hay chỉ tổng tiền?") → **chèn `[NEEDS CLARIFICATION: câu hỏi cụ thể]` ngay tại dòng đó**, KHÔNG tự chọn 1 phương án rồi viết như đã chốt. Phân biệt với Stop-on-stuck: mơ hồ **block** cả artifact (entity không có thuộc tính nào, cardinality bất định) → `NEEDS_INPUT` zero-write; mơ hồ **không block** (1 chi tiết trong FR đã viết được) → marker inline, viết tiếp phần còn lại. **Completion gate:** spec còn ≥1 marker → KHÔNG đề xuất `status: in-review` (nêu ở L1 + Phase H clarify pass). Ở Phase H (bước 28), marker chưa giải quyết được **promote thành mục Open Questions** (gom về Mục cuối) — marker = "OQ chưa promote", không phải kênh song song với OQ.
- **Self-verify trước khi trình L1 — checklist chất-lượng-cách-VIẾT-requirement (KHÔNG phải test sản phẩm)** — trước khi show L1 mỗi tầng, agent tự soát theo checklist dưới. Tinh thần Spec Kit: *"nếu spec là code viết bằng lời, checklist là bộ unit-test của nó"* — kiểm **spec viết đủ/rõ/nhất quán chưa**, KHÔNG kiểm "nút bấm được không". **CẤM mục checklist dùng từ "verify/test/confirm/bấm được"** (đó là test sản phẩm, không phải soát spec). Mỗi phát hiện gắn tag `[Clarity]` / `[Gap]` / `[Consistency]`.
  - **(a) Structural — chạy bằng KG, KHÔNG re-scan prose toàn feature** (deterministic, rẻ): `node .agents/skills/kg/engine/kg-query.mjs coverage {feature}` (anti-join: FR chưa có US/UC, UC orphan, error/screen chưa map) + `... trace {feature}` (dump edge + broken refs: BR→FR, error→FR, state→trigger). CHỈ Read prose node bị KG flag (golden rule `kg-usage.md`: graph CHỌN, prose KẾT LUẬN). `KG-ERROR` (exit 2) → fallback prose-scan như cũ.
  - **(b) Semantic — đọc prose:** `[Gap]` FR phủ hết capability PRD (`Done when`)? mỗi P0 FR có thể fail có ≥1 error case? mọi FR trỏ actor đã khai ở Mục Actors? · `[Clarity]` mỗi FR/NFR có tiêu chí đạt **đo được** (FR: cột `Verify by`; NFR: `Acceptance`)? FR atomic (1 nghĩa vụ testable — flag FR nối nhiều "AND")? · `[Consistency]` có FR khẳng định behavior mà 1 OQ/marker đang mở phủ định? BR nào orphan (không Implements FR)? thuật ngữ dùng khớp `docs/_shared/definitions.md`?
  - **(c) Named self-critique — soi qua lăng kính đặt tên (bước cuối, TRƯỚC L1):** chạy 2 lăng kính bắt buộc + 1 tùy tầng:
    - **Pre-mortem** (luôn): "Giả sử feature này hỏng sau khi lên — vì rủi ro nghiệp vụ nào chưa ghi trong spec?" → thiếu → thêm BR/NFR/OQ.
    - **Inversion** (luôn): "Khách/actor phá luồng này bằng cách nào?" → lộ error case thiếu → bổ sung Error Matrix.
    - **Stakeholder-mapping** (khi có URD/persona): "Mỗi persona/need trong URD có ≥1 FR phục vụ?" → thiếu → thêm FR hoặc đánh OQ.
  - Lỗi phát hiện → sửa trước khi Write, hoặc nêu gọn ở L1 để anh biết (theo tag). KHÔNG im lặng bỏ qua.
- **Approval L1 trước mỗi nhóm Write; L2 diff khi sửa file đã tồn tại** — per `approval-gate.md`. 1 bảng L1 cho mỗi tầng/nhóm artifact, KHÔNG gộp nhiều tầng.
- **Skip L3 cho mermaid** (flows/erd/states) và **skip L3 cho wireframe trong chain mode** — write bản đầu, anh review từ rendered file/folder, muốn sửa thì gọi lại skill lẻ.
- **Interactive menu feature** khi no-arg — list features có `{feature}-prd.md` chưa có `srs/{feature}-spec.md`.
- **Auto-detect upstream** — ưu tiên `{feature}-prd.md > {feature}-urd.md > {feature}-brd.md > brainstorms/`.
- **Soft gate** thiếu PRD → warn + ask explicit confirm.
- **Feature bootstrap** — `spec.md` là điểm-vào nhóm A (per `feature-bootstrap.md`): không có upstream + arg là mô tả nghiệp vụ + feature chưa tồn tại → derive slug, confirm L1, phỏng vấn Tầng 1 từ đầu, tạo `docs/{feature}/srs/` khi Write. Phần downstream (Tầng 2-4) vẫn cần spec.md vừa chốt.
- **ID feature-prefixed**: FR/NFR/BR/E/SC phải có `-{feature}-` (per `naming-conventions.md`).
- **Migration prompt** nếu phát hiện `docs/srs/{feature}/` (Phase 1 legacy).
- **Vietnamese-first**. **Frontmatter chuẩn**.
- **BA conventions** (must follow) — Author resolution cho activity log, no-re-ask, IT-BA framing, Vietnamese typography, L1 prose preview. Per `ba-conventions.md`.

### Pitfalls — easy to get wrong

- **Tầng nội dung SRS-cho-BA (CỐT LÕI)** — SRS chứa 2 tầng: (1) requirement nghiệp vụ do BA sở hữu; (2) ràng buộc kỹ thuật/pháp lý ĐÃ được architect/đối tác/legal phê duyệt (ghi kèm `source/owner`). KHÔNG chứa tầng thứ 3: quyết định solution design mà skill tự chọn. Cụ thể:
  - ✅ ĐƯỢC: "khách thấy kết quả trong 3 giây", "khả dụng 99.9% giờ bán hàng", "5.000 giao dịch/giờ cao điểm", "dữ liệu thẻ nhạy cảm, chỉ admin xem, giữ 7 năm", compliance (PCI-DSS) *nếu* đã được bảo mật/legal chốt (ghi source), tên đối tác ngoài + mục đích + SLA.
  - ❌ KHÔNG: thuật toán hash (HMAC/SHA), nền tảng (NestJS/PostgreSQL/Next.js), isolation level (SERIALIZABLE), bundle budget (KB gzip), endpoint/SDK/payload. → thuộc Architecture/Integration Spec riêng.
  - NFR viết thành **outcome đo được + test được**, KHÔNG thành hướng dẫn implement.
- **Front-load gaps ≠ front-load toàn bộ** — agent đọc upstream dựng nháp rồi hỏi chỗ thiếu; KHÔNG bắt anh liệt kê lại FR/entity từ đầu. Vi phạm no-re-ask nếu hỏi thứ upstream đã có.
- **An toàn ghi file** — không ghi trước approval, không rollback bằng git/rm. Nếu dùng sub-agent thì sub-agent trả proposed content, main thread Write.
- **`/user-flow` luôn main thread** — HARD STOP + reviewer cần tương tác thật; chờ `stage: flow-approved` trước wireframe (không chỉ check file tồn tại).
- **PRD Mục 4 Capabilities** — pull capabilities → derive FR (1 cap ~2-5 FR). Dùng cột `Done when` làm mốc kiểm FR phủ đủ outcome; giữ `Traces to` (`UN-*`/`BO-*`) để chain `UN-*/BO-* → CAP-* → FR-*`.
- **EARS notation (tùy chọn, cho FR + Error) — mẫu câu để test 1:1, KHÔNG mandatory toàn bộ.** Khi mô tả hành vi theo **sự kiện** hoặc **lỗi**, viết FR/Error theo mẫu EARS đọc-tự-nhiên (dịch thẳng thành test case):
  - **Sự kiện:** "**Khi** {trigger}, **hệ thống phải** {kết quả}." — vd "Khi khách bấm Thanh toán, hệ thống phải hiển thị 3 phương thức."
  - **Lỗi/bất thường:** "**Nếu** {điều kiện lỗi}, **thì hệ thống phải** {xử lý}." — vd "Nếu thẻ bị từ chối, thì hệ thống phải hiện danh sách phương thức khác." (map thẳng 1 dòng Error Matrix.)
  - **Trạng thái:** "**Trong khi** {trạng thái}, **hệ thống phải** {hành vi}." · **Luôn luôn:** "**Hệ thống phải** {hành vi}." · **Tùy chọn:** "**Nếu có** {tính năng}, **hệ thống phải** {hành vi}."
  - KHÔNG ép mọi FR thành EARS cứng nhắc (câu "luôn luôn"/"tùy chọn" đọc gượng trong tiếng Việt) — dùng **When/If-then** ở chỗ hành vi/lỗi (đó là chỗ đáng giá nhất), phần còn lại viết prose nghiệp vụ bình thường. Mục tiêu: rõ + test được, KHÔNG phải điền form.
- **Error Matrix critical** — flows sequence reference `E-{feature}-NNN`. Error Matrix rỗng → flows thiếu cite.
- **Business Rule link Implements FR** — mỗi BR nên map ≥1 FR (rule mô tả why, FR mô tả what). BR orphan → self-verify cảnh báo.
- **UC KHÔNG có sequence/state diagram** — chỉ prose. Diagram thuộc flows.md/states.md.
- **ID continuity khi sửa file đã tồn tại** — không renumber, append next NNN.
- **Hook stale-propagation** — edit `spec.md` mark downstream stale nếu đã tồn tại.
- **Mermaid syntax fail** — KHÔNG "vẫn Write, warn" im lặng nữa. Bước 16b render-verify `mermaid-verify.mjs` NGAY sau Write bắt lỗi, tự sửa tối đa 2 lần/file theo `diagram-selection.md` "Mermaid syntax safety" (chú ý: `;` trong `Note over` = vỡ sequence; `&`/`<`/`>` trong flowchart label = vỡ; quote lồng). Vẫn fail → báo user paste mermaid.live, KHÔNG báo "xong".

## Inputs

```
/srs                               # interactive menu feature, rồi menu tầng
/srs <feature>                     # menu tầng — đã có spec.md thì tự vào update mode (L2 diff)
/srs <feature> --spec-only         # chỉ Core spec (tương đương chọn [1])
```

Muốn đổi hành vi mặc định, nói bằng lời:
- `spec.md` đã tồn tại → skill tự hiểu là revise (L2 diff). Downstream KHÔNG tự chạy lại — muốn sửa thì gọi skill lẻ (`/sequence`, `/erd`, `/usecase`...).
- Viết bằng tiếng Anh → nói "viết bằng tiếng Anh".
- "chỉ cần spec thôi" = chọn [1].
- "chạy hết" / "làm tất" = chọn [all].

## Context (chạy ở đầu phiên bằng `run_command`)

```bash
date +%Y-%m-%d
for d in docs/*/; do [ -f "${d}$(basename "$d")-prd.md" ] && basename "$d"; done | head -20
for d in docs/*/; do [ -f "${d}srs/$(basename "$d")-spec.md" ] && basename "$d"; done | head -20
ls docs/srs/ 2>/dev/null | head -10
```

## Approach

### Phase A — Setup + chọn tầng

1) **Legacy migration check** — `docs/srs/{feature}/` (Phase 1) tồn tại → prompt migrate `docs/srs/{feature}/` → `docs/{feature}/srs/` (Y → `git mv` + update wikilinks; n → warn).
2) **Resolve feature.** No-arg → menu features có PRD chưa có SRS. Multi-pick → loop tuần tự mỗi feature 1 chain riêng.
3) **Validate + mode.** `srs/{feature}-spec.md` đã tồn tại → update mode (L2 diff), báo anh biết. Parse `--spec-only`.
4) **Auto-detect upstream** — ưu tiên `{feature}-prd.md > {feature}-urd.md > {feature}-brd.md > brainstorms/`. List, anh pick combo.
   - **KG chọn nguồn trước (rẻ hơn scan):** chạy `node .agents/skills/kg/engine/kg-query.mjs facts {feature}` và `node .agents/skills/kg/engine/kg-query.mjs neighbors <doc-path>` khi có doc mốc để lấy danh sách candidate/coverage, rồi VẪN Read đầy đủ prose file đã chọn. Tuân `.agents/references/kg-usage.md` (3 nghĩa vụ: `--all` khi bị cap · đọc mục "Phải Read tay" · `KG-ERROR` → scan trực tiếp như cũ).
5) **Soft gate / bootstrap** — thiếu upstream + mô tả nghiệp vụ + feature mới → nhóm A (`feature-bootstrap.md`): derive slug, confirm L1.
6) **HỎI MENU TẦNG** (Mục "Menu") — anh chọn số N hoặc `all`. Đây là điểm quyết định phạm vi phỏng vấn.
6b. **In roadmap (progress model) — NGAY sau khi chốt tầng, TRƯỚC phỏng vấn.** BA cần biết trước "sẽ mất bao nhiêu bước" (chạy `[all]` thực tế là ~20-30 điểm tương tác qua 4 skill — đừng để BA tưởng "1 phát xong"). In 1 dòng sized theo pick, vd cho `[all]`:
    ```
    Chạy tới Tầng 4 — sẽ qua 4 chặng:
      Tầng 1 Core spec      (1 lần anh duyệt)
      Tầng 2 Models         (1 lần duyệt gộp)
      Tầng 3 UX             (anh duyệt user flow + từng wireframe)
      Tầng 4 Delivery       (user story + AC)
    Khoảng {N} điểm cần anh xác nhận. Bắt đầu Tầng 1…
    ```
    Rồi **prefix mỗi tầng khi bắt đầu** bằng 1 dòng vị trí: `── Tầng 2/4: Models ──` để BA luôn biết đang ở đâu, còn bao nhiêu. Tier-1/spec-only thì roadmap gọn 1 dòng.

### Phase B — Front-load gaps (đọc upstream trước, chỉ hỏi chỗ thiếu)

> Nguyên tắc: agent làm việc trước, anh sửa sau — KHÔNG bắt anh khai từ đầu.

7) **Đọc hết upstream** đã pick → dựng **bản nháp**: scope 1 dòng + FR list (derive từ PRD capabilities) + NFR/BR/error sơ bộ suy được. **Chỗ mơ hồ nhỏ chưa suy được → chèn `[NEEDS CLARIFICATION: ...]` inline, KHÔNG đoán bừa** (xem Constraint marker). EARS: FR/Error nên viết theo mẫu **When…/If…then…** khi mô tả hành vi theo sự kiện/lỗi (xem Pitfalls — EARS) — đọc tự nhiên + test 1:1.
8) **Trình bản nháp + hỏi gap Tầng 1:**
   - Scope + FR: "Em bóc {N} FR từ PRD, anh xem thiếu/thừa gì?" (KHÔNG bắt anh liệt kê lại).
   - NFR (outcome nghiệp vụ): thời gian khách chờ · giờ vận hành cần khả dụng · lượng giao dịch cao điểm · dữ liệu nhạy cảm + ai xem + giữ bao lâu · mức chấp nhận mất dữ liệu. Chưa chốt → `TBD — owner — deadline`.
   - Business rules + Error cases + Success Criteria (outcome đo được) + Constraints nghiệp vụ + OQ.
9) **Hỏi gap các tầng đã chọn** (chỉ phần liên quan menu, KHÔNG hỏi tầng không chọn):
   - Chọn ≥[2] Models → **Entities** (tên + thuộc tính nghiệp vụ + cardinality) · **entity multi-state** · **functions** (2-6 user goal: actor + pre-condition + expected result + branches) · **technical flows** (tên + related FR).
   - Chọn ≥[3] UX → **Screens** (purpose + fields/actions + layout + mapping screen→function) · **loại wireframe** (ASCII / HTML / cả hai) · **device size** (mobile 375 / tablet 768 / desktop 1024 / responsive). **Chốt device Ở ĐÂY 1 lần** (đề xuất theo `docs/design.md` breakpoints) — ghi vào `userflow.md` frontmatter `primary_device` khi Phase E chạy `/user-flow`, để `/user-flow` + `/wireframe-ascii`/`/wireframe-html` KHÔNG hỏi lại (no-re-ask, `ba-conventions.md` Mục 2 "cùng session" override Mục 7 "always ask" khi value đã chọn session này). Xem note "Truyền device xuống" ở Phase E.‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍
   - Chọn ≥[4] Delivery → không hỏi thêm (dùng lại UC + screens).

`--spec-only` / chọn [1] → bỏ bước 9, dừng phỏng vấn ở Tầng 1.

### Phase C — Tầng 1: Core spec

10) **Self-verify** — FR phủ hết capability PRD (`Done when`)? BR có link Implements FR? Error đủ cho FR quan trọng? Success Criteria đo được?
11) **Approval L1** — preview `spec.md`:
    ```
    1 | docs/{feature}/srs/{feature}-spec.md | create | {N} FR, {M} NFR, {K} BR, {E} errors, {S} success criteria
    ```
    User Y → Write. n → abort.
12) Chọn [1] / `--spec-only` → bỏ qua Tầng 2-4, nhảy thẳng **Phase G (auto-review) → H (OQ) → I (report)**.

### Phase D — Tầng 2: Models (nếu chọn ≥[2])

> **Cách thực thi downstream (Tầng 2-4) — INLINE main thread, KHÔNG spawn subagent ghi file:** khi Phase D/E/F "gọi `/usecase`, `/user-flow`, `/wireframe-ascii`, `/userstory`, `/ac`", nghĩa là agent **tự đọc SKILL.md (nếu có) hoặc template tương ứng và thực thi các bước NGAY trong main conversation** — tôn trọng đầy đủ L1/L2/L3/HARD STOP/`ask_question` của từng bước. TUYỆT ĐỐI KHÔNG dùng `invoke_subagent` để tự chạy trọn skill downstream và ghi file (subagent mất kênh HITL trực tiếp với user). Vì chạy inline, **L1 của chính bước downstream ĐÃ thỏa "L1 trước mỗi Write"** — `/srs` KHÔNG chồng thêm 1 L1 nữa lên trên. Protocol Stop-on-stuck YAML + "sub-agent trả proposed content" (Mục "Stop-on-stuck") CHỈ áp cho `invoke_subagent` phân-tích-nặng tùy chọn ở Tầng-1 spec draft, KHÔNG áp cho Tầng 2-4 (các tầng này dùng HITL loop riêng).
>
> Conventions: `flows.md`/`states.md`/`erd.md` = slim frontmatter (type/feature/updated). `usecases/{feature}-usecase-index.md` = FULL frontmatter (bảng `## Use cases` là ma trận truy vết UC↔FR↔Screen↔Error↔OQ, KHÔNG còn file traceability riêng), `uc-*.md` = zero frontmatter. Mọi ID feature-prefixed. Cập nhật `docs/_shared/changelog.md` (nếu dự án có dùng) theo [changelog.md](../../references/changelog.md).

13) **Use cases** — từ functions Batch: mỗi function → `usecases/uc-{slug}.md` (zero FM, fully-dressed Cockburn, KHÔNG embed diagram) + `usecases/{feature}-usecase-index.md` (bảng `## Use cases` gồm ma trận UC↔FR↔Screen↔Error↔OQ — không còn file traceability riêng).
14) **ERD** — `srs/{feature}-erd.md` (mermaid erDiagram, entities + thuộc tính nghiệp vụ + relationships). Skip nếu không có entity.
15) **Flows** — `srs/{feature}-flows.md` (sequence/activity per flow, cite `E-{feature}-NNN`). Skip nếu không có technical flow.
16) **States** — `srs/{feature}-states.md` (state diagram per entity). Skip nếu không có entity multi-state.
16b. **Render-verify mermaid (BẮT BUỘC, ngay sau khi Write mỗi file có mermaid)** — mermaid KHÔNG render trong chat nên lỗi cú pháp (vd `;` trong `Note over`, `&`/`<`/`>` trong flowchart label, quote lồng) chỉ lộ khi user mở IDE. Chạy cho MỌI file mermaid vừa ghi ở Tầng 2: `node .agents/scripts/mermaid-verify.mjs --file docs/{feature}/srs/{feature}-flows.md` (+ `-erd.md`, `-states.md`). Block nào FAIL → tự sửa theo `.agents/references/diagram-selection.md` "Mermaid syntax safety" (tối đa 2 lần/file), rồi verify lại. Vẫn fail sau 2 lần → giữ file + báo user paste block đó vào mermaid.live để chẩn. KHÔNG báo "Tầng 2 xong" khi còn block fail. (Cùng cơ chế `/sequence` bước 9.5 — `/srs` sinh mermaid inline nên PHẢI tự verify, không dựa skill lẻ.)
17) **Self-verify** — mọi error trong flows có trong Error Matrix? mọi state có trigger? UC nào orphan (không map FR)?
18) **Approval L1 Tầng 2** — gộp preview mọi file Tầng 2 vào 1 bảng. User Y → Write. **`n` ở đây = từ chối NỘI DUNG Tầng 2 vừa dựng, KHÔNG phải mở lại menu tầng** (ngoại lệ có định nghĩa của rule "không hỏi tiếp giữa tầng"): hỏi "sửa lại Tầng 2 (nói chỗ cần đổi) hay bỏ hẳn Tầng 2?". Bỏ hẳn → spec giữ nguyên, chạy tiếp các tầng cao hơn đã chọn ở menu (nếu có), KHÔNG hỏi lại "tiếp không".

### Phase E — Tầng 3: UX (nếu chọn ≥[3])

> **Signpost handoff (D2) + truyền device xuống (D3):** Tầng 3 chạy trọn skill khác (`/user-flow`, rồi wireframe) inline — BA dễ tưởng đã lạc sang skill khác hoặc `/srs` đã kết thúc. Nên **bọc rõ 2 đầu**:
> - **Trước khi gọi `/user-flow`:** in banner `── Giờ dựng user flow: anh sẽ duyệt flow (chốt/sửa/hủy) trước khi vẽ màn. Xong tự quay lại /srs. ──`
> - **Truyền device đã chốt ở Batch (bước 9):** seed `primary_device` xuống `/user-flow` (ghi frontmatter) + `/wireframe-*` → chúng KHÔNG hỏi lại device (no-re-ask). Cũng seed screens list để `/user-flow` Phase C skip câu đã trả lời ở Batch.
> - **Sau khi `userflow.md` đạt `stage: flow-approved`:** in `✓ Flow đã duyệt — quay lại /srs, tiếp tục vẽ wireframe.` trước bước 20.
> - **Trim "Recommended next" của sub-skill** khi chạy trong chain `/srs` — báo cáo "next: /wireframe…/srs" của `/user-flow` đọc như vạch-đích-giả, gây tưởng run kết thúc. Bỏ/rút gọn phần đó trong chain mode.

19) **Gọi `/user-flow {feature}` ở MAIN THREAD** — seed screens list + `primary_device` (từ Batch bước 9) để không hỏi lại. Skill tự chạy Phase A-G của nó (HARD STOP + reviewer `flow-reviewer`) — CHỜ anh confirm thật. Đã có `userflow.md` `stage: flow-approved` → dùng thẳng.
20) **Wireframe** (chỉ sau `userflow.md` đạt `stage: flow-approved`):
    - `ascii` → gọi logic `/wireframe-ascii {feature}` (đọc userflow, tự vẽ + L1 riêng của skill đó).
    - `html` → `/wireframe-html {feature}`.
    - `both` → chạy cả 2 (đọc lại ASCII làm nguồn element nếu đã có).

### Phase F — Tầng 4: Delivery (nếu chọn [4])

21) **Điều kiện**: UC (Tầng 2) bắt buộc. Screens ASCII (Tầng 3) là **tùy chọn** — nếu BA chọn "spec + story bỏ wireframe" ở Menu (D4), story vẫn chạy với **screen ref = TBD** (bổ sung sau khi có wireframe). Thiếu UC → đã xác nhận kéo Tầng 2 ở Menu.
22) **User stories** — `/userstory {feature}` đọc spec + UC + screens, chia story theo UC + screens, Write `userstories/us-*.md` + index. Self-verify: mọi FR quan trọng có ≥1 story?
23) **AC** (nếu anh chọn) — `/ac {feature}` đọc US vừa tạo, Write AC inline.
24) **Approval L1 Tầng 4** — preview US + index (+ AC).

### Phase G — Auto-review + auto-fix (chạy mặc định, KHÔNG hỏi trước)

> Nhất quán với `/brd` + `/prd-epic` (mỗi skill sinh doc quan trọng đều có tầng review độc lập — self-verify là skill *tự chấm mình*, phase này là *người khác chấm*, bắt cái self-verify mù). Chạy SAU khi các tầng đã ghi xong, TRƯỚC Phase H (OQ resolution — vì review có thể sinh OQ/finding cần resolve). Phase này là tầng review tự-chạy-sẵn cho doc `/srs` vừa sinh (mỗi skill sinh doc tự có tầng review inline của mình).

25) **KG pre-pass — dựng shortlist gap TRƯỚC khi spawn agent (bám `kg-usage.md`: graph CHỌN, prose KẾT LUẬN).** Chạy 1 lần ở main thread: `node .agents/skills/kg/engine/kg-query.mjs coverage {feature}` (anti-join: FR chưa có US/UC, UC orphan, error/screen chưa map) + `... trace {feature}` (dump mọi edge + broken refs: BR→FR, error→FR, actor→FR, state→trigger) + `... facts {feature}` (đếm cấu trúc hiện có). Kết quả = **danh sách node/edge nghi vấn** để agent tập trung Read prose đúng chỗ, KHÔNG scan mù toàn feature. Tuân 3 nghĩa vụ `kg-usage.md`: `⚠ còn N mục` → chạy `--all` (KHÔNG làm việc trên danh sách cắt dở); đọc mục "Phải Read tay" (doc graph không parse được — graph mù về chúng); `KG-ERROR` (exit 2) → báo agent scan prose trực tiếp như cũ. **KG chỉ khoanh vùng, KHÔNG thu hẹp phạm vi review:** agent VẪN phải phủ hết checklist (i)-(vi) + completeness/edge; KG giúp đọc *đúng chỗ trước*, KHÔNG phải cớ bỏ qua node KG không đụng tới (rủi ro nghiệp vụ/wording nằm ngoài graph). Chất lượng > token — nghi ngờ thì đọc thêm.
26) **Spawn subagents song song qua `invoke_subagent` (`TypeName: "research"`) — READ-ONLY (trả findings, KHÔNG tự Write)** — đúng ranh giới A1/an-toàn-ghi-file: sub-agent review chỉ đọc + trả finding, main thread mới apply fix. Bộ role **chọn theo tầng đã chạy**:
   - **Luôn** (mọi tầng): `Senior BA Reviewer` (completeness, edge case, ambiguity, actor khai đủ) · `QA Reviewer` (FR/NFR **testable** không — mỗi FR có `Verify by`/pass condition rõ; Error Matrix phủ đủ P0 FR; Success Criteria đo được) · `Tech Reviewer` (feasibility NFR/constraint; **scope-leakage** — solution-design nền-tảng/thuật-toán/endpoint lọt vào SRS).
   - **+`UX/UI Reviewer`** khi chạy ≥Tầng 3 (screen state coverage, flow consistency).
   Truyền cho mỗi subagent: **KG shortlist (bước 25)** + target files (spec + artifact tầng đã ghi) + `.agents/references/review-format.md` + `.agents/references/ba-conventions.md` + `.agents/references/kg-usage.md`. Subagent dùng shortlist để Read prose đúng node nghi vấn rồi KẾT LUẬN bằng prose (KHÔNG kết luận thẳng từ KG facts — facts không chứa điều kiện/wording). Ngoài review-format chung, soi đặc thù SRS: (i) FR↔capability trace (`CAP-*`→`FR-*`, không FR mồ côi khỏi PRD), (ii) BR↔FR (`Implements FR`), (iii) error→FR, (iv) actor declared cho mọi FR, (v) NFR outcome đo được (không phải hướng dẫn implement), (vi) marker `[NEEDS CLARIFICATION]` còn sót. Các đối-chiếu-quan-hệ (i)-(iv) LẤY TỪ KG trace (bước 25), subagent chỉ Read prose để xác nhận + tìm cái KG không thấy (wording/nghĩa).
27) **Aggregate findings** per `review-format.md` — dedupe, escalation 2+ agent cùng WARNING → BLOCKING.
28) **Phân loại + apply (như `/prd-epic`):**
   - **(a) safe fix** — editorial, consistency nội-bộ-doc, bổ sung từ facts đã chốt ở upstream/interview → **TỰ APPLY hết, không hỏi** (L2 diff nếu file đã tồn tại).
   - **(b) business decision** — đổi con số/quyết định user đã chốt, thêm ràng buộc nghiệp vụ mới → **TỰ CHỌN phương án hợp lý nhất** (ưu tiên nhất quán facts đã chốt + ít rủi ro nghiệp vụ nhất) + apply luôn, KHÔNG dừng hỏi giữa chừng; đánh dấu từng cái trong report mục **"🔶 Quyết định thay user — review lại"**.
   - Nếu dự án có `docs/_shared/changelog.md`, append dòng cập nhật theo [changelog.md](../../references/changelog.md) (`reviewed by @{agents}: {N} auto-fixed ({M} auto-decided)`).
   - User nói **"khỏi review"** trong câu lệnh → skip toàn Phase G.

### Phase H — OQ resolution pass (chạy 1 lần ở cuối)

> **Lưu ý nhãn Phase:** `resolve-oqs.md` tự gọi mình là "**Phase E**" (pattern chung mọi BA skill: chạy sau Write doc). Ở `/srs`, pass này là **Phase H — chạy MỘT lần ở cuối, SAU khi mọi tầng đã ghi + đã auto-review**, KHÔNG chạy sau mỗi lần Write của từng tầng (nếu chạy sau mỗi Write thì OQ của tầng sau chưa tồn tại lúc resolve tầng trước). Đừng nhầm "Phase E" của resolve-oqs với Phase E (UX) của skill này. OQ mới do Phase G review sinh ra cũng gom vào pass này.

29) **Clarify pass + marker promote** — grep toàn spec mọi `TBD`/`[NEEDS CLARIFICATION: ...]`: hỏi anh chốt từng cái. Chốt được → thay marker bằng nội dung thật (L2 diff). Chưa chốt → **promote marker thành 1 dòng ở Mục Open Questions** (ghi owner/deadline nếu có) rồi xóa marker inline — để spec không còn `[NEEDS CLARIFICATION]` rải rác. **Completion gate:** còn marker chưa promote/chưa giải quyết → báo rõ ở report "spec còn {K} chỗ chưa rõ, chưa nên lên `in-review`".
30) **Resolve OQs** per `resolve-oqs.md` — own OQs (spec Mục Open Questions) + inherited (reverse-doc/prd/urd/brd/brainstorm + userflow Mục 4 nếu chạy Tầng 3) + OQ mới do Phase G review sinh. Prompt Y/skip/ids → loop 1-by-1 → cascade scan + L2 diff → update upstream nếu inherited resolved.

### Phase I — Final report

31) **Output report** liệt kê theo tầng đã chạy:
    ```
    ✅ SRS done cho feature {feature} (chạy tới Tầng {N}):

       Tầng 1 — Core spec:
       - docs/{feature}/srs/{feature}-spec.md   ({N} FR, {M} NFR, {K} BR, {E} errors, {S} SC)

       Tầng 2 [nếu chạy] — Models:
       - docs/{feature}/srs/{feature}-erd.md · flows.md · states.md [cái nào có]
       - docs/{feature}/usecases/{feature}-usecase-index.md (bảng ## Use cases = ma trận truy vết UC↔FR↔Screen↔Error↔OQ) + uc-*.md

       Tầng 3 [nếu chạy] — UX:
       - docs/{feature}/srs/{feature}-userflow.md
       - docs/{feature}/ascii-wireframe/ và/hoặc html-wireframe/

       Tầng 4 [nếu chạy] — Delivery:
       - docs/{feature}/userstories/{feature}-story-index.md + us-*.md [+ AC]

       Dừng ở Tầng {N}. Muốn chạy tiếp: /srs {feature} rồi chọn tầng cao hơn,
       hoặc gọi skill lẻ (/usecase, /user-flow, /userstory...).

    Mở docs/{feature}/ trong IDE/Obsidian để review.
    Sửa gì gọi lại đúng skill (file đã tồn tại tự vào update mode):
       /sequence · /activity · /activity-swimlane · /erd · /state · /usecase
       /user-flow · /wireframe-ascii · /wireframe-html · /userstory · /ac
       /figma {feature} [<screen>] · /prototype-html {feature}

    Review (Phase G): @{agents} soi · {N} auto-fixed · {M} 🔶 quyết định thay anh (xem dưới).
    🔶 Quyết định thay user — review lại:
       - {từng business-decision tự quyết + lý do, để anh kiểm}
    Resolved OQs: {R}/{N}. Còn hold: {M}. Marker chưa rõ: {K} (nếu còn → chưa nên in-review).
    ```

## Output

Output **tuỳ tầng user chọn** ở menu (4 tầng lũy tiến). Tầng 1 luôn chạy; tầng sau chỉ chạy khi user chọn.

| Tầng | File |
|---|---|
| **[1] Core spec** | `docs/{feature}/srs/{feature}-spec.md` — FR/NFR/BR/Error Matrix/Success Criteria. **FULL frontmatter** (`type: srs` + status + links) |
| **[2] +Models** | `docs/{feature}/usecases/uc-{slug}.md` + `docs/{feature}/usecases/{feature}-usecase-index.md` · `docs/{feature}/srs/{feature}-flows.md` · `docs/{feature}/srs/{feature}-states.md` · `docs/{feature}/srs/{feature}-erd.md` |
| **[3] +UX** | `docs/{feature}/srs/{feature}-userflow.md` · **rồi tuỳ loại wireframe user chọn (ASCII / HTML / cả hai)**:<br>· ASCII → `docs/{feature}/ascii-wireframe/{flow-slug}.md` + `{feature}-wireframe-index.md`<br>· HTML → `docs/{feature}/html-wireframe/{flow-slug}.html` + `{feature}-wireframe.html` (cửa vào) + `{feature}-wireframe-html-index.md` |
| **[4] +Delivery** | `docs/{feature}/userstories/us-{NNN}.md` + `docs/{feature}/userstories/{feature}-story-index.md` (AC inline) |

**Khi nào ghi:** mỗi file qua 1 L1 approval riêng. Sub-agent KHÔNG ghi file đích — chỉ main thread Write.

## Stop-on-stuck — structured result (thay vì tự bịa)

Khi 1 phần (hoặc sub-agent nếu dùng) thiếu info nghiệp vụ không tự suy được, KHÔNG ghi file dở. Trả structured result về `/srs`:

```yaml
status: READY | NEEDS_INPUT | FAILED
proposed_files: []          # chỉ khi READY — nội dung đề xuất, main thread Write sau L1
blocking_questions:         # chỉ khi NEEDS_INPUT
  - id: Q-ERD-01
    category: business-cardinality
    question: "Một đơn hàng có thể có nhiều lần thanh toán không?"
    why_blocking: "Quyết định quan hệ nghiệp vụ Order–Transaction"
assumptions: []             # giả định đã dùng (để anh xác nhận)
source_gaps: []             # chỗ upstream thiếu
```

**Preflight bắt buộc:** kiểm đủ input TRƯỚC khi generate. Thiếu blocking info → trả `NEEDS_INPUT` NGAY, **zero-write**. KHÔNG generate một phần rồi mới phát hiện thiếu.

Trigger `NEEDS_INPUT` (blocking):
- Entity không có thuộc tính nào suy được từ FR/scope.
- Flow trigger ambiguous (nhiều cách trigger).
- Screen field list trống / không có action.
- Relationship cardinality unclear.

KHÔNG `NEEDS_INPUT` (non-blocking, tự xử):
- Mermaid syntax preference (tự chọn).
- Wireframe layout exact pixel.
- NFR threshold nghiệp vụ chưa critical → ghi `TBD — owner — deadline` + OQ.
- Edge case error đã có default generic.
- **Chi tiết mơ hồ trong 1 requirement đã viết được** (vd 1 lựa chọn hiển thị) → **`[NEEDS CLARIFICATION: ...]` inline**, viết tiếp phần còn lại (KHÔNG zero-write cả phần).

`/srs` gom mọi `blocking_questions` cùng tầng thành 1 batch hỏi anh, rồi chạy lại đúng phần đó kèm answer — retry tối đa 2 lần/phần, vẫn thiếu → skip phần đó + note ở report.

## References

> **Progressive Disclosure:** Đọc các tài liệu tham chiếu bên dưới bằng `read_file` khi cần tra cứu quy ước hoặc mẫu template.

- [ba-conventions.md](../../references/ba-conventions.md)
- [project-profile.md](../../references/project-profile.md)
- [approval-gate.md](../../references/approval-gate.md)
- [kg-usage.md](../../references/kg-usage.md)
- [naming-conventions.md](../../references/naming-conventions.md)
- [feature-bootstrap.md](../../references/feature-bootstrap.md)
- [changelog.md](../../references/changelog.md)
- [resolve-oqs.md](../../references/resolve-oqs.md)
- [review-format.md](../../references/review-format.md)
- [srs-spec.md](../../../_templates/srs-spec.md)
- [example-srs-spec.md](./references/example-srs-spec.md)

**Lazy (chỉ đọc/chạy khi tới bước tương ứng):**
- Bước 16b Mermaid verify: chạy `node .agents/scripts/mermaid-verify.mjs` · đọc [diagram-selection.md](../../references/diagram-selection.md) mục "Mermaid syntax safety" khi có block fail cần sửa cú pháp.
- Tầng 2 Models: [usecase.md](../../../_templates/usecase.md), [usecase-index.md](../../../_templates/usecase-index.md) (khi Phase D dựng use case).
- Tầng 4 Delivery: [user-story.md](../../../_templates/user-story.md), [user-story-index.md](../../../_templates/user-story-index.md) (khi Phase F dựng story).‍​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌‌‌‌‌‌​​‌‌‌​​‌​​‌​‌​‌​‌‌‌‌‌‌​​‌​‌‌​​‌‌‌‌​‌​‌​‌​​​​​‌‌‌​​​​​‌‌‌‌​‌‌​‌​‌​​​‌‌‌‌​​​​​‌‌​​‌​‌​‌​‌‌​‌‌​​​‌‌​‌​‌‌​​‍


<!-- wm:c3e3a8b9c06f46427bf9089e2fdafa48 -->
<sub>Tài liệu thuộc bộ AI4BA BA-Kit — bản quyền ai4ba.com</sub>
