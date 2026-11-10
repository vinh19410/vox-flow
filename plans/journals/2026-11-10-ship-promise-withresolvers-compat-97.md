---
title: "Ship Promise.withResolvers compat (#97) vào beta"
date: 2026-11-10
summary: "PR #118 merged vào dev (faa7ae2); helper promiseWithResolvers thay 6 call-site trong apps/web, giữ floor iOS 14.3; 296/296 test, Deploy Beta run 42786341126 success; kongming advisory 2/5 checkpoint fail do hạn mức."
---

# Ship Promise.withResolvers compat (#97) vào beta

## What happened

Ship fix #97 qua PR #118 (branch `fix/97-promise-withresolvers-ios`, mode beta) vào dev ngày 2026-11-10, merge commit `faa7ae2`. Bug: `Promise.withResolvers` (Safari 17.4+/Chrome 119+/Firefox 121+) được gọi ở 6 call-site trong `apps/web` (`storage.ts` ×4, `use-recorder.ts`, `image-compress.ts`) → `TypeError` ngay khi load trên iOS < 17.4, làm gãy cả ba luồng ghi âm, persistence IndexedDB và nén avatar — đúng nhóm thiết bị chiếm phần lớn cohort người dùng.

Fix: helper cục bộ `promiseWithResolvers<T>()` tại `apps/web/src/lib/promise-with-resolvers.ts` (viết theo executor-based, trả đúng type toàn cục `PromiseWithResolvers<T>`); thay cả 6 call-site; các call-site test chạy trên Node 22 giữ nguyên builtin. TDD: 3 regression test xoá builtin rồi restore trong `finally` (helper dùng chung `apps/web/src/test/without-promise-with-resolvers.ts`); test storage assert `idb.rows.size === 1` để lỗi không bị nuốt bởi memory-fallback; red phase được chứng minh bằng `TypeError`/`AssertionError` trước khi fix.

Verification: 296/296 test web (37 file), `check-types` exit 0, grep `Promise.withResolvers` trong `dist/` = 0, scan ES2024/ES2025 toàn repo sạch ngoài 6 điểm đã vá. Deploy Beta run 42786341126 cho `faa7ae2`: success.

Điều phải nói thẳng: suýt nữa cả team đã tin vào một test xanh giả — bản red test đầu tiên của storage **không thể fail** vì memory-fallback nuốt sạch lỗi; không có assert `idb.rows.size === 1` thì "test xanh" chỉ là ảo giác, và Critical duy nhất của red-team bắt đúng chỗ này. Kongming advisory chỉ đạt 2/5 checkpoint do hạn mức Cursor (`USAGE_PRICING_REQUIRED`) — ghi nhận non-fatal, không phải cái cớ để bỏ qua advisory.

## Decision

- Giữ product floor ~iOS 14.3 (ràng buộc `MediaRecorder`) theo cohort ≤ 16.3 trong `docs/decisions/email-push-provider.md` — không nâng floor lên 17.4 chỉ vì một API tiện lợi.
- Từ chối core-js, can thiệp `browserslist`/`build.target`, nâng min-iOS-17.4, và guard script scan dist: helper tại chỗ thắng mọi phương án hạ tầng; guard script bị loại vì chi phí duy trì lớn hơn giá trị khi scan tay đã sạch.
- Số liệu quy trình: plan `plans/261110-0837-97-promise-withresolvers-ios-compat` qua validate + red-team (8 findings, 7 áp dụng); local review 0 Critical / 0 Important / 3 Minor.

## Next steps

- Smoke tay trên beta: ghi âm, lưu offline, nén avatar — ưu tiên máy thật iOS < 17.4 nếu còn trong phòng test.
- Khi floor sản phẩm thực sự nâng ≥ 17.4: xoá helper, trả 6 call-site về builtin.
- Quy ước mới cho review: API mới hơn floor bắt buộc đi qua helper tương tự — đưa vào checklist nếu tái diễn.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
