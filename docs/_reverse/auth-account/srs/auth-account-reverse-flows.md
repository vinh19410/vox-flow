---
type: reverse-srs-flows
feature: auth-account
updated: 2026-11-12
---

# auth-account — Flows tái lập (reverse)

> **Đã duyệt (#134).** Chỉ vẽ bước CÓ trong code (kèm quyết định đã chốt ở `reverse-gaps.md`). Nguồn mỗi flow nằm dưới tiêu đề (đường dẫn repo đầy đủ). Chi tiết lỗi: `auth-account-reverse-spec.md` Mục 6. Flow legacy (`/login` → `/dashboard`) đã xóa ở #134 cùng khu `_app-legacy`.

## Flow 1: Đăng ký bằng email + mật khẩu

> Nguồn ✅: apps/web/src/features/auth/auth-screen.tsx:118-143; packages/auth/src/index.ts:34-37; packages/api/src/test/auth.test.ts:59-87,257-284. Liên quan FR-001..005, FR-012, E-002, E-004, E-005.

### Sequence — Đăng ký bằng email

```mermaid
sequenceDiagram
    actor K as Khach
    participant W as Man hinh Auth (web)
    participant S as May chu xac thuc
    participant D as CSDL D1
    K->>W: Chon che do dang ky, nhap Ten, Email, Mat khau 8 ky tu tro len
    K->>W: Bam Tao tai khoan
    Note over W: Trinh duyet chan neu thieu truong hoac email sai dinh dang (cau chu HTML5 theo ngon ngu trinh duyet cua nguoi dung)
    W->>S: Gui ten da trim (1..50 ky tu), email da trim, mat khau nguyen ban (8..128 ky tu)
    alt Email da ton tai (ma USER_ALREADY_EXISTS...)
        S-->>W: Loi 422
        W-->>K: Email đã được sử dụng. (E-002)
    else Ten ngoai 1..50 ky tu sau trim
        S-->>W: BAD_REQUEST INVALID_NAME
        W-->>K: Tên hiển thị không hợp lệ (1–50 ký tự). (E-016)
    else Gui qua nhanh vuot 3 lan/10s
        S-->>W: HTTP 429
        W-->>K: Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây. (E-015)
    else Ma loi khac
        S-->>W: Loi khac
        W-->>K: Đăng ký không thành công. Vui lòng thử lại. (E-004)
    else Ngoai le mang
        W-->>K: Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau. (E-005)
    else Thanh cong
        S->>D: Tao user va account
        S-->>W: Tra token va cap phien tu dong (autoSignIn)
        W->>W: Chon dich = redirect hop le hoac /onboarding
        W-->>K: Tai lai toan trang toi dich
    end
    Note over S: Mat khau bam scrypt, dai 8..128 ky tu (better-auth 1.7.12)
```

### Activity — Đăng ký bằng email

```mermaid
flowchart TD
    A["Mo /auth, bam Chua co tai khoan? Dang ky"] --> B["Nhap Ten hien thi (1..50 ky tu), Email, Mat khau (8..128 ky tu)"]
    B --> C{"Form hop le theo trinh duyet?"}
    C -->|Khong| C1["Trinh duyet chan gui (cau chu HTML5 theo ngon ngu trinh duyet)"]
    C -->|Co| D["Khoa form, cat khoang trang ten va email"]
    D --> E{"Ket qua goi dang ky"}
    E -->|"Ma bat dau USER_ALREADY_EXISTS"| E1["Hien: Email đã được sử dụng."]
    E -->|"INVALID_NAME (ten ngoai 1..50)"| E1b["Hien: Tên hiển thị không hợp lệ (1–50 ký tự)."]
    E -->|"HTTP 429 (qua nhanh)"| E1c["Hien: Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."]
    E -->|"Ma loi khac"| E2["Hien: Đăng ký không thành công. Vui lòng thử lại."]
    E -->|"Ngoai le"| E3["Hien: Không thể kết nối đến máy chủ xác thực."]
    E -->|"Thanh cong"| F{"redirect hop le?"}
    F -->|Co| F1["Tai lai toan trang toi redirect"]
    F -->|Khong| F2["Tai lai toan trang toi /onboarding"]
    E1 --> G["Mo khoa form, giu nguyen du lieu da nhap"]
    E1b --> G
    E1c --> G
    E2 --> G
    E3 --> G
```

## Flow 2: Đăng nhập bằng email + mật khẩu

> Nguồn ✅: apps/web/src/features/auth/auth-screen.tsx; packages/api/src/test/auth.test.ts; apps/web/src/routes/_proto/auth.tsx (chuyển hướng khi đã onboard, #134). Liên quan FR-006..009, FR-015, FR-012, E-001, E-003, E-005, E-015.

### Sequence — Đăng nhập bằng email

```mermaid
sequenceDiagram
    actor K as Khach
    participant W as Man hinh Auth (web)
    participant S as May chu xac thuc
    K->>W: Nhap Email, Mat khau roi bam Dang nhap
    W->>S: Gui email da trim, mat khau nguyen ban
    alt Sai email hoac mat khau, email khong ton tai, hoac tai khoan chi co Google (401 INVALID_EMAIL_OR_PASSWORD)
        S-->>W: Loi 401
        W-->>K: Sai email hoặc mật khẩu. (E-001)
    else Gui qua nhanh vuot 3 lan/10s
        S-->>W: HTTP 429
        W-->>K: Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây. (E-015)
    else Ma loi khac
        S-->>W: Loi khac
        W-->>K: Đăng nhập không thành công. Vui lòng thử lại. (E-003)
    else Ngoai le mang
        W-->>K: Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau. (E-005)
    else Thanh cong
        S-->>W: Phien dang nhap (cookie)
        W->>W: Chon dich = redirect hop le hoac /app/dashboard
        W-->>K: Tai lai toan trang toi dich
    end
```

### Activity — Đăng nhập bằng email

```mermaid
flowchart TD
    A["Mo /auth (neu da co phien va da onboard, khong co error thi bi chuyen sang dich hop le)"] --> B["Nhap Email va Mat khau"]
    B --> C["Khoa form, cat khoang trang email"]
    C --> D{"Ket qua goi dang nhap"}
    D -->|"INVALID_EMAIL_OR_PASSWORD (ca email khong ton tai)"| D1["Hien: Sai email hoặc mật khẩu."]
    D -->|"HTTP 429 (qua nhanh)"| D1b["Hien: Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."]
    D -->|"Ma loi khac"| D2["Hien: Đăng nhập không thành công. Vui lòng thử lại."]
    D -->|"Ngoai le"| D3["Hien: Không thể kết nối đến máy chủ xác thực."]
    D -->|"Thanh cong"| E{"redirect hop le?"}
    E -->|"Co (bat dau bang /, khong // va khong /auth, /login)"| E1["Tai lai toan trang toi redirect"]
    E -->|Khong| E2["Tai lai toan trang toi /app/dashboard"]
    D1 --> F["Mo khoa form"]
    D1b --> F
    D2 --> F
    D3 --> F
```

## Flow 3: Đăng nhập bằng Google

> Nguồn ✅: apps/web/src/features/auth/auth-screen.tsx; packages/auth/src/index.ts; packages/api/src/test/auth.test.ts; apps/web/src/features/__tests__/slice-a.test.tsx. Liên quan FR-013, FR-014, FR-015, E-005..E-008, E-015. Bước Google chấp thuận/hủy diễn ra ngoài hệ thống — kết quả về web qua callback hoặc tham số `error`; cơ chế `callbackURL`/`newUserCallbackURL` đã xác minh trên `better-auth@1.7.12`.

### Sequence — Đăng nhập Google

```mermaid
sequenceDiagram
    actor K as Khach
    participant W as Man hinh Auth (web)
    participant S as May chu xac thuc
    participant G as Google OAuth
    K->>W: Bam Tiep tuc voi Google
    W->>S: Yeu cau dang nhap social, callback = dich hop le hoac /app/dashboard, newUserCallbackURL = dich hop le hoac /onboarding, errorCallback = /auth (kem redirect hop le)
    alt Qua gioi han toc do (HTTP 429)
        S-->>W: HTTP 429
        W-->>K: Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây. (E-015)
    else Loi tra ve ngay khac
        S-->>W: Loi
        W-->>K: Đăng nhập Google không thành công. Vui lòng thử lại. (E-006)
    else Ngoai le mang
        W-->>K: Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau. (E-005)
    else Bat dau thanh cong
        S-->>W: URL Google
        W->>G: Chuyen huong trinh duyet
        alt Nguoi dung dong y
            G->>S: Goi lai callback google
            Note over S: Ho so Google moi duoc chuan hoa ten 1..50 ky tu (normalizeOAuthUserName) va kiem tra qua hook user.create
            S-->>W: Chuyen ve dich: callbackURL (tai khoan cu) hoac newUserCallbackURL = /onboarding (tai khoan moi), kem phien dang nhap
        else Huy hoac loi
            G->>S: Loi
            S-->>W: Chuyen ve /auth kem tham so error
            W-->>K: E-007 hoac E-008 tuy gia tri error
        end
    end
```

### Activity — Đăng nhập Google

```mermaid
flowchart TD
    A["Bam nut Tiep tuc voi Google"] --> B{"Dang xu ly (isBusy)?"}
    B -->|Co| B1["Bo qua lan bam"]
    B -->|Khong| C["Hien Đang kết nối..., khoa form"]
    C --> D["Tinh callbackURL, newUserCallbackURL va errorCallbackURL tu redirect hop le"]
    D --> E{"Ket qua khoi tao"}
    E -->|"HTTP 429"| E0["Hien: Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."]
    E -->|"Loi tra ve khac"| E1["Hien: Đăng nhập Google không thành công. Vui lòng thử lại."]
    E -->|"Ngoai le"| E2["Hien: Không thể kết nối đến máy chủ xác thực."]
    E -->|"Thanh cong"| F["Chuyen sang Google"]
    F --> G{"Quay lai"}
    G -->|"Thanh cong, tai khoan cu"| G1["Vao dich, mac dinh /app/dashboard"]
    G -->|"Thanh cong, tai khoan moi"| G1b["Vao newUserCallbackURL, mac dinh /onboarding"]
    G -->|"error = account_not_linked"| G2["Hien: Email này đã đăng ký bằng mật khẩu..."]
    G -->|"error khac"| G3["Hien: Đăng nhập Google không thành công hoặc đã bị hủy..."]
```

## Flow 4: Đăng xuất

> Nguồn ✅: apps/web/src/hooks/use-sign-out.ts; apps/web/src/lib/auth-guard.ts (clearOnboardedUserCache, #134); apps/web/src/features/app-state/use-profile-hydration.ts; apps/web/src/hooks/__tests__/use-sign-out.test.tsx. Liên quan FR-016..018, E-009.

### Sequence — Đăng xuất

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Giao dien web
    participant S as May chu xac thuc
    H->>W: Bam Dang xuat (sidebar, bottom nav hoac ho so)
    W->>S: Huy phien
    alt Phan hoi loi hoac ngoai le mang
        S-->>W: Loi
        W-->>H: Toast Đăng xuất thất bại. Vui lòng thử lại. (E-009)
        Note over W: O nguyen trang, khong xoa state, khong dieu huong
    else Thanh cong
        S-->>W: Phien da huy
        W->>W: Xoa khoa state prototype trong sessionStorage (loi xoa bi bo qua)
        W->>W: Xoa bo nho dem trang thai onboarding (clearOnboardedUserCache)
        W->>W: Dieu huong toi /auth
        W->>W: Phien khong con user nen reset state hoc vien, giu mode va voice
        W-->>H: Man hinh Auth
    end
```

### Activity — Đăng xuất

```mermaid
flowchart TD
    A["Bam Dang xuat"] --> B["Goi huy phien"]
    B --> C{"Loi HTTP hoac ngoai le?"}
    C -->|Co| C1["Toast: Đăng xuất thất bại. Vui lòng thử lại."]
    C1 --> C2["Giu nguyen trang va phien"]
    C -->|Khong| D["Xoa sessionStorage khoa vox-flow-proto-state-v3"]
    D --> D2["Xoa bo nho dem trang thai onboarding (clearOnboardedUserCache)"]
    D2 --> E["Dieu huong toi /auth (hoac dich tuy chon)"]
    E --> F["Reset state hoc vien, giu mode va voice"]
```

## Flow 5: Bảo vệ route theo phiên và onboarding

> Nguồn ✅: apps/web/src/lib/auth-guard.ts:24-105; apps/web/src/routes/_proto/auth.tsx:19-22; apps/web/src/routes/_proto/app/route.tsx:7; apps/web/src/routes/_proto/onboarding.tsx:7-26; apps/web/src/features/onboarding/onboarding-screen.tsx:27-34; apps/web/src/lib/__tests__/auth-guard.test.ts; apps/web/src/lib/__tests__/route-guards.test.ts. Liên quan FR-015, FR-019..023.

### Sequence — Guard route

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant R as Router web
    participant S as May chu xac thuc
    participant P as Dich vu ho so (profile)
    H->>R: Mo /app/*, /exam hoac /scoring
    R->>S: Hoi phien hien tai
    alt Khong co phien hoac loi mang
        S-->>R: Rong hoac loi
        R-->>H: Chuyen /auth kem redirect = dia chi dang vao
    else Co phien
        alt Da nho user da onboarding
            R-->>H: Cho vao, khong hoi ho so
        else Chua nho
            R->>P: Doc ho so
            alt Khong co ho so hoac onboardedAt rong
                P-->>R: null hoac chua xong
                R-->>H: Chuyen /onboarding
            else Da onboarding
                P-->>R: onboardedAt co gia tri
                R->>R: Nho user da onboarding
                R-->>H: Cho vao
            else Loi doc ho so
                P-->>R: Loi
                R-->>H: Cho vao (fail-open) va canh bao console
            end
        end
    end
    Note over R: /onboarding chi kiem tra phien, neu da onboarding thi chuyen /app/dashboard; hoan tat goi markUserOnboarded. /auth (khong co ?error=) goi redirectIfOnboarded chuyen nguoi da onboarding ve safeRedirect ?? /app/dashboard, nguoi chua onboard o lai /auth.
```

### Activity — Guard route

```mermaid
flowchart TD
    A["Vao route duoc bao ve"] --> B{"Co phien?"}
    B -->|"Khong hoac loi mang"| B1["Chuyen /auth kem redirect = dia chi hien tai"]
    B -->|Co| C{"Loai route?"}
    C -->|"/auth (khong co ?error=)"| CA{"Da onboarding (cache hoac profile.get)?"}
    CA -->|Co| CA1["Chuyen safeRedirect ?? /app/dashboard"]
    CA -->|"Chua hoac loi doc"| CA2["O lai /auth (cho phep doi tai khoan)"]
    C -->|"/onboarding"| D{"Da onboarding?"}
    D -->|Co| D1["Chuyen /app/dashboard"]
    D -->|"Chua hoac loi doc"| D2["Cho vao onboarding (hoan tat goi markUserOnboarded)"]
    C -->|"Khong (app, exam, scoring)"| E{"User da co trong bo nho dem?"}
    E -->|Co| E1["Cho vao"]
    E -->|Khong| F["Doc ho so"]
    F --> G{"Ket qua"}
    G -->|"Rong hoac onboardedAt rong"| G1["Chuyen /onboarding"]
    G -->|"onboardedAt co gia tri"| G2["Ghi nho user va cho vao"]
    G -->|"Loi khong phai redirect"| G3["Cho vao va console.warn"]
```

## Flow 6: Truy cập khu vực quản trị

> Nguồn ✅: apps/web/src/routes/admin/disputes.tsx:7-29; apps/web/src/routes/admin/forecast.tsx:7-29; packages/api/src/index.ts:31-45; packages/api/src/auth-utils.ts:1-13. Liên quan FR-024, FR-026, E-011.

### Sequence — Khu quản trị

```mermaid
sequenceDiagram
    actor Q as Nguoi dung
    participant R as Router web
    participant S as May chu (API)
    Q->>R: Mo /admin/disputes hoac /admin/forecast
    R->>S: Hoi phien
    alt Khong co phien
        R-->>Q: Chuyen /auth
    else Co phien
        R->>S: Goi kiem tra admin
        alt Khong co phien o API
            S-->>R: UNAUTHORIZED Authentication required
            R-->>Q: Chuyen /app/dashboard
        else Email khong thuoc ADMIN_EMAILS
            S-->>R: FORBIDDEN Admin access required
            R-->>Q: Chuyen /app/dashboard
        else Loi bat ky khac
            S-->>R: Loi
            R-->>Q: Chuyen /app/dashboard
        else La admin
            S-->>R: isAdmin true
            R-->>Q: Hien man hinh quan tri
        end
    end
```

### Activity — Khu quản trị

```mermaid
flowchart TD
    A["Mo /admin/*"] --> B{"Co phien?"}
    B -->|Khong| B1["Chuyen /auth"]
    B -->|Co| C["Goi kiem tra quyen admin phia may chu"]
    C --> D{"Email trong ADMIN_EMAILS? (trim, khong phan biet hoa thuong)"}
    D -->|"Khong hoac danh sach rong"| D1["FORBIDDEN, chuyen /app/dashboard"]
    D -->|"Loi bat ky"| D2["Chuyen /app/dashboard"]
    D -->|Co| E["Vao man hinh quan tri"]
```

## Flow 7: Hợp lệ hóa tên hiển thị và ảnh đại diện khi tạo/cập nhật tài khoản

> Nguồn ✅: packages/auth/src/name-validation.ts; packages/auth/src/image-validation.ts; packages/auth/src/index.ts:31-61,103-112; packages/api/src/test/auth.test.ts:89-193,251-350. Liên quan FR-001, FR-028, BR-003, BR-009..017, E-012, E-016. Chỉ phần kiểm tra tại hook — luồng chọn/nén avatar thuộc `onboarding-profile`.

### Sequence — Hợp lệ hóa tên và ảnh

```mermaid
sequenceDiagram
    actor N as Nguoi dung hoac OAuth
    participant S as May chu xac thuc (databaseHooks.user)
    participant D as CSDL D1
    N->>S: Tao hoac cap nhat user (co the kem name va/hoac image)
    alt Co truong name nhung khong phai chuoi hoac sau trim ngoai 1..50 ky tu
        S-->>N: BAD_REQUEST INVALID_NAME (E-016)
        Note over D: Khong ghi, du lieu cu giu nguyen
    else Ten hop le hoac khong gui truong name
        alt Khong gui truong image
            S->>D: Luu ten da trim (neu co), giu nguyen anh
            S-->>N: Thanh cong
        else image la null
            S->>D: Luu ten da trim (neu co), xoa anh
            S-->>N: Thanh cong
        else image khong phai chuoi, rong, qua 32000 ky tu hoac dinh dang cam
            S-->>N: BAD_REQUEST INVALID_IMAGE (E-012)
            Note over D: Khong ghi, du lieu cu giu nguyen
        else image https, data URL webp jpeg png hoac /avatars/
            S->>D: Luu ten da trim (neu co) va anh
            S-->>N: Thanh cong
        end
    end
```

### Activity — Hợp lệ hóa tên và ảnh

```mermaid
flowchart TD
    A["Yeu cau tao hoac cap nhat user"] --> N0{"Co truong name?"}
    N0 -->|Khong| B{"Co truong image?"}
    N0 -->|Co| N1{"La chuoi va trim() dai 1..50?"}
    N1 -->|Khong| XN["Tu choi INVALID_NAME"]
    N1 -->|Co| N2["Ghi nhan name da trim"] --> B
    B -->|Khong| OK["Chap nhan va luu"]
    B -->|Co| C{"image la null?"}
    C -->|Co| C1["Chap nhan, xoa anh"]
    C -->|Khong| D{"La chuoi khac rong?"}
    D -->|Khong| X["Tu choi INVALID_IMAGE"]
    D -->|Co| E{"Do dai tren 32000?"}
    E -->|Co| X
    E -->|Khong| F{"Bat dau bang https://?"}
    F -->|Co| OK
    F -->|Khong| G{"data:image webp, jpeg hoac png base64?"}
    G -->|Co| OK
    G -->|Khong| H{"Bat dau bang /avatars/?"}
    H -->|Co| OK
    H -->|Khong| X
```
