# privacy-controls — Evidence base (truy vết code → luồng)

Đường dẫn tính từ gốc repo `/root/projects/vox-flow`. ID nguồn S# theo `reverse-sources.md`.

## §1. Endpoints (điểm vào)

| Method | Path | Màn/route gọi | Auth | Mục đích nghiệp vụ | Nguồn (file:line) |
|--------|------|---------------|------|--------------------|-------------------|
| tRPC query | `privacy.getConsent` | `apps/web/src/features/app-state/use-profile-hydration.ts` (tự động sau đăng nhập) | Phiên đăng nhập (protectedProcedure) | Đọc trạng thái đồng ý hiện tại | packages/api/src/routers/privacy.ts:60-86; apps/web/src/features/app-state/use-profile-hydration.ts:81 |
| tRPC mutation | `privacy.setConsent` | Không có màn gọi (negative-search N1) | Phiên đăng nhập | Ghi nhận sự kiện đồng ý | packages/api/src/routers/privacy.ts:88-122 |
| tRPC query | `privacy.exportData` | Không có màn gọi (N1) | Phiên đăng nhập | Xuất dữ liệu cá nhân của chính mình | packages/api/src/routers/privacy.ts:124-127 |
| Hàm nội bộ | `requireConsent(db, userId)` | Không có caller (N3) | — | Chặn nếu chưa trả lời bước đồng ý | packages/api/src/routers/privacy.ts:9-35 |
| Hàm nội bộ | `requireExamConsent(db, userId)` | `attempt.start` (bắt đầu bài thi) | — | Luôn trả inHistory=true, calibrationGranted=false | packages/api/src/exam/consent.ts:8-17; packages/api/src/routers/attempt.ts:88 |
| Hàm nội bộ | `exportUserData(db, userId)` | `privacy.exportData` | — | Gộp export của mọi bảng cá nhân | packages/api/src/data-registry.ts:256-266 |
| Hàm nội bộ | `eraseUserData(ctx, userId)` | Không có caller (N4) | — | Xoá dữ liệu cá nhân + ghi âm | packages/api/src/data-registry.ts:268-280 |
| Gắn router | `privacy` trong `appRouter` | — | — | Đăng ký router | packages/api/src/routers/index.ts:7, 22 |

## §2. Validation (ràng buộc field)

| Field | Rule | Giá trị exact | Lỗi khi vi phạm | Nguồn (file:line) | Nhãn |
|-------|------|---------------|-----------------|-------------------|------|
| kind (dạng từng loại) | enum | "save" hoặc "calibration" | Lỗi validate zod mặc định ⚠️ chưa resolve | packages/api/src/routers/privacy.ts:39 | ✅ |
| granted (dạng từng loại) | boolean bắt buộc | — | như trên ⚠️ | packages/api/src/routers/privacy.ts:40 | ✅ |
| policyVersion | string tùy chọn, không giới hạn độ dài / định dạng | mặc định "v1" khi thiếu | — | packages/api/src/routers/privacy.ts:41, 48, 92 | ✅ |
| save / calibration / train (dạng gộp) | boolean tùy chọn; phải có ít nhất một trường boolean | — | "At least one consent setting (save, calibration, or train) must be provided" | packages/api/src/routers/privacy.ts:44-56 | ✅ (nguồn); 🟡 (mã/wording phía client) |
| Union hai dạng | z.union: dạng từng loại hoặc dạng gộp | — | Lỗi union ⚠️ chưa resolve | packages/api/src/routers/privacy.ts:37-57 | 🟡 |
| consent_event.kind | enum cột DB | ["save","calibration"], NOT NULL | — | packages/db/src/schema/consent.ts:15 | ✅ |
| consent_event.granted | boolean NOT NULL | — | — | packages/db/src/schema/consent.ts:16 | ✅ |
| consent_event.policy_version | text NOT NULL default | "v1" | — | packages/db/src/schema/consent.ts:17 | ✅ |
| consent_event.user_id | FK → user, xoá dây chuyền | — | — | packages/db/src/schema/consent.ts:12-14 | ✅ |
| Phân loại bảng | mỗi bảng schema ∈ DATA_REGISTRY hoặc NON_PERSONAL_TABLES; lý do > 5 ký tự | — | thông điệp test: "Table '{name}' from @vox-flow/db/schema is not classified in DATA_REGISTRY or NON_PERSONAL_TABLES" | packages/api/src/data-registry.test.ts:78-108 | ✅ |

## §3. Errors (lỗi + wording thật)

| Error ID | Trigger | Wording exact (câu thật) | Recovery | Nguồn throw + catalog (file:line) | Nhãn |
|----------|---------|--------------------------|----------|-----------------------------------|------|
| E-001 | Không có phiên | UNAUTHORIZED — "Authentication required" | Đăng nhập | packages/api/src/index.ts:15-22 | ✅ |
| E-002 | Chưa có sự kiện save | FORBIDDEN — "Consent required: user has not completed consent step" | Ghi đồng ý | packages/api/src/routers/privacy.ts:17-22 · test packages/api/src/routers/privacy.test.ts:136-142 | ✅ |
| E-003 | Gửi gộp không có trường | thông điệp nguồn "At least one consent setting (save, calibration, or train) must be provided"; mã client ⚠️ chưa resolve | Gửi ít nhất một trường | packages/api/src/routers/privacy.ts:55 | 🟡 |
| E-004 | Sai dạng đầu vào | ⚠️ chưa resolve | Sửa đầu vào | packages/api/src/routers/privacy.ts:37-57 | 🟡 |
| E-005 | Trang R2 bị cắt không con trỏ | Error "Erasure stalled for {prefix}: truncated page without a cursor" | Chạy lại sau khi kiểm tra R2 | packages/api/src/data-registry.ts:193-195 · test packages/api/src/data-registry.test.ts:657 | ✅ |
| E-006 | Xoá file R2 lỗi cả lần thử lại | Error "Erasure left {N} audio object(s) undeleted under {prefix}" | Chạy lại | packages/api/src/data-registry.ts:198-200 · test packages/api/src/data-registry.test.ts:675 | ✅ |
| E-007 | (liên quan) Khiếu nại chưa bật | FORBIDDEN — "Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt" | Chờ bật cờ | packages/api/src/routers/dispute.ts:27-33 | ✅ |
| E-008 | Lỗi DB khi xuất | Không có xử lý riêng ⚠️ chưa resolve | — | packages/api/src/data-registry.ts:256-266 | 🟡 |

## §4. Business Rules (rule + hằng số + state transition)

| Rule | Trigger | Hằng số/ngưỡng | Có test phủ? | Nguồn (file:line) | Nhãn |
|------|---------|----------------|--------------|-------------------|------|
| Sự kiện đồng ý chỉ thêm mới | setConsent | — | có (packages/api/src/routers/privacy.test.ts:82-111) | packages/api/src/routers/privacy.ts:95-118 | ✅ |
| Trạng thái = sự kiện mới nhất mỗi loại | getConsent | limit 1, orderBy createdAt DESC | có (privacy.test.ts:102-111) | packages/api/src/routers/privacy.ts:63-75 | ✅ |
| hasAnswered = có sự kiện save | getConsent | — | có (privacy.test.ts:73-80, 97-100) | packages/api/src/routers/privacy.ts:84 | ✅ |
| train = calibration | getConsent | — | không (test chỉ kiểm save, calibration, hasAnswered) | packages/api/src/routers/privacy.ts:83 | ✅ |
| calibration ưu tiên hơn train khi cùng gửi | setConsent dạng gộp | `input.calibration ?? input.train` | không | packages/api/src/routers/privacy.ts:110 | ✅ |
| policyVersion mặc định | setConsent | "v1" | có một phần (privacy.test.ts:85-89 truyền "v1.0"; mặc định không được khẳng định) | packages/api/src/routers/privacy.ts:92 | ✅ |
| Kiểm tra đồng ý: save=false vẫn qua | requireConsent | — | có (privacy.test.ts:144-148) | packages/api/src/routers/privacy.ts:17-22 | ✅ |
| Bài thi luôn lưu | start attempt | inHistory true, calibrationGranted false | có gián tiếp (packages/api/src/routers/attempt.test.ts:93, 247, 253 khẳng định inHistory true; không có test trực tiếp cho hàm; calibrationGranted không khẳng định) | packages/api/src/exam/consent.ts:12-16 | ✅ |
| Xuất: score_run rỗng | exportUserData | `[]` | có (packages/api/src/data-registry.test.ts:527-546) | packages/api/src/data-registry.ts:151 | ✅ |
| Xuất: attempt_score chỉ 7 field | exportUserData | key set exact | có (data-registry.test.ts:527-582) | packages/api/src/data-registry.ts:129-138 | ✅ |
| Trần bind D1 | export/erase | 100 tham số, chunk 15 | có (data-registry.test.ts:354) | packages/api/src/data-registry.ts:39-46 | ✅ |
| Phân trang R2 | erase attempt | 1000 đối tượng/trang | có (data-registry.test.ts:583) | packages/api/src/data-registry.ts:172-197 | ✅ |
| Thử lại xoá 1 lần | erase attempt | 1 retry | có (data-registry.test.ts:663) | packages/api/src/data-registry.ts:181-190 | ✅ |
| Thứ tự xoá | eraseUserData | bảng khác "user" trước | có (data-registry.test.ts:110) | packages/api/src/data-registry.ts:268-280 | ✅ |
| Admin nghe ghi âm cần shareConsent | tải ghi âm | disputeShareConsent === true | có (packages/api/src/auth-utils.test.ts:57-91) | packages/api/src/auth-utils.ts:23-35 | ✅ |
| shareConsent mặc định false | gửi khiếu nại | false | không (test truyền shareConsent tường minh, vd packages/api/src/routers/dispute.test.ts:58) | packages/api/src/routers/dispute.ts:16 | ✅ |

## §5. Entities (đối tượng dữ liệu nghiệp vụ)

| Entity | Field nghiệp vụ chính | Quan hệ | Nguồn (file:line) |
|--------|-----------------------|---------|-------------------|
| consent_event | id, userId, kind (save/calibration), granted, policyVersion, createdAt | N-1 user (xoá dây chuyền); index (userId), (userId, kind) | packages/db/src/schema/consent.ts:6-24 |
| attempt (cờ liên quan) | inHistory (mặc định true), calibrationGranted (mặc định false) | N-1 user | packages/db/src/schema/attempt.ts:16-17 |
| score_dispute.share_consent | shareConsent (mặc định false) | N-1 attempt, N-1 user | packages/db/src/schema/dispute.ts:24 |
| DATA_REGISTRY | 12 mục bảng: tableName, export, erase | — | packages/api/src/data-registry.ts:33-47 |
| NON_PERSONAL_TABLES | 3 bảng + lý do | — | packages/api/src/data-registry.ts:247-254 |

## §6. Cross-repo hops (điểm nghiệp vụ → luồng liên quan)

Cùng một monorepo, một tiến trình API (Cloudflare Worker); có các điểm chéo gói / chéo dịch vụ như sau:

| Điểm khởi phát | → tới đâu | Cơ chế (đọc/ghi/gọi) | Luồng nghiệp vụ liên quan | Nguồn 2 đầu (file:line) |
|----------------|-----------|----------------------|---------------------------|-------------------------|
| Web: nạp hồ sơ sau đăng nhập | API: đọc đồng ý | gọi tRPC (đọc) | Nạp trạng thái đồng ý | apps/web/src/features/app-state/use-profile-hydration.ts:81 · packages/api/src/routers/privacy.ts:60 |
| API: xuất dữ liệu | D1 (nhiều bảng) | đọc tuần tự mỗi bảng | Xuất dữ liệu | packages/api/src/data-registry.ts:258-260 · packages/api/src/routers/privacy.ts:126 |
| API: xoá dữ liệu | R2 (liệt kê + xoá) | gọi bucket list/delete | Xoá dữ liệu cá nhân | packages/api/src/data-registry.ts:180-183 · packages/api/src/data-registry.ts:19-31 |
| API: bắt đầu bài thi | exam consent | gọi hàm nội bộ | Bắt đầu thi | packages/api/src/routers/attempt.ts:88 · packages/api/src/exam/consent.ts:8 |
| Server: tải ghi âm | bảng khiếu nại (shareConsent) | đọc D1 | Chia sẻ ghi âm cho giám khảo (score-dispute) | apps/server/src/index.ts:322-340 · packages/api/src/auth-utils.ts:23-35 |

Số hop chéo tiến trình thực sự (web ↔ api ↔ R2/D1): 4 (hop 1, 2, 3, 5). Hop 4 là nội bộ cùng tiến trình.

## §7. Gaps / Ambiguities (code câm hoặc nghi ngờ)

* Không có UI gọi ghi đồng ý / xuất dữ liệu — *(negative-search N1/N2: `setConsent|exportData|privacy\.` + `ConsentRows|PrivacyScreen|app/privacy` · loại: dead-code-nghi)*
* Hàm kiểm tra đồng ý không có caller — *(N3: `requireConsent\b` · dead-code-nghi)*
* Hàm xoá dữ liệu không có caller — *(N4: `eraseUserData` · dead-code-nghi)*
* Không có luồng xoá tự động — *(N5: `retention|ttl|purge|24 ?h|86400` · code-câm)*
* Trạng thái đồng ý ở web chỉ được ghi, không được đọc — *(N6 · dead-code-nghi)*
* `inHistory` không được dùng để lọc lịch sử — *(N7 · code-câm)*
* Không có test cho nhánh UNAUTHORIZED của thao tác riêng tư và không có test cho mặc định policyVersion — *(N10 · code-câm)*
* Không có test trực tiếp cho `requireExamConsent` — *(pattern `requireExamConsent` · scope: `packages`, `apps` (`*.test.ts`, `*.test.tsx`) → 0 kết quả · code-câm)*
