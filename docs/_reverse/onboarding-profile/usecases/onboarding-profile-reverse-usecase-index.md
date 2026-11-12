---
type: reverse-usecase-index
feature: onboarding-profile
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/onboarding-profile/onboarding-profile-reverse-spec.md
---

# onboarding-profile — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-set-goal-onboarding](./uc-set-goal-onboarding.md) | Thiết lập mục tiêu band và ngày thi (onboarding bước 1) | Học viên mới | FR-onboarding-profile-001..006, 013, 025 | Onboarding bước 1 | E-onboarding-profile-001..005, 008 | OQ-2, 5, 6, 7, 14 | [S9: apps/web/src/features/onboarding/components/goal-step.tsx:31-49] [S1: packages/api/src/routers/profile.ts:53-89] | ✅ |
| [uc-check-mic](./uc-check-mic.md) | Kiểm tra micro 5 giây | Học viên mới | FR-onboarding-profile-007..009 | Onboarding bước 2 | E-onboarding-profile-010, 011 | OQ-3, 15, 18 | [S10: apps/web/src/features/onboarding/components/mic-check.tsx:23-62] [S12: apps/web/src/hooks/use-mic-level.ts:13-110] | ✅ |
| [uc-complete-onboarding](./uc-complete-onboarding.md) | Hoàn tất onboarding và vào ứng dụng | Học viên mới | FR-onboarding-profile-010..012, 014, 015 | Onboarding bước 2 | E-onboarding-profile-006, 007, 009, 031 | OQ-7, 8 | [S8: apps/web/src/features/onboarding/onboarding-screen.tsx:17-30] [S1: packages/api/src/routers/profile.ts:91-134] | ✅ |
| [uc-view-profile](./uc-view-profile.md) | Xem hồ sơ cá nhân | Học viên đã onboard | FR-onboarding-profile-015, 017, 018 | Hồ sơ cá nhân | E-onboarding-profile-031 | OQ-9, 16 | [S17: apps/web/src/features/profile/profile-screen.tsx:160-458] | ✅ |
| [uc-update-goal](./uc-update-goal.md) | Sửa mục tiêu band và ngày thi | Học viên đã onboard | FR-onboarding-profile-020, 004..006 | Hồ sơ cá nhân | E-onboarding-profile-002..005, 012, 013 | OQ-2, 5 | [S17: apps/web/src/features/profile/profile-screen.tsx:126-158] | ✅ |
| [uc-update-display-name](./uc-update-display-name.md) | Sửa tên hiển thị | Học viên đã onboard | FR-onboarding-profile-019 | Hồ sơ cá nhân | E-onboarding-profile-014, 015, 017 | OQ-11 | [S17: apps/web/src/features/profile/profile-screen.tsx:70-99] | ✅ |
| [uc-change-avatar](./uc-change-avatar.md) | Đổi ảnh đại diện | Học viên đã onboard | FR-onboarding-profile-021..024 | Hồ sơ cá nhân, Hộp thoại ảnh | E-onboarding-profile-016..030 | OQ-10, 12, 13 | [S18: apps/web/src/features/profile/components/avatar-modal.tsx:26-67] [S17: apps/web/src/features/profile/profile-screen.tsx:102-123] | ✅ |

## Ma trận UC ↔ FR ↔ Screen ↔ Error ↔ OQ

| FR | UC | Screen | Error | OQ |
|----|----|--------|-------|----|
| FR-001..003 | uc-set-goal-onboarding | Onboarding bước 1 | E-008 | OQ-2, 6, 7 |
| FR-004..006 | uc-set-goal-onboarding, uc-update-goal | Onboarding bước 1, Hồ sơ | E-001..005, E-012 | OQ-5, 6 |
| FR-007..009 | uc-check-mic | Onboarding bước 2 | E-010, E-011 | OQ-3, 15, 18 |
| FR-010..012 | uc-complete-onboarding | Onboarding bước 2 | E-006, E-007, E-009 | OQ-7 |
| FR-013 | uc-set-goal-onboarding | Khung onboarding | — | OQ-14 |
| FR-014..016 | uc-complete-onboarding, uc-view-profile | /onboarding, /app/* | E-031 | OQ-8 |
| FR-017 | uc-view-profile | (nền, không có màn riêng) | — | OQ-17 |
| FR-018 | uc-view-profile | Hồ sơ | — | OQ-9, 16 |
| FR-019 | uc-update-display-name | Hồ sơ | E-014, E-015, E-017 | OQ-11 |
| FR-020 | uc-update-goal | Hồ sơ | E-012, E-013 | OQ-2, 5 |
| FR-021..024 | uc-change-avatar | Hồ sơ, Hộp thoại ảnh | E-016..030 | OQ-10, 12, 13 |
| FR-025..027 | mọi UC cần phiên / uc-complete-onboarding | — | E-001 | OQ-7 |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Học viên mới (chưa onboard) | người | [S14: apps/web/src/lib/auth-guard.ts:52-56] |
| Học viên đã onboard | người | [S15: apps/web/src/routes/_proto/onboarding.tsx:14-17] |
| Trình duyệt/thiết bị micro | ngoài | [S12: apps/web/src/hooks/use-mic-level.ts:40] |
| Dịch vụ xác thực (cập nhật tên/ảnh) | hệ thống | [S5: packages/auth/src/index.ts:60-71] |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn — mỗi mệnh đề mang nhãn ✅/🔵/🟡. Chạy `/usecase onboarding-profile` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Không có use case cho quản trị viên: code không có thủ tục admin cho hồ sơ (xem Gap trong `reverse-gaps.md`).
* Đăng xuất, nâng cấp gói trên màn Hồ sơ thuộc feature khác (OQ-16), không tạo use case ở đây.
