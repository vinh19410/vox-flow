---
title: "Tài khoản & mục tiêu (`onboarding`)"
description: "Học viên mới đăng nhập, lưu band mục tiêu và ngày thi thật, kiểm tra micro thật, rồi vào được lần ghi âm đầu tiên."
status: completed
priority: P1
effort: 2d
issue: 14
branch: vinh19410/vox-flow-ai-14
tags: [backend, frontend, advice]
blockedBy: [project:261105-0909-wi02-reconcile-prd-roadmap]
blocks: [project:261105-0910-wi11-privacy-controls, project:261105-0910-wi12-mock-exam, project:261105-0910-wi15-billing-qr, project:261105-0910-wi17-first-real-students-gate]
created: 2026-11-05
---

# Tài khoản & mục tiêu (`onboarding`)

Tracking: #14

Mục 10 trong `docs/roadmap-work-items.md` · Giai đoạn: Now · Tính năng: `onboarding`

> **Handover Contract (`--advice`):** Plan này sẵn sàng bàn giao cho model thực thi khác. Mỗi phase chia thành task có Goal, Target files and symbols, Steps, Success criteria và Verify so sánh được. Mỗi phase có Failure Protocol riêng; dừng khi Verify không đạt là hành vi đúng, không phải bị kẹt.

## Outcome
Học viên mới đăng nhập, lưu band mục tiêu và ngày thi thật, kiểm tra micro thật, rồi vào được lần ghi âm đầu tiên.

## Phụ thuộc
- Phải chờ: #6 (đã merge trong PR #32), #11 (mềm — đã tách theo xác nhận của người dùng ngày 2026-11-05); #13 (mềm, đã merge trong PR #38)
- Mở khóa: #15, #16, #19, #21

## Constraints
- Sao lưu D1 trước khi áp migration lên môi trường thật.
- Luồng phải ít bước nhất có thể; rủi ro chính là học viên bỏ đi trước lần ghi âm đầu.
- Rủi ro: Luồng vào auth screen sẽ được bổ sung Google OAuth khi #11 hoàn thành mà không ảnh hưởng tới schema user_profile (đã liên kết độc lập qua Better Auth user.id).
## Non-goals
- Lưu đồng ý dữ liệu; thuộc #15 dù bước đồng ý nằm trong luồng onboarding.
- Báo band thật sau ngày thi, trừ khi #6 quyết định đưa vào.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Backend hồ sơ học viên](./phase-01-backend-ho-so-hoc-vien.md) | Completed |
| 2 | [Phase 2: Nối giao diện onboarding](./phase-02-noi-giao-dien-onboarding.md) | Completed |

## Acceptance Criteria
- [ ] Band mục tiêu và ngày thi được lưu trong D1 và còn nguyên sau khi tải lại trang hoặc đổi thiết bị. (Đã kiểm chứng qua unit test D1 & hook; chưa kiểm chứng E2E toàn trình trên trình duyệt)
- [ ] Người đã hoàn tất không phải làm lại onboarding. (Đã kiểm chứng qua unit test route guard beforeLoad; chưa kiểm chứng E2E toàn trình trên trình duyệt)
- [x] Micro bị chặn thì hiện hướng dẫn xử lý và không cho qua bước; không còn "Chế độ mô phỏng" ở bản thật.
- [x] Test và kiểm tra kiểu đều qua.

## Câu hỏi mở
- SRS `onboarding` đang `stale` theo work items, nhưng không có PRD gốc (người sở hữu xác nhận ngày 2026-11-05) và SRS, brainstorm cũng không có trong repo, nên phải viết lại phạm vi trong plan trước khi code. PRD được dựng lại ở #6.


## Red Team Review

### Adversarial Review Summary (2 Lenses: Security Adversary + Assumption Destroyer)
- Total Findings: 9 (1 Critical, 4 High, 4 Medium)
- Accepted & Applied: 9/9

| # | Lens | Severity | Title & Disposition | Applied Changes |
|---|------|----------|---------------------|-----------------|
| 1 | Assumption Destroyer | Critical | Profile hydration missing from client AppState | Phase 2 Task 2.1: Thêm hydration từ `profile.get` vào AppState tại `_proto/route.tsx` |
| 2 | Security Adversary | High | Unauthenticated onboarding flow & silent fail | Phase 2 Task 2.1: Thêm session check trong `beforeLoad` của `_proto/onboarding.tsx` |
| 3 | Security Adversary | High | Premature `completeOnboarding` and timestamp tampering | Phase 1 Task 1.2: Bắt buộc profile tồn tại + `targetBand != null`, cấm client gửi `onboardedAt` |
| 4 | Security Adversary | High | Mic bypass via retained "Bỏ qua" button | Phase 2 Task 2.2: Bỏ nút "Bỏ qua", chỉ cho qua khi mic check thành công |
| 5 | Assumption Destroyer | High | Test suite breakage in `slice-a.test.tsx` | Phase 2: Đưa `slice-a.test.tsx` vào scope và mock `trpcClient.profile` |
| 6 | Assumption Destroyer | Medium | False assumption on `relations.ts` | Phase 1: Bỏ `relations.ts` khỏi danh sách sửa đổi (Drizzle auto-import) |
| 7 | Assumption Destroyer | Medium | Unnecessary edit to `trpc.ts` | Phase 2: Bỏ `apps/web/src/utils/trpc.ts` khỏi danh sách sửa đổi (tự suy luận AppRouter) |
| 8 | Assumption Destroyer | Medium | Incomplete D1 schema column types | Phase 1 Task 1.1: Định nghĩa rõ `real("target_band")`, nullable `examDate`, nullable `onboardedAt`, `createdAt`, `updatedAt` |
| 9 | Security Adversary | Medium | Validation edge cases (discrete bands, date format) | Phase 1 Task 1.2: Validate mảng band 0.5 cố định, so sánh ngày `YYYY-MM-DD` |

### Whole-Plan Consistency Sweep
- Đồng bộ toàn bộ các pha: Phase 1 và Phase 2 đã phản ánh toàn bộ 9 điểm cải tiến từ Red Team Review.
- Quyết định tách #11 thành phụ thuộc mềm đã được cập nhật đồng bộ ở frontmatter, phần Phụ thuộc của `plan.md`, `phase-01-backend-ho-so-hoc-vien.md` và `docs/roadmap-work-items.md`.
- Không còn mâu thuẫn hay claim `[UNVERIFIED]`.
<!-- slug: wi10-onboarding -->
