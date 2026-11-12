---
type: reverse-srs-flows
feature: onboarding-profile
updated: 2026-11-11
---

# onboarding-profile — Flows tái lập (reverse)

> Chỉ vẽ bước CÓ trong code. Bước suy đoán chú thích 🔵/🟡. Nguồn tổng: `_evidence.md`. Nhãn trong sơ đồ mermaid viết không dấu để tránh lỗi cú pháp; wording thật (có dấu, nguyên văn) xem Mục 6 của spec và §3 của `_evidence.md`.

## Flow 1: Thiết lập mục tiêu khi onboarding (bước 1)

Nguồn: apps/web/src/features/onboarding/components/goal-step.tsx:31-49, packages/api/src/routers/profile.ts:53-89. FR-001..006. Nhãn ✅.

### Sequence — Thiết lập mục tiêu

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Trinh duyet
    participant S as May chu
    participant D as CSDL ho so
    H->>W: Chon band 5.0 den 9.0 va ngay thi tuy chon
    H->>W: Bam Tiep tuc hoac Bo qua ngay thi
    W->>W: Khoa nut va hien Dang luu
    W->>S: Luu band va ngay thi
    alt Chua dang nhap
        S-->>W: UNAUTHORIZED Authentication required
        W-->>H: Khong the luu muc tieu. Vui long kiem tra ket noi va thu lai.
    else Band hoac ngay khong hop le
        S-->>W: Loi kiem tra dau vao (E-002 den E-004)
        W-->>H: Khong the luu muc tieu. Vui long kiem tra ket noi va thu lai.
    else Hop le
        S->>D: Tao moi hoac ghi de band va ngay thi
        D-->>S: Ho so sau khi luu
        S-->>W: Ho so
        W->>W: Cap nhat trang thai target va examDate
        W-->>H: Sang buoc 2 kiem tra mic
    end
    Note over W: Bo qua ngay thi xoa ngay roi luu voi ngay trong
    Note over W,S: 🟡 Neu khong co kenh goi may chu thi coi nhu thanh cong (OQ-7)
```

### Activity — Thiết lập mục tiêu

```mermaid
flowchart TD
    A["Mo buoc 1: band mac dinh 7.0, ngay thi trong"] --> B["Chon 1 trong 9 band 5.0 den 9.0"]
    B --> C{"Chon ngay thi?"}
    C -->|Co| D["Ngay khong som hon hom nay gio dia phuong"]
    C -->|Bo qua ngay thi| E["Xoa ngay, ngay thi = trong"]
    D --> F["Bam Tiep tuc"]
    E --> F
    F --> G["Khoa nut, hien Dang luu"]
    G --> H{"May chu chap nhan?"}
    H -->|"Band thuoc 9 muc va ngay hop le khong qua khu UTC"| I["Ghi de ho so, cap nhat trang thai"]
    H -->|Khong| J["Banner: Khong the luu muc tieu. Vui long kiem tra ket noi va thu lai."]
    I --> K["Sang buoc 2"]
    J --> B
```

## Flow 2: Kiểm tra mic và hoàn tất onboarding (bước 2)

Nguồn: apps/web/src/features/onboarding/components/mic-check.tsx:23-62, apps/web/src/hooks/use-mic-level.ts:40-98, apps/web/src/features/onboarding/onboarding-screen.tsx:17-30, packages/api/src/routers/profile.ts:91-134. FR-007..012. Nhãn ✅.

### Sequence — Kiểm tra mic và hoàn tất

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Trinh duyet
    participant M as Micro thiet bi
    participant S as May chu
    participant D as CSDL ho so
    H->>W: Bam Ghi thu 5 giay
    W->>M: Xin quyen micro
    alt Bi tu choi hoac khong co thiet bi hoac loi am thanh
        M-->>W: Loi
        W-->>H: Micro bi chan va nut Thu lai quyen micro
        H->>W: Bam Thu lai quyen micro
    else Cho phep
        M-->>W: Luong am thanh
        loop moi 100 ms den du 5.0 giay
            W->>W: Do muc am, cong don dong ho 0.1 giay
        end
        alt Muc dinh duoi 0.05
            W-->>H: Khong nghe thay tieng va nut Thu lai am thanh
        else Muc dinh tu 0.05 tro len
            W-->>H: Da nhan tin hieu micro thanh cong va nut Micro on tiep tuc
            H->>W: Bam Micro on tiep tuc
            W->>S: Hoan tat onboarding
            alt Chua co ho so hoac loi
                S-->>W: PRECONDITION_FAILED hoac INTERNAL_SERVER_ERROR
                W-->>H: Khong the hoan tat onboarding. Vui long thu lai.
            else Thanh cong
                S->>D: Ghi thoi diem onboard neu chua co
                D-->>S: Ho so
                S-->>W: Ho so
                W-->>H: Chuyen toi Dashboard
            end
        end
    end
    Note over W: Luong micro duoc giai phong khi dung ghi hoac roi man
    Note over W: 🟡 Khong co duong bo qua buoc mic (OQ-3)
```

### Activity — Kiểm tra mic và hoàn tất

```mermaid
flowchart TD
    A["Buoc 2: bam Ghi thu 5 giay"] --> B{"Quyen micro va thiet bi?"}
    B -->|"Tu choi hoac khong co"| C["Micro bi chan - nut Thu lai quyen micro"]
    C --> A
    B -->|Duoc| D["Dang nghe: dong ho tang 0.1 giay moi 100 ms"]
    D --> E{"Da du 5.0 giay?"}
    E -->|Chua| D
    E -->|Roi| F{"Muc dinh tu 0.05 tro len?"}
    F -->|"Khong"| G["Khong nghe thay tieng - nut Thu lai am thanh"]
    G --> A
    F -->|"Co"| H["Da nhan tin hieu - nut Micro on tiep tuc"]
    H --> I["Bam: khoa nut, hien Dang hoan tat"]
    I --> J{"May chu ghi nhan?"}
    J -->|Loi| K["Banner: Khong the hoan tat onboarding. Vui long thu lai."]
    K --> H
    J -->|Thanh cong| L["Chuyen toi Dashboard"]
```

## Flow 3: Cổng truy cập (trang onboarding và khu vực ứng dụng)

Nguồn: apps/web/src/routes/_proto/onboarding.tsx:8-25, apps/web/src/lib/auth-guard.ts:24-70, apps/web/src/routes/_proto/app/route.tsx:7. FR-014, FR-015. Nhãn ✅.

### Sequence — Cổng truy cập

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Trinh duyet
    participant S as May chu
    H->>W: Mo trang /onboarding hoac /app, /exam, /scoring
    W->>S: Lay phien dang nhap
    alt Khong co phien
        S-->>W: Khong co phien
        W-->>H: Chuyen toi trang dang nhap kem duong dan quay lai
    else Co phien
        alt Dang vao /app, /exam, /scoring
            alt Nguoi dung da nam trong bo nho da onboard
                W-->>H: Cho vao
            else Chua nam trong bo nho
                W->>S: Doc ho so
                alt Ho so khong co hoac chua onboard
                    W-->>H: Chuyen toi /onboarding
                else Da onboard
                    W->>W: Ghi nho nguoi dung da onboard
                    W-->>H: Cho vao
                else Loi bat ngo
                    W-->>H: Cho vao va ghi canh bao console
                end
            end
        else Dang vao /onboarding
            W->>S: Doc ho so, loi coi nhu khong co
            alt Da onboard
                W-->>H: Chuyen toi /app/dashboard
            else Chua onboard hoac loi
                W-->>H: Hien man onboarding
            end
        end
    end
```

### Activity — Cổng truy cập

```mermaid
flowchart TD
    A["Mo trang can bao ve"] --> B{"Co phien dang nhap?"}
    B -->|Khong| C["Chuyen toi /auth"]
    B -->|Co| D{"Trang nao?"}
    D -->|"/onboarding"| E["Doc ho so, loi coi nhu null"]
    E --> F{"Co thoi diem onboard?"}
    F -->|Co| G["Chuyen toi /app/dashboard"]
    F -->|Khong| H["Hien man onboarding"]
    D -->|"/app, /exam, /scoring"| I{"Da nam trong bo nho da onboard?"}
    I -->|Co| J["Cho vao"]
    I -->|Khong| K["Doc ho so"]
    K --> L{"Ket qua?"}
    L -->|"Co thoi diem onboard"| M["Ghi nho va cho vao"]
    L -->|"Null hoac chua onboard"| N["Chuyen toi /onboarding"]
    L -->|"Loi bat ngo"| O["Cho vao fail-open, console.warn"]
```

## Flow 4: Đồng bộ hồ sơ khi đăng nhập/đăng xuất

Nguồn: apps/web/src/features/app-state/use-profile-hydration.ts:29-105, apps/web/src/routes/_proto/route.tsx:29-35. FR-017. Nhãn ✅.

### Sequence — Đồng bộ hồ sơ

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Trinh duyet
    participant S as May chu
    H->>W: Phien thay doi
    alt Phien dang tai
        W->>W: Khong dung trang thai
    else Khong co nguoi dung - dang xuat
        W->>W: Dat lai du lieu nguoi dung, giu mode va voice
    else Co nguoi dung
        W->>W: Nap ten va email tu phien
        alt Da nap cho nguoi dung nay
            W->>W: Bo qua
        else Chua nap
            W->>S: Doc ho so
            alt Loi mang hoac may chu
                S-->>W: Loi
                W->>W: Khong danh dau da nap, de thu lai sau
            else Co ho so
                S-->>W: band va ngay thi
                W->>W: target = band, examDate = ngay thi hoac trong
            else Chua co ho so
                S-->>W: null
                W->>W: target = 7.0, examDate = trong
            end
        end
    end
    Note over W: 🟡 Hook con nap dong y du lieu - ngoai pham vi (OQ-17)
```

### Activity — Đồng bộ hồ sơ

```mermaid
flowchart TD
    A["Phien thay doi"] --> B{"Phien dang tai?"}
    B -->|Co| C["Khong lam gi"]
    B -->|Khong| D{"Co nguoi dung?"}
    D -->|Khong| E["Dat lai trang thai, giu mode va voice"]
    D -->|Co| F["Nap ten va email"]
    F --> G{"Da nap cho nguoi dung nay?"}
    G -->|Co| H["Dung"]
    G -->|Khong| I["Doc ho so"]
    I --> J{"Ket qua?"}
    J -->|Loi| K["Khong danh dau da nap, thu lai sau"]
    J -->|"Co ho so"| L["target = band da luu, examDate = ngay da luu hoac null"]
    J -->|"Null"| M["target = 7.0, examDate = null"]
```

## Flow 5: Sửa mục tiêu trên màn Hồ sơ

Nguồn: apps/web/src/features/profile/profile-screen.tsx:126-158. FR-020. Nhãn ✅.

### Sequence — Sửa mục tiêu

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Trinh duyet
    participant S as May chu
    participant D as CSDL ho so
    H->>W: Chon band, chon hoac xoa ngay thi, bam Luu muc tieu
    alt Ngay thi truoc hom nay UTC
        W-->>H: Ngay thi du kien khong the o trong qua khu.
    else Hop le
        W->>S: Luu band va ngay thi
        alt Loi
            S-->>W: Loi
            W-->>H: Khong the luu muc tieu. Vui long kiem tra lai ket noi.
        else Thanh cong
            S->>D: Ghi de, giu nguyen thoi diem onboard
            D-->>S: Ho so
            S-->>W: Ho so
            W-->>H: Toast Da cap nhat muc tieu luyen thi IELTS va nut Da luu muc tieu 2.5 giay
        end
    end
```

### Activity — Sửa mục tiêu

```mermaid
flowchart TD
    A["Bam Luu muc tieu"] --> B{"Co ngay thi?"}
    B -->|Khong| D["Gui ngay thi = null"]
    B -->|Co| C{"Ngay nho hon hom nay UTC?"}
    C -->|Co| E["Banner: Ngay thi du kien khong the o trong qua khu. Khong goi may chu"]
    C -->|Khong| D2["Gui ngay thi"]
    D --> F["Luu"]
    D2 --> F
    F --> G{"May chu chap nhan?"}
    G -->|Khong| H["Banner: Khong the luu muc tieu. Vui long kiem tra lai ket noi."]
    G -->|Co| I["Cap nhat trang thai, toast thanh cong, Da luu muc tieu 2.5 giay"]
```

## Flow 6: Sửa tên hiển thị

Nguồn: apps/web/src/features/profile/profile-screen.tsx:70-99. FR-019. Nhãn ✅.

### Sequence — Sửa tên

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Trinh duyet
    participant A as Dich vu xac thuc
    H->>W: Nhap ten toi da 50 ky tu, bam Luu ten
    alt Ten rong sau khi cat khoang trang
        W-->>H: Toast Ten hien thi khong duoc de trong
    else Hop le
        W->>A: Cap nhat ten va anh hien tai neu co
        alt Loi hoac dich vu khong kha dung
            A-->>W: Loi, ke ca INVALID_IMAGE
            W-->>H: Toast Co loi xay ra khi cap nhat thong tin. Vui long thu lai.
        else Thanh cong
            A-->>W: OK
            W->>W: Cap nhat ten trong trang thai
            W-->>H: Toast Da cap nhat thong tin ca nhan thanh cong va nut Da luu 2.5 giay
        end
    end
```

### Activity — Sửa tên

```mermaid
flowchart TD
    A["Bam Luu ten"] --> B{"Ten sau trim rong?"}
    B -->|Co| C["Toast: Ten hien thi khong duoc de trong"]
    B -->|Khong| D["Khoa nut, goi cap nhat ten kem anh hien tai"]
    D --> E{"Ket qua?"}
    E -->|"Loi hoac co error"| F["Toast: Co loi xay ra khi cap nhat thong tin. Vui long thu lai."]
    E -->|OK| G["Cap nhat ten, toast thanh cong, Da luu 2.5 giay"]
```

## Flow 7: Đổi ảnh đại diện

Nguồn: apps/web/src/features/profile/components/avatar-modal.tsx:26-67, apps/web/src/features/profile/utils/image-compress.ts:9-106, apps/web/src/features/profile/profile-screen.tsx:102-123, packages/auth/src/image-validation.ts:17-31. FR-021..024. Nhãn ✅.

### Sequence — Đổi ảnh đại diện

```mermaid
sequenceDiagram
    actor H as Hoc vien
    participant W as Trinh duyet
    participant A as Dich vu xac thuc
    H->>W: Bam nut may anh, mo hop thoai Chon anh dai dien
    alt Tab Mau co san
        H->>W: Chon 1 trong 6 mau
    else Tab Tai anh len
        H->>W: Chon tep PNG, JPG, WebP, GIF
        alt Khong phai anh hoac tren 5MB hoac loi nen
            W-->>H: Thong bao loi nen anh (E-020 den E-029)
        else Nen duoc
            W->>W: Cat vuong, 180x180, WebP hoac JPEG 0.85, toi da 32000 ky tu
        end
    else Tab Link URL
        H->>W: Dan link va bam Xem thu
        alt Rong hoac khong bat dau bang https
            W-->>H: Thong bao loi link (E-018, E-019)
        else Hop le
            W->>W: Dung link lam anh xem truoc
        end
    end
    H->>W: Bam Xac nhan doi anh
    W->>W: Hien anh moi ngay, dong hop thoai
    W->>A: Cap nhat anh, kem ten neu khong rong
    alt May chu tu choi INVALID_IMAGE hoac loi khac
        A-->>W: Loi
        W-->>H: Toast Khong the luu anh dai dien. Vui long thu lai.
        Note over W: Anh tren man khong duoc hoan lai (OQ-10)
    else Chap nhan
        A-->>W: OK
        W-->>H: Toast Da cap nhat anh dai dien moi
    end
```

### Activity — Đổi ảnh đại diện

```mermaid
flowchart TD
    A["Mo hop thoai: mac dinh anh hien tai hoac mau dau"] --> B{"Tab nao?"}
    B -->|"Mau co san"| C["Chon 1 trong 6 mau /avatars/id.svg"]
    B -->|"Tai anh len"| D{"Tep hop le? image/*, toi da 5MB"}
    D -->|Khong| E["Hien loi nen anh"]
    D -->|Co| F["Nen 180x180, WebP hoac JPEG, chat luong 0.85"]
    F --> G{"Ket qua toi da 32000 ky tu?"}
    G -->|Khong| E
    G -->|Co| H["Dat lam anh xem truoc"]
    B -->|"Link URL"| I{"Bat dau bang https://?"}
    I -->|Khong| J["Hien loi link"]
    I -->|Co| K["Bam Xem thu: dat lam anh xem truoc"]
    C --> L["Bam Xac nhan doi anh"]
    H --> L
    K --> L
    L --> M["Hien anh moi, goi luu anh"]
    M --> N{"May chu chap nhan? https, data webp jpeg png, /avatars/, toi da 32000"}
    N -->|Khong| O["Toast: Khong the luu anh dai dien. Vui long thu lai."]
    N -->|Co| P["Toast: Da cap nhat anh dai dien moi"]
```
